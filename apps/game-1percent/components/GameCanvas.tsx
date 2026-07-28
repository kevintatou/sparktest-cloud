"use client";

import { useEffect, useRef } from "react";
import styles from "./GameCanvas.module.css";
import { CONFIG } from "@/game/config";
import { GameEngine } from "@/game/engine";
import { createSoundManager, type SoundManager } from "@/lib/sound";

interface GameCanvasProps {
  muted: boolean;
  onGameOver: (survivalSeconds: number) => void;
}

function draw(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  width: number,
  height: number,
  now: number,
  shakeUntil: number,
  flashUntil: number,
) {
  ctx.save();

  if (now < shakeUntil) {
    const mag = CONFIG.shake.magnitudePx;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }

  ctx.fillStyle = CONFIG.arena.background;
  ctx.fillRect(-20, -20, width + 40, height + 40);

  if (engine.safeArea.active) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-20, -20, width + 40, height + 40);
    ctx.arc(width / 2, height / 2, engine.safeArea.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 60, 60, 0.12)";
    ctx.fill("evenodd");
    ctx.restore();

    ctx.beginPath();
    ctx.arc(width / 2, height / 2, engine.safeArea.radius, 0, Math.PI * 2);
    ctx.strokeStyle = CONFIG.safeArea.color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  for (const o of engine.obstacles) {
    if (o.kind === "rect") {
      ctx.fillStyle = CONFIG.rect.color;
      ctx.fillRect(o.x, o.y, o.width, o.height);
      continue;
    }

    const isActive = o.phase === "active";
    ctx.beginPath();
    ctx.strokeStyle = isActive ? CONFIG.laser.activeColor : CONFIG.laser.warningColor;
    ctx.lineWidth = isActive ? CONFIG.laser.thickness : 2;
    ctx.setLineDash(isActive ? [] : [10, 8]);
    if (o.orientation === "horizontal") {
      ctx.moveTo(0, o.position);
      ctx.lineTo(width, o.position);
    } else {
      ctx.moveTo(o.position, 0);
      ctx.lineTo(o.position, height);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.beginPath();
  ctx.fillStyle = CONFIG.player.color;
  ctx.shadowColor = CONFIG.player.color;
  ctx.shadowBlur = 16;
  ctx.arc(engine.player.pos.x, engine.player.pos.y, engine.player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();

  if (now < flashUntil) {
    const remaining = (flashUntil - now) / CONFIG.shake.durationMs;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * remaining})`;
    ctx.fillRect(0, 0, width, height);
  }
}

export function GameCanvas({ muted, onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const soundRef = useRef<SoundManager | null>(null);
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  useEffect(() => {
    soundRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const sound = createSoundManager(muted);
    soundRef.current = sound;
    const seenLasers = new WeakSet<object>();

    let width = window.innerWidth;
    let height = window.innerHeight;
    const engine = new GameEngine(width, height);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.resize(width, height);
    }
    resize();
    window.addEventListener("resize", resize);

    function handlePointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      engine.setTarget(e.clientX - rect.left, e.clientY - rect.top);
    }
    function preventScroll(e: TouchEvent) {
      e.preventDefault();
    }

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("touchstart", preventScroll, { passive: false });
    canvas.addEventListener("touchmove", preventScroll, { passive: false });

    sound.playStart();

    let rafId = 0;
    let lastTime = performance.now();
    let shakeUntil = 0;
    let flashUntil = 0;

    function frame(now: number) {
      // Clamp delta time so a dropped frame or tab switch can't cause a huge
      // simulation jump (e.g. player teleporting through an obstacle).
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (engine.alive) {
        engine.update(dt);

        // Fire the laser warning cue exactly once, the frame it appears.
        for (const o of engine.obstacles) {
          if (o.kind === "laser" && !seenLasers.has(o)) {
            seenLasers.add(o);
            sound.playLaserWarning();
          }
        }

        if (!engine.alive) {
          sound.playCollision();
          shakeUntil = now + CONFIG.shake.durationMs;
          flashUntil = now + CONFIG.shake.durationMs;
          onGameOverRef.current(engine.elapsed);
        }
      }

      draw(ctx!, engine, width, height, now, shakeUntil, flashUntil);
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("touchstart", preventScroll);
      canvas.removeEventListener("touchmove", preventScroll);
      sound.dispose();
      soundRef.current = null;
    };
    // Intentionally runs once per mount: each run gets a fresh <GameCanvas key=.../>.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
