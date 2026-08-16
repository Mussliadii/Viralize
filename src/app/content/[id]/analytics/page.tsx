"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, Loader2, AlertCircle, TrendingUp, ThumbsUp, MessageCircle } from "lucide-react";
import { LinkVideoForm } from "@/components/LinkVideoForm";
import { AnalyticsChart, type AnalyticsSnapshotData } from "@/components/AnalyticsChart";
import { TopCommentsList, type TopCommentData } from "@/components/TopCommentsList";
import { Button } from "@/components/ui/Button";

interface ContentDetail {
  id: string;
  title: string;
  youtubeVideoId: string | null;
  youtubeVideoUrl: string | null;
  analytics: AnalyticsSnapshotData[];
  comments: TopCommentData[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: number;
  delta: number | null;
}) {
  return (
    <div className="ease-spring flex flex-1 flex-col gap-1 rounded-card border border-border bg-card p-5 shadow-card motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-3xl font-semibold text-foreground">
          {value.toLocaleString()}
        </span>
        {delta !== null && (
          <span
            className={`font-mono text-sm ${delta >= 0 ? "text-accent" : "text-destructive"}`}
          >
            {delta >= 0 ? "+" : ""}
            {delta.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/content/${params.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setContent(data.content);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id, reloadToken]);

  const refresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch(`/api/content/${params.id}/analytics/refresh`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  };

  const latest = content?.analytics.at(-1) ?? null;
  const previous =
    content && content.analytics.length > 1
      ? content.analytics.at(-2)!
      : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-3xl text-foreground">
        Analytics
      </h1>

      {loadError && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          {loadError}
        </div>
      )}

      {!loadError && !content && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading...
        </div>
      )}

      {content && (
        <>
          <p className="mb-8 text-muted-foreground">{content.title}</p>

          {!content.youtubeVideoId && (
            <LinkVideoForm
              contentId={content.id}
              onLinked={() => setReloadToken((t) => t + 1)}
            />
          )}

          {content.youtubeVideoId && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <a
                  href={content.youtubeVideoUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  View on YouTube
                </a>
                <Button onClick={refresh} disabled={refreshing}>
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  )}
                  {refreshing ? "Refreshing..." : "Refresh Analytics"}
                </Button>
              </div>

              {refreshError && (
                <p className="text-sm text-destructive">{refreshError}</p>
              )}

              {!latest ? (
                <p className="text-muted-foreground">
                  No data yet — click &ldquo;Refresh Analytics&rdquo; to pull
                  real stats from YouTube.
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <StatCard
                      icon={TrendingUp}
                      label="Views"
                      value={latest.views}
                      delta={previous ? latest.views - previous.views : null}
                    />
                    <StatCard
                      icon={ThumbsUp}
                      label="Likes"
                      value={latest.likes}
                      delta={previous ? latest.likes - previous.likes : null}
                    />
                    <StatCard
                      icon={MessageCircle}
                      label="Comments"
                      value={latest.comments}
                      delta={
                        previous ? latest.comments - previous.comments : null
                      }
                    />
                  </div>

                  <AnalyticsChart snapshots={content.analytics} />

                  <div>
                    <h2 className="mb-3 font-medium text-foreground">
                      Top Comments
                    </h2>
                    <TopCommentsList comments={content.comments} />
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
