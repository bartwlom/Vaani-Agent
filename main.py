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
    Conversational Voice Agent — acts like a real-time AI assistant over phone.
    The user speaks naturally and the agent responds conversationally,
    similar to talking with ChatGPT but over a phone call.
    """

    def __init__(self, custom_instructions: str = ""):
        # Use custom instructions if provided (from dashboard), otherwise use defaults
        default_instructions = (
            "You are Vaani, a friendly and intelligent AI voice assistant on a phone call. "
            "You are having a real-time voice conversation with the caller. "
            "IMPORTANT RULES:\n"
            "1. Respond naturally and conversationally, as if you're a helpful friend.\n"
            "2. Keep your answers concise — this is a phone call, not a text chat. "
            "Aim for 1-3 sentences unless the user asks for detail.\n"
            "3. NEVER ask the user to press keys, dial numbers, or interact with a phone menu. "
            "This is a natural voice conversation.\n"
            "4. You can answer questions on any topic — general knowledge, math, science, "
            "coding, daily life, recommendations, etc.\n"
            "5. If you don't know something, say so honestly.\n"
            "6. Be warm, helpful, and engaging. Use a conversational tone.\n"
            "7. Listen carefully to what the user says and respond directly to their question.\n"
            "8. If the user seems confused or silent, gently prompt them: "
            "'Is there anything I can help you with?'\n"
        )

        instructions = custom_instructions if custom_instructions.strip() else default_instructions

        super().__init__(
            instructions=instructions,
        )
        logger.info("VoiceAgent initialized with instructions.")

    async def on_enter(self) -> None:
        """Called when the agent successfully joins the room and the call connects."""
        logger.info(f"Agent {AGENT_ID} joined the session — greeting the caller.")
        try:
            await self.session.say(
                "Hey there! I'm Vaani, your AI assistant. "
                "You can ask me anything — I'm here to help. What's on your mind?"
            )
        except Exception:
            logger.error("Failed to speak initial greeting", exc_info=True)

    async def on_exit(self) -> None:
        """Called when the agent is leaving the room / call ends."""
        logger.info(f"Agent {AGENT_ID} is exiting the session.")
        try:
            await self.session.say("Thanks for chatting! Have a great day. Goodbye!")
        except Exception:
            logger.error("Failed to speak goodbye message", exc_info=True)


async def start_session(context: JobContext):
    """
    Main entry point for each individual call/session.
    This is invoked by VideoSDK when a call is routed to this agent
    via the Inbound Gateway → Routing Rule pipeline.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        logger.error("GEMINI_API_KEY is not set. Cannot start session.")
        return

    logger.info("Initializing Gemini Realtime model for telephony...")
    model = GeminiRealtime(
        model="gemini-2.5-flash-native-audio-preview-12-2025",
        api_key=gemini_key,
        config=GeminiLiveConfig(
            voice="Leda",
            response_modalities=["AUDIO"],
        ),
    )

    pipeline = RealTimePipeline(model=model)
    session = AgentSession(agent=MyVoiceAgent(), pipeline=pipeline)

    try:
        logger.info("Connecting to VideoSDK room...")
        await context.connect()
        logger.info("Starting agent session — ready for conversation.")
        await session.start()

        # Keep the session alive until the call ends or is interrupted
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

    required_vars = ["GEMINI_API_KEY", "VIDEOSDK_AUTH_TOKEN"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please check your .env file.")
        logger.error("")
        logger.error("Required variables:")
        logger.error("  GEMINI_API_KEY       - Your Google Gemini API key")
        logger.error("  VIDEOSDK_AUTH_TOKEN   - Your VideoSDK authentication token")
        logger.error("")
        logger.error("Optional variables:")
        logger.error("  VIDEOSDK_API_KEY     - VideoSDK API key (for dashboard)")
        logger.error("  VIDEOSDK_SECRET      - VideoSDK secret (for dashboard)")
        sys.exit(1)


if __name__ == "__main__":
    validate_env()

    try:
        # Register the agent with a unique ID for telephony routing.
        # This agent_id MUST match the one configured in VideoSDK Dashboard
        # under Telephony → Routing Rules.
        options = Options(
            agent_id=AGENT_ID,
            register=True,
            max_processes=10,
            host="localhost",
            port=8081,
        )

        logger.info(f"Starting WorkerJob for Agent: {AGENT_ID}")
        logger.info(f"Agent will listen on localhost:8081")
        logger.info(f"Make sure VideoSDK Routing Rule points to agent_id='{AGENT_ID}'")
        job = WorkerJob(entrypoint=start_session, jobctx=make_context, options=options)
        job.start()
    except KeyboardInterrupt:
        logger.info("Agent worker stopped by user.")
    except Exception:
        logger.exception("Failed to start agent worker")
