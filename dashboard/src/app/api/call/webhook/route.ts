import { NextResponse } from "next/server";

// =========================================================================
// ⚠️ TODO: THIS IS THE WEBHOOK ENDPOINT FOR TWILIO -> VIDEOSDK MEDIA LOGIC
// =========================================================================
// This endpoint receives updates/TwiML from Twilio when the call connects.
// You should return valid TwiML here that instructs Twilio to stream audio
// via WebSocket to your VideoSDK Worker backend.
//
export async function POST(request: Request) {
  try {
    // Read Twilio's incoming webhook payload
    // const twilioData = await request.formData();
    // const callStatus = twilioData.get("CallStatus");

    // Output TwiML asking Twilio to connect via WebSocket (Media Stream)
    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
          <Connect>
              <Stream url="wss://your-videosdk-worker-url.com/stream">
              </Stream>
          </Connect>
      </Response>
    `;

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
      status: 200,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
