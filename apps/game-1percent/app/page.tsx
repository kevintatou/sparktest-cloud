"use client";

import { useEffect, useRef, useState } from "react";
import { GameCanvas } from "@/components/GameCanvas";
import { StartScreen } from "@/components/StartScreen";
import { GameOverScreen } from "@/components/GameOverScreen";
import { estimatePercentile } from "@/game/percentile";
import { trackEvent } from "@/lib/analytics";
import { shareScore } from "@/lib/share";
import {
  getMuted,
  getPersonalBest,
  incrementRunCount,
  setMuted as persistMuted,
  setPersonalBestIfHigher,
} from "@/lib/storage";

type Screen = "start" | "playing" | "gameover";

interface RunResult {
  survivalSeconds: number;
  percentile: number;
  personalBest: number;
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>("start");
  const [result, setResult] = useState<RunResult | null>(null);
  const [muted, setMuted] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const runNumberRef = useRef(0);

  useEffect(() => {
    setMuted(getMuted());
    trackEvent("page_viewed");
  }, []);

  function startRun() {
    runNumberRef.current = incrementRunCount();
    setRunKey((k) => k + 1);
    setScreen("playing");
  }

  function handlePlay() {
    trackEvent("game_started");
    startRun();
  }

  function handlePlayAgain() {
    trackEvent("play_again_clicked");
    trackEvent("game_started");
    startRun();
  }

  function handleGameOver(survivalSeconds: number) {
    const percentile = estimatePercentile(survivalSeconds);
    const personalBest = setPersonalBestIfHigher(survivalSeconds);

    trackEvent("game_finished", {
      score_seconds: Math.round(survivalSeconds * 10) / 10,
      personal_best: Math.round(personalBest * 10) / 10,
      estimated_percentile: percentile,
      run_number: runNumberRef.current,
    });

    setResult({ survivalSeconds, percentile, personalBest });
    setScreen("gameover");
  }

  async function handleShare() {
    const score = result?.survivalSeconds ?? 0;
    const shareResult = await shareScore(score);
    trackEvent("score_shared", { score_seconds: Math.round(score * 10) / 10 });
    return shareResult;
  }

  function toggleMuted() {
    setMuted((prev) => {
      const next = !prev;
      persistMuted(next);
      return next;
    });
  }

  return (
    <>
      {screen === "start" && <StartScreen onPlay={handlePlay} />}

      {screen === "playing" && <GameCanvas key={runKey} muted={muted} onGameOver={handleGameOver} />}

      {screen === "gameover" && result && (
        <GameOverScreen
          survivalSeconds={result.survivalSeconds}
          personalBest={result.personalBest}
          percentile={result.percentile}
          onPlayAgain={handlePlayAgain}
          onShare={handleShare}
        />
      )}

      <button
        onClick={toggleMuted}
        aria-label={muted ? "Unmute" : "Mute"}
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 10,
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "999px",
          border: "1px solid rgba(242, 245, 255, 0.25)",
          background: "rgba(10, 10, 18, 0.6)",
          color: "#f2f5ff",
          fontSize: "1.1rem",
          cursor: "pointer",
        }}
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </>
  );
}
