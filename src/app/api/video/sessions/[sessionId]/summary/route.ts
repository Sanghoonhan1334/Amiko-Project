import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/video/sessions/[sessionId]/summary
 * Get the session summary.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: summary, error } = await admin
      .from("vc_session_summaries")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
    }

    return NextResponse.json({ summary: summary || null });
  } catch (err) {
    console.error("[Summary] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
