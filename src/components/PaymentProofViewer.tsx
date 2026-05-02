import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

type Props = {
  path: string;
  label?: string;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default" | "lg";
};

export const PaymentProofViewer = ({ path, label = "View proof", variant = "outline", size = "sm" }: Props) => {
  const [open, setOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isPdf = path.toLowerCase().endsWith(".pdf");

  const openViewer = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 60 * 5);
    setLoading(false);
    if (error || !data?.signedUrl) {
      toast.error(error?.message || "Could not load proof");
      return;
    }
    setSignedUrl(data.signedUrl);
    setOpen(true);
  };

  return (
    <>
      <Button variant={variant} size={size} onClick={openViewer} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isPdf ? <FileText className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Payment proof</DialogTitle></DialogHeader>
          {signedUrl && (
            isPdf ? (
              <iframe src={signedUrl} className="w-full h-[70vh] rounded-lg border" title="Payment proof PDF" />
            ) : (
              <img src={signedUrl} alt="Payment proof" className="w-full max-h-[70vh] rounded-lg object-contain bg-muted/40" />
            )
          )}
          {signedUrl && (
            <a href={signedUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Open in new tab →</a>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
