"use client";

import { useState } from "react";
import styles from "./GameOverScreen.module.css";
import type { ShareResult } from "@/lib/share";

interface GameOverScreenProps {
  survivalSeconds: number;
  personalBest: number;
  percentile: number;
  onPlayAgain: () => void;
  onShare: () => Promise<ShareResult>;
}

function shareFeedbackText(result: ShareResult): string {
  if (result === "shared") return "Shared!";
  if (result === "copied") return "Copied to clipboard!";
  return "Couldn't share — try again.";
}

export function GameOverScreen({
  survivalSeconds,
  personalBest,
  percentile,
  onPlayAgain,
  onShare,
}: GameOverScreenProps) {
  const [shareFeedback, setShareFeedback] = useState("");

  async function handleShare() {
    const result = await onShare();
    setShareFeedback(shareFeedbackText(result));
  }

  return (
    <div className={styles.screen}>
      <p className={styles.score}>You survived {survivalSeconds.toFixed(1)} seconds</p>
      <p className={styles.percentile}>Better than {percentile.toFixed(0)}% of players</p>
      <p className={styles.best}>Personal best: {personalBest.toFixed(1)}s</p>
      <p className={styles.disclaimer}>Estimated percentile during beta</p>
      <div className={styles.buttonRow}>
        <button className={styles.playAgainButton} onClick={onPlayAgain}>
          PLAY AGAIN
        </button>
        <button className={styles.shareButton} onClick={handleShare}>
          SHARE SCORE
        </button>
        <p className={styles.shareFeedback}>{shareFeedback}</p>
      </div>
    </div>
  );
}
