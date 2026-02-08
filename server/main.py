import asyncio 
import os
import logging
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
from vision_agents.plugins import getstream, gemini
from vision_agents.core.edge.types import User
from vision_agents.core.events import (
    CallSessionParticipantJoinedEvent, 
    CallSessionParticipantLeftEvent, 
    CallSessionStartedEvent, 
    CallSessionEndedEvent, 
    PluginBaseEvent
)
from vision_agents.core.llm.events import (
    RealtimeUserSpeechTranscriptionEvent, 
    LLMResponseChunkEvent
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Global storage for active meetings
active_meetings: Dict[str, dict] = {}

# Pydantic models for API
class StartMeetingRequest(BaseModel):
    call_id: str
    agent_name: Optional[str] 
    agent_instructions: Optional[str] 
    agent_id: str

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

class TranscriptResponse(BaseModel):
    call_id: str
    transcript: list
    total_entries: int


async def run_agent(call_id: str, agent_name: str, instructions: str, agent_id: str):
    """
    Background task to run the meeting assistant agent
    """
    logger.info(f"Starting agent for call: {call_id}")
    
    meeting_data = active_meetings.get(call_id)
    if not meeting_data:
        logger.error(f"Meeting {call_id} not found in active_meetings!")
        return
    
    try:
        # ⚡ OPTIMIZED GEMINI CONFIGURATION
        agent = agents.Agent(
            edge=getstream.Edge(),
            agent_user=User(
                id=agent_id,
                name=agent_name,
            ),
            instructions=instructions,
            llm=gemini.Realtime(),  # ← Use default settings
        )
        
        meeting_data['agent'] = agent
       
        
        # Event handlers
        @agent.events.subscribe
        async def handle_session_started(event: CallSessionStartedEvent):
            logger.info(f"Call Started: {call_id}")
            meeting_data["is_active"] = True
            logger.info("Meeting started")

            try:
                channel = agent.edge.client.channel("messaging", call_id) 
                await channel.watch()
                meeting_data["channel"] = channel
                logger.info("Chat channel initialized")
            except Exception as e:
                logger.error(f"Failed to initialize chat channel: {e}")
        
        @agent.events.subscribe
        async def handle_participant_joined(event: CallSessionParticipantJoinedEvent):
            if event.participant.user.id == agent_id:
                return
            participant_name = event.participant.user.name
            logger.info(f"Participant joined: {participant_name}")
        
        @agent.events.subscribe
        async def handle_participant_left(event: CallSessionParticipantLeftEvent):
            if event.participant.user.id == agent_id:
                return
            participant_name = event.participant.user.name
            logger.info(f"Participant left: {participant_name}")
        
        @agent.events.subscribe
        async def handle_transcription(event: RealtimeUserSpeechTranscriptionEvent):
            """Called when Gemini transcribes speech to text"""
            if not event.text or len(event.text.strip()) == 0:
                return
            
            speaker = getattr(event, 'participant_id', 'Unknown')
            transcript_text = event.text
            meeting_data["transcript"].append({
                "speaker": speaker,
                "text": transcript_text,
                'timestamp': getattr(event, 'timestamp', datetime.now().isoformat())
            })
            logger.info(f"[{speaker}]: {transcript_text}")
        
        @agent.events.subscribe
        async def handle_llm_response(event: LLMResponseChunkEvent):
            if hasattr(event, 'delta') and event.delta:
                logger.info(f"Agent: {event.delta}")
        
        @agent.events.subscribe
        async def handle_session_ended(event: CallSessionEndedEvent):
            """Called when call ends"""
            meeting_data["is_active"] = False
            logger.info(f"Meeting ended: {call_id}")
            logger.info(f"Final Stats - Transcript entries: {len(meeting_data['transcript'])}")
        
        # Join the call
        await agent.create_user()
        call = agent.edge.client.video.call("default", call_id)
        logger.info(f"Joining call: {call_id}")
        
        async with agent.join(call):
            logger.info(f"Joined call successfully: {call_id}")
            await agent.finish()
        
        logger.info(f"Agent finished for call: {call_id}")
    
    except Exception as e:
        logger.error(f"Error in agent for call {call_id}: {str(e)}")
        if call_id in active_meetings:
            active_meetings[call_id]["is_active"] = False
            active_meetings[call_id]["error"] = str(e)
    
    finally:
        # Mark as inactive but keep data for retrieval
        if call_id in active_meetings:
            active_meetings[call_id]["is_active"] = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    logger.info("Starting Meeting Assistant API")
    yield
    logger.info("Shutting down Meeting Assistant API")
    # Cleanup all active meetings
    for call_id in list(active_meetings.keys()):
        logger.info(f"Cleaning up meeting: {call_id}")


# Create FastAPI app
app = FastAPI(
    title="Meeting Assistant API",
    description="API for managing AI meeting assistant agents",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Meeting Assistant API",
        "version": "1.0.0",
        "endpoints": {
            "start": "POST /meetings/start",
            "status": "GET /meetings/{call_id}/status",
            "transcript": "GET /meetings/{call_id}/transcript",
            "stop": "POST /meetings/{call_id}/stop",
            "list": "GET /meetings"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_meetings": len([m for m in active_meetings.values() if m.get("is_active", False)]),
        "total_meetings": len(active_meetings)
    }


@app.post("/meetings/start", response_model=MeetingResponse)
async def start_meeting(request: StartMeetingRequest, background_tasks: BackgroundTasks):
    """Start a new meeting assistant agent"""
    
    # 🔍 PREVENT DUPLICATES
    if request.call_id in active_meetings:
        existing = active_meetings[request.call_id]
        
        # If already active, reject
        if existing.get("is_active", False):
            logger.error(f"❌ DUPLICATE REQUEST BLOCKED: Meeting {request.call_id} is already active")
            raise HTTPException(
                status_code=400, 
                detail=f"Meeting {request.call_id} is already active"
            )
        
        # If inactive, allow restart
        logger.warning(f"⚠️ Restarting inactive meeting: {request.call_id}")
    
    # Mark as "starting" IMMEDIATELY to prevent race conditions
    active_meetings[request.call_id] = {
        "transcript": [],
        "is_active": True,  # ← Set to True IMMEDIATELY
        "started_at": datetime.now().isoformat(),
        "agent": None,
        "channel": None
    }
    
    logger.info(f"🔔 START REQUEST ACCEPTED for call_id: {request.call_id}")
    
    # Start agent in background
    background_tasks.add_task(
        run_agent, 
        request.call_id, 
        request.agent_name,
        request.agent_instructions,
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
    """Get the status of a meeting"""
    if call_id not in active_meetings:
        raise HTTPException(status_code=404, detail=f"Meeting {call_id} not found")
    
    meeting = active_meetings[call_id]
    return MeetingStatus(
        call_id=call_id,
        is_active=meeting.get("is_active", False),
        transcript_count=len(meeting.get("transcript", [])),
        started_at=meeting.get("started_at")
    )


@app.get("/meetings/{call_id}/transcript", response_model=TranscriptResponse)
async def get_transcript(call_id: str):
    """Get the transcript for a meeting"""
    if call_id not in active_meetings:
        raise HTTPException(status_code=404, detail=f"Meeting {call_id} not found")
    
    meeting = active_meetings[call_id]
    return TranscriptResponse(
        call_id=call_id,
        transcript=meeting.get("transcript", []),
        total_entries=len(meeting.get("transcript", []))
    )


@app.post("/meetings/{call_id}/stop")
async def stop_meeting(call_id: str):
    """Stop a meeting"""
    if call_id not in active_meetings:
        raise HTTPException(status_code=404, detail=f"Meeting {call_id} not found")
    
    meeting = active_meetings[call_id]
    
    if not meeting.get("is_active", False):
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Meeting {call_id} is already stopped",
                "call_id": call_id
            }
        )
    
    # Mark as inactive (actual cleanup handled by agent)
    meeting["is_active"] = False
    
    return {
        "success": True,
        "call_id": call_id,
        "message": f"Meeting {call_id} stopped",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/meetings")
async def list_meetings():
    """List all meetings"""
    meetings = []
    for call_id, meeting in active_meetings.items():
        meetings.append({
            "call_id": call_id,
            "is_active": meeting.get("is_active", False),
            "transcript_count": len(meeting.get("transcript", [])),
            "started_at": meeting.get("started_at"),
            "has_error": "error" in meeting
        })
    
    return {
        "total": len(meetings),
        "active": len([m for m in meetings if m["is_active"]]),
        "meetings": meetings
    }


@app.delete("/meetings/{call_id}")
async def delete_meeting(call_id: str):
    """Delete a meeting and its data"""
    if call_id not in active_meetings:
        raise HTTPException(status_code=404, detail=f"Meeting {call_id} not found")
    
    meeting = active_meetings[call_id]
    
    if meeting.get("is_active", False):
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete active meeting. Stop it first."
        )
    
    del active_meetings[call_id]
    
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
    
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
