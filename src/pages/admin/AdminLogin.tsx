import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedEmail = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.toLowerCase() === "admin") return "admin@gigbridge.local";
    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email and password required");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail(email), password });
    if (error) { setLoading(false); return toast.error(error.message); }

    const userId = data.user?.id;
    if (!userId) { setLoading(false); await supabase.auth.signOut(); return toast.error("Sign-in returned no user."); }

    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setLoading(false);
    if (roleErr) { await supabase.auth.signOut(); return toast.error(`Role check failed: ${roleErr.message}`); }
    if (!roleRow) {
      await supabase.auth.signOut();
      return toast.error("This account doesn't have admin access.");
    }
    toast.success("Welcome, admin.");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-secondary text-secondary-foreground flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0, transparent 40%), radial-gradient(circle at 75% 75%, hsl(var(--accent)) 0, transparent 40%)" }} />
      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-accent/20">
            <ShieldAlert className="h-5 w-5 text-accent" />
          </div>
          <span className="font-display text-xl font-bold">Gig Bridge · Admin</span>
        </div>
        <Card className="p-6 rounded-2xl shadow-lift bg-card text-card-foreground border-border/40">
          <h1 className="font-display text-xl font-semibold mb-1">Operations console</h1>
          <p className="text-sm text-muted-foreground mb-5">Restricted to platform admins.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="ae">Email</Label>
              <Input id="ae" type="text" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="ap">Password</Label>
              <Input id="ap" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in to admin
            </Button>
          </form>
        </Card>
        <p className="text-center text-sm text-secondary-foreground/70 mt-6">
          <Link to="/" className="hover:text-secondary-foreground">← Back to Gig Bridge</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
