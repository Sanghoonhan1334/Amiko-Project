import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseClient } from "@/lib/supabase";

// GET: Get schedule config
export async function GET() {
  try {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
      .from("vc_schedule_config")
      .select("*")
      .eq("is_active", true)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      console.error("[VC_SCHEDULE] Get error:", error);
      return NextResponse.json(
        { error: "Failed to fetch schedule" },
        { status: 500 },
      );
    }

    return NextResponse.json({ schedules: data || [] });
  } catch (err) {
    console.error("[VC_SCHEDULE] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST: Admin - create/update schedule config
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Auth required" }, { status: 401 });

    // Check admin
    const adminClient = createAdminClient();
    const { data: adminCheck } = await adminClient
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { schedules } = body; // Array of schedule configs

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { error: "schedules array required" },
        { status: 400 },
      );
    }

    // Upsert schedules using admin client
    const results = [];
    for (const schedule of schedules) {
      const { data, error } = await adminClient
        .from("vc_schedule_config")
        .upsert({
          id: schedule.id || undefined,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          duration_minutes: schedule.duration_minutes || 30,
          price_usd: schedule.price_usd || 5.0,
          max_slots: schedule.max_slots || 10,
          is_active: schedule.is_active !== false,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("[VC_SCHEDULE] Upsert error:", error);
      } else {
        results.push(data);
      }
    }

    return NextResponse.json({ schedules: results });
  } catch (err) {
    console.error("[VC_SCHEDULE] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE: Admin - delete schedule config
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const adminClient = createAdminClient();
    const { data: adminCheck } = await adminClient
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("id");

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule id required" },
        { status: 400 },
      );
    }

    const { error } = await adminClient
      .from("vc_schedule_config")
      .delete()
      .eq("id", scheduleId);

    if (error) {
      console.error("[VC_SCHEDULE] Delete error:", error);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[VC_SCHEDULE] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
