"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface EditableContent {
  id: string;
  title: string;
  script: string;
  description: string;
  hashtags: string;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

const fieldClassName =
  "rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:outline focus:outline-2 focus:outline-ring";

export function ContentEditorForm({ content }: { content: EditableContent }) {
  const router = useRouter();
  const [title, setTitle] = useState(content.title);
  const [script, setScript] = useState(content.script);
  const [description, setDescription] = useState(content.description);
  const [hashtags, setHashtags] = useState(content.hashtags);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [startingRender, setStartingRender] = useState(false);

  const persist = () =>
    fetch(`/api/content/${content.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, script, description, hashtags }),
    });

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await persist();
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const renderVideo = async () => {
    setStartingRender(true);
    try {
      await persist();
      router.push(`/render/${content.id}`);
    } finally {
      setStartingRender(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-6 shadow-card">
      <Field label="Title">
        <input
          className={fieldClassName}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>
      <Field label="Script">
        <textarea
          className={`${fieldClassName} min-h-40 resize-y`}
          value={script}
          onChange={(e) => setScript(e.target.value)}
        />
      </Field>
      <Field label="Description">
        <textarea
          className={`${fieldClassName} min-h-20 resize-y`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="Hashtags">
        <input
          className={fieldClassName}
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
        />
      </Field>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          variant="accent"
          onClick={renderVideo}
          disabled={startingRender}
        >
          {startingRender ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Video className="h-4 w-4" aria-hidden="true" />
          )}
          Render Video
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-accent">
            <Check className="h-4 w-4" aria-hidden="true" />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
