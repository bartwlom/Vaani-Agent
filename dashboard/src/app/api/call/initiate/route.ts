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

    // Check which method to use: VideoSDK SIP API (preferred) or Twilio fallback
    if (videosdkToken) {
      // ─── METHOD 1: VideoSDK Outbound SIP Call (Recommended) ───
      // This routes through VideoSDK → SIP Trunk → Phone, and the AI agent
      // is automatically connected via the routing rule.
      console.log("Using VideoSDK SIP outbound call...");

      const res = await fetch("https://api.videosdk.live/v2/sip/outbound-call", {
        method: "POST",
        headers: {
          "Authorization": videosdkToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          from: twilioPhoneNumber,
          agentId: "MyTelephonyAgent",
          // Pass custom instructions if provided from dashboard
          ...(agentPrompt && { metadata: { systemPrompt: agentPrompt } }),
        }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error("VideoSDK SIP call error:", errorData);
        
        // Fall back to Twilio direct if VideoSDK SIP is not configured
        if (res.status === 404 || res.status === 400) {
          console.log("VideoSDK SIP endpoint not available, trying Twilio direct...");
          return await makeTwilioCall(phoneNumber, agentPrompt, twilioAccountSid, twilioAuthToken, twilioPhoneNumber);
        }
        
        throw new Error(`VideoSDK API error: ${res.status} - ${errorData}`);
      }

      const data = await res.json();
      console.log("VideoSDK outbound call initiated:", data);

      return NextResponse.json({
        success: true,
        message: "Call initiated via VideoSDK SIP",
        data: {
          phoneNumber,
          callSid: data.callId || data.id || "videosdk-call",
          callStatus: "initiated",
          method: "videosdk-sip",
          promptReceived: agentPrompt !== "",
        },
      });
    }

    // ─── METHOD 2: Twilio Direct (Fallback) ───
    // Uses Twilio to call the number with a webhook that connects to VideoSDK
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

  // Use our own webhook that returns TwiML to connect to VideoSDK
  // For this to work, you need the webhook publicly accessible (ngrok, etc.)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  const webhookUrl = baseUrl
    ? `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/api/call/webhook`
    : undefined;

  if (!webhookUrl) {
    return NextResponse.json(
      {
        error: "No public webhook URL configured. For outbound calls, either:\n" +
          "1. Set up VideoSDK Outbound Gateway + SIP Trunk (recommended), or\n" +
          "2. Set NEXT_PUBLIC_APP_URL to your public URL (ngrok for dev)",
      },
      { status: 500 }
    );
  }

  console.log("Using Twilio direct call with webhook:", webhookUrl);

  const call = await client.calls.create({
    url: webhookUrl,
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
      method: "twilio-direct",
      promptReceived: agentPrompt !== "",
    },
  });
}
