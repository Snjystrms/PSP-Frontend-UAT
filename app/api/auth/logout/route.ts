import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ message: "Cross-origin logout request rejected." }, { status: 403 });
  }
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set("vaspan_access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
