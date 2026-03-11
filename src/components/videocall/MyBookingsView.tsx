"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Video,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface MyBookingsViewProps {
  open: boolean;
  onClose: () => void;
}

function getLocalDateTime(utcDateStr: string) {
  const d = new Date(utcDateStr);
  return {
    date: d.toLocaleDateString([], { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    full: d.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "cancelled":
      return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
    case "completed":
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function MyBookingsView({ open, onClose }: MyBookingsViewProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    if (!open || !user?.id) return;
    setLoading(true);
    fetch("/api/videocall/bookings")
      .then((r) => r.json())
      .then((data) => setBookings(data.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, user?.id]);

  const now = new Date();

  const upcomingBookings = bookings.filter((b) => {
    const sessionDate = new Date(b.session?.scheduled_at || "");
    return b.status === "confirmed" && sessionDate > now;
  });

  const pastBookings = bookings.filter((b) => {
    const sessionDate = new Date(b.session?.scheduled_at || "");
    return (
      sessionDate <= now || b.status === "completed" || b.status === "cancelled"
    );
  });

  const canJoinSession = (booking: any) => {
    if (!booking.session?.scheduled_at || booking.status !== "confirmed")
      return false;
    const start = new Date(booking.session.scheduled_at).getTime();
    const durationMs = (booking.session?.duration_minutes || 30) * 60 * 1000;
    const diff = start - Date.now();
    return diff <= 15 * 60 * 1000 && diff > -durationMs;
  };

  const handleJoin = async (booking: any) => {
    try {
      const res = await fetch(
        `/api/video/sessions/${booking.session_id}/access-token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();
      if (res.ok) {
        const params = new URLSearchParams({
          channel: data.channel,
          token: data.token,
          uid: data.uid.toString(),
          appId: data.appId,
          sessionId: booking.session_id,
          title: data.title || booking.session?.title || "",
          durationMinutes: (booking.session?.duration_minutes || 30).toString(),
          ...(data.isHost ? { isHost: "true" } : {}),
          ...(data.token_expires_in
            ? { tokenExpiresIn: data.token_expires_in.toString() }
            : {}),
        });
        window.open(`/videocall/room?${params.toString()}`, "_blank");
      }
    } catch (err) {
      console.error("Join error:", err);
    }
  };

  const renderBookingCard = (booking: any) => {
    const session = booking.session || {};
    const { date, time, full } = getLocalDateTime(session.scheduled_at || "");
    const joinable = canJoinSession(booking);

    return (
      <div
        key={booking.id}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-3 space-y-2"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">
              {session.title || t("vcMarketplace.untitled")}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session.topic}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={`text-[10px] ml-2 ${getStatusBadge(booking.status)}`}
          >
            {t(`vcMarketplace.bookingStatus.${booking.status}`)}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {full}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {time}
          </span>
          {booking.amount_paid > 0 && (
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              ${booking.amount_paid.toFixed(2)}
            </span>
          )}
        </div>

        {/* Host info */}
        {session.host && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center overflow-hidden">
              {session.host.avatar_url ? (
                <img
                  src={session.host.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[8px] text-white font-bold">
                  {session.host.display_name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {session.host.display_name}
            </span>
            {session.host.avg_rating > 0 && (
              <span className="text-xs text-yellow-500 flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-yellow-400" />
                {session.host.avg_rating.toFixed(1)}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        {joinable && (
          <Button
            size="sm"
            onClick={() => handleJoin(booking)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs"
          >
            <Video className="w-3.5 h-3.5 mr-1" />
            {t("vcMarketplace.joinSession")}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5 text-purple-500" />
            {t("vcMarketplace.myBookings")}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-8">
            <TabsTrigger value="upcoming" className="text-xs">
              {t("vcMarketplace.upcoming")} ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="text-xs">
              {t("vcMarketplace.past")} ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-3 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {t("vcMarketplace.noBookings")}
                </p>
              </div>
            ) : (
              upcomingBookings.map(renderBookingCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-3 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
              </div>
            ) : pastBookings.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {t("vcMarketplace.noPastBookings")}
                </p>
              </div>
            ) : (
              pastBookings.map(renderBookingCard)
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
