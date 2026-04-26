import { NextResponse } from "next/server";

/**
 * Initiates an outbound call via VideoSDK's SIP telephony API.
 * 
 * Flow:
 * 1. Dashboard sends phone number + optional prompt to this endpoint
 * 2. This endpoint calls VideoSDK's outbound SIP API
 * 3. VideoSDK routes the call through your Twilio SIP Trunk
 * 4. The call connects to your Python agent (main.py) via routing rules
 * 5. Gemini-powered AI agent handles the conversation
 */
export async function POST(request: Request) {
  try {
    const { phoneNumber, agentPrompt } = await request.json();

    console.log("Initiating outbound call to:", phoneNumber);

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const videosdkToken = process.env.VIDEOSDK_AUTH_TOKEN;
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    // ─── METHOD: Twilio Direct ───
    // Uses Twilio to call the number with a webhook that connects to VideoSDK
    // This is the most reliable method for outbound calls because VideoSDK's direct 
    // Outbound Gateway SIP API requires additional dashboard configuration (gatewayId).
    return await makeTwilioCall(phoneNumber, agentPrompt, twilioAccountSid, twilioAuthToken, twilioPhoneNumber);

  } catch (error) {
    console.error("Call initiation error:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate call",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fallback: Use Twilio to make a direct call with TwiML that connects
 * the call to the VideoSDK room where the AI agent lives.
 */
async function makeTwilioCall(
  phoneNumber: string,
  agentPrompt: string,
  accountSid: string | undefined,
  authToken: string | undefined,
  twilioPhoneNumber: string | undefined
) {
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    return NextResponse.json(
      { error: "Twilio credentials not configured. Set up SIP Trunking in VideoSDK dashboard for proper telephony routing." },
      { status: 500 }
    );
  }

  // Dynamic import for twilio
  const twilio = (await import("twilio")).default;
  const client = twilio(accountSid, authToken);

  const videosdk_sip_uri = process.env.VIDEOSDK_SIP_URI;

  if (!videosdk_sip_uri) {
    return NextResponse.json(
      { error: "VIDEOSDK_SIP_URI is not configured in dashboard/.env.local. Please set it to your Inbound Gateway URI to connect calls to the agent." },
      { status: 500 }
    );
  }

  console.log("Using Twilio direct call with inline TwiML connecting to:", videosdk_sip_uri);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Amy">Please hold while I connect you to the AI assistant.</Say>
    <Dial>
        <Sip>${videosdk_sip_uri}</Sip>
    </Dial>
</Response>`;

  const call = await client.calls.create({
    twiml: twiml,
    to: phoneNumber,
    from: twilioPhoneNumber,
  });

  console.log("Twilio call initiated:", call.sid);

  return NextResponse.json({
    success: true,
    message: "Call initiated via Twilio",
    data: {
      phoneNumber,
      callSid: call.sid,
      callStatus: call.status,
      method: "twilio-direct-twiml",
      promptReceived: agentPrompt !== "",
    },
  });
}
