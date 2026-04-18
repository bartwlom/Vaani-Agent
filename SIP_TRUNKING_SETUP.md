# SIP Trunking Setup Guide — Connect Twilio to VideoSDK Agent

This guide walks you through configuring SIP trunking so that phone calls to your Twilio number are routed to your VideoSDK AI agent (Vaani).

## Prerequisites

- Twilio account with a phone number (`+13613210673`)
- VideoSDK account at [app.videosdk.live](https://app.videosdk.live)
- Python agent (`main.py`) running locally

---

## Step 1: Create Inbound Gateway in VideoSDK

1. Log in to [app.videosdk.live](https://app.videosdk.live)
2. Navigate to **Telephony → Inbound Gateways**
3. Click **Add**
4. Enter your Twilio phone number: `+13613210673`
5. Click **Create**
6. **Copy the Inbound Gateway SIP URI** — it will look like:
   ```
   sip:<your-org-id>.sip.videosdk.live
   ```

> **Save this URI** — you'll need it for both Twilio and your `.env` file.

---

## Step 2: Create Routing Rule in VideoSDK

1. In VideoSDK dashboard, go to **Telephony → Routing Rules**
2. Click **Add**
3. Configure:
   - **Gateway**: Select the gateway you just created
   - **Dispatch**: Select **Agent**
   - **Agent Type**: Select **Self Hosted**
   - **Agent ID**: Enter `MyTelephonyAgent` (must match exactly)
4. Click **Create**

---

## Step 3: Configure Twilio SIP Trunk

1. Log in to [console.twilio.com](https://console.twilio.com)
2. Go to **Voice → SIP Trunking**
3. Click **Create new SIP Trunk**
4. Give it a name (e.g., "VideoSDK AI Agent")

### Configure Origination

5. In the SIP Trunk settings, go to the **Origination** tab
6. Click **Add Origination URI**
7. Paste the **Inbound Gateway SIP URI** from Step 1:
   ```
   sip:<your-org-id>.sip.videosdk.live
   ```
8. Set Priority to `10`, Weight to `10`
9. Click **Add**

### Link Your Phone Number

10. Go to **Phone Numbers → Manage → Active Numbers**
11. Click on your number (`+13613210673`)
12. Under **Voice Configuration**:
    - Set **Configure With** to: **SIP Trunk**
    - Select the SIP Trunk you just created
13. Click **Save**

---

## Step 4: Update Environment Variables

Add the VideoSDK SIP URI to your dashboard `.env.local`:

```env
VIDEOSDK_SIP_URI=sip:<your-org-id>.sip.videosdk.live
```

---

## Step 5: Start the Agent

```bash
cd /home/brtwl/Projects/voice-agent
source venv/bin/activate
python main.py
```

You should see:
```
Starting WorkerJob for Agent: MyTelephonyAgent
Agent will listen on localhost:8081
```

---

## Step 6: Test It!

1. Make sure `main.py` is running
2. Call your Twilio number: `+13613210673`
3. The AI agent should answer and say: *"Hey there! I'm Vaani, your AI assistant..."*
4. Ask it any question — it will respond conversationally

---

## Troubleshooting

### Call goes to voicemail or "number not available"
- Make sure `python main.py` is running
- Check that the Twilio number is linked to the SIP Trunk (not a TwiML app)

### Agent connects but doesn't speak
- Check `GEMINI_API_KEY` is valid and has quota
- Check the agent logs for errors

### "Press a key" / music playing
- Your Twilio number is still pointing to the old TwiML app or demo URL
- Go to Twilio → Phone Numbers → change Voice Configuration to SIP Trunk

### Agent ID mismatch
- The `agent_id` in `main.py` must exactly match the ID in VideoSDK Routing Rules
- Current value: `MyTelephonyAgent`
