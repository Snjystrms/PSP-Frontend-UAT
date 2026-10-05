type Context = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, { params }: Context) {
  const { path } = await params;
  const endpoint = path.join("/");
  if (endpoint !== "health" && endpoint !== "health/ready") {
    return Response.json({ message: "Unknown health endpoint." }, { status: 404 });
  }
  const apiBase = (process.env.PSP_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/+$/, "");
  const hostBase = apiBase.replace(/\/api\/v1$/i, "");
  try {
    const upstream = await fetch(`${hostBase}/${endpoint}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return Response.json({ status: "unavailable", message: "Payment service health endpoint is unreachable." }, { status: 502 });
  }
}
