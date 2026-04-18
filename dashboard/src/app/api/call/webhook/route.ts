import { NextResponse } from "next/server";

/**
 * Twilio Webhook — Called when Twilio connects a call.
 * 
 * Returns TwiML that connects the call to VideoSDK via SIP,
 * where the AI agent is waiting to handle the conversation.
 * 
 * This is used as a fallback when VideoSDK's native SIP outbound
 * is not configured. The preferred path is:
 *   Twilio SIP Trunk → VideoSDK Inbound Gateway → Routing Rule → Agent
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const callStatus = formData.get("CallStatus");
    const callSid = formData.get("CallSid");
    const from = formData.get("From");
    const to = formData.get("To");

    console.log(`\n=== TWILIO WEBHOOK CALLED ===`);
    console.log(`Call SID: ${callSid}`);
    console.log(`Status: ${callStatus}`);
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`==========================\n`);

    // Get the VideoSDK SIP URI from environment
    // This should be your Inbound Gateway URI from VideoSDK dashboard
    const videosdk_sip_uri = process.env.VIDEOSDK_SIP_URI;

    let twiml: string;

    if (videosdk_sip_uri) {
      // Connect the call to VideoSDK via SIP — the AI agent will handle it
      twiml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Say voice="Polly.Amy">Please hold while I connect you to an AI assistant.</Say>
            <Dial>
                <Sip>${videosdk_sip_uri}</Sip>
            </Dial>
        </Response>
      `;
      console.log("Connecting call to VideoSDK via SIP:", videosdk_sip_uri);
    } else {
      // No SIP URI configured — instruct user to set up SIP trunking
      twiml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Say voice="Polly.Amy">
                The AI agent is not yet connected. 
                Please configure the VideoSDK SIP trunk in your dashboard.
                Visit the setup guide for instructions.
            </Say>
            <Pause length="1"/>
            <Say voice="Polly.Amy">Goodbye.</Say>
        </Response>
      `;
      console.warn("⚠️  VIDEOSDK_SIP_URI not set! Cannot bridge call to AI agent.");
      console.warn("Set VIDEOSDK_SIP_URI to your Inbound Gateway URI from VideoSDK dashboard.");
    }

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    
    // Return error TwiML so caller gets feedback
    const errorTwiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
          <Say voice="Polly.Amy">Sorry, there was an error connecting your call. Please try again later.</Say>
      </Response>
    `;
    
    return new NextResponse(errorTwiml, {
      headers: { "Content-Type": "text/xml" },
      status: 200,
    });
  }
}

// Handle GET requests for health check / testing
export async function GET() {
  const sipUri = process.env.VIDEOSDK_SIP_URI;
  
  return NextResponse.json({
    status: "ok",
    sipConfigured: !!sipUri,
    message: sipUri 
      ? "Webhook ready — SIP URI configured" 
      : "⚠️ VIDEOSDK_SIP_URI not configured. Set up Inbound Gateway in VideoSDK dashboard.",
  });
}
