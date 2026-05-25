"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { blogSchema } from "@/lib/validators";
import { toSlug } from "@/lib/admin";
import { markdownToHtml } from "@/lib/markdown";
import { z } from "zod";
import {
  ArrowLeft,
  Heading1,
  Heading2,
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  X,
  Sparkles,
  Eye,
  Edit3,
  Upload,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

type FormValues = z.input<typeof blogSchema>;

// ─── Toolbar button data ──────────────────────────────────
const toolbarItems = [
  { icon: Heading1, label: "Heading 1", prefix: "# ", suffix: "" },
  { icon: Heading2, label: "Heading 2", prefix: "## ", suffix: "" },
  { icon: Bold, label: "Bold", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Italic", prefix: "*", suffix: "*" },
  { icon: Code, label: "Code", prefix: "`", suffix: "`" },
  { icon: List, label: "Bullet list", prefix: "- ", suffix: "" },
  { icon: ListOrdered, label: "Numbered list", prefix: "1. ", suffix: "" },
];

export default function BlogForm({
  initial,
}: {
  initial?: Partial<FormValues> & { id?: string };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [imagePreview, setImagePreview] = useState(initial?.featuredImage || "");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const linkBtnRef = useRef<HTMLButtonElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: initial?.title || "",
      slug: initial?.slug || "",
      content: initial?.content || "",
      author: initial?.author || "Royal Optics",
      featuredImage: initial?.featuredImage || "",
      status: initial?.status || "DRAFT",
    },
  });

  // ─── Live preview ───────────────────────────────────────
  const updatePreview = useCallback((content: string) => {
    setPreview(markdownToHtml(content));
  }, []);

  useEffect(() => {
    updatePreview(form.getValues("content"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Toolbar insert ─────────────────────────────────────
  function insertMarkdown(prefix: string, suffix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = form.getValues("content");
    const selected = current.substring(start, end);
    const isLinePrefix = prefix.endsWith(" ") && !suffix;

    let newContent: string;
    let cursorPos: number;

    if (isLinePrefix) {
      // Line-level prefix (headings, lists)
      const beforeLine = current.lastIndexOf("\n", start - 1) + 1;
      const newLine = prefix + current.substring(beforeLine);
      newContent = current.substring(0, beforeLine) + newLine.substring(0, newLine.length);
      // Actually, let's just insert at current cursor
      newContent = current.substring(0, start) + prefix + selected + suffix + current.substring(end);
      cursorPos = start + prefix.length + selected.length + suffix.length;
    } else {
      newContent = current.substring(0, start) + prefix + selected + suffix + current.substring(end);
      cursorPos = start + prefix.length + selected.length;
    }

    form.setValue("content", newContent);
    updatePreview(newContent);

    // Restore cursor
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  }

  // ─── Link popup helpers ─────────────────────────────────
  function openLinkPopup() {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = form.getValues("content").substring(start, end);
      setLinkText(selected);
    } else {
      setLinkText("");
    }
    setLinkUrl("");
    setShowLinkPopup(true);
  }

  function insertLink() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = linkText.trim() || "link";
    const url = linkUrl.trim() || "#";
    const markdown = `[${text}](${url})`;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = form.getValues("content");
    const newContent = current.substring(0, start) + markdown + current.substring(end);
    const cursorPos = start + markdown.length;

    form.setValue("content", newContent);
    updatePreview(newContent);
    setShowLinkPopup(false);
    setLinkText("");
    setLinkUrl("");

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  }

  // ─── Featured image upload ──────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Request presigned path
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type }),
      });
      if (!presignRes.ok) throw new Error("Upload preparation failed");
      const { filePath } = await presignRes.json();

      // Upload the file
      const uploadRes = await fetch(`/api/uploads?filePath=${encodeURIComponent(filePath)}`, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) throw new Error(uploadData.error || "Image upload failed");

      const url = uploadData.url || filePath;
      form.setValue("featuredImage", url);
      setImagePreview(url);
      toast.success("Featured image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage() {
    form.setValue("featuredImage", "");
    setImagePreview("");
  }

  // ─── Submit ─────────────────────────────────────────────
  async function onSubmit(values: FormValues) {
    try {
      setSubmitting(true);
      const payload = {
        ...values,
        slug: values.slug?.trim() ? toSlug(values.slug) : toSlug(values.title),
      };
      const endpoint = initial?.id ? `/api/admin/blogs/${initial.id}` : "/api/admin/blogs";
      const method = initial?.id ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save blog");
      toast.success(initial?.id ? "Blog updated" : "Blog created");
      router.push("/admin/blogs");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Unable to save blog");
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = !!initial?.id;
  const contentValue = form.watch("content");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="blog-editor-root">
      {/* ── Top navigation bar ─────────────────────────────── */}
      <div className="blog-editor-topbar">
        <Link href="/admin/blogs" className="blog-editor-back">
          <ArrowLeft size={16} />
          <span>Back to Blogs</span>
        </Link>
        <h1 className="blog-editor-page-title">
          {isEditing ? "Edit Post" : "Create Post"}
        </h1>
      </div>

      {/* ── Title + Featured Image row ─────────────────────── */}
      <div className="blog-editor-header">
        <div className="blog-editor-header-left">
          <input
            {...form.register("title")}
            placeholder="Enter your blog title..."
            className="blog-editor-title-input"
            id="blog-title"
          />
          {/* Compact meta row: slug + author */}
          <div className="blog-editor-meta-row">
            <div className="blog-editor-meta-field">
              <label htmlFor="blog-slug">Slug</label>
              <div className="blog-editor-slug-group">
                <input
                  {...form.register("slug")}
                  id="blog-slug"
                  placeholder="auto-generated-slug"
                  className="blog-editor-meta-input"
                />
                <button
                  type="button"
                  className="blog-editor-slug-auto"
                  onClick={() => form.setValue("slug", toSlug(form.getValues("title")))}
                >
                  Auto
                </button>
              </div>
            </div>
            <div className="blog-editor-meta-field">
              <label htmlFor="blog-author">Author</label>
              <input
                {...form.register("author")}
                id="blog-author"
                placeholder="Royal Optics"
                className="blog-editor-meta-input"
              />
            </div>
            <div className="blog-editor-meta-field">
              <label htmlFor="blog-status">Status</label>
              <div className="blog-editor-select-wrapper">
                <select {...form.register("status")} id="blog-status" className="blog-editor-meta-input blog-editor-select">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
                <ChevronDown size={14} className="blog-editor-select-icon" />
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="blog-editor-featured-image">
          {imagePreview ? (
            <div className="blog-editor-image-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Featured" />
              <button type="button" className="blog-editor-image-remove" onClick={removeImage}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="blog-editor-image-upload"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={20} />
              <span>Featured Image</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="blog-editor-toolbar">
        <div className="blog-editor-toolbar-left">
          {toolbarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className="blog-editor-toolbar-btn"
                onClick={() => insertMarkdown(item.prefix, item.suffix)}
                title={item.label}
              >
                <Icon size={16} />
              </button>
            );
          })}
          <button
            ref={linkBtnRef}
            type="button"
            className="blog-editor-toolbar-btn"
            onClick={openLinkPopup}
            title="Insert Link"
          >
            <Link2 size={16} />
          </button>
          <div className="blog-editor-toolbar-divider" />
          <button
            type="button"
            className="blog-editor-toolbar-btn"
            onClick={() => insertMarkdown("![alt](", ")")}
            title="Image"
          >
            <ImageIcon size={16} />
          </button>
        </div>
        <div className="blog-editor-toolbar-right">
          <button type="button" className="blog-editor-ai-btn" disabled title="Coming soon">
            <Sparkles size={14} />
            <span>AI Refactor</span>
          </button>
        </div>
      </div>

      {/* ── Tab switcher (mobile) + Editor panes ───────────── */}
      <div className="blog-editor-tab-bar">
        <button
          type="button"
          className={`blog-editor-tab ${activeTab === "write" ? "active" : ""}`}
          onClick={() => setActiveTab("write")}
        >
          <Edit3 size={14} />
          Write
        </button>
        <button
          type="button"
          className={`blog-editor-tab ${activeTab === "preview" ? "active" : ""}`}
          onClick={() => {
            updatePreview(form.getValues("content"));
            setActiveTab("preview");
          }}
        >
          <Eye size={14} />
          Preview
        </button>
      </div>

      <div className="blog-editor-panes">
        {/* Write pane */}
        <div className={`blog-editor-write-pane ${activeTab === "write" ? "active" : ""}`}>
          <textarea
            {...form.register("content", {
              onChange: (e) => updatePreview(e.target.value),
            })}
            ref={(el) => {
              form.register("content").ref(el);
              textareaRef.current = el;
            }}
            placeholder="Start writing your blog content in markdown..."
            className="blog-editor-textarea"
            id="blog-content"
            spellCheck={false}
          />
        </div>

        {/* Preview pane */}
        <div className={`blog-editor-preview-pane ${activeTab === "preview" ? "active" : ""}`}>
          <div className="blog-editor-preview-label">PREVIEW</div>
          <div
            className="blog-editor-preview-content"
            dangerouslySetInnerHTML={{ __html: preview || '<p class="blog-editor-preview-empty">Preview will appear here as you type...</p>' }}
          />
        </div>
      </div>

      {/* ── Bottom action bar ──────────────────────────────── */}
      <div className="blog-editor-actions">
        <p className="blog-editor-hint">
          Supports Markdown — headings, bold, italic, code blocks, lists, links & images.
        </p>
        <div className="blog-editor-actions-right">
          <button type="button" className="blog-editor-cancel-btn" onClick={() => router.back()}>
            Cancel
          </button>
          <button type="submit" className="blog-editor-submit-btn" disabled={submitting}>
            {submitting ? "Saving..." : isEditing ? "Update Blog" : "Create Blog"}
          </button>
        </div>
      </div>

      {/* ── Link popup ──────────────────────────────────────── */}
      {showLinkPopup && (
        <>
          <div className="blog-editor-link-overlay" onClick={() => setShowLinkPopup(false)} />
          <div className="blog-editor-link-popup">
            <div className="blog-editor-link-popup-header">
              <Link2 size={16} />
              <span>Insert Link</span>
              <button type="button" className="blog-editor-link-popup-close" onClick={() => setShowLinkPopup(false)}>
                <X size={14} />
              </button>
            </div>
            <div className="blog-editor-link-popup-body">
              <div className="blog-editor-link-popup-field">
                <label htmlFor="link-text">Text</label>
                <input
                  id="link-text"
                  type="text"
                  placeholder="Link text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="blog-editor-link-popup-input"
                  autoFocus
                />
              </div>
              <div className="blog-editor-link-popup-field">
                <label htmlFor="link-url">URL</label>
                <input
                  id="link-url"
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertLink(); } }}
                  className="blog-editor-link-popup-input"
                />
              </div>
            </div>
            <div className="blog-editor-link-popup-actions">
              <button type="button" className="blog-editor-cancel-btn" onClick={() => setShowLinkPopup(false)}>Cancel</button>
              <button type="button" className="blog-editor-submit-btn" onClick={insertLink}>Insert</button>
            </div>
          </div>
        </>
      )}
    </form>
  );
}
