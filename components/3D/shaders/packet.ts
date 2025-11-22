import * as THREE from "three";

/**
 * This function modifies the shader of the packet material to create a glowing gradient effect.
 * It injects custom vertex and fragment shader code to achieve the desired visual style.
 */
export const onPacketBeforeCompile = (shader: THREE.ShaderMaterial) => {
  shader.uniforms.uColor = { value: new THREE.Color("#00eaff") };

  shader.vertexShader = `
    varying vec3 vPosition;
    ${shader.vertexShader}
  `.replace(
    "#include <begin_vertex>",
    `
    #include <begin_vertex>
    vPosition = position;
    `
  );

  shader.fragmentShader = `
    uniform vec3 uColor;
    varying vec3 vPosition;
    ${shader.fragmentShader}
  `.replace(
    "vec4 diffuseColor = vec4( diffuse, opacity );",
    `
    
    // Ball glow shader effect
    float longitudinal = smoothstep(-0.5, 0.5, vPosition.z);
    float radial = 1.0 - length(vPosition.xy) * 2.0;
    radial = pow(radial, 0.5);
    
    float intensity = longitudinal * radial;

    // Color calculations
    vec3 baseGlow = uColor * 3.0; 
    vec3 coreWhite = vec3(5.0);
    
    vec3 finalColor = mix(baseGlow, coreWhite, pow(intensity, 3.0));

    float alpha = intensity;
    
    if (alpha < 0.05) discard;

    vec4 diffuseColor = vec4(finalColor, alpha);
    `
  );
};
