"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="container max-w-md py-16 sm:py-24">
      <h1 className="font-display text-2xl font-semibold text-white text-center">Welcome back</h1>
      <p className="text-sm text-white/50 text-center mt-1.5">Log in to book tickets and manage your events</p>

      <Card className="p-6 mt-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-violet-300 hover:text-violet-200 mb-1.5">Forgot password?</Link>
            </div>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Log in
          </Button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/35">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <Button variant="secondary" className="w-full" size="lg" onClick={() => signIn("google", { callbackUrl })}>
          Continue with Google
        </Button>
      </Card>

      <p className="text-center text-sm text-white/50 mt-6">
        New to EVENTRA?{" "}
        <Link href="/register" className="text-violet-300 hover:text-violet-200">Create an account</Link>
      </p>
    </div>
  );
}
