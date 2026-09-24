"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const upload = async (file: File) => {
    if (!cloudName || !preset) {
      toast.error("Image upload isn't configured — paste an image URL below instead.");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", preset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
      const data = await res.json();
      if (data.secure_url) {
        onChange(data.secure_url);
        toast.success("Banner uploaded.");
      } else {
        toast.error("Upload failed. Try a different image or paste a URL.");
      }
    } catch {
      toast.error("Upload failed. Try a different image or paste a URL.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative aspect-video rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex items-center justify-center cursor-pointer overflow-hidden hover:border-violet-500/40 transition-colors"
      >
        {value ? (
          <Image src={value} alt="Event banner" fill className="object-cover" />
        ) : uploading ? (
          <Loader2 className="h-6 w-6 text-white/40 animate-spin" />
        ) : (
          <div className="text-center text-white/40">
            <ImagePlus className="h-6 w-6 mx-auto mb-2" />
            <p className="text-xs">Click to upload a banner (16:9 recommended)</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-white/30 shrink-0" />
        <Input placeholder="...or paste an image URL" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
