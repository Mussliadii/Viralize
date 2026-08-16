"use client";

import { useState } from "react";
import { CircleUserRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Demonstrates the "connect account" interaction pattern for Auto-post via
 * OAuth — but it is explicitly a UI demo, not a working integration. Real
 * auto-posting needs per-platform app review (YouTube/TikTok/Meta), which
 * is out of scope for this project (see PRD.md §4b). Clicking "Authorize"
 * never contacts any real platform; it only flips local component state.
 */
export function OAuthConnectStub({
  onConnected,
}: {
  onConnected: () => void;
}) {
  const [stage, setStage] = useState<"idle" | "consent" | "connected">(
    "idle",
  );

  if (stage === "connected") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted px-3 py-2 text-sm text-accent">
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        Connected (Demo Mode) — no real account was linked
      </div>
    );
  }

  if (stage === "consent") {
    return (
      <div className="flex flex-col gap-3 rounded-card border border-dashed border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <CircleUserRound
            className="h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-foreground">Authorize Viralize</p>
            <p className="text-sm text-muted-foreground">
              Allow access to post videos on your behalf
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setStage("connected");
              onConnected();
            }}
            className="text-sm"
          >
            Authorize
          </Button>
          <Button
            variant="outline"
            onClick={() => setStage("idle")}
            className="text-sm"
          >
            Cancel
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Demo only — no account will actually be connected, no data is sent
          to any real platform.
        </p>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => setStage("consent")}
      className="w-fit text-sm"
    >
      <CircleUserRound className="h-4 w-4" aria-hidden="true" />
      Connect Account (Demo)
    </Button>
  );
}
