/**
 * Split a filename into its base ("Patient_Doe_MRI_Report") and dotted
 * extension (".pdf"). When no extension is present, ext is empty.
 */
export function splitFileName(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return { base: name, ext: "" };
  return { base: name.slice(0, dot), ext: name.slice(dot) };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} mins ago`;
  if (diffH < 24) {
    const today = isSameDay(date, now);
    return today
      ? `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : `${diffH}h ago`;
  }
  if (diffD === 1) return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diffD < 7) return `${diffD} days ago`;
  if (diffD < 14) return "Last week";
  if (diffD < 30) return `${Math.floor(diffD / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
