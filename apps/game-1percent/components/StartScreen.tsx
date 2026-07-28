"use client";

import styles from "./StartScreen.module.css";

interface StartScreenProps {
  onPlay: () => void;
}

export function StartScreen({ onPlay }: StartScreenProps) {
  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>1%</h1>
      <p className={styles.tagline}>Can you survive longer than 99% of players?</p>
      <button className={styles.playButton} onClick={onPlay}>
        PLAY
      </button>
    </div>
  );
}
