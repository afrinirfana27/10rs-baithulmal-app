import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDetail } from "@/lib/api";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@baithulmal.com");
  const [password, setPassword] = useState("admin123");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back");
      nav("/");
    } catch (err) {
      toast.error(formatDetail(err.response?.data?.detail) || err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-app" data-testid="login-page">
      {/* Left visual */}
      <div className="hidden md:flex relative bg-moss overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1567712595315-545da0d341b2"
          alt="mosque at sunset"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#157A45]/90 via-[#157A45]/75 to-[#0E5E34]/95" />
        <div className="relative z-10 p-14 flex flex-col justify-between text-white w-full">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center text-2xl font-bold text-white">10₹</div>
            <div>
              <div className="text-3xl font-bold">Baithulmal</div>
              <div className="text-xs tracking-[0.3em] uppercase text-white/70">10 Rupee Community Fund</div>
            </div>
          </div>
          <div>
            <div className="text-4xl leading-[1.15] max-w-md font-medium">
              &ldquo;A little given regularly is dearer to Allah than much given at once.&rdquo;
            </div>
            <div className="mt-4 text-sm text-white/70">— A tradition on charity</div>
          </div>
          <div className="text-xs text-white/60">Donors · Beneficiaries · Kadan · Sadakah · Reports</div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8 flex items-center gap-3">
            <div className="coin-badge">10₹</div>
            <div>
              <div className="text-2xl text-moss font-bold">Baithulmal</div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-[color:var(--text-muted)]">Community Fund</div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl text-[color:var(--text-primary)] font-bold">Welcome back.</h1>
          <p className="mt-2 text-[color:var(--text-secondary)]">Sign in to manage donors, beneficiaries and daily accounts.</p>

          <form onSubmit={submit} className="mt-8 space-y-5" data-testid="login-form">
            <div>
              <Label>Email</Label>
              <Input required type="email" data-testid="login-email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@baithulmal.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input required type="password" data-testid="login-password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button disabled={busy} data-testid="login-submit" className="btn-primary-moss rounded-full w-full py-6 text-base font-medium">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
            <div className="text-xs text-[color:var(--text-muted)] text-center pt-2">
              Default admin — admin@baithulmal.com / admin123
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
