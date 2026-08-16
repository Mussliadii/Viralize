import Link from "next/link";
import { Sparkles, TrendingUp, Wand2, LineChart, ArrowRight } from "lucide-react";

const STEPS = [
  {
    icon: TrendingUp,
    title: "Discover",
    description: "Real trends from YouTube and Google Trends, ranked by AI.",
  },
  {
    icon: Wand2,
    title: "Generate",
    description: "A full script, title, and a rendered short video — automatically.",
  },
  {
    icon: LineChart,
    title: "Track",
    description: "Real views, likes, and comments once your video is live.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-20">
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-primary shadow-sm">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          AI-powered content pipeline
        </span>

        <h1 className="max-w-2xl text-4xl leading-[1.1] text-foreground sm:text-5xl">
          Turn what&apos;s trending into your{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            next video
          </span>
        </h1>

        <p className="max-w-md text-lg text-muted-foreground">
          Pick a niche, and Viralize handles trend research, scriptwriting,
          and video rendering — end to end.
        </p>

        <Link
          href="/niche"
          className="ease-spring mt-2 flex min-h-11 items-center gap-2 rounded-lg bg-gradient-primary px-6 py-3 text-base font-medium text-white shadow-sm motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Start Creating Content
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-20 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className="ease-spring flex flex-col items-start gap-3 rounded-card border border-border bg-card p-6 shadow-card motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-white">
              <step.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="font-heading text-lg text-foreground">
              {step.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
