import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// POST: Report a user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const body = await request.json();
    const { session_id, reported_user_id, reason, description } = body;

    if (!reported_user_id || !reason) {
      return NextResponse.json(
        { error: "reported_user_id and reason required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("vc_reports")
      .insert({
        session_id: session_id || null,
        reporter_id: user.id,
        reported_user_id,
        reason,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[VC_REPORTS] Insert error:", error);
      return NextResponse.json({ error: "Report failed" }, { status: 500 });
    }

    return NextResponse.json({ report: data }, { status: 201 });
  } catch (err) {
    console.error("[VC_REPORTS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
