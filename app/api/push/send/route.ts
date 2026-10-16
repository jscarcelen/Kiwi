import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import http2 from "node:http2";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Sends queued notifications to iOS devices via APNs (token-based auth).
// Env: PUSH_SECRET, SUPABASE_SERVICE_ROLE_KEY, APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY (contents of the .p8), APNS_BUNDLE_ID (default app.wom.marketplace), APNS_PRODUCTION ("true" for TestFlight/App Store).
const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

function apnsJwt() {
  const header = b64(JSON.stringify({ alg: "ES256", kid: process.env.APNS_KEY_ID }));
  const claims = b64(JSON.stringify({ iss: process.env.APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) }));
  const key = (process.env.APNS_KEY ?? "").replace(/\\n/g, "\n");
  const sig = crypto.sign("sha256", Buffer.from(`${header}.${claims}`), { key, dsaEncoding: "ieee-p1363" });
  return `${header}.${claims}.${b64(sig)}`;
}

function push(client: http2.ClientHttp2Session, jwt: string, token: string, payload: object): Promise<{ status: number; reason?: string }> {
  return new Promise((resolve) => {
    const req = client.request({
      ":method": "POST", ":path": `/3/device/${token}`, authorization: `bearer ${jwt}`,
      "apns-topic": process.env.APNS_BUNDLE_ID || "app.wom.marketplace", "apns-push-type": "alert", "apns-priority": "10",
    });
    let status = 0, body = "";
    req.on("response", (h) => { status = Number(h[":status"]); });
    req.on("data", (c) => (body += c));
    req.on("end", () => { let reason; try { reason = JSON.parse(body).reason; } catch {} resolve({ status, reason }); });
    req.on("error", () => resolve({ status: 0, reason: "network" }));
    req.end(JSON.stringify(payload));
  });
}

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest) { return run(req); }

async function run(req: NextRequest) {
  const secret = process.env.PUSH_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.APNS_KEY || !process.env.APNS_KEY_ID || !process.env.APNS_TEAM_ID || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json({ ok: false, error: "APNs / service-role env vars not set yet" }, { status: 503 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: queue } = await db.from("notifications").select("*").is("sent_at", null).order("created_at").limit(200);
  if (!queue?.length) return NextResponse.json({ ok: true, sent: 0 });

  const { data: tokens } = await db.from("device_tokens").select("token,user_id").in("user_id", Array.from(new Set(queue.map((n) => n.user_id))));
  const byUser = new Map<string, string[]>();
  (tokens ?? []).forEach((t) => byUser.set(t.user_id, [...(byUser.get(t.user_id) ?? []), t.token]));

  const host = process.env.APNS_PRODUCTION === "true" ? "https://api.push.apple.com" : "https://api.sandbox.push.apple.com";
  const client = http2.connect(host);
  client.on("error", () => {});
  const jwt = apnsJwt();
  let sent = 0;
  const dead: string[] = [];
  for (const n of queue) {
    for (const tok of byUser.get(n.user_id) ?? []) {
      const r = await push(client, jwt, tok, { aps: { alert: { title: n.title, body: n.body }, sound: "default" }, url: n.url });
      if (r.status === 200) sent++;
      else if (r.status === 410 || r.reason === "BadDeviceToken" || r.reason === "Unregistered") dead.push(tok);
    }
  }
  client.close();
  if (dead.length) await db.from("device_tokens").delete().in("token", dead);
  await db.from("notifications").update({ sent_at: new Date().toISOString() }).in("id", queue.map((n) => n.id));
  return NextResponse.json({ ok: true, sent, queued: queue.length, removedTokens: dead.length });
}
