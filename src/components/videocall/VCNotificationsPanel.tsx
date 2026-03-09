"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  Check,
  CheckCheck,
  CalendarDays,
  CreditCard,
  AlertCircle,
  Video,
  Clock,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VCNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  session?: {
    id: string;
    title: string;
    scheduled_at: string;
    status: string;
  };
}

function getNotifIcon(type: string) {
  switch (type) {
    case "session_booked":
      return CalendarDays;
    case "payment_confirmed":
      return CreditCard;
    case "session_starting":
      return Video;
    case "session_cancelled":
      return AlertCircle;
    case "reminder_24h":
    case "reminder_1h":
      return Clock;
    case "refund":
      return CreditCard;
    default:
      return Bell;
  }
}

function getNotifColor(type: string) {
  switch (type) {
    case "session_booked":
      return "text-blue-500";
    case "payment_confirmed":
      return "text-green-500";
    case "session_starting":
      return "text-purple-500";
    case "session_cancelled":
      return "text-red-500";
    case "reminder_24h":
    case "reminder_1h":
      return "text-yellow-500";
    case "refund":
      return "text-orange-500";
    default:
      return "text-gray-500";
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function VCNotificationsPanel() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<VCNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/videocall/notifications?limit=20");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {}
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/videocall/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch {}
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/videocall/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifications();
        }}
        className="relative text-xs"
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {t("vcMarketplace.notifications.title")}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-purple-500 hover:text-purple-600 font-medium flex items-center gap-0.5"
                >
                  <CheckCheck className="w-3 h-3" />
                  {t("vcMarketplace.notifications.markAllRead")}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t("vcMarketplace.notifications.empty")}
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = getNotifIcon(notif.type);
                const color = getNotifColor(notif.type);
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                    className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-gray-50 dark:border-gray-750 transition-colors cursor-pointer ${
                      notif.is_read
                        ? "bg-white dark:bg-gray-800"
                        : "bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    }`}
                  >
                    <div className={`mt-0.5 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-tight ${
                          notif.is_read
                            ? "text-gray-600 dark:text-gray-400"
                            : "text-gray-800 dark:text-gray-100 font-medium"
                        }`}
                      >
                        {notif.message}
                      </p>
                      {notif.session && (
                        <p className="text-[10px] text-purple-500 dark:text-purple-400 mt-0.5 truncate">
                          {notif.session.title}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {timeAgo(notif.created_at)}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
