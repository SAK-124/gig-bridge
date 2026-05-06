import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  hireId: string;
  readonly?: boolean;
}

export const HireChat = ({ hireId, readonly = false }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("hire_id", hireId)
      .order("created_at", { ascending: true });
    const msgs = data || [];
    setMessages(msgs);

    // Load sender names we don't have yet
    const unknown = [...new Set(msgs.map((m) => m.sender_id))].filter((id) => !profiles[id]);
    if (unknown.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, company_name").in("user_id", unknown);
      const map: Record<string, string> = { ...profiles };
      (profs || []).forEach((p: any) => { map[p.user_id] = p.full_name || p.company_name || "User"; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`hire-chat-${hireId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `hire_id=eq.${hireId}` }, () => {
        loadMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hireId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!user || !text.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      hire_id: hireId,
      sender_id: user.id,
      message_text: text.trim(),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setText("");
  };

  if (loading) return (
    <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />Loading chat...
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <MessageCircle className="h-4 w-4" />Messages
      </div>

      <div className="bg-muted/30 rounded-xl p-3 space-y-2 max-h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No messages yet. Start the conversation.</p>
        ) : messages.map((msg) => {
          const isOwn = msg.sender_id === user?.id;
          const senderName = profiles[msg.sender_id] || "User";
          return (
            <div key={msg.id} className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-muted-foreground px-1">{senderName}</span>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${isOwn ? "bg-primary text-primary-foreground" : "bg-card border border-border/60"}`}>
                {msg.message_text}
                {msg.attachment_urls?.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="block text-xs underline mt-1 opacity-80">Attachment {i + 1}</a>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground px-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!readonly && (
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message..."
            className="text-base"
            disabled={sending}
          />
          <Button size="sm" onClick={send} disabled={sending || !text.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};
