// Shared motion easing + spring presets used by the animated sidebar and
// other motion components. Tuned to feel snappy but never overshoot layout.

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 380,
  damping: 34,
  mass: 0.8,
} as const;

export const SPRING_PRESS = {
  type: "spring",
  stiffness: 520,
  damping: 30,
  mass: 0.6,
} as const;
