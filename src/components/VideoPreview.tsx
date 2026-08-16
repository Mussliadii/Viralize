import { Download } from "lucide-react";

export function VideoPreview({ videoUrl }: { videoUrl: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-xs overflow-hidden rounded-card border border-border bg-card shadow-card">
        <video src={videoUrl} controls className="aspect-9/16 w-full" />
      </div>
      <a
        href={videoUrl}
        download
        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download
      </a>
    </div>
  );
}
