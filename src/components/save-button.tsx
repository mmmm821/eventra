"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SaveButton({ eventId, initiallySaved }: { eventId: string; initiallySaved: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      setSaved(data.saved);
      toast.success(data.saved ? "Saved to your events" : "Removed from saved");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={loading}>
      <Heart className={`h-4 w-4 ${saved ? "fill-pink-500 text-pink-500" : ""}`} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
