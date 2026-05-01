import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

const StudentSettings = () => (
  <div className="space-y-6 max-w-2xl">
    <div>
      <h1 className="font-display text-3xl font-bold text-secondary">Settings</h1>
      <p className="text-muted-foreground">Manage your student account.</p>
    </div>
    <Card className="p-6 rounded-2xl border-border/60 space-y-3">
      <h2 className="font-semibold text-lg">Account</h2>
      <p className="text-sm text-muted-foreground">Profile, payout, and application data are connected to this signed-in account.</p>
      <Button variant="outline" onClick={signOut}>Sign out</Button>
    </Card>
  </div>
);

export default StudentSettings;
