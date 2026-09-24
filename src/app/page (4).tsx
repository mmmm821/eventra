"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="container max-w-md py-16 sm:py-24">
      <h1 className="font-display text-2xl font-semibold text-white text-center">Reset your password</h1>
      <p className="text-sm text-white/50 text-center mt-1.5">We'll email you a link to set a new one</p>

      <Card className="p-6 mt-8">
        {sent ? (
          <div className="text-center py-4">
            <MailCheck className="h-8 w-8 text-violet-400 mx-auto mb-3" />
            <p className="text-white text-sm">If an account exists for {email}, a reset link is on its way.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </Button>
          </form>
        )}
      </Card>

      <p className="text-center text-sm text-white/50 mt-6">
        <Link href="/login" className="text-violet-300 hover:text-violet-200">Back to log in</Link>
      </p>
    </div>
  );
}
