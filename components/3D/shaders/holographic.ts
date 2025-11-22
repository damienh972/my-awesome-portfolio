import { perlinNoise3D } from "./perlinNoise3D";

export const holographicVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
uniform float time;

${perlinNoise3D}

void main() {
  vec3 pos = position;

  float noise1 = snoise(pos * 2.0 + vec3(time * 0.2, time * 0.15, time * 0.18));
  float noise2 = snoise(pos * 3.0 - vec3(time * 0.15, time * 0.2, time * 0.12));
  float noise3 = snoise(pos * 4.0 + vec3(time * 0.1, time * 0.25, time * 0.2));

  float displacement = noise1 * 0.08 + noise2 * 0.05 + noise3 * 0.03;

  vec3 newPosition = pos + normal * displacement;

  vNormal = normalize(normalMatrix * normal);
  vPosition = newPosition;
  vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
  vWorldPosition = worldPos.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

export const holographicFragmentShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
uniform float time;
uniform float opacity;
uniform float colorMix;

void main() {
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
  fresnel = pow(fresnel, 1.8);

  vec3 baseColorHero = vec3(0.043, 0.035, 0.188);
  vec3 glowColorHero = vec3(0.2, 0.18, 0.45);

  vec3 baseColorBlockchain = vec3(0.12, 0.09, 0.27);
  vec3 glowColorBlockchain = vec3(0.22, 0.19, 0.47);

  vec3 baseColor = mix(baseColorHero, baseColorBlockchain, colorMix);
  vec3 glowColor = mix(glowColorHero, glowColorBlockchain, colorMix);

  float variation = sin(vPosition.x * 2.0 + time * 0.3) *
                   cos(vPosition.y * 2.0 + time * 0.2) *
                   sin(vPosition.z * 2.0 + time * 0.25);
  variation = variation * 0.1 + 0.9;

  vec3 finalColor = mix(baseColor, glowColor, fresnel) * variation;

  float alpha = (fresnel * 0.4 + 0.15) * opacity;

  gl_FragColor = vec4(finalColor, alpha);
}
`;
