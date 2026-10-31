export const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
};

export const gentleSpring = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
};

export const microSpring = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export const staggerContainer = (staggerDelay = 0.05) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
};

