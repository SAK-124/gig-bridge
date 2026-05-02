import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { GraduationCap, Briefcase, Loader2 } from "lucide-react";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Password required").max(72),
  role: z.enum(["student", "business"]),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

const Auth = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = params.get("mode") === "signup" ? "signup" : "login";
  const initialRole = (params.get("role") as "student" | "business") || "student";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: initialRole });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) { setLoading(false); return toast.error(error.message); }

    const userId = signInData.user?.id;
    if (!userId) { setLoading(false); await supabase.auth.signOut(); return toast.error("Sign-in succeeded but no user was returned. Try again."); }

    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setLoading(false);
    if (roleErr) { await supabase.auth.signOut(); return toast.error(`Could not load your role: ${roleErr.message}`); }
    if (!roleRow?.role) { await supabase.auth.signOut(); return toast.error("Account exists but no role is attached. Contact admin to finish setup."); }

    toast.success("Welcome back!");
    if (roleRow.role === "admin") navigate("/admin");
    else if (roleRow.role === "business") navigate("/business");
    else navigate("/student");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: redirectUrl, data: { full_name: form.fullName } },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    if (data.user) {
      const { error: roleErr } = await supabase
        .from("user_roles")
        .insert({ user_id: data.user.id, role: form.role });
      if (roleErr && !/duplicate|already/i.test(roleErr.message)) {
        setLoading(false);
        return toast.error(`Account created but role assignment failed: ${roleErr.message}. Sign in and contact support.`);
      }
    }

    setLoading(false);
    if (data.session) {
      toast.success("Account created!");
      navigate(form.role === "business" ? "/business" : "/student");
    } else {
      toast.success("Account created. You can log in once email confirmation is complete.");
      setMode("login");
    }
  };

  return (
    <div className="min-h-screen bg-background bridge-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>
        <Card className="p-6 shadow-lift rounded-2xl border-border/60">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="li-email">Email</Label>
                  <Input id="li-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="li-pass">Password</Label>
                  <Input id="li-pass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Log in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label>I am a…</Label>
                  <RadioGroup value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "student" | "business" })} className="grid grid-cols-2 gap-3">
                    <Label htmlFor="r-student" className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-smooth ${form.role === "student" ? "border-primary bg-primary-soft" : "border-border"}`}>
                      <RadioGroupItem value="student" id="r-student" />
                      <GraduationCap className="h-4 w-4" /> Student
                    </Label>
                    <Label htmlFor="r-biz" className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-smooth ${form.role === "business" ? "border-primary bg-primary-soft" : "border-border"}`}>
                      <RadioGroupItem value="business" id="r-biz" />
                      <Briefcase className="h-4 w-4" /> Business
                    </Label>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-name">{form.role === "business" ? "Your name" : "Full name"}</Label>
                  <Input id="su-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pass">Password</Label>
                  <Input id="su-pass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="hover:text-primary">← Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
