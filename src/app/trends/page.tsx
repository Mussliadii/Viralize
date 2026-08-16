"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw, Video, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RankedTopic {
  title: string;
  score: number;
  reasoning: string;
  source: string;
  sourceUrl?: string;
}

interface SourceError {
  source: "youtube" | "google_trends";
  message: string;
}

interface TrendsResponse {
  niche: string;
  topics: RankedTopic[];
  sourceErrors: SourceError[];
}

interface TrendsErrorResponse {
  error: string;
  sourceErrors?: SourceError[];
}

function sourceIcon(source: string) {
  if (source.toLowerCase().includes("youtube")) return Video;
  return TrendingUp;
}

function TrendsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const niche = searchParams.get("niche");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<RankedTopic[]>([]);
  const [sourceErrors, setSourceErrors] = useState<SourceError[]>([]);
  const [retryToken, setRetryToken] = useState(0);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    if (!niche) {
      return;
    }

    let cancelled = false;

    fetch(`/api/trends?niche=${encodeURIComponent(niche)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json()) as TrendsErrorResponse;
          throw new Error(body.error);
        }
        return (await res.json()) as TrendsResponse;
      })
      .then((data) => {
        if (cancelled) return;
        setTopics(data.topics);
        setSourceErrors(data.sourceErrors);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [niche, retryToken]);

  const retry = () => {
    setLoading(true);
    setError(null);
    setRetryToken((t) => t + 1);
  };

  const createContent = async (topic: RankedTopic, index: number) => {
    setGeneratingIndex(index);
    setGenerateError(null);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          topic: {
            title: topic.title,
            reasoning: topic.reasoning,
            source: topic.source,
            score: topic.score,
            sourceUrl: topic.sourceUrl,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Content generation failed");
      router.push(`/generate/${data.content.id}`);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : String(err));
      setGeneratingIndex(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="mb-2 text-3xl text-foreground">Trending Topics</h1>
      <p className="mb-10 text-muted-foreground">
        Pulled live from YouTube and Google Trends, then ranked by Groq.
      </p>

      {!niche && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          No niche selected — go back and pick one.
        </div>
      )}

      {niche && loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Fetching trends and asking Groq to rank them...
        </div>
      )}

      {niche && !loading && error && (
        <div className="flex flex-col items-start gap-3 rounded-card border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
            <span className="font-medium">Couldn&apos;t load trends</span>
          </div>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={retry}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {niche && !loading && !error && (
        <>
          {sourceErrors.length > 0 && (
            <div className="mb-6 rounded-card border border-border bg-muted p-4 text-sm text-muted-foreground">
              Some sources didn&apos;t respond ({sourceErrors
                .map((e) => e.source)
                .join(", ")}
              ) — showing results from the rest.
            </div>
          )}

          {generateError && (
            <div className="mb-6 flex items-center gap-2 rounded-card border border-border bg-card p-4 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              {generateError}
            </div>
          )}

          {topics.length === 0 ? (
            <p className="text-muted-foreground">
              No topics came back. Try again in a moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {topics.map((topic, i) => {
                const Icon = sourceIcon(topic.source);
                const isGenerating = generatingIndex === i;
                return (
                  <div
                    key={i}
                    className="ease-spring flex flex-col gap-3 rounded-card border border-border bg-card p-6 shadow-card motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-medium text-foreground">
                        {topic.title}
                      </h2>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-gradient-primary px-2.5 py-1 font-mono text-xs font-semibold text-white">
                        {Math.round(topic.score)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {topic.reasoning}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {topic.sourceUrl ? (
                        <a
                          href={topic.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {topic.source}
                        </a>
                      ) : (
                        <span>{topic.source}</span>
                      )}
                    </div>
                    <Button
                      variant="accent"
                      onClick={() => createContent(topic, i)}
                      disabled={generatingIndex !== null}
                      className="mt-2"
                    >
                      {isGenerating && (
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      {isGenerating ? "Generating..." : "Create Content"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function TrendsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <TrendsContent />
    </Suspense>
  );
}
