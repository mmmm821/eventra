"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, User, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"ATTENDEE" | "ORGANIZER">("ATTENDEE");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", organization: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.issues) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, val] of Object.entries<any>(data.issues.fieldErrors ?? {})) {
          if (val?.[0]) fieldErrors[key] = val[0];
        }
        setErrors(fieldErrors);
      }
      toast.error(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      toast.success("Account created — please log in.");
      router.push("/login");
      return;
    }
    router.push(role === "ORGANIZER" ? "/organizer" : "/dashboard");
    router.refresh();
  };

  return (
    <div className="container max-w-md py-16 sm:py-24">
      <h1 className="font-display text-2xl font-semibold text-white text-center">Create your account</h1>
      <p className="text-sm text-white/50 text-center mt-1.5">Discover events or start hosting your own</p>

      <div className="grid grid-cols-2 gap-3 mt-8">
        <RoleCard icon={User} label="Attendee" description="Discover & book" active={role === "ATTENDEE"} onClick={() => setRole("ATTENDEE")} />
        <RoleCard icon={Building2} label="Organizer" description="Host & sell tickets" active={role === "ORGANIZER"} onClick={() => setRole("ORGANIZER")} />
      </div>

      <Card className="p-6 mt-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Full name" error={errors.name}>
            <Input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Priya Sharma" />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" />
          </Field>
          {role === "ORGANIZER" && (
            <Field label="Organization / club name" error={errors.organization}>
              <Input required value={form.organization} onChange={(e) => update("organization", e.target.value)} placeholder="e.g. Tech Society, SRM" />
            </Field>
          )}
          <Field label="Password" error={errors.password}>
            <Input type="password" required value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="At least 8 characters" />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword}>
            <Input type="password" required value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
          </Field>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-white/50 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-violet-300 hover:text-violet-200">Log in</Link>
      </p>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function RoleCard({ icon: Icon, label, description, active, onClick }: { icon: any; label: string; description: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        active ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"
      )}
    >
      <Icon className={cn("h-5 w-5 mb-2", active ? "text-violet-300" : "text-white/50")} />
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="text-xs text-white/45">{description}</p>
    </button>
  );
}
