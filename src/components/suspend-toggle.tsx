"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export function SuspendToggle({ userId, initialSuspended }: { userId: string; initialSuspended: boolean }) {
  const router = useRouter();
  const [suspended, setSuspended] = useState(initialSuspended);
  const [loading, setLoading] = useState(false);

  const toggle = async (checked: boolean) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSuspended: checked }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not update user.");
      return;
    }
    setSuspended(checked);
    toast.success(checked ? "User suspended." : "User reinstated.");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/40">{suspended ? "Suspended" : "Active"}</span>
      <Switch checked={suspended} onCheckedChange={toggle} disabled={loading} />
    </div>
  );
}
