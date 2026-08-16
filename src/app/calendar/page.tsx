"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

interface ContentListItem {
  id: string;
  title: string;
  niche: string;
  status: string;
  renderStatus: string;
  publishingMethod: string | null;
  scheduledAt: string | null;
  createdAt: string;
}

export default function CalendarPage() {
  const [items, setItems] = useState<ContentListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setItems(data.content);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="mb-2 text-3xl text-foreground">
        Content Calendar
      </h1>
      <p className="mb-8 text-muted-foreground">
        Every draft, rendered, and scheduled video in one place.
      </p>

      {!items && !error && (
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

      {items && items.length === 0 && (
        <p className="text-muted-foreground">
          Nothing here yet —{" "}
          <Link href="/niche" className="underline">
            start creating content
          </Link>
          .
        </p>
      )}

      {items && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={
                  item.status === "draft"
                    ? `/generate/${item.id}`
                    : `/content/${item.id}/analytics`
                }
                className="ease-spring flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card p-5 shadow-card motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {item.niche}
                    {item.scheduledAt &&
                      ` — ${new Date(item.scheduledAt).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.publishingMethod === "oauth_demo" &&
                    item.status === "scheduled" && (
                      <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                        DEMO
                      </span>
                    )}
                  <StatusBadge
                    status={item.status}
                    renderStatus={item.renderStatus}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
