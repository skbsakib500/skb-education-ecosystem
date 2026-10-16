"use client";
import { useEffect } from "react";
import { supabase } from "./supabase";

export function useRealtimeMessages(
  conversationId: string | null,
  onNew: (msg: any) => void
) {
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel("conv-" + conversationId)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: "conversation_id=eq." + conversationId },
        (payload) => onNew(payload.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, onNew]);
}

export function useRealtimeNotifications(
  userId: string | null,
  onNew: (n: any) => void
) {
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel("notif-" + userId)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: "recipient_user_id=eq." + userId },
        (payload) => onNew(payload.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, onNew]);
}
