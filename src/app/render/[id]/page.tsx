"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { VideoPreview } from "@/components/VideoPreview";
import { SchedulerForm } from "@/components/SchedulerForm";
import { Button } from "@/components/ui/Button";

const STAGES = [
  { key: "narration", label: "Generating narration" },
  { key: "footage", label: "Fetching footage" },
  { key: "subtitles", label: "Adding subtitles" },
  { key: "composing", label: "Composing video" },
];

interface ContentStatus {
  renderStatus: string;
  renderError: string | null;
  videoUrl: string | null;
  status: string;
}

const TERMINAL_STATES = new Set(["rendered", "failed"]);

export default function RenderPage() {
  const params = useParams<{ id: string }>();
  const [status, setStatus] = useState<ContentStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const poll = () => {
      fetch(`/api/content/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          setStatus(data.content);
          if (TERMINAL_STATES.has(data.content.renderStatus) && interval) {
            clearInterval(interval);
          }
        })
        .catch(() => {});
    };

    fetch(`/api/content/${params.id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error);
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setStatus(data.content);

        const rs = data.content.renderStatus;
        if (rs === "not_started" || rs === "failed") {
          fetch(`/api/content/${params.id}/render`, { method: "POST" }).catch(
            () => {},
          );
        }
        if (!TERMINAL_STATES.has(rs) || rs === "not_started") {
          interval = setInterval(poll, 1500);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [params.id, retryToken]);

  const currentStageIndex = STAGES.findIndex(
    (s) => s.key === status?.renderStatus,
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-8 px-6 py-16">
      <h1 className="text-3xl text-foreground">
        Rendering Video
      </h1>

      {loadError && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          {loadError}
        </div>
      )}

      {!loadError && status?.renderStatus === "rendered" && status.videoUrl && (
        <>
          <VideoPreview videoUrl={status.videoUrl} />
          {status.status === "draft" ? (
            <div className="w-full">
              <SchedulerForm contentId={params.id} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Already scheduled — see the{" "}
              <a href="/calendar" className="underline">
                Content Calendar
              </a>
              .
            </p>
          )}
        </>
      )}

      {!loadError && status?.renderStatus === "failed" && (
        <div className="flex w-full flex-col items-start gap-3 rounded-card border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
            <span className="font-medium">Render failed</span>
          </div>
          <p className="text-sm text-muted-foreground">{status.renderError}</p>
          <Button onClick={() => setRetryToken((t) => t + 1)}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {!loadError &&
        status &&
        !TERMINAL_STATES.has(status.renderStatus) && (
          <ul className="flex w-full flex-col gap-3">
            {STAGES.map((stage, i) => {
              const isDone = currentStageIndex > i;
              const isCurrent = currentStageIndex === i;
              return (
                <li
                  key={stage.key}
                  className={`flex items-center gap-3 rounded-card border border-border bg-card px-4 py-3 ${
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2
                      className="h-5 w-5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                  ) : isCurrent ? (
                    <Loader2
                      className="h-5 w-5 shrink-0 animate-spin text-primary"
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="h-5 w-5 shrink-0 rounded-full border border-border" />
                  )}
                  {stage.label}
                </li>
              );
            })}
          </ul>
        )}
    </main>
  );
}
