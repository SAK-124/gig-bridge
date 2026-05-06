import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  hireId: string;
  revieweeId: string;
  revieweeName: string;
  reviewerRole: "student" | "business";
  open: boolean;
  onClose: () => void;
}

export const RatingPrompt = ({ hireId, revieweeId, revieweeName, reviewerRole, open, onClose }: Props) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user || rating === 0) return toast.error("Select a star rating");
    setSaving(true);
    const { error } = await supabase.from("reviews").insert({
      hire_id: hireId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      reviewer_role: reviewerRole,
      rating,
      review_text: text.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Review submitted. Thank you!");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate your experience with {revieweeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Rating *</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`${star} star`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hovered || rating) ? "fill-warning text-warning" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
              </p>
            )}
          </div>
          <div>
            <Label>Review (optional)</Label>
            <Textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share a short review about your experience..."
              className="text-base mt-1"
              maxLength={500}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={saving || rating === 0} className="flex-1">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit review
            </Button>
            <Button variant="ghost" onClick={onClose}>Skip</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
