"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Users,
  Clock,
  Globe,
  CalendarDays,
  MapPin,
  DollarSign,
  Flag,
  Video,
  Loader2,
  AlertCircle,
  CheckCircle,
  User,
  Play,
} from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { PAYPAL_CONFIG } from "@/lib/paypal";
import RatingModal from "./RatingModal";
import ReportModal from "./ReportModal";

interface SessionDetailModalProps {
  session: any;
  open: boolean;
  onClose: () => void;
  onBookingComplete: () => void;
}

function getLocalDateTime(utcDateStr: string) {
  const d = new Date(utcDateStr);
  return {
    date: d.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

function getCategoryEmoji(category: string) {
  const emojis: Record<string, string> = {
    general: "💬",
    language: "🗣️",
    food: "🍜",
    travel: "✈️",
    music: "🎵",
    fashion: "👗",
    technology: "💻",
    sports: "⚽",
    movies: "🎬",
    history: "📜",
    art: "🎨",
    business: "💼",
  };
  return emojis[category] || "💬";
}

export default function SessionDetailModal({
  session,
  open,
  onClose,
  onBookingComplete,
}: SessionDetailModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [sessionDetail, setSessionDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [myBooking, setMyBooking] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showPaypal, setShowPaypal] = useState(false);
  const [vcBookingId, setVcBookingId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!session?.id) return;
    setLoading(true);
    fetch(`/api/videocall/sessions/${session.id}`)
      .then((r) => r.json())
      .then((data) => {
        setSessionDetail(data.session || session);
        // Check if user has a booking for this session
        if (user?.id && data.session?.bookings) {
          const userBooking = data.session.bookings.find(
            (b: any) => b.user_id === user.id && b.status === "confirmed",
          );
          setMyBooking(userBooking || null);
        }
      })
      .catch(() => setSessionDetail(session))
      .finally(() => setLoading(false));
  }, [session?.id, user?.id]);

  const s = sessionDetail || session;
  const host = s?.host;
  const { date, time } = getLocalDateTime(s?.scheduled_at || "");
  const spotsLeft = (s?.max_participants || 0) - (s?.current_participants || 0);
  const isHost = user?.id === host?.user_id;
  const canJoin = myBooking && s?.status === "live";
  const sessionEnded = s?.status === "completed";
  const hasRated = s?.ratings?.some((r: any) => r.user_id === user?.id);

  // Check if within 15 minutes of start
  const canJoinSoon = (() => {
    if (!myBooking || !s?.scheduled_at) return false;
    const start = new Date(s.scheduled_at).getTime();
    const now = Date.now();
    return now >= start - 15 * 60 * 1000;
  })();

  const handleFreeBooking = async () => {
    try {
      setBooking(true);
      setError("");
      // Use Phase 1 enrollment endpoint
      const res = await fetch(`/api/video/sessions/${s.id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("vcMarketplace.bookingError"));
        return;
      }
      if (data.requires_payment) {
        // Session requires payment — show PayPal flow
        setVcBookingId(data.booking.id);
        setShowPaypal(true);
        return;
      }
      setMyBooking(data.booking);
      setSuccess(t("vcMarketplace.bookingSuccess"));
      setTimeout(() => onBookingComplete(), 1500);
    } catch {
      setError(t("vcMarketplace.bookingError"));
    } finally {
      setBooking(false);
    }
  };

  const handleJoinSession = async () => {
    try {
      setJoining(true);
      setError("");
      // Use Phase 1 access-token endpoint (validates payment + access)
      const res = await fetch(`/api/video/sessions/${s.id}/access-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("vcMarketplace.joinError"));
        return;
      }
      const params = new URLSearchParams({
        channel: data.channel,
        token: data.token,
        uid: data.uid.toString(),
        appId: data.appId,
        sessionId: s.id,
        title: data.title || s.title,
        ...(data.isHost ? { isHost: "true" } : {}),
        ...(data.token_expires_in
          ? { tokenExpiresIn: data.token_expires_in.toString() }
          : {}),
      });
      window.open(`/videocall/room?${params.toString()}`, "_blank");
    } catch {
      setError(t("vcMarketplace.joinError"));
    } finally {
      setJoining(false);
    }
  };

  const handleStartSession = async () => {
    try {
      setStarting(true);
      setError("");
      // Host starts session via access-token (will set session to live)
      const res = await fetch(`/api/video/sessions/${s.id}/access-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("vcMarketplace.startError"));
        return;
      }
      // Open video room
      const params = new URLSearchParams({
        channel: data.channel,
        token: data.token,
        uid: data.uid.toString(),
        appId: data.appId,
        sessionId: s.id,
        title: data.title || s.title,
        isHost: "true",
        ...(data.token_expires_in
          ? { tokenExpiresIn: data.token_expires_in.toString() }
          : {}),
      });
      window.open(`/videocall/room?${params.toString()}`, "_blank");
      setSessionDetail((prev: any) => ({
        ...prev,
        status: "live",
        started_at: new Date().toISOString(),
      }));
      setSuccess(t("vcMarketplace.sessionStarted"));
    } catch {
      setError(t("vcMarketplace.startError"));
    } finally {
      setStarting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {getCategoryEmoji(s.category)}
                  </span>
                  <DialogTitle className="text-base">{s.title}</DialogTitle>
                </div>
                {s.status === "live" && (
                  <Badge className="bg-red-500 text-white text-xs animate-pulse">
                    ● LIVE
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Topic & Description */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {s.topic}
                </p>
                {s.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {s.description}
                  </p>
                )}
              </div>

              {/* Info badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {t(`vcMarketplace.categories.${s.category}`)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {t(`vcMarketplace.levels.${s.level}`)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  {s.language?.toUpperCase()}
                </Badge>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <CalendarDays className="w-4 h-4 text-purple-500" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>{time}</span>
                </div>
              </div>

              {/* Participants & Duration */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <Users className="w-4 h-4 text-green-500" />
                  <span>
                    {s.current_participants}/{s.max_participants}
                  </span>
                  {spotsLeft > 0 && spotsLeft <= 3 && (
                    <span className="text-xs text-orange-500">
                      ({spotsLeft} {t("vcMarketplace.spotsLeft")})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{s.duration_minutes} min</span>
                </div>
              </div>

              {/* Host Profile Section */}
              <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {t("vcMarketplace.hostInfo")}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {host?.avatar_url ? (
                      <img
                        src={host.avatar_url}
                        alt={host.display_name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-800 dark:text-gray-100">
                      {host?.display_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {host?.country && (
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {host.country}
                        </span>
                      )}
                      {host?.avg_rating > 0 && (
                        <span className="text-xs text-yellow-500 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          {host.avg_rating.toFixed(1)} ({host.total_reviews})
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {host?.total_sessions || 0}{" "}
                        {t("vcMarketplace.sessions")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {s.tags && s.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.tags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Ratings Section */}
              {s.ratings && s.ratings.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {t("vcMarketplace.reviews")} ({s.ratings.length})
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {s.ratings.slice(0, 3).map((r: any) => (
                      <div
                        key={r.id}
                        className="bg-gray-50 dark:bg-gray-750 rounded-lg p-2 text-xs"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">
                            {r.overall_rating?.toFixed(1)}
                          </span>
                        </div>
                        {r.comment && (
                          <p className="text-gray-600 dark:text-gray-400">
                            {r.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {success}
                </div>
              )}

              {/* PayPal Payment Section — uses VC-specific routes */}
              {showPaypal && s.price_usd > 0 && user && (
                <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                    {t("vcMarketplace.payment.payWith")}
                  </p>
                  <PayPalScriptProvider
                    options={{
                      clientId: PAYPAL_CONFIG.clientId,
                      currency: "USD",
                      intent: "capture",
                    }}
                  >
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        shape: "rect",
                        label: "pay",
                        height: 40,
                      }}
                      createOrder={async () => {
                        const res = await fetch("/api/videocall/pay", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ session_id: s.id }),
                        });
                        const data = await res.json();
                        if (!res.ok)
                          throw new Error(data.error || "Payment failed");
                        if (data.type === "free") {
                          setMyBooking(data.booking);
                          setSuccess(t("vcMarketplace.bookingSuccess"));
                          setShowPaypal(false);
                          setTimeout(() => onBookingComplete(), 1500);
                          throw new Error("FREE_BOOKING_COMPLETED");
                        }
                        setVcBookingId(data.bookingId);
                        return data.paypalOrderId;
                      }}
                      onApprove={async (data) => {
                        try {
                          const res = await fetch(
                            "/api/videocall/pay/capture",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                paypal_order_id: data.orderID,
                                booking_id: vcBookingId,
                              }),
                            },
                          );
                          const result = await res.json();
                          if (!res.ok) {
                            setError(
                              result.error || t("vcMarketplace.payment.failed"),
                            );
                            return;
                          }
                          setMyBooking({
                            id: vcBookingId,
                            status: "confirmed",
                          });
                          setSuccess(t("vcMarketplace.bookingSuccess"));
                          setShowPaypal(false);
                          setTimeout(() => onBookingComplete(), 1500);
                        } catch {
                          setError(t("vcMarketplace.payment.failed"));
                        }
                      }}
                      onError={(err) => {
                        if (String(err).includes("FREE_BOOKING_COMPLETED"))
                          return;
                        setError(t("vcMarketplace.payment.failed"));
                      }}
                      onCancel={() => {
                        setShowPaypal(false);
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              )}

              {/* Price Display */}
              {!myBooking &&
                !isHost &&
                (s.status === "scheduled" || s.status === "upcoming") &&
                spotsLeft > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {s.price_usd > 0
                        ? `$${s.price_usd.toFixed(2)} USD`
                        : t("vcMarketplace.free")}
                    </p>
                    {s.price_usd > 0 && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {t("vcMarketplace.payment.securePaypal")}
                      </p>
                    )}
                  </div>
                )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {/* Report button */}
              {user && !isHost && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReport(true)}
                  className="text-xs text-gray-400 hover:text-red-500 mr-auto"
                >
                  <Flag className="w-3 h-3 mr-1" />
                  {t("vcMarketplace.report")}
                </Button>
              )}

              {/* Action buttons */}
              {isHost ? (
                <div className="flex items-center gap-2">
                  {(s.status === "scheduled" || s.status === "upcoming") && (
                    <Button
                      size="sm"
                      onClick={handleStartSession}
                      disabled={starting}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs"
                    >
                      {starting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />{" "}
                          {t("vcMarketplace.starting")}
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 mr-1" />{" "}
                          {t("vcMarketplace.startSession")}
                        </>
                      )}
                    </Button>
                  )}
                  {s.status === "live" && (
                    <Button
                      size="sm"
                      onClick={handleJoinSession}
                      disabled={joining}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs"
                    >
                      {joining ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />{" "}
                          {t("vcMarketplace.joining")}
                        </>
                      ) : (
                        <>
                          <Video className="w-3.5 h-3.5 mr-1" />{" "}
                          {t("vcMarketplace.joinSession")}
                        </>
                      )}
                    </Button>
                  )}
                  <Badge variant="secondary" className="text-xs py-1 px-3">
                    {t("vcMarketplace.youAreHost")}
                  </Badge>
                </div>
              ) : myBooking ? (
                <>
                  {sessionEnded && !hasRated ? (
                    <Button
                      size="sm"
                      onClick={() => setShowRating(true)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
                    >
                      <Star className="w-3.5 h-3.5 mr-1" />
                      {t("vcMarketplace.rateSession")}
                    </Button>
                  ) : canJoin || canJoinSoon ? (
                    <Button
                      size="sm"
                      onClick={handleJoinSession}
                      disabled={joining}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs"
                    >
                      {joining ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />{" "}
                          {t("vcMarketplace.joining")}
                        </>
                      ) : (
                        <>
                          <Video className="w-3.5 h-3.5 mr-1" />{" "}
                          {t("vcMarketplace.joinSession")}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-xs py-1 px-3 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {t("vcMarketplace.booked")}
                    </Badge>
                  )}
                </>
              ) : (s.status === "scheduled" || s.status === "upcoming") &&
                spotsLeft > 0 ? (
                s.price_usd > 0 ? (
                  <Button
                    size="sm"
                    onClick={() => setShowPaypal(true)}
                    disabled={showPaypal}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xs"
                  >
                    <DollarSign className="w-3.5 h-3.5 mr-1" />
                    {t("vcMarketplace.bookNow")} - ${s.price_usd.toFixed(2)}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleFreeBooking}
                    disabled={booking}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs"
                  >
                    {booking ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />{" "}
                        {t("vcMarketplace.booking")}
                      </>
                    ) : (
                      <>{t("vcMarketplace.bookFree")}</>
                    )}
                  </Button>
                )
              ) : spotsLeft <= 0 ? (
                <Badge
                  variant="secondary"
                  className="text-xs py-1 px-3 bg-yellow-50 text-yellow-600"
                >
                  {t("vcMarketplace.sessionFull")}
                </Badge>
              ) : null}
            </DialogFooter>
          </>
        )}

        {/* Sub-modals */}
        {showRating && (
          <RatingModal
            open={showRating}
            onClose={() => setShowRating(false)}
            sessionId={s.id}
            hostId={host?.id}
            onRated={() => {
              setShowRating(false);
              setSuccess(t("vcMarketplace.ratingSuccess"));
            }}
          />
        )}
        {showReport && (
          <ReportModal
            open={showReport}
            onClose={() => setShowReport(false)}
            reportedUserId={host?.user_id}
            sessionId={s.id}
            onReported={() => {
              setShowReport(false);
              setSuccess(t("vcMarketplace.reportSuccess"));
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
