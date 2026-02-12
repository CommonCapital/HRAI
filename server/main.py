import asyncio 
import os
import logging
import time
from uuid import uuid4
from typing import Dict, Optional
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from vision_agents.core import agents
from vision_agents.plugins import getstream, openai
from vision_agents.core.edge.types import User
from vision_agents.core.events import (
    CallSessionParticipantJoinedEvent, 
    CallSessionParticipantLeftEvent, 
    CallSessionStartedEvent, 
    CallSessionEndedEvent
)
from vision_agents.core.llm.events import (
    RealtimeUserSpeechTranscriptionEvent, 
    LLMResponseChunkEvent
)

# Configure logging with better formatting
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

# Global storage for active meetings with thread-safe operations
active_meetings: Dict[str, dict] = {}
meetings_lock = asyncio.Lock()

# Configuration
MAX_TRANSCRIPT_SIZE = 10000  # Prevent memory issues
STALL_TIMEOUT = 45  # seconds
CLEANUP_INACTIVE_AFTER = 3600  # 1 hour


# Pydantic models for API
class StartMeetingRequest(BaseModel):
    call_id: str
    agent_name: Optional[str] = "AI Meeting Assistant"
    agent_instructions: Optional[str] = "You are a helpful AI meeting assistant."
    agent_id: str = "agent-bot"


class MeetingResponse(BaseModel):
    success: bool
    call_id: str
    message: str
    timestamp: str


class MeetingStatus(BaseModel):
    call_id: str
    is_active: bool
    transcript_count: int
    started_at: Optional[str] = None
    last_activity: Optional[str] = None
    error: Optional[str] = None


class TranscriptResponse(BaseModel):
    call_id: str
    transcript: list
    total_entries: int


class HealthStatus(BaseModel):
    status: str
    active_meetings: int
    total_meetings: int
    uptime_seconds: float


# Utility function for safe meeting data access
async def get_meeting_data(call_id: str) -> Optional[dict]:
    """Thread-safe meeting data retrieval"""
    async with meetings_lock:
        return active_meetings.get(call_id)


async def update_meeting_data(call_id: str, updates: dict):
    """Thread-safe meeting data update"""
    async with meetings_lock:
        if call_id in active_meetings:
            active_meetings[call_id].update(updates)


async def save_agent_response_to_transcript(call_id: str, agent_id: str, agent_response_buffer: dict):
    """
    Helper function to save accumulated agent response to transcript
    """
    if agent_response_buffer['text']:
        meeting = await get_meeting_data(call_id)
        if meeting and len(meeting.get("transcript", [])) < MAX_TRANSCRIPT_SIZE:
            meeting["transcript"].append({
                "speaker": agent_id,  # ✅ Will be renamed to speaker_id in webhook
                "text": agent_response_buffer['text'],
                "timestamp": agent_response_buffer['start_time'],
                "type": "agent"  # ✅ Mark as agent message
            })
            logger.info(f"✅ Saved agent response to transcript: {len(agent_response_buffer['text'])} chars")
        
        # Reset buffer
        agent_response_buffer['text'] = ''
        agent_response_buffer['start_time'] = None


async def run_agent(call_id: str, agent_name: str, instructions: str, agent_id: str):
    """
    Optimized background task to run the meeting assistant agent
    """
    logger.info(f"🚀 Starting agent for call: {call_id}")
    
    meeting_data = await get_meeting_data(call_id)
    if not meeting_data:
        logger.error(f"❌ Meeting {call_id} not found in active_meetings!")
        return
    
    agent = None
    call = None
    
    try:
        # ✅ OPTIMIZED OPENAI CONFIGURATION (more stable than Gemini)
        agent = agents.Agent(
            edge=getstream.Edge(),
            agent_user=User(
                id=agent_id,
                name=agent_name,
            ),
            instructions=instructions,
            llm=openai.Realtime(),
        )
        
        await update_meeting_data(call_id, {'agent': agent})
        
        # Track last activity for stall detection
        last_activity = {'time': time.time()}
        
        # Track agent response chunks for assembly
        agent_response_buffer = {'text': '', 'start_time': None}
        
        # ✅ LIGHTWEIGHT EVENT HANDLERS (minimal processing)
        @agent.events.subscribe
        async def handle_session_started(event: CallSessionStartedEvent):
            logger.info(f"✅ Call Started: {call_id}")
            await update_meeting_data(call_id, {
                "is_active": True,
                "session_started": datetime.now().isoformat()
            })
            
            # Initialize chat channel in background (non-blocking)
            asyncio.create_task(initialize_chat_channel(agent, call_id))
        
        @agent.events.subscribe
        async def handle_participant_joined(event: CallSessionParticipantJoinedEvent):
            if event.participant.user.id == agent_id:
                return
            participant_name = event.participant.user.name
            logger.info(f"👤 Participant joined: {participant_name}")
            last_activity['time'] = time.time()
        
        @agent.events.subscribe
        async def handle_participant_left(event: CallSessionParticipantLeftEvent):
            if event.participant.user.id == agent_id:
                return
            participant_name = event.participant.user.name
            logger.info(f"👋 Participant left: {participant_name}")
        
        @agent.events.subscribe
        async def handle_transcription(event: RealtimeUserSpeechTranscriptionEvent):
            """
            Optimized transcription handler with size limits
            ALSO saves any pending agent response before recording user message
            """
            if not event.text or len(event.text.strip()) == 0:
                return
            
            last_activity['time'] = time.time()
            
            # ✅ SAVE PREVIOUS AGENT RESPONSE (if any exists in buffer)
            # This ensures agent responses are saved before the next user message
            await save_agent_response_to_transcript(call_id, agent_id, agent_response_buffer)
            
            speaker = getattr(event, 'participant_id', 'Unknown')
            transcript_text = event.text
            
            # ✅ Prevent memory issues with transcript size limits
            meeting = await get_meeting_data(call_id)
            if meeting and len(meeting.get("transcript", [])) < MAX_TRANSCRIPT_SIZE:
                transcript_entry = {
                    "speaker": speaker,  # ✅ Will be renamed to speaker_id in webhook
                    "text": transcript_text,
                    "timestamp": datetime.now().isoformat(),  # ✅ ISO format, converted to start_ts/end_ts in webhook
                    "type": "user"  # ✅ Mark as user message
                }
                meeting["transcript"].append(transcript_entry)
                meeting["last_activity"] = datetime.now().isoformat()
                
                # Lightweight logging (no excessive detail)
                logger.debug(f"📝 [{speaker}]: {transcript_text[:50]}...")
            else:
                logger.warning(f"⚠️ Transcript size limit reached for {call_id}")
        
        @agent.events.subscribe
        async def handle_llm_response(event: LLMResponseChunkEvent):
            """
            Track agent responses for stall detection AND transcript accumulation
            """
            last_activity['time'] = time.time()
            if hasattr(event, 'delta') and event.delta:
                logger.debug(f"🤖 Agent: {event.delta[:50]}...")
                
                # ✅ Accumulate agent response chunks
                if not agent_response_buffer['start_time']:
                    agent_response_buffer['start_time'] = datetime.now().isoformat()
                agent_response_buffer['text'] += event.delta
        
        @agent.events.subscribe
        async def handle_session_ended(event: CallSessionEndedEvent):
            """
            Clean session end - save any remaining agent response
            """
            logger.info(f"🏁 Meeting ended: {call_id}")
            
            # ✅ SAVE ANY REMAINING AGENT RESPONSE before ending
            await save_agent_response_to_transcript(call_id, agent_id, agent_response_buffer)
            
            meeting = await get_meeting_data(call_id)
            if meeting:
                await update_meeting_data(call_id, {
                    "is_active": False,
                    "ended_at": datetime.now().isoformat()
                })
                logger.info(f"📊 Final Stats - Transcript entries: {len(meeting.get('transcript', []))}")
        
        # ✅ START WATCHDOG for stall detection
        watchdog_task = asyncio.create_task(
            monitor_agent_activity(call_id, last_activity, STALL_TIMEOUT)
        )
        
        # Join the call
        await agent.create_user()
        call = agent.edge.client.video.call("default", call_id)
        logger.info(f"📞 Joining call: {call_id}")
        
        async with agent.join(call):
            logger.info(f"✅ Joined call successfully: {call_id}")
            
            # ✅ CRITICAL: Send initial greeting to start conversation
            try:
                # Extract first question from instructions or use default
                greeting = extract_greeting(instructions)
                await agent.llm.simple_response(greeting)
                logger.info(f"💬 Agent sent initial greeting")
            except Exception as e:
                logger.error(f"⚠️ Failed to send greeting: {e}")
            
            # Keep agent alive until meeting ends
            await agent.finish()
        
        # Cancel watchdog
        watchdog_task.cancel()
        
        logger.info(f"✅ Agent finished successfully for call: {call_id}")
    
    except asyncio.CancelledError:
        logger.info(f"🛑 Agent task cancelled for call: {call_id}")
        raise
    
    except Exception as e:
        logger.error(f"❌ Error in agent for call {call_id}: {str(e)}", exc_info=True)
        await update_meeting_data(call_id, {
            "is_active": False,
            "error": str(e),
            "error_time": datetime.now().isoformat()
        })
    
    finally:
        # Always mark as inactive
        await update_meeting_data(call_id, {
            "is_active": False,
            "finished_at": datetime.now().isoformat()
        })
        logger.info(f"🧹 Cleanup completed for call: {call_id}")


async def initialize_chat_channel(agent, call_id: str):
    """Initialize chat channel asynchronously (non-blocking)"""
    try:
        channel = agent.edge.client.channel("messaging", call_id) 
        await channel.watch()
        await update_meeting_data(call_id, {"channel": channel})
        logger.info(f"💬 Chat channel initialized for {call_id}")
    except Exception as e:
        logger.error(f"⚠️ Failed to initialize chat channel for {call_id}: {e}")


async def monitor_agent_activity(call_id: str, last_activity: dict, timeout: int):
    """Watchdog to detect stalled agents"""
    try:
        while True:
            await asyncio.sleep(10)  # Check every 10 seconds
            
            meeting = await get_meeting_data(call_id)
            if not meeting or not meeting.get("is_active"):
                break
            
            inactive_duration = time.time() - last_activity['time']
            
            if inactive_duration > timeout:
                logger.error(f"⚠️ STALL DETECTED: No activity for {inactive_duration:.0f}s in {call_id}")
                await update_meeting_data(call_id, {
                    "error": f"Agent stalled - no activity for {inactive_duration:.0f}s",
                    "is_active": False
                })
                break
                
    except asyncio.CancelledError:
        logger.debug(f"Watchdog cancelled for {call_id}")


def extract_greeting(instructions: str) -> str:
    """Extract first greeting from instructions or provide default"""
    # Try to extract first sentence/question
    lines = instructions.split('.')
    if lines:
        first_line = lines[0].strip()
        if first_line:
            return first_line
    
    # Default greeting
    return "Hello! I'm your AI meeting assistant. How can I help you today?"


async def cleanup_old_meetings():
    """Background task to cleanup old inactive meetings"""
    while True:
        try:
            await asyncio.sleep(300)  # Run every 5 minutes
            
            now = time.time()
            to_delete = []
            
            async with meetings_lock:
                for call_id, meeting in active_meetings.items():
                    if not meeting.get("is_active", False):
                        started_at = meeting.get("started_at")
                        if started_at:
                            started_time = datetime.fromisoformat(started_at).timestamp()
                            if now - started_time > CLEANUP_INACTIVE_AFTER:
                                to_delete.append(call_id)
                
                for call_id in to_delete:
                    logger.info(f"🧹 Auto-cleaning up old meeting: {call_id}")
                    del active_meetings[call_id]
            
            if to_delete:
                logger.info(f"🧹 Cleaned up {len(to_delete)} old meetings")
                
        except Exception as e:
            logger.error(f"Error in cleanup task: {e}")


# Track app startup time
app_start_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    logger.info("🚀 Starting Meeting Assistant API")
    
    # Start cleanup task
    cleanup_task = asyncio.create_task(cleanup_old_meetings())
    
    yield
    
    logger.info("🛑 Shutting down Meeting Assistant API")
    
    # Cancel cleanup task
    cleanup_task.cancel()
    
    # Cleanup all active meetings
    async with meetings_lock:
        for call_id in list(active_meetings.keys()):
            logger.info(f"🧹 Cleaning up meeting: {call_id}")


# Create FastAPI app
app = FastAPI(
    title="Meeting Assistant API",
    description="Optimized API for managing AI meeting assistant agents",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware with security improvements
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://hraiclient.vercel.app"  # Add your production domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Meeting Assistant API - Optimized",
        "version": "2.0.0",
        "status": "operational",
        "endpoints": {
            "start": "POST /meetings/start",
            "status": "GET /meetings/{call_id}/status",
            "transcript": "GET /meetings/{call_id}/transcript",
            "stop": "POST /meetings/{call_id}/stop",
            "delete": "DELETE /meetings/{call_id}",
            "list": "GET /meetings",
            "health": "GET /health"
        }
    }


@app.get("/health", response_model=HealthStatus)
async def health_check():
    """Health check endpoint with detailed stats"""
    async with meetings_lock:
        active_count = len([m for m in active_meetings.values() if m.get("is_active", False)])
        total_count = len(active_meetings)
    
    return HealthStatus(
        status="healthy",
        active_meetings=active_count,
        total_meetings=total_count,
        uptime_seconds=time.time() - app_start_time
    )


@app.post("/meetings/start", response_model=MeetingResponse)
async def start_meeting(request: StartMeetingRequest, background_tasks: BackgroundTasks):
    """
    Start a new meeting assistant agent
    
    Optimizations:
    - Prevents duplicate active meetings
    - Uses OpenAI for better stability
    - Implements stall detection
    - Thread-safe operations
    """
    
    # ✅ Validate environment variables
    if not os.getenv("STREAM_API_KEY"):
        raise HTTPException(status_code=500, detail="STREAM_API_KEY not configured")
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    # ✅ PREVENT DUPLICATES with thread-safe check
    async with meetings_lock:
        if request.call_id in active_meetings:
            existing = active_meetings[request.call_id]
            
            # If already active, reject
            if existing.get("is_active", False):
                logger.warning(f"⚠️ DUPLICATE REQUEST BLOCKED: Meeting {request.call_id} is already active")
                raise HTTPException(
                    status_code=409, 
                    detail=f"Meeting {request.call_id} is already active. Stop it first or use a different call_id."
                )
            
            # If inactive, allow restart
            logger.info(f"♻️ Restarting inactive meeting: {request.call_id}")
        
        # Mark as "starting" IMMEDIATELY to prevent race conditions
        active_meetings[request.call_id] = {
            "transcript": [],
            "is_active": True,  # Set to True IMMEDIATELY
            "started_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat(),
            "agent": None,
            "channel": None,
            "agent_name": request.agent_name,
            "agent_id": request.agent_id
        }
    
    logger.info(f"✅ START REQUEST ACCEPTED for call_id: {request.call_id}")
    
    # Start agent in background
    background_tasks.add_task(
        run_agent, 
        request.call_id, 
        request.agent_name or "AI Meeting Assistant",
        request.agent_instructions or "You are a helpful AI meeting assistant.",
        request.agent_id
    )
    
    return MeetingResponse(
        success=True,
        call_id=request.call_id,
        message=f"Meeting assistant started for call: {request.call_id}",
        timestamp=datetime.now().isoformat()
    )


@app.get("/meetings/{call_id}/status", response_model=MeetingStatus)
async def get_meeting_status(call_id: str):
    """Get the status of a meeting with detailed information"""
    meeting = await get_meeting_data(call_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {call_id} not found")
    
    return MeetingStatus(
        call_id=call_id,
        is_active=meeting.get("is_active", False),
        transcript_count=len(meeting.get("transcript", [])),
        started_at=meeting.get("started_at"),
        last_activity=meeting.get("last_activity"),
        error=meeting.get("error")
    )


@app.get("/meetings/{call_id}/transcript", response_model=TranscriptResponse)
async def get_transcript(call_id: str, limit: Optional[int] = None):
    """
    Get the transcript for a meeting
    
    Returns transcript in format compatible with UI:
    - speaker: will be renamed to speaker_id by webhook
    - text: the transcript text
    - timestamp: ISO format, will be converted to start_ts/end_ts by webhook
    - type: 'user' or 'agent'
    
    Args:
        limit: Optional limit on number of transcript entries to return (most recent)
    """
    meeting = await get_meeting_data(call_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {call_id} not found")
    
    transcript = meeting.get("transcript", [])
    
    # Apply limit if specified
    if limit and limit > 0:
        transcript = transcript[-limit:]
    
    return TranscriptResponse(
        call_id=call_id,
        transcript=transcript,
        total_entries=len(meeting.get("transcript", []))
    )


@app.post("/meetings/{call_id}/stop")
async def stop_meeting(call_id: str):
    """Stop a meeting gracefully"""
    meeting = await get_meeting_data(call_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {call_id} not found")
    
    if not meeting.get("is_active", False):
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Meeting {call_id} is already stopped",
                "call_id": call_id,
                "timestamp": datetime.now().isoformat()
            }
        )
    
    # Mark as inactive (agent will cleanup)
    await update_meeting_data(call_id, {
        "is_active": False,
        "stopped_at": datetime.now().isoformat()
    })
    
    logger.info(f"🛑 Meeting {call_id} stop requested")
    
    return {
        "success": True,
        "call_id": call_id,
        "message": f"Meeting {call_id} stopped",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/meetings")
async def list_meetings(active_only: bool = False):
    """
    List all meetings
    
    Args:
        active_only: If True, only return active meetings
    """
    meetings = []
    
    async with meetings_lock:
        for call_id, meeting in active_meetings.items():
            is_active = meeting.get("is_active", False)
            
            if active_only and not is_active:
                continue
            
            meetings.append({
                "call_id": call_id,
                "is_active": is_active,
                "transcript_count": len(meeting.get("transcript", [])),
                "started_at": meeting.get("started_at"),
                "last_activity": meeting.get("last_activity"),
                "has_error": "error" in meeting,
                "error": meeting.get("error") if "error" in meeting else None
            })
    
    return {
        "total": len(meetings),
        "active": len([m for m in meetings if m["is_active"]]),
        "meetings": meetings
    }


@app.delete("/meetings/{call_id}")
async def delete_meeting(call_id: str, force: bool = False):
    """
    Delete a meeting and its data
    
    Args:
        force: If True, delete even if meeting is active (not recommended)
    """
    meeting = await get_meeting_data(call_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {call_id} not found")
    
    if meeting.get("is_active", False) and not force:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete active meeting. Stop it first or use ?force=true"
        )
    
    async with meetings_lock:
        del active_meetings[call_id]
    
    logger.info(f"🗑️ Deleted meeting: {call_id}")
    
    return {
        "success": True,
        "call_id": call_id,
        "message": f"Meeting {call_id} deleted",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"🚀 Starting server on {host}:{port}")
    
    # Production-ready configuration
    uvicorn.run(
        app, 
        host=host, 
        port=port,
        log_level="info",
        access_log=True
    )