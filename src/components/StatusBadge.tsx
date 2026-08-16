import { FileText, Loader2, Clock, CheckCircle2 } from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof FileText; className: string }
> = {
  draft: {
    label: "Draft",
    icon: FileText,
    className: "bg-muted text-muted-foreground",
  },
  scheduled: {
    label: "Scheduled",
    icon: Clock,
    className: "bg-secondary/20 text-primary",
  },
  published: {
    label: "Published",
    icon: CheckCircle2,
    className: "bg-accent/15 text-accent",
  },
};

const IN_PROGRESS_RENDER_STATUSES = new Set([
  "narration",
  "footage",
  "subtitles",
  "composing",
]);

export function StatusBadge({
  status,
  renderStatus,
}: {
  status: string;
  renderStatus: string;
}) {
  if (IN_PROGRESS_RENDER_STATUSES.has(renderStatus)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-2.5 py-1 text-xs font-medium text-primary">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Rendering
      </span>
    );
  }

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}
