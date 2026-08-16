"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check } from "lucide-react";
import { OAuthConnectStub } from "./OAuthConnectStub";
import { Button } from "@/components/ui/Button";

type PublishingMethod = "manual" | "oauth_demo";

const selectClassName =
  "rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:outline focus:outline-2 focus:outline-ring";

export function SchedulerForm({ contentId }: { contentId: string }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [method, setMethod] = useState<PublishingMethod>("manual");
  const [oauthConnected, setOauthConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(
    date && time && (method === "manual" || oauthConnected),
  );

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const res = await fetch(`/api/content/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          publishingMethod: method,
          scheduledAt,
        }),
      });
      if (!res.ok) throw new Error("Failed to save the schedule");
      setScheduled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (scheduled) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-card border border-border bg-card p-6 text-accent">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5" aria-hidden="true" />
          <span className="font-medium">Scheduled</span>
        </div>
        <Button onClick={() => router.push("/calendar")} className="text-sm">
          View Content Calendar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-6 shadow-card">
      <h2 className="font-medium text-foreground">Schedule This Video</h2>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={selectClassName}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Time</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={selectClassName}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Platform</span>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className={selectClassName}
        >
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          Publishing Method
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMethod("manual")}
            className={`min-h-11 cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              method === "manual"
                ? "border-primary bg-primary text-white"
                : "border-border text-foreground"
            }`}
          >
            Manual Upload
          </button>
          <button
            type="button"
            onClick={() => setMethod("oauth_demo")}
            className={`flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              method === "oauth_demo"
                ? "border-primary bg-primary text-white"
                : "border-border text-foreground"
            }`}
          >
            Auto-post via OAuth
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              DEMO
            </span>
          </button>
        </div>
        {method === "oauth_demo" && (
          <OAuthConnectStub onConnected={() => setOauthConnected(true)} />
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={submit} disabled={!canSubmit || saving}>
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        {saving ? "Saving..." : "Save Schedule"}
      </Button>
    </div>
  );
}
