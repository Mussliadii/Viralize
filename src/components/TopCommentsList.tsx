"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";

export interface TopCommentData {
  author: string;
  text: string;
  likeCount: number;
}

const TRUNCATE_AT = 220;

function CommentText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > TRUNCATE_AT;
  const shown = expanded || !isLong ? text : `${text.slice(0, TRUNCATE_AT)}…`;

  return (
    <p className="text-sm text-muted-foreground">
      {shown}{" "}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="cursor-pointer font-medium text-primary underline"
        >
          {expanded ? "show less" : "show more"}
        </button>
      )}
    </p>
  );
}

export function TopCommentsList({ comments }: { comments: TopCommentData[] }) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No comments yet (or comments are disabled on this video).
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {comments.map((comment, i) => (
        <li
          key={i}
          className="flex flex-col gap-1 rounded-card border border-border bg-card p-4 shadow-card"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">
              #{i + 1} {comment.author}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
              {comment.likeCount}
            </span>
          </div>
          <CommentText text={comment.text} />
        </li>
      ))}
    </ol>
  );
}
