/**
 * Lightweight markdown-to-HTML converter.
 * Supports: headings, bold, italic, code blocks, inline code,
 * ordered/unordered lists, links, images, blockquotes, hr, paragraphs.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function markdownToHtml(md: string): string {
  if (!md) return "";

  const lines = md.split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let inList: "ul" | "ol" | null = null;

  function closeList() {
    if (inList) {
      html.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }
  }

  function processInline(text: string): string {
    // Images: ![alt](src)
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0" />');
    // Links: [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#60a5fa;text-decoration:underline">$1</a>');
    // Bold: **text** or __text__
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
    // Italic: *text* or _text_
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    text = text.replace(/_(.+?)_/g, "<em>$1</em>");
    // Inline code: `code`
    text = text.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>');
    return text;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        html.push(escapeHtml(codeBlockContent.join("\n")));
        html.push("</code></pre>");
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        closeList();
        inCodeBlock = true;
        html.push('<pre style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;overflow-x:auto;margin:12px 0"><code>');
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      closeList();
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const sizes: Record<number, string> = {
        1: "font-size:2em;font-weight:800;margin:20px 0 10px",
        2: "font-size:1.5em;font-weight:700;margin:18px 0 8px",
        3: "font-size:1.25em;font-weight:600;margin:14px 0 6px",
        4: "font-size:1.1em;font-weight:600;margin:12px 0 6px",
        5: "font-size:1em;font-weight:600;margin:10px 0 4px",
        6: "font-size:0.9em;font-weight:600;margin:10px 0 4px",
      };
      html.push(`<h${level} style="${sizes[level]}">${processInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeList();
      html.push('<hr style="border:none;border-top:1px solid rgba(255,255,255,0.15);margin:16px 0" />');
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      closeList();
      html.push(`<blockquote style="border-left:3px solid rgba(96,165,250,0.5);padding:4px 12px;margin:8px 0;color:rgba(255,255,255,0.7)">${processInline(trimmed.slice(2))}</blockquote>`);
      continue;
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (inList !== "ul") {
        closeList();
        inList = "ul";
        html.push('<ul style="padding-left:24px;margin:8px 0;list-style:disc">');
      }
      html.push(`<li style="margin:4px 0">${processInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inList !== "ol") {
        closeList();
        inList = "ol";
        html.push('<ol style="padding-left:24px;margin:8px 0;list-style:decimal">');
      }
      html.push(`<li style="margin:4px 0">${processInline(olMatch[1])}</li>`);
      continue;
    }

    // Paragraph
    closeList();
    html.push(`<p style="margin:8px 0;line-height:1.7">${processInline(trimmed)}</p>`);
  }

  // Close any open code block
  if (inCodeBlock) {
    html.push(escapeHtml(codeBlockContent.join("\n")));
    html.push("</code></pre>");
  }

  closeList();

  return html.join("\n");
}
