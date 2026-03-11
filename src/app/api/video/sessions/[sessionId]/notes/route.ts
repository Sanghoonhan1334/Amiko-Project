import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/video/sessions/[sessionId]/notes
 * Get educational notes for this session.
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

    const { data: notes, error } = await admin
      .from("vc_educational_notes")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .eq("status", "ready")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (err) {
    console.error("[Notes] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
