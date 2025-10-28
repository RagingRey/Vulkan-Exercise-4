#version 450

// INs
layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec3 inColor;
layout(location = 2) in vec3 inNormal;

// UBO (Scene Data)
layout(binding = 0) uniform SceneUBO {
    mat4 view;
    mat4 proj;
    vec3 lightPos1; // Static White
    vec3 lightPos2; // Rotating Red
    vec3 eyePos;
} ubo;

// Push Constants (Per-Object Data)
layout(push_constant) uniform PushConstants {
    mat4 model;
    vec4 ambientMat;  // Using vec4 for alignment
    vec4 specularMat; // Using vec4 for alignment
    float shininess;
} pc;

// OUTs
layout(location = 0) out vec3 fragColor;       // Will use as Diffuse Material
layout(location = 1) out vec3 fragWorldPos;
layout(location = 2) out vec3 fragWorldNormal;
layout(location = 3) out vec3 fragAmbientMat;  // Pass material from PC
layout(location = 4) out vec3 fragSpecularMat; // Pass material from PC
layout(location = 5) out float fragShininess;   // Pass material from PC

void main() {
    gl_Position = ubo.proj * ubo.view * pc.model * vec4(inPosition, 1.0);
    fragWorldPos = (pc.model * vec4(inPosition, 1.0)).xyz;
    fragWorldNormal = mat3(transpose(inverse(pc.model))) * inNormal;
    
    // Pass vertex color as diffuse material
    fragColor = inColor; 
    
    // Pass push-constant materials to frag shader
    fragAmbientMat = pc.ambientMat.xyz;
    fragSpecularMat = pc.specularMat.xyz;
    fragShininess = pc.shininess;
}