"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { ContentEditorForm, type EditableContent } from "@/components/ContentEditorForm";

interface ContentResponse {
  content: EditableContent & { topicTitle: string; niche: string };
}

export default function GeneratePage() {
  const params = useParams<{ id: string }>();
  const [content, setContent] = useState<ContentResponse["content"] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/content/${params.id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json()) as { error: string };
          throw new Error(body.error);
        }
        return (await res.json()) as ContentResponse;
      })
      .then((data) => {
        if (!cancelled) setContent(data.content);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-3xl text-foreground">
        Generated Content
      </h1>

      {!content && !error && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {content && (
        <>
          <p className="mb-6 text-muted-foreground">
            Based on: &ldquo;{content.topicTitle}&rdquo;
          </p>
          <ContentEditorForm content={content} />
        </>
      )}
    </main>
  );
}
