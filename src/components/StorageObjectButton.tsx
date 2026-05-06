import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  bucket: string;
  path: string;
  label: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
};

export const StorageObjectButton = ({
  bucket,
  path,
  label,
  variant = "outline",
  size = "sm",
}: Props) => {
  const [loading, setLoading] = useState(false);

  const openObject = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 5);
    setLoading(false);
    if (error || !data?.signedUrl) {
      toast.error(error?.message || "Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button type="button" variant={variant} size={size} onClick={openObject} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
};
