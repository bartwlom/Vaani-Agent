# SIP Trunking Setup Guide — Connect Twilio to VideoSDK Agent

This guide walks you through configuring SIP trunking so that phone calls to your Twilio number are routed to your VideoSDK AI agent.

## Prerequisites

- Twilio account with a phone number
- VideoSDK account at [app.videosdk.live](https://app.videosdk.live)
- Python agent (`main.py`) running locally

---

## Step 1: Create Inbound Gateway in VideoSDK

1. Log in to [app.videosdk.live](https://app.videosdk.live)
2. Navigate to **Telephony → Inbound Gateways**
3. Click **Add**
4. Enter your Twilio phone number
5. Click **Create**
6. **Copy the Inbound Gateway SIP URI** (`sip:<your-org-id>.sip.videosdk.live`)

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
3. Click **Create new SIP Trunk** and name it.

### Configure Origination

4. In the SIP Trunk settings, go to the **Origination** tab
5. Click **Add Origination URI**
6. Paste the **Inbound Gateway SIP URI** from Step 1 (`sip:<your-org-id>.sip.videosdk.live`)
7. Set Priority to `10`, Weight to `10`
8. Click **Add**

### Link Your Phone Number

9. Go to **Phone Numbers → Manage → Active Numbers**
10. Click on your number
11. Under **Voice Configuration**:
    - Set **Configure With** to: **SIP Trunk**
    - Select the SIP Trunk you just created
12. Click **Save**

---

## Step 4: Update Environment Variables

Add the VideoSDK SIP URI to your dashboard `.env.local`:

```env
VIDEOSDK_SIP_URI=sip:<your-org-id>.sip.videosdk.live
```

---

## Step 5: Start the Agent

```bash
python main.py
```

---

## Step 6: Test It!

1. Make sure `main.py` is running
2. Call your Twilio number
3. The AI agent should answer and converse.
