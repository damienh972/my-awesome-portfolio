export const ANIMATION_CONFIG = {
  camera: {
    parallaxStrength: 0.5,
    lerpSpeed: 0.1,
    pointerInfluence: 5,
  },
  scroll: {
    hero: {
      height: 1,
      snapThreshold: 150,
      snapDistance: 5,
      snapDelay: 50,
      snapDuration: 600,
    },
    blockchain: {
      height: 4,
      quizPerfectRatio: 0.58,
    },
    ranges: {
      wall: {
        in: [0.15, 0.45] as [number, number],
        out: [0.85, 0.95] as [number, number],
      },
      text: {
        in: [0.45, 0.62] as [number, number],
        out: [0.8, 0.9] as [number, number],
      },
    },
  },
  transitions: {
    duration: 1000,
    easing: 'ease-in-out',
    pointerDisableThreshold: 0.8,
  },
  framerMotion: {
    hero: {
      subtitle: {
        delay: 3,
        duration: 0.8,
      },
      description: {
        delay: 3.5,
        duration: 0.8,
      },
    },
    contentOpacity: {
      scrollRange: [0, 0.6, 0.9] as [number, number, number],
      opacityRange: [1, 1, 0] as [number, number, number],
    },
  },
} as const;
