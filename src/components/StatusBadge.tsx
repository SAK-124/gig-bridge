import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  awaiting_payment: "Awaiting Payment",
  payment_received: "Payment Received",
  in_progress: "Work In Progress",
  submitted: "Submitted",
  revision_requested: "Revision Requested",
  approved: "Approved",
  payout_pending: "Payout Pending",
  paid: "Paid",
  disputed: "Disputed",
  open: "Open",
  closed: "Closed",
  completed: "Completed",
  pending: "Pending",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
  awaiting: "Awaiting",
  received: "Received",
  refunded: "Refunded",
};

const tones: Record<string, string> = {
  awaiting_payment: "bg-warning/15 text-warning-foreground border-warning/40",
  awaiting: "bg-warning/15 text-warning-foreground border-warning/40",
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
  payment_received: "bg-primary/15 text-primary border-primary/40",
  received: "bg-primary/15 text-primary border-primary/40",
  in_progress: "bg-primary/15 text-primary border-primary/40",
  submitted: "bg-accent/20 text-accent-foreground border-accent/50",
  revision_requested: "bg-warning/15 text-warning-foreground border-warning/40",
  approved: "bg-success/15 text-success border-success/40",
  payout_pending: "bg-accent/20 text-accent-foreground border-accent/50",
  paid: "bg-success/15 text-success border-success/40",
  disputed: "bg-destructive/15 text-destructive border-destructive/40",
  open: "bg-success/15 text-success border-success/40",
  closed: "bg-muted text-muted-foreground border-border",
  completed: "bg-success/15 text-success border-success/40",
  shortlisted: "bg-primary/15 text-primary border-primary/40",
  rejected: "bg-destructive/15 text-destructive border-destructive/40",
  hired: "bg-success/15 text-success border-success/40",
  refunded: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", tones[status] ?? "", className)}>
      {labels[status] ?? status}
    </Badge>
  );
}
