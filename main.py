import asyncio
import logging
import os
import sys
from typing import Optional

from dotenv import load_dotenv
from videosdk.agents import (
    Agent,
    AgentSession,
    JobContext,
    Options,
    RealTimePipeline,
    RoomOptions,
    WorkerJob,
)
from videosdk.plugins.google import GeminiLiveConfig, GeminiRealtime

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("VaaniAgent")

# Constants
AGENT_ID = "MyTelephonyAgent"


class MyVoiceAgent(Agent):
    """
    Custom Voice Agent implementation for handling telephony sessions.
    """

    def __init__(self):
        super().__init__(
            instructions="You are a helpful AI assistant that answers phone calls. Keep your responses concise and friendly.",
        )

    async def on_enter(self) -> None:
        """Called when the agent successfully joins the room."""
        logger.info(f"Agent {AGENT_ID} joined the session.")
        try:
            await self.session.say(
                "Hello! I'm your real-time assistant. How can I help you today?"
            )
        except Exception:
            logger.error("Failed to speak initial greeting")

    async def on_exit(self) -> None:
        """Called when the agent is leaving the room."""
        logger.info(f"Agent {AGENT_ID} is exiting the session.")
        try:
            await self.session.say("Goodbye! It was great talking with you!")
        except Exception:
            logger.error("Failed to speak goodbye message")


async def start_session(context: JobContext):
    """
    Main entry point for each individual call/session.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        logger.error("GEMINI_API_KEY is not set.")
        return

    logger.info("Initializing Gemini Realtime model...")
    model = GeminiRealtime(
        model="gemini-2.0-flash-exp",  # Using a standard stable/known preview model
        api_key=gemini_key,
        config=GeminiLiveConfig(voice="Leda", response_modalities=["AUDIO"]),
    )

    pipeline = RealTimePipeline(model=model)
    session = AgentSession(agent=MyVoiceAgent(), pipeline=pipeline)

    try:
        logger.info("Connecting to VideoSDK room...")
        await context.connect()
        logger.info("Starting agent session...")
        await session.start()

        # Keep the session alive until interrupted
        stop_event = asyncio.Event()
        await stop_event.wait()

    except Exception:
        logger.exception("An error occurred during the agent session")
    finally:
        logger.info("Shutting down session and context...")
        await session.close()
        await context.shutdown()


def make_context() -> JobContext:
    """Creates a new JobContext with default room options."""
    return JobContext(room_options=RoomOptions())


def validate_env():
    """Validates that required environment variables are set."""
    load_dotenv()
    required_vars = ["GEMINI_API_KEY", "VIDEOSDK_API_KEY", "VIDEOSDK_SECRET"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please check your .env file.")
        sys.exit(1)


if __name__ == "__main__":
    validate_env()

    try:
        # Register the agent with a unique ID for telephony routing
        options = Options(
            agent_id=AGENT_ID,
            register=True,
            max_processes=10,
            host="localhost",
            port=8081,
        )

        logger.info(f"Starting WorkerJob for Agent: {AGENT_ID}")
        job = WorkerJob(entrypoint=start_session, jobctx=make_context, options=options)
        job.start()
    except KeyboardInterrupt:
        logger.info("Agent worker stopped by user.")
    except Exception:
        logger.exception("Failed to start agent worker")
