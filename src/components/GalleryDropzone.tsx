import { useCallback, useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GalleryItem = { url: string; name?: string };
export type GalleryValue = Record<string, GalleryItem | string> | null | undefined;

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per image

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function normalize(g: GalleryValue): Record<string, GalleryItem> {
  if (!g || typeof g !== "object") return {};
  const out: Record<string, GalleryItem> = {};
  for (const [k, v] of Object.entries(g)) {
    if (typeof v === "string") out[k] = { url: v };
    else if (v && typeof v === "object" && typeof (v as GalleryItem).url === "string") {
      out[k] = v as GalleryItem;
    }
  }
  return out;
}

export function GalleryDropzone({
  value,
  onChange,
  label = "Gallery",
  multiple = true,
  className,
}: {
  value: GalleryValue;
  onChange: (next: Record<string, GalleryItem>) => void;
  label?: string;
  multiple?: boolean;
  className?: string;
}) {
  const items = normalize(value);
  const entries = Object.entries(items);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (arr.length === 0) {
        setError("Only image files are allowed.");
        return;
      }
      const next = multiple ? { ...items } : {};
      for (const f of arr) {
        if (f.size > MAX_BYTES) {
          setError(`"${f.name}" exceeds 5 MB.`);
          continue;
        }
        try {
          const url = await readAsDataUrl(f);
          const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          next[key] = { url, name: f.name };
          if (!multiple) break;
        } catch {
          setError(`Could not read "${f.name}".`);
        }
      }
      onChange(next);
    },
    [items, multiple, onChange],
  );

  const remove = (key: string) => {
    const next = { ...items };
    delete next[key];
    onChange(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {entries.length} image{entries.length === 1 ? "" : "s"}
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border bg-muted/30 hover:bg-muted/60",
        )}
      >
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Upload className="size-6" />
          <div>
            <span className="font-medium text-foreground">Drop images here</span>{" "}
            or click to browse
          </div>
          <div className="text-xs">PNG, JPG, WEBP — up to 5 MB each</div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {entries.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {entries.map(([key, it]) => (
            <div
              key={key}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              {it.url ? (
                <img
                  src={it.url}
                  alt={it.name || key}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="size-6" />
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(key);
                }}
                aria-label="Remove image"
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
