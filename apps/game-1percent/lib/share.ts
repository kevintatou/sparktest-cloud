export type ShareResult = "shared" | "copied" | "failed";

export function buildShareText(score: number): string {
  return `I survived ${score.toFixed(1)} seconds in 1%. Can you beat me?`;
}

/** Uses the Web Share API when available, falling back to clipboard copy. */
export async function shareScore(score: number): Promise<ShareResult> {
  const text = buildShareText(score);
  const url = typeof window !== "undefined" ? window.location.href : "";

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text, url });
      return "shared";
    } catch {
      // User cancelled the share sheet, or it failed — fall back to clipboard.
    }
  }

  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}
