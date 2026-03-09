import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const adminClient = createAdminClient();
  const { data: adminCheck } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!adminCheck) return null;
  return { user, adminClient };
}

// GET /api/admin/video/slots — List all admin slots
export async function GET() {
  try {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
      .from("vc_schedule_config")
      .select("*")
      .order("day_of_week")
      .order("start_time");

    if (error) {
      console.error("[ADMIN_SLOTS] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch slots" },
        { status: 500 },
      );
    }

    return NextResponse.json({ slots: data || [] });
  } catch (err) {
    console.error("[ADMIN_SLOTS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/video/slots — Create a new slot
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const auth = await verifyAdmin(supabase);
    if (!auth) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      day_of_week,
      start_time,
      end_time,
      duration_minutes = 30,
      price_usd = 5.0,
      max_slots = 10,
      timezone = "Asia/Seoul",
      is_active = true,
    } = body;

    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: "day_of_week, start_time, and end_time are required" },
        { status: 400 },
      );
    }

    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: "day_of_week must be 0-6" },
        { status: 400 },
      );
    }

    const { data, error } = await auth.adminClient
      .from("vc_schedule_config")
      .insert({
        day_of_week,
        start_time,
        end_time,
        duration_minutes,
        price_usd,
        max_slots,
        timezone,
        is_active,
        created_by: auth.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[ADMIN_SLOTS] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to create slot" },
        { status: 500 },
      );
    }

    return NextResponse.json({ slot: data }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN_SLOTS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
