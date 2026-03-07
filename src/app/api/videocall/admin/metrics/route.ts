import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseClient } from "@/lib/supabase";

// GET: Admin metrics dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const adminClient = createAdminClient();

    // Check admin
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

    // Gather metrics
    const [sessionsRes, bookingsRes, hostsRes, ratingsRes, revenueRes] =
      await Promise.all([
        adminClient
          .from("vc_sessions")
          .select("id, status", { count: "exact" }),
        adminClient
          .from("vc_bookings")
          .select("id, payment_status, amount_paid, platform_share", {
            count: "exact",
          }),
        adminClient
          .from("vc_host_profiles")
          .select("id, status, avg_rating", { count: "exact" }),
        adminClient
          .from("vc_ratings")
          .select("overall_rating", { count: "exact" }),
        adminClient
          .from("vc_bookings")
          .select("amount_paid, platform_share, host_share")
          .eq("payment_status", "paid"),
      ]);

    const totalSessions = sessionsRes.count || 0;
    const liveSessions =
      sessionsRes.data?.filter((s) => s.status === "live").length || 0;
    const completedSessions =
      sessionsRes.data?.filter((s) => s.status === "completed").length || 0;
    const totalBookings = bookingsRes.count || 0;
    const paidBookings =
      bookingsRes.data?.filter((b) => b.payment_status === "paid").length || 0;
    const totalHosts = hostsRes.count || 0;
    const activeHosts =
      hostsRes.data?.filter((h) => h.status !== "suspended").length || 0;

    const totalRevenue =
      revenueRes.data?.reduce((sum, b) => sum + (b.amount_paid || 0), 0) || 0;
    const platformRevenue =
      revenueRes.data?.reduce((sum, b) => sum + (b.platform_share || 0), 0) ||
      0;
    const hostRevenue =
      revenueRes.data?.reduce((sum, b) => sum + (b.host_share || 0), 0) || 0;

    const allRatings =
      ratingsRes.data?.map((r) => r.overall_rating).filter(Boolean) || [];
    const avgRating =
      allRatings.length > 0
        ? parseFloat(
            (
              allRatings.reduce((a: number, b: number) => a + b, 0) /
              allRatings.length
            ).toFixed(2),
          )
        : 0;

    return NextResponse.json({
      metrics: {
        sessions: {
          total: totalSessions,
          live: liveSessions,
          completed: completedSessions,
        },
        bookings: { total: totalBookings, paid: paidBookings },
        hosts: { total: totalHosts, active: activeHosts },
        revenue: {
          total: totalRevenue,
          platform: platformRevenue,
          host: hostRevenue,
        },
        ratings: { average: avgRating, total: allRatings.length },
      },
    });
  } catch (err) {
    console.error("[VC_ADMIN_METRICS] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
