import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Checks if a user is a participant (enrolled + paid) or the host of a session.
 * Used to gate access to session-scoped resources (consents, recordings, summaries, notes, reviews).
 */
export async function isSessionParticipant(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const admin = createAdminClient();

  // Check if user is the host
  const { data: session } = await admin
    .from("vc_sessions")
    .select("host_id")
    .eq("id", sessionId)
    .single();

  if (!session) return false;

  const { data: hostProfile } = await admin
    .from("vc_host_profiles")
    .select("user_id")
    .eq("id", session.host_id)
    .single();

  if (hostProfile?.user_id === userId) return true;

  // Check if user has a valid booking
  const { data: booking } = await admin
    .from("vc_bookings")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .not("status", "in", '("cancelled","refunded")')
    .limit(1)
    .single();

  return !!booking;
}
