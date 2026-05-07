import { ReactNode, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

type DeleteActionButtonProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  children?: ReactNode;
  disabled?: boolean;
  onConfirm: () => Promise<void> | void;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
};

export function DeleteActionButton({
  title,
  description,
  confirmLabel = "Delete",
  children,
  disabled,
  onConfirm,
  size = "sm",
  variant = "ghost",
  className,
}: DeleteActionButtonProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size={size} variant={variant} className={className} disabled={disabled || saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : children ?? <Trash2 className="h-3.5 w-3.5 text-destructive" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); confirm(); }} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
