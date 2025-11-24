import { injectShaderUtils } from './utils';

const vertexShaderCore = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float time;
  uniform float hoverState;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;

    float noiseFreq = 2.0;
    float noiseAmp = 0.015 + (hoverState * 0.03);
    float speed = time * 0.8;

    float noiseVal = snoise(pos * noiseFreq + vec3(speed));
    vec3 newPos = pos + normal * noiseVal * noiseAmp;

    vPosition = newPos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`;

export const sc2ButtonsVertexShader = injectShaderUtils(vertexShaderCore, ['perlinNoise3D']);

export const sc2ButtonsFragmentShader = `
  uniform float opacity;
  uniform vec3 baseColor;
  uniform float hoverState;

  varying vec3 vNormal;

  void main() {

    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);

    vec3 color = baseColor;

    if (hoverState > 0.0) {
       color = mix(color, vec3(1.0), hoverState * 0.1);
    }

    float alpha = (0.1 + fresnel * 0.9) * opacity;

    gl_FragColor = vec4(color, alpha);
  }
`;
