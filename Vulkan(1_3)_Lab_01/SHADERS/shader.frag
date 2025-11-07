#version 450

layout(location = 0) in vec3 vColor;
layout(location = 1) in vec2 vUV;

layout(location = 2) in flat int vTexIndex;

layout(location = 0) out vec4 outColor;

layout(set = 0, binding = 1) uniform sampler2D mainTex;
layout(set = 0, binding = 2) uniform sampler2D tileTex;

void main() {
    vec3 color;

    if (gl_FrontFacing) {
        // --- This is an OUTSIDE face ---
        // Use the index from the C++ code
        if (vTexIndex == 0) {
            color = texture(mainTex, vUV).rgb; // wood
        } else {
            color = texture(tileTex, vUV).rgb; // rock
        }
    } else {
        // --- This is an INSIDE face ---
        // Always use the wood texture
        color = texture(mainTex, vUV).rgb; 
    }
    
    outColor = vec4(color, 1.0);
}