import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

// GET  /api/users/me/translation-preferences — Read translation preferences
// PATCH /api/users/me/translation-preferences — Update translation preferences
// Supports both vc (marketplace) and meet (amiko meet) modules via ?module= query param

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();

    let user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const { data } = await supabase.auth.getUser(authHeader.slice(7));
        user = data.user;
      }
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const module = url.searchParams.get("module") || "vc";
    const table =
      module === "meet"
        ? "amiko_meet_translation_preferences"
        : "vc_translation_preferences";

    const { data: prefs } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Return defaults if none saved
    return NextResponse.json({
      preferences: prefs || {
        display_mode: "original_and_translated",
        target_language: "ko",
        auto_detect_source: true,
      },
    });
  } catch (err) {
    console.error("[Translation Prefs GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();

    let user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const { data } = await supabase.auth.getUser(authHeader.slice(7));
        user = data.user;
      }
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const module = body.module || "vc";
    const table =
      module === "meet"
        ? "amiko_meet_translation_preferences"
        : "vc_translation_preferences";

    const updates: Record<string, any> = {};

    // Validate and pick allowed fields
    if (
      body.display_mode &&
      ["original_only", "translated_only", "original_and_translated"].includes(
        body.display_mode
      )
    ) {
      updates.display_mode = body.display_mode;
    }
    if (
      body.target_language &&
      ["ko", "es", "en"].includes(body.target_language)
    ) {
      updates.target_language = body.target_language;
    }
    if (typeof body.auto_detect_source === "boolean") {
      updates.auto_detect_source = body.auto_detect_source;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Atomic upsert
    const { data: prefs, error: upsertErr } = await supabase
      .from(table)
      .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
      .select()
      .single();

    if (upsertErr) {
      console.error("[Translation Prefs Upsert]", upsertErr);
      return NextResponse.json(
        { error: "Failed to save preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences: prefs });
  } catch (err) {
    console.error("[Translation Prefs PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
