import { injectShaderUtils } from './utils';

const vertexShaderCore = `
attribute float scale;
attribute vec3 randomness;
attribute vec3 color;
uniform float time;
varying float vAlpha;
varying vec3 vColor;

void main() {
  vec3 pos = position;

  float noise1 = snoise(pos * 1.5 + vec3(time * 0.2));
  float noise2 = snoise(pos * 2.5 + vec3(time * 0.15, time * 0.18, time * 0.22));

  pos.x += sin(time * 0.4 + randomness.x * 6.28) * 0.15 * noise1;
  pos.y += cos(time * 0.35 + randomness.y * 6.28) * 0.15 * noise1;
  pos.z += sin(time * 0.45 + randomness.z * 6.28) * 0.15 * noise2;

  float pulse = sin(time * 1.5 + length(position) * 2.0) * 0.1 + 1.0;
  pos *= pulse;

  float dist = length(pos);
  if (dist > 1.3) {
    pos = normalize(pos) * 1.3;
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  gl_PointSize = scale * 120.0 * (1.0 / -mvPosition.z);

  vAlpha = 1.0 - smoothstep(0.5, 1.3, dist);
  vColor = color;
}
`;

export const essenceVertexShader = injectShaderUtils(vertexShaderCore, ['perlinNoise3D']);

export const essenceFragmentShader = `
uniform float opacity;
varying float vAlpha;
varying vec3 vColor;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;

  float circle = 1.0 - smoothstep(0.0, 0.5, dist);
  circle = pow(circle, 1.5);

  vec3 finalColor = vColor;

  float alpha = circle * vAlpha * opacity * 0.8;
  gl_FragColor = vec4(finalColor, alpha);
}
`;
