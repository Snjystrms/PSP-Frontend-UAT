"use client";

import { motion } from "motion/react";
import {
  forwardRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export interface SharedLayoutBgProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Extra pixels to grow the pill beyond the hovered child on every side. */
  inset?: number;
  pillClassName?: string;
  pillContainerClassName?: string;
  children?: ReactNode;
}

interface PillRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Renders a container that paints a single "hover pill" behind whichever direct
 * interactive child the pointer is over, sliding it between them. The active
 * selection highlight is handled separately by the menu button's own layoutId
 * span — this is purely the hover affordance.
 */
export const SharedLayoutBg = forwardRef<HTMLElement, SharedLayoutBgProps>(
  function SharedLayoutBg(
    {
      as: Tag = "div",
      inset = 0,
      pillClassName,
      pillContainerClassName,
      className,
      children,
      onPointerMove,
      onPointerLeave,
      ...props
    },
    forwardedRef,
  ) {
    const containerRef = useRef<HTMLElement | null>(null);
    const hoveredItemRef = useRef<HTMLElement | null>(null);
    const [rect, setRect] = useState<PillRect | null>(null);
    const [visible, setVisible] = useState(false);
    const MotionTag = useMemo(() => motion.create(Tag), [Tag]);

    const setRefs = useCallback(
      (node: HTMLElement | null) => {
        containerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    const handlePointerMove = useCallback(
      (event: React.PointerEvent<HTMLElement>) => {
        onPointerMove?.(event);
        const container = containerRef.current;
        if (!container) return;
        const target = (event.target as HTMLElement).closest<HTMLElement>(
          '[data-slot="sidebar-menu-item"]',
        );
        if (!target || !container.contains(target)) {
          if (hoveredItemRef.current) {
            hoveredItemRef.current = null;
            setVisible(false);
          }
          return;
        }
        if (hoveredItemRef.current === target) return;
        hoveredItemRef.current = target;
        const c = container.getBoundingClientRect();
        const t = target.getBoundingClientRect();
        setRect({
          top: t.top - c.top - inset,
          left: t.left - c.left - inset,
          width: t.width + inset * 2,
          height: t.height + inset * 2,
        });
        setVisible(true);
      },
      [inset, onPointerMove],
    );

    const handlePointerLeave = useCallback(
      (event: React.PointerEvent<HTMLElement>) => {
        onPointerLeave?.(event);
        hoveredItemRef.current = null;
        setVisible(false);
      },
      [onPointerLeave],
    );

    return (
      <MotionTag
        {...props}
        ref={setRefs}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={cn("relative", className)}
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 z-0",
            pillContainerClassName,
          )}
        >
          {rect ? (
            <motion.div
              className={cn("absolute", pillClassName)}
              initial={false}
              animate={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                opacity: visible ? 1 : 0,
              }}
              transition={{ type: "spring", stiffness: 460, damping: 40 }}
            />
          ) : null}
        </div>
        {children}
      </MotionTag>
    );
  },
);
