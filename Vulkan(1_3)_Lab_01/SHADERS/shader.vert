#version 450

layout(location = 0) in vec3 inPos;
layout(location = 1) in vec3 inColor;
layout(location = 2) in vec3 inNormal;
layout(location = 3) in vec2 inUV;

layout(location = 0) out vec3 vColor;
layout(location = 1) out vec2 vUV;
layout(location = 2) out flat int vTexIndex;

layout(set = 0, binding = 0, std140) uniform SceneUBO {
    mat4 view;
    mat4 proj;
    vec3 lightPos1; float _pad0;
    vec3 lightPos2; float _pad1;
    vec3 eyePos;    float _pad2;
    vec2 texSize;   int   filterMode; float _pad3;
} ubo;

layout(push_constant) uniform ObjectPC {
    mat4 model;
    vec4 ambientMat;
    vec4 specularMat;
    float shininess;
    int texIndex; // <-- Add this
} pc;

void main() {
    vColor = inColor;
    vUV = inUV;
    vTexIndex = pc.texIndex;
    gl_Position = ubo.proj * ubo.view * pc.model * vec4(inPos, 1.0);
}