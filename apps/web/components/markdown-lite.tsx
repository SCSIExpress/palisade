import type { ReactNode } from "react";

/**
 * Tiny renderer for the constrained markdown our per-game guides use —
 * headings, bullet lists, paragraphs, **bold**, `code`, [links](url). Keeping
 * it hand-rolled avoids a markdown dependency (and its audit surface) for what
 * is a fixed, repo-authored format; docs are trusted content, but we still
 * never use dangerouslySetInnerHTML.
 */
export function MarkdownLite({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.split("\n");
  let list: ReactNode[] | null = null;
  let key = 0;

  const flushList = () => {
    if (list) {
      blocks.push(
        <ul key={key++} className="ml-4 list-disc space-y-1.5 text-sm leading-relaxed text-slate-300">
          {list}
        </ul>,
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("- ")) {
      (list ??= []).push(<li key={key++}>{inline(line.slice(2))}</li>);
      continue;
    }
    flushList();
    if (!line.trim()) continue;
    if (line.startsWith("## ")) {
      blocks.push(
        <h3 key={key++} className="mt-5 text-sm font-semibold uppercase tracking-wide text-ark-accent2">
          {line.slice(3)}
        </h3>,
      );
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h2 key={key++} className="text-lg font-semibold text-slate-100">
          {line.slice(2)}
        </h2>,
      );
    } else {
      blocks.push(
        <p key={key++} className="text-sm leading-relaxed text-slate-300">
          {inline(line)}
        </p>,
      );
    }
  }
  flushList();
  return <div className="space-y-3">{blocks}</div>;
}

/** Inline spans: **bold**, `code`, [text](url) — tokenized left to right. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <strong key={k++} className="font-semibold text-slate-100">
          {m[1]}
        </strong>,
      );
    } else if (m[2] !== undefined) {
      out.push(
        <code key={k++} className="rounded bg-ark-bg px-1 py-0.5 font-mono text-[0.85em] text-ark-accent">
          {m[2]}
        </code>,
      );
    } else {
      out.push(
        <a key={k++} href={m[4]} target="_blank" rel="noreferrer" className="text-ark-accent hover:underline">
          {m[3]}
        </a>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
