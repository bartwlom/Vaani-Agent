import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(request: Request) {
  try {
    const { phoneNumber, agentPrompt } = await request.json();

    console.log("Initiating call to:", phoneNumber);

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    console.log("Twilio config check:", {
      accountSid: accountSid ? "Set" : "Missing",
      authToken: authToken ? "Set" : "Missing",
      twilioPhoneNumber: twilioPhoneNumber ? "Set" : "Missing"
    });

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json(
        { error: "Twilio credentials not configured" },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    // Use TwiML Bin URL for demo, or ngrok URL for production
    // For local development, use Twilio's demo TwiML
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL || 
      'http://demo.twilio.com/docs/voice.xml';

    console.log("Using webhook URL:", webhookUrl);

    // Make the actual phone call via Twilio
    const call = await client.calls.create({
      url: webhookUrl,
      to: phoneNumber,
      from: twilioPhoneNumber,
    });

    console.log("Call initiated successfully:", call.sid);

    return NextResponse.json({ 
      success: true, 
      message: "Call initiated successfully",
      data: { 
        phoneNumber,
        callSid: call.sid,
        callStatus: call.status,
        promptReceived: agentPrompt !== ""
      }
    });
  } catch (error) {
    console.error("Twilio call error:", error);
    console.error("Error details:", (error as Error).message);
    
    return NextResponse.json(
      { 
        error: "Failed to initiate call", 
        details: (error as Error).message,
        code: (error as any).code,
        moreInfo: (error as any).moreInfo
      },
      { status: 500 }
    );
  }
}
