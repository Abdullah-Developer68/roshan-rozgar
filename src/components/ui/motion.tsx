"use client";
import { MotionConfig, motion, type HTMLMotionProps, type Transition } from "motion/react";
import type { ReactNode } from "react";

/** Shared easing: quick out, soft landing — calm, never bouncy. */
export const ease = [0.22, 1, 0.36, 1] as const;
export const spring: Transition = { type: "spring", stiffness: 380, damping: 32, mass: 0.8 };

/** App-wide motion settings: honours the OS "reduce motion" preference. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.35, ease }}>
      {children}
    </MotionConfig>
  );
}

/** Fade + rise into view once when scrolled to. */
export function Reveal({ delay = 0, y = 16, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease, delay }}
      {...props}
    />
  );
}

/** Container that staggers its <StaggerItem> children. */
export function Stagger({ gap = 0.06, delay = 0, inView = false, ...props }: HTMLMotionProps<"div"> & { gap?: number; delay?: number; inView?: boolean }) {
  const variants = { hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } };
  return inView ? (
    <motion.div variants={variants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} {...props} />
  ) : (
    <motion.div variants={variants} initial="hidden" animate="show" {...props} />
  );
}

export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

export function StaggerItem(props: HTMLMotionProps<"div">) {
  return <motion.div variants={itemVariants} {...props} />;
}

/** List-item enter/exit used with <AnimatePresence> (requests, results, messages). */
export const listItem = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.18 } },
  transition: spring,
};
