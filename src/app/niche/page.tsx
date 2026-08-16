"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { NicheIcon } from "@/components/NicheIcon";

interface NicheOption {
  id: string;
  label: string;
  icon: string;
}

export default function NichePage() {
  const router = useRouter();
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/niches")
      .then((res) => res.json())
      .then((data) => setNiches(data.niches))
      .catch(() => setError("Failed to load niches. Try refreshing."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="mb-2 text-3xl text-foreground">
        What do you create content about?
      </h1>
      <p className="mb-10 text-muted-foreground">
        Pick your niche — trend discovery and content generation are tailored
        to it.
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading niches...
        </div>
      )}

      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {niches.map((niche) => (
            <button
              key={niche.id}
              type="button"
              onClick={() => router.push(`/trends?niche=${niche.id}`)}
              className="ease-spring group flex min-h-11 cursor-pointer flex-col items-center gap-4 rounded-card border border-border bg-card p-7 text-center shadow-card motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="ease-spring flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-white motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-110">
                <NicheIcon name={niche.icon} className="h-6 w-6" />
              </span>
              <span className="font-medium text-foreground">
                {niche.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
