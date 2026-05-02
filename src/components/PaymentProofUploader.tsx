import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
  hireId: string;
  uploaderRole: "business" | "admin";
  onUploaded: (path: string) => void | Promise<void>;
  buttonLabel?: string;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];

export const PaymentProofUploader = ({ hireId, uploaderRole, onUploaded, buttonLabel }: Props) => {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Use a PNG, JPEG, WebP, or PDF screenshot.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Max 5 MB. Compress your screenshot and try again.");
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop() || "png";
    const safeName = `${uploaderRole}-${Date.now()}.${ext.toLowerCase()}`;
    const path = `${hireId}/${safeName}`;
    const { error } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false, contentType: file.type });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Screenshot uploaded.");
    await onUploaded(path);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="w-full sm:w-auto">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
        {buttonLabel || (uploaderRole === "business" ? "Upload transfer screenshot" : "Upload payout screenshot")}
      </Button>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ImageIcon className="h-3.5 w-3.5" /> PNG / JPEG / WebP / PDF · max 5 MB
      </p>
    </div>
  );
};
