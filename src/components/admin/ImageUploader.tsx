"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
};

async function requestUploadPath(file: File) {
  const response = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, mimeType: file.type }),
  });
  if (!response.ok) {
    throw new Error("Unable to prepare image upload");
  }
  const payload = await response.json();
  return String(payload.filePath || "");
}

export default function ImageUploader({ label, value, onChange, multiple = false }: Props) {
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canAddMore = multiple || value.length === 0;

  function addFromUrl() {
    const nextUrl = urlInput.trim();
    if (!nextUrl) return;
    if (multiple) {
      if (value.includes(nextUrl)) return;
      onChange([...value, nextUrl]);
    } else {
      onChange([nextUrl]);
    }
    setUrlInput("");
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const filePath = await requestUploadPath(file);
      if (!filePath) throw new Error("Upload path not returned");
      if (multiple) {
        onChange([...value, filePath]);
      } else {
        onChange([filePath]);
      }
      toast.success("Image selected");
    } catch (error: any) {
      toast.error(error.message || "Failed to select image");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(target: string) {
    onChange(value.filter((item) => item !== target));
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      <div className="flex gap-2">
        <Input
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder="Paste image URL or uploaded path"
        />
        <Button type="button" variant="outline" onClick={addFromUrl} disabled={!urlInput.trim() || !canAddMore}>
          <Plus size={14} />
          Add
        </Button>
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!canAddMore}>
          <Upload size={14} />
          Upload
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </div>
      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {value.map((url) => (
            <div key={url} className="group relative overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
              <div className="relative aspect-square bg-slate-100 dark:bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Uploaded preview" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Remove image"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
