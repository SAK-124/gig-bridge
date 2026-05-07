import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeleteActionButton } from "@/components/DeleteActionButton";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, LogOut, Trash2 } from "lucide-react";

export function AccountDangerZone({ roleLabel }: { roleLabel: "student" | "business" }) {
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    setDeleting(true);
    const { data, error } = await supabase.rpc("delete_own_account" as any);
    setDeleting(false);
    if (error) return toast.error(error.message);
    if (!data) return toast.error("Account was not deleted. Refresh and try again.");
    await signOut();
  };

  return (
    <Card className="p-6 rounded-2xl border-destructive/30 bg-destructive/5 space-y-3">
      <h2 className="font-semibold text-lg text-destructive">Danger zone</h2>
      <p className="text-sm text-muted-foreground">
        Delete this {roleLabel} account from authentication and remove records tied through the database. The same email can sign up again after deletion.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />Sign out
        </Button>
        <DeleteActionButton
          title="Delete your account?"
          description="This removes your login account and cascades connected profile data. This cannot be undone."
          confirmLabel="Delete account"
          variant="destructive"
          onConfirm={deleteAccount}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Trash2 className="mr-2 h-4 w-4" />Delete account</>}
        </DeleteActionButton>
      </div>
    </Card>
  );
}
