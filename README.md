# Vaani-Agent: VideoSDK + Gemini Realtime Voice

This project runs a real-time AI telephony agent using [VideoSDK](https://videosdk.live/) and [Google Gemini](https://ai.google.dev/). It leverages Gemini's low-latency native audio models to provide rapid, conversational interactions.

## Prerequisites
- Python 3.11 or higher
- A [VideoSDK](https://videosdk.live/) account
- A [Google AI Studio](https://aistudio.google.com/) account (for the Gemini API key)

## 1. Setup Environment Variables
First, create a `.env` file in the root directory and add your API credentials. **Never commit this file to GitHub!**

Create a file named `.env` and paste the following inside:
```env
# Gemini API Key for the AI model
GEMINI_API_KEY="your_gemini_api_key_here"

# VideoSDK Credentials for telephony routing
VIDEOSDK_API_KEY="your_videosdk_api_key_here"
VIDEOSDK_SECRET="your_videosdk_secret_here"
```

## 2. Set Up a Python Virtual Environment
Modern Linux systems block global package installation to protect the OS. You must create and activate a virtual environment first:

```bash
# Create the virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate
# (On Windows use: venv\Scripts\activate)
```

## 3. Install Dependencies
With the virtual environment activated, install the required packages:

```bash
pip3 install -r requirements.txt
```

## 4. Run the Agent
Start the agent worker. It will connect to VideoSDK and wait for calls:

```bash
python3 main.py
```
*Note: Leave this terminal open and running. The agent uses the unique identifier `MyTelephonyAgent` to handle routing.*

## 5. Making a Call
Once the agent is running:
1. **Inbound Calls**: Go to your VideoSDK Dashboard -> **Telephony / SIP**. You can link a phone number (provided by VideoSDK or Twilio) directly to the Agent ID: `MyTelephonyAgent`. When anyone dials that phone number, the agent will instantly pick up and answer!
2. **Outbound Calls**: You can use the VideoSDK API to trigger an outbound call to any real phone number, assigning `MyTelephonyAgent` as the AI participant in the room.


