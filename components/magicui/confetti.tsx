"use client";

import confetti from "canvas-confetti";

// Triggers the confetti side cannons animation for 3 seconds
export function showConfetti() {
  const end = Date.now() + 3 * 1000; // 3 seconds
  const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 2,
      angle: 60,
      spread: 75,
      startVelocity: 60,
      origin: { x: 0, y: 0.8 },
      colors: colors
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 75,
      startVelocity: 60,
      origin: { x: 1, y: 0.8 },
      colors: colors
    });

    requestAnimationFrame(frame);
  };

  frame();
}

// Optionally, export a dummy component if you need to mount something
export function ConfettiMount() {
  return null;
}
