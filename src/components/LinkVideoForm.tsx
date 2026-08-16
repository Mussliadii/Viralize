"use client";

import { useState } from "react";
import { Link2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LinkVideoForm({
  contentId,
  onLinked,
}: {
  contentId: string;
  onLinked: () => void;
}) {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/content/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeVideoUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to link video");
      onLinked();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-6 shadow-card">
      <p className="text-muted-foreground">
        Not published yet. Once you&apos;ve uploaded this video to YouTube
        yourself, paste the link here to start tracking real performance.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:outline focus:outline-2 focus:outline-ring"
        />
        <Button onClick={submit} disabled={!url || saving}>
          <Link2 className="h-4 w-4" aria-hidden="true" />
          {saving ? "Linking..." : "Link Video"}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}
    </div>
  );
}
