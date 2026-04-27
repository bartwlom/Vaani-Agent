import { NextResponse } from "next/server";

/**
 * Initiates an outbound call via VideoSDK's SIP telephony API.
 *
 * Flow:
 * 1. Dashboard sends phone number + optional prompt to this endpoint
 * 2. This endpoint calls VideoSDK's /v2/sip/call API
 * 3. VideoSDK creates a room, routes to the registered agent (MyTelephonyAgent)
 * 4. VideoSDK bridges the phone call through the outbound gateway (Twilio)
 * 5. Gemini-powered AI agent handles the conversation
 */
export async function POST(request: Request) {
  try {
    const { phoneNumber, agentPrompt } = await request.json();

    console.log("Initiating outbound call to:", phoneNumber);

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number required" },
        { status: 400 }
      );
    }

    const videosdkToken = process.env.VIDEOSDK_AUTH_TOKEN;
    const gatewayId = process.env.VIDEOSDK_OUTBOUND_GATEWAY_ID;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!videosdkToken) {
      return NextResponse.json(
        { error: "VIDEOSDK_AUTH_TOKEN is not configured." },
        { status: 500 }
      );
    }

    if (!gatewayId) {
      return NextResponse.json(
        {
          error:
            "VIDEOSDK_OUTBOUND_GATEWAY_ID is not configured. Create an outbound gateway in VideoSDK dashboard.",
        },
        { status: 500 }
      );
    }

    // Use VideoSDK's native outbound SIP call API
    // This properly creates a room, routes to the agent, and bridges the call
    console.log("Using VideoSDK outbound SIP call API...");

    const sipCallPayload: Record<string, string> = {
      sipCallTo: phoneNumber,
      gatewayId: gatewayId,
      displayName: "AI Agent",
    };

    // Include 'from' number if available
    if (twilioPhoneNumber) {
      sipCallPayload.sipCallFrom = twilioPhoneNumber;
    }

    const response = await fetch("https://api.videosdk.live/v2/sip/call", {
      method: "POST",
      headers: {
        Authorization: videosdkToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sipCallPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("VideoSDK SIP call failed:", data);
      return NextResponse.json(
        {
          error: "Failed to initiate call via VideoSDK",
          details: data.message || JSON.stringify(data),
        },
        { status: response.status }
      );
    }

    console.log("VideoSDK call initiated:", JSON.stringify(data));

    return NextResponse.json({
      success: true,
      message: "Call initiated via VideoSDK SIP",
      data: {
        phoneNumber,
        callSid: data.data?.id || data.data?.roomId || "unknown",
        callStatus: data.data?.status || "initiated",
        roomId: data.data?.roomId,
        method: "videosdk-sip-outbound",
        promptReceived: agentPrompt !== "",
      },
    });
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
