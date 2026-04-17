import { NextResponse } from "next/server";

// This endpoint receives webhook from Twilio when the call connects.
// It returns TwiML instructions for what to do with the call.
export async function POST(request: Request) {
  try {
    // Read Twilio's incoming webhook payload
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

    // For now, return a simple TwiML response that speaks a message
    // In production, you would connect this to VideoSDK for AI processing
    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
          <Say voice="alice">Hello! This is your AI assistant. How can I help you today?</Say>
          <Pause length="2"/>
          <Say voice="alice">Thank you for calling. Goodbye!</Say>
      </Response>
    `;

    console.log("Returning TwiML response");

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Also handle GET requests for testing
export async function GET() {
  const twiml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say voice="alice">Hello! This is your AI assistant.</Say>
    </Response>
  `;

  return new NextResponse(twiml, {
    headers: {
      "Content-Type": "text/xml",
    },
    status: 200,
  });
}
