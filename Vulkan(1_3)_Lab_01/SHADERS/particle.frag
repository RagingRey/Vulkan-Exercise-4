#version 450

layout(location = 0) in vec2 texCoord;
layout(location = 1) in float t;

layout(location = 0) out vec4 outColor;

// Simple radial falloff sprite, time-faded.
// For smoke, switch the blend mode on the pipeline (ONE_MINUS_SRC_ALPHA) and adjust colors below.
void main() {
    // Soft circular mask
    float r = length(texCoord - vec2(0.5));
    float mask = smoothstep(0.6, 0.0, r); // inner bright, soft edges

    // Fire gradient over time (hot core to cooler)
    vec3 fireStart = vec3(1.0, 0.9, 0.5);
    vec3 fireEnd   = vec3(1.0, 0.1, 0.0);
    vec3 color = mix(fireStart, fireEnd, clamp(t, 0.0, 1.0));

    // Fade out over lifetime; shape curve to taste
    float lifetime = pow(1.0 - t, 1.2);

    float alpha = mask * lifetime;

    // With additive blending, RGB is what matters; keep alpha as driver for src factor
    outColor = vec4(color * alpha, alpha);
}