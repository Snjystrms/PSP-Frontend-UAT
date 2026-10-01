import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: RouteContext) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      return Response.json({ message: "Cross-origin request rejected." }, { status: 403 });
    }
  }
  const token = await getToken({ req: request as NextRequest, secret: process.env.AUTH_SECRET });
  const accessToken = token?.accessToken;
  if (typeof accessToken !== "string") {
    return Response.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
  }

  const { path } = await context.params;
  const backendBase = (process.env.PSP_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/+$/, "");
  const incoming = new URL(request.url);
  const target = `${backendBase}/${path.map(encodeURIComponent).join("/")}${incoming.search}`;
  const headers = new Headers({ Authorization: `Bearer ${accessToken}` });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
  });
  const responseHeaders = new Headers();
  const responseType = response.headers.get("content-type");
  if (responseType) responseHeaders.set("content-type", responseType);
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
