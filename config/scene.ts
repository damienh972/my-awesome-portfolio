export const SCENE_CONFIG = {
  camera: {
    hero: {
      position: [0, 0, 12] as [number, number, number],
      fov: 50,
    },
    blockchain: {
      near: {
        position: [0, 0, 8] as [number, number, number],
      },
      far: {
        position: [0, 0, 6] as [number, number, number],
      },
    },
    responsive: {
      mobile: {
        position: [0, 0, 12] as [number, number, number],
        fov: 75,
      },
      tablet: {
        position: [0, 0, 10] as [number, number, number],
        fov: 75,
      },
      desktop: {
        position: [0, 0, 8] as [number, number, number],
        fov: 75,
      },
    },
  },
  lights: {
    ambient: {
      hero: 0.3,
      blockchain: 1.5,
    },
    blockchain: {
      intensity: 8,
      positions: [
        [-10, 0, -5],
        [10, 5, -5],
        [0, -10, -5],
      ] as Array<[number, number, number]>,
      colors: ['#d8b4fe', '#67e8f9', '#6366f1'],
      distance: 50,
      decay: 2,
    },
    directional: {
      position: [5, 5, 5] as [number, number, number],
      intensity: 1.5,
      color: '#00d9ff',
    },
  },
  fog: {
    hero: {
      color: '#000000',
      near: 10,
      far: 60,
    },
    blockchain: {
      color: '#2e1065',
      near: 10,
      far: 60,
    },
  },
  background: {
    hero: 'radial-gradient(circle at 50% 50%, rgb(10, 12, 20) 0%, rgb(0, 0, 0) 100%)',
    blockchain: 'radial-gradient(circle at 50% 50%, #200a49ff 0%, #0f172a 100%)',
    opacity: 0.8,
  },
  performance: {
    dpr: [1, 1.5] as [number, number],
    antialias: false,
    powerPreference: 'high-performance' as const,
  },
} as const;
