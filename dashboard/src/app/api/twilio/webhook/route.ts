import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const videosdk_sip_uri = process.env.VIDEOSDK_SIP_URI;

    if (!videosdk_sip_uri) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>SIP URI not configured.</Say></Response>`,
        {
          headers: { "Content-Type": "text/xml" },
        }
      );
    }

    console.log("Inbound Twilio call received. Forwarding to VideoSDK SIP:", videosdk_sip_uri);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>
        <Sip>${videosdk_sip_uri}</Sip>
    </Dial>
</Response>`;

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>An application error has occurred.</Say></Response>`,
      {
        headers: { "Content-Type": "text/xml" },
      }
    );
  }
}
