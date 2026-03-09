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
from vision_agents.plugins import getstream, openai, gemini
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
    agent_type: str = "active"  # 🆕 NEW: "active" or "passive"
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
                "speaker": agent_id,
                "text": agent_response_buffer['text'],
                "timestamp": agent_response_buffer['start_time'],
                "type": "agent"
            })
            logger.info(f"✅ Saved agent response to transcript: {len(agent_response_buffer['text'])} chars")
        
        # Reset buffer
        agent_response_buffer['text'] = ''
        agent_response_buffer['start_time'] = None


async def run_agent(call_id: str, agent_name: str, instructions: str, agent_id: str):
    """
    ✅ EXISTING: ACTIVE agent - unchanged
    Optimized background task to run the meeting assistant agent
    """
    logger.info(f"🚀 Starting ACTIVE agent for call: {call_id}")
    
    meeting_data = await get_meeting_data(call_id)
    if not meeting_data:
        logger.error(f"❌ Meeting {call_id} not found in active_meetings!")
        return
    
    agent = None
    call = None
    
    try:
        agent = agents.Agent(
            edge=getstream.Edge(),
            agent_user=User(
                id=agent_id,
                name=agent_name,
            ),
            instructions=instructions,
            llm=openai.Realtime(),
        )
        
        await update_meeting_data(call_id, {'agent': agent, 'agent_type': 'active'})
        
        last_activity = {'time': time.time()}
        agent_response_buffer = {'text': '', 'start_time': None}
        
        @agent.events.subscribe
        async def handle_session_started(event: CallSessionStartedEvent):
            logger.info(f"✅ Call Started: {call_id}")
            await update_meeting_data(call_id, {
                "is_active": True,
                "session_started": datetime.now().isoformat()
            })
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
            if not event.text or len(event.text.strip()) == 0:
                return
            
            last_activity['time'] = time.time()
            await save_agent_response_to_transcript(call_id, agent_id, agent_response_buffer)
            
            speaker = getattr(event, 'participant_id', 'Unknown')
            transcript_text = event.text
            
            meeting = await get_meeting_data(call_id)
            if meeting and len(meeting.get("transcript", [])) < MAX_TRANSCRIPT_SIZE:
                transcript_entry = {
                    "speaker": speaker,
                    "text": transcript_text,
                    "timestamp": datetime.now().isoformat(),
                    "type": "user"
                }
                meeting["transcript"].append(transcript_entry)
                meeting["last_activity"] = datetime.now().isoformat()
                logger.debug(f"📝 [{speaker}]: {transcript_text[:50]}...")
            else:
                logger.warning(f"⚠️ Transcript size limit reached for {call_id}")
        
        @agent.events.subscribe
        async def handle_llm_response(event: LLMResponseChunkEvent):
            last_activity['time'] = time.time()
            response_text = None
            
            if hasattr(event, 'delta') and event.delta:
                response_text = event.delta
            elif hasattr(event, 'text') and event.text:
                response_text = event.text
            elif hasattr(event, 'content') and event.content:
                response_text = event.content
            elif hasattr(event, 'chunk') and event.chunk:
                response_text = event.chunk
            
            if not response_text:
                logger.warning(f"⚠️ LLMResponseChunkEvent has no recognized text attribute")
                return
            
            if not agent_response_buffer['start_time']:
                agent_response_buffer['start_time'] = datetime.now().isoformat()
            
            agent_response_buffer['text'] += response_text
            
            if len(agent_response_buffer['text']) % 50 == 0:
                logger.info(f"🤖 Agent response length: {len(agent_response_buffer['text'])} chars")
        
        @agent.events.subscribe
        async def handle_session_ended(event: CallSessionEndedEvent):
            logger.info(f"🏁 Meeting ended: {call_id}")
            await save_agent_response_to_transcript(call_id, agent_id, agent_response_buffer)
            
            meeting = await get_meeting_data(call_id)
            if meeting:
                await update_meeting_data(call_id, {
                    "is_active": False,
                    "ended_at": datetime.now().isoformat()
                })
                logger.info(f"📊 Final Stats - Transcript entries: {len(meeting.get('transcript', []))}")
        
        watchdog_task = asyncio.create_task(
            monitor_agent_activity(call_id, last_activity, STALL_TIMEOUT)
        )
        
        await agent.create_user()
        call = agent.edge.client.video.call("default", call_id)
        logger.info(f"📞 Joining call: {call_id}")
        
        async with agent.join(call):
            logger.info(f"✅ Joined call successfully: {call_id}")
            
            # ✅ ACTIVE: Send initial greeting
            try:
                greeting = extract_greeting(instructions)
                await agent.llm.simple_response(greeting)
                logger.info(f"💬 Active agent sent initial greeting")
            except Exception as e:
                logger.error(f"⚠️ Failed to send greeting: {e}")
            
            await agent.finish()
        
        watchdog_task.cancel()
        logger.info(f"✅ Active agent finished successfully for call: {call_id}")
    
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
        await update_meeting_data(call_id, {
            "is_active": False,
            "finished_at": datetime.now().isoformat()
        })
        logger.info(f"🧹 Cleanup completed for call: {call_id}")


async def run_passive_agent(call_id: str, agent_name: str, instructions: str, agent_id: str):
    """
    🆕 NEW: PASSIVE agent - stays silent unless triggered
    Background task for passive meeting assistant
    - Stays silent unless triggered by agent name or "AI"
    - Takes complete notes (user + agent messages)
    - Uses OpenAI Realtime
    - Supports CV context
    """
    logger.info(f"🚀 Starting PASSIVE agent for call: {call_id}")
    logger.info(f"   Agent Name: {agent_name}")
    logger.info(f"   Will respond to: '{agent_name}' or 'AI'")
    
    meeting_data = await get_meeting_data(call_id)
    if not meeting_data:
        logger.error(f"❌ Meeting {call_id} not found in active_meetings!")
        return
    
    agent = None
    call = None
    
    try:
        agent = agents.Agent(
            edge=getstream.Edge(),
            agent_user=User(
                id=agent_id,
                name=agent_name,
            ),
            instructions=instructions,  # Already has passive prefix from webhook
            llm=gemini.Realtime(),
        )
        
        await update_meeting_data(call_id, {
            'agent': agent,
            'agent_type': 'passive',
            'agent_name': agent_name
        })
        
        last_activity = {'time': time.time()}
        agent_response_buffer = {'text': '', 'start_time': None}
        
        @agent.events.subscribe
        async def handle_session_started(event: CallSessionStartedEvent):
            logger.info(f"✅ Call Started: {call_id}")
            await update_meeting_data(call_id, {
                "is_active": True,
                "session_started": datetime.now().isoformat()
            })
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
            🔥 PASSIVE AGENT: Transcribes + detects triggers
            """
            if not event.text or len(event.text.strip()) == 0:
                return
            
            last_activity['time'] = time.time()
            await save_agent_response_to_transcript(call_id, agent_id, agent_response_buffer)
            
            speaker = getattr(event, 'participant_id', 'Unknown')
            transcript_text = event.text
            
            meeting = await get_meeting_data(call_id)
            if meeting and len(meeting.get("transcript", [])) < MAX_TRANSCRIPT_SIZE:
                # Save user message
                transcript_entry = {
                    "speaker": speaker,
                    "text": transcript_text,
                    "timestamp": datetime.now().isoformat(),
                    "type": "user"
                }
                meeting["transcript"].append(transcript_entry)
                meeting["last_activity"] = datetime.now().isoformat()
                
                logger.info(f"📝 USER [{speaker}]: {transcript_text[:100]}...")
                
                # 🔥 TRIGGER DETECTION
                agent_name_lower = agent_name.lower()
                text_lower = transcript_text.lower()
                
                triggered = False
                
                # Check for agent name
                if agent_name_lower in text_lower:
                    triggered = True
                    logger.info(f"🔔 PASSIVE AGENT TRIGGERED by name: '{agent_name}'")
                
                # Check for "AI" (word boundary check)
                elif " ai " in f" {text_lower} " or text_lower.startswith("ai ") or text_lower.endswith(" ai"):
                    triggered = True
                    logger.info(f"🔔 PASSIVE AGENT TRIGGERED by 'AI'")
                
                if triggered:
                    # Build context from recent transcript
                    context = "MEETING TRANSCRIPT (Recent):\n\n"
                    recent_entries = meeting.get('transcript', [])[-10:]
                    for entry in recent_entries:
                        context += f"[{entry.get('speaker', 'Unknown')}]: {entry.get('text', '')}\n"
                    
                    # Extract question (remove trigger words)
                    question = transcript_text
                    for trigger_word in [agent_name, agent_name_lower, "ai", "AI"]:
                        question = question.replace(trigger_word, "").strip()
                    question = question.lstrip(",.:;").strip()
                    
                    # Build prompt
                    prompt = f"""
{context}

USER QUESTION: {question}

Provide a concise, helpful answer based ONLY on the meeting transcript above.
Be professional and brief. Use only information from this meeting.
"""
                    
                    try:
                        await agent.llm.simple_response(prompt)
                        logger.info(f"💬 PASSIVE AGENT responding to trigger")
                    except Exception as e:
                        logger.error(f"❌ Error in triggered response: {e}")
                else:
                    logger.debug(f"📝 PASSIVE AGENT staying silent (no trigger)")
            else:
                logger.warning(f"⚠️ Transcript size limit reached")
        
        @agent.events.subscribe
        async def handle_llm_response(event: LLMResponseChunkEvent):
            last_activity['time'] = time.time()
            response_text = None
            
            if hasattr(event, 'delta') and event.delta:
                response_text = event.delta
            elif hasattr(event, 'text') and event.text:
                response_text = event.text
            elif hasattr(event, 'content') and event.content:
                response_text = event.content
            elif hasattr(event, 'chunk') and event.chunk:
                response_text = event.chunk
            
            if not response_text:
                logger.warning(f"⚠️ LLMResponseChunkEvent has no recognized text")
                return
            
            if not agent_response_buffer['start_time']:
                agent_response_buffer['start_time'] = datetime.now().isoformat()
            
            agent_response_buffer['text'] += response_text
            
            if len(agent_response_buffer['text']) % 50 == 0:
                logger.info(f"🤖 Agent response: {len(agent_response_buffer['text'])} chars")
        
        @agent.events.subscribe
        async def handle_session_ended(event: CallSessionEndedEvent):
            logger.info(f"🏁 Meeting ended: {call_id}")
            await save_agent_response_to_transcript(call_id, agent_id, agent_response_buffer)
            
            meeting = await get_meeting_data(call_id)
            if meeting:
                await update_meeting_data(call_id, {
                    "is_active": False,
                    "ended_at": datetime.now().isoformat()
                })
                
                user_msgs = len([t for t in meeting.get("transcript", []) if t.get("type") == "user"])
                agent_msgs = len([t for t in meeting.get("transcript", []) if t.get("type") == "agent"])
                logger.info(f"📊 Final Stats - User: {user_msgs}, Agent: {agent_msgs}")
        
        watchdog_task = asyncio.create_task(
            monitor_agent_activity(call_id, last_activity, STALL_TIMEOUT)
        )
        
        await agent.create_user()
        call = agent.edge.client.video.call("default", call_id)
        logger.info(f"📞 Joining call: {call_id}")
        
        async with agent.join(call):
            logger.info(f"✅ Joined call successfully: {call_id}")
            
            # 🔥 PASSIVE: NO GREETING - Just stay silent
            logger.info(f"📝 Passive agent ready - will respond to '{agent_name}' or 'AI'")
            
            await agent.finish()
        
        watchdog_task.cancel()
        logger.info(f"✅ Passive agent finished for call: {call_id}")
    
    except Exception as e:
        logger.error(f"❌ Error in passive agent: {str(e)}", exc_info=True)
        await update_meeting_data(call_id, {
            "is_active": False,
            "error": str(e),
            "error_time": datetime.now().isoformat()
        })
    
    finally:
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
            await asyncio.sleep(10)
            
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
    lines = instructions.split('.')
    if lines:
        first_line = lines[0].strip()
        if first_line:
            return first_line
    
    return "Hello! I'm your AI meeting assistant. How can I help you today?"


async def cleanup_old_meetings():
    """Background task to cleanup old inactive meetings"""
    while True:
        try:
            await asyncio.sleep(300)
            
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


app_start_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    logger.info("🚀 Starting Meeting Assistant API")
    cleanup_task = asyncio.create_task(cleanup_old_meetings())
    yield
    logger.info("🛑 Shutting down Meeting Assistant API")
    cleanup_task.cancel()
    async with meetings_lock:
        for call_id in list(active_meetings.keys()):
            logger.info(f"🧹 Cleaning up meeting: {call_id}")


app = FastAPI(
    title="Meeting Assistant API",
    description="Optimized API for managing AI meeting assistant agents",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        
        
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
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
    Routes to active or passive agent based on agent_type
    """
    
    if not os.getenv("STREAM_API_KEY"):
        raise HTTPException(status_code=500, detail="STREAM_API_KEY not configured")
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    if request.agent_type not in ["active", "passive"]:
        raise HTTPException(
            status_code=400, 
            detail="agent_type must be 'active' or 'passive'"
        )
    
    async with meetings_lock:
        if request.call_id in active_meetings:
            existing = active_meetings[request.call_id]
            
            if existing.get("is_active", False):
                logger.warning(f"⚠️ DUPLICATE: Meeting {request.call_id} already active")
                raise HTTPException(
                    status_code=409, 
                    detail=f"Meeting {request.call_id} is already active"
                )
            
            logger.info(f"♻️ Restarting inactive meeting: {request.call_id}")
        
        active_meetings[request.call_id] = {
            "transcript": [],
            "is_active": True,
            "started_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat(),
            "agent": None,
            "channel": None,
            "agent_name": request.agent_name,
            "agent_id": request.agent_id,
            "agent_type": request.agent_type
        }
    
    logger.info(f"✅ START REQUEST ACCEPTED")
    logger.info(f"   Call ID: {request.call_id}")
    logger.info(f"   Agent: {request.agent_name}")
    logger.info(f"   Type: {request.agent_type.upper()}")
    
    # 🔥 CONDITIONAL: Call appropriate function based on type
    if request.agent_type == "active":
        logger.info(f"🎙️ Starting ACTIVE agent")
        background_tasks.add_task(
            run_agent,
            request.call_id,
            request.agent_name or "AI Meeting Assistant",
            request.agent_instructions or "You are a helpful AI meeting assistant.",
            request.agent_id
        )
    elif request.agent_type == "passive":
        logger.info(f"📝 Starting PASSIVE agent")
        background_tasks.add_task(
            run_passive_agent,
            request.call_id,
            request.agent_name or "AI Meeting Assistant",
            request.agent_instructions or "You are a helpful AI meeting assistant.",
            request.agent_id
        )
    
    return MeetingResponse(
        success=True,
        call_id=request.call_id,
        message=f"{request.agent_type.capitalize()} agent started for call: {request.call_id}",
        timestamp=datetime.now().isoformat()
    )


@app.get("/meetings/{call_id}/status", response_model=MeetingStatus)
async def get_meeting_status(call_id: str):
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
    meeting = await get_meeting_data(call_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {call_id} not found")
    
    transcript = meeting.get("transcript", [])
    
    if limit and limit > 0:
        transcript = transcript[-limit:]
    
    return TranscriptResponse(
        call_id=call_id,
        transcript=transcript,
        total_entries=len(meeting.get("transcript", []))
    )


@app.post("/meetings/{call_id}/stop")
async def stop_meeting(call_id: str):
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
    
    uvicorn.run(
        app, 
        host=host, 
        port=port,
        log_level="info",
        access_log=True
    )