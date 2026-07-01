/* ============================================================================
 * Client-side file export + clipboard helpers.
 * Frontend-only app: these produce real downloads/clipboard writes in the
 * browser instead of round-tripping to a server.
 * ==========================================================================*/

/** Trigger a browser download for an in-memory Blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Download arbitrary text as a file. */
export function downloadText(text: string, filename: string, mime = "text/plain") {
  downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
}

/** Escape a single CSV cell (quote when it contains a comma, quote or newline). */
function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Build a CSV string from an array of rows + column definitions, then download it.
 * Each column maps a row object to a cell value.
 */
export function downloadCsv<T>(
  rows: T[],
  columns: { header: string; value: (row: T) => unknown }[],
  filename: string,
) {
  const head = columns.map((c) => csvCell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(",")).join("\n");
  downloadText(`${head}\n${body}`, filename, "text/csv");
}

/** Download a JS object/array as pretty-printed JSON. */
export function downloadJson(data: unknown, filename: string) {
  downloadText(JSON.stringify(data, null, 2), filename, "application/json");
}

/**
 * Copy text to the clipboard. Returns true on success.
 * Falls back to a hidden textarea + execCommand when the async API is unavailable
 * (e.g. non-secure contexts).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Minimal CSV parser → array of row objects keyed by the header row.
 * Handles quoted cells, escaped quotes ("") and commas/newlines inside quotes.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (!header) return [];
  return body.map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => { obj[h.trim()] = (r[idx] ?? "").trim(); });
    return obj;
  });
}

/** Open a native file picker and resolve with the chosen file's text (or null if cancelled). */
export function pickTextFile(accept = ".csv,text/csv"): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, text: String(reader.result ?? "") });
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}

/** Absolute URL for a route in the current origin (for share links). */
export function shareUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}
