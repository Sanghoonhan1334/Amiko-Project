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

// PATCH /api/admin/video/slots/[slotId] — Update a slot
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> },
) {
  try {
    const { slotId } = await params;
    const supabase = await createSupabaseClient();
    const auth = await verifyAdmin(supabase);
    if (!auth) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const allowedFields = [
      "day_of_week",
      "start_time",
      "end_time",
      "duration_minutes",
      "price_usd",
      "max_slots",
      "timezone",
      "is_active",
    ];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const { data, error } = await auth.adminClient
      .from("vc_schedule_config")
      .update(updates)
      .eq("id", slotId)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN_SLOTS] Update error:", error);
      return NextResponse.json(
        { error: "Failed to update slot" },
        { status: 500 },
      );
    }

    return NextResponse.json({ slot: data });
  } catch (err) {
    console.error("[ADMIN_SLOTS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/video/slots/[slotId] — Delete a slot
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> },
) {
  try {
    const { slotId } = await params;
    const supabase = await createSupabaseClient();
    const auth = await verifyAdmin(supabase);
    if (!auth) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { error } = await auth.adminClient
      .from("vc_schedule_config")
      .delete()
      .eq("id", slotId);

    if (error) {
      console.error("[ADMIN_SLOTS] Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete slot" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN_SLOTS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
