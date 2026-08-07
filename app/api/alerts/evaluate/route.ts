import { timingSafeEqual } from "node:crypto";
import { runAlertEvaluation } from "@/lib/alerts/scheduler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const summary = await runAlertEvaluation();
    return Response.json(summary, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Alert evaluation failed." }, { status: 500 });
  }
}

export const GET = POST;
