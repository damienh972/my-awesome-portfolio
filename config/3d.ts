export const BLOCKCHAIN_CONFIG = {
  nodes: {
    count: 18,
    connectionDistance: 14,
    sphere: {
      radius: 0.8,
      widthSegments: 32,
      heightSegments: 32,
    },
    material: {
      color: '#1e293b',
      roughness: 0.5,
      metalness: 0.8,
      emissive: '#1e1b4b',
      emissiveIntensity: 0.1,
    },
    distribution: {
      x: 40,
      y: 30,
      z: 20,
    },
  },
  cables: {
    cylinder: {
      radiusTop: 0.03,
      radiusBottom: 0.03,
      radialSegments: 4,
    },
    material: {
      color: '#475569',
      opacity: 0.2,
    },
  },
  packets: {
    count: 40,
    initialActive: 15,
    speed: {
      min: 0.5,
      max: 1.0,
    },
    sphere: {
      radius: 0.5,
      widthSegments: 16,
      heightSegments: 16,
    },
    scale: [0.09, 0.09, 0.6] as [number, number, number],
    material: {
      color: '#00eaff',
    },
    activationProbability: 0.2,
  },
  animation: {
    rotation: 0.0015,
    pointerInfluence: 0.2,
    lerpSpeed: 0.05,
    position: {
      hero: [0, -50, -60] as [number, number, number],
      blockchain: [0, 0, -12] as [number, number, number],
    },
  },
  seed: 42,
} as const;

export const ORB_CONFIG = {
  scale: 1.2,
  sphere: {
    radius: 1.5,
    widthSegments: 64,
    heightSegments: 64,
  },
  innerCore: {
    radius: 0.3,
    segments: 32,
    color: '#ffd700',
    opacity: 0.2,
  },
  lights: {
    primary: {
      color: '#a855f7',
      baseIntensity: 1.5,
      pulseAmplitude: 0.8,
      pulseSpeed: 1.2,
      distance: 20,
    },
    secondary: {
      color: '#ffd700',
      intensity: 1,
      distance: 8,
    },
  },
  essence: {
    count: 300,
    distribution: {
      radiusExponent: 1.5,
      maxRadius: 1.1,
    },
    scale: {
      min: 0.2,
      max: 0.7,
    },
    colors: {
      golden: {
        threshold: 0.7,
        color: [1.0, 0.85, 0.5] as [number, number, number],
      },
      cyan: {
        color: [0.98, 0.98, 1.0] as [number, number, number],
      },
    },
  },
  animation: {
    position: {
      start: [0, 2.0, 0] as [number, number, number],
      end: [-3.0, 1.3, 3] as [number, number, number],
    },
    scale: {
      reduction: 0.3,
    },
    phases: {
      one: 0.35,
      two: 0.55,
    },
    lerpSpeed: 0.1,
  },
  seed: 42,
} as const;

export const PARTICLES_CONFIG = {
  text: 'Damien Heloise',
  font: 'Michroma',
  physics: {
    springForce: 0.004,
    returnStrength: {
      min: 0.01,
      max: 0.02,
    },
    friction: 0.92,
    dispersion: {
      force: {
        min: 0.3,
        max: 0.5,
      },
      zFactor: 0.5,
    },
    repulsion: 0.1,
    mobile: {
      skipFrames: 0,
    },
  },
  visual: {
    size: {
      mobile: 0.08,
      desktop: 0.08,
    },
    opacity: 1.0,
  },
  canvas: {
    mobile: {
      width: 400,
      height: 120,
      fontSize: 32,
      sampling: 6,
      scale: 65,
    },
    tablet: {
      width: 1000,
      height: 250,
      fontSize: 80,
      sampling: 3,
      scale: 90,
    },
    desktop: {
      width: 1200,
      height: 300,
      fontSize: 100,
      sampling: 3,
      scale: 80,
    },
  },
  mouse: {
    defaultRadius: 0.4,
    threshold: 128,
  },
  initial: {
    distribution: 40,
  },
  seed: 42,
} as const;

export const QUIZ_CONFIG = {
  panel: {
    width: 6.0,
    height: 5.0,
    position: [0, -1, -1] as [number, number, number],
    mobilePosition: [0, -1, -4] as [number, number, number],
    scale: 0.8,
    contentScale: 0.85,
  },
  grid: {
    cols: 6,
    rows: 5,
  },
  debris: {
    count: 30,
    depth: 0.2,
  },
  material: {
    color: '#1e293b',
    roughness: 0.2,
    metalness: 0.8,
    emissive: '#1b2b52',
    emissiveIntensity: 0.2,
  },
  buttons: {
    colors: {
      normal: '#4617d5',
      hover: '#735bac',
    },
    dimensions: {
      width: 4.0,
      height: 0.55,
      depth: 0.05,
      radius: 0.02,
      smoothness: 8,
    },
    retry: {
      width: 2.5,
      height: 0.6,
      depth: 0.1,
    },
    scale: {
      normal: 1.0,
      hover: 1.05,
    },
    opacity: {
      base: 0.9,
      hoverBoost: 1.5,
    },
  },
  text: {
    font: 'Michroma',
    fontUrl: '/fonts/michroma/Michroma-Regular.ttf',
    colors: {
      normal: '#e0f7fa',
      active: '#ffffff',
      success: '#69f0ae',
      failure: '#ff5252',
      retry: '#000000',
    },
    sizes: {
      question: 0.22,
      option: 0.16,
      result: 0.4,
      retry: 0.2,
    },
    maxWidth: 4.0,
  },
  animation: {
    questionDelay: 300,
    resultDelay: 500,
    basePosition: [2.2, 2.2, 0] as [number, number, number],
  },
  seed: 42,
} as const;
