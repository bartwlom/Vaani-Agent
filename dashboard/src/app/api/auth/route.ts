import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { operatorId, passcode } = await request.json();

    // Mock validation
    if (operatorId && passcode) {
      // In a real app, validate against a database.
      // Here we accept any non-empty credentials for the mock sequence.

      const response = NextResponse.json({ success: true, message: "AUTH_SUCCESS" });
      
      // Set an HTTP-only secure cookie
      response.cookies.set({
        name: "operator_session",
        value: "mock-jwt-token-12345",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "INVALID_CREDENTIALS" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
