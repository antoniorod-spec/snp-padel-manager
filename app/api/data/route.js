import { kvGet, kvSet } from "@/lib/kv";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY_TOURNAMENT = "snp:tournament";
const KEY_STATE = "snp:state";

export async function GET() {
  try {
    const [tournament, state] = await Promise.all([
      kvGet(KEY_TOURNAMENT),
      kvGet(KEY_STATE),
    ]);
    return NextResponse.json({ tournament: tournament || null, state: state || {} });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (body.tournament !== undefined) {
      await kvSet(KEY_TOURNAMENT, body.tournament);
    }
    if (body.state !== undefined) {
      await kvSet(KEY_STATE, body.state);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
