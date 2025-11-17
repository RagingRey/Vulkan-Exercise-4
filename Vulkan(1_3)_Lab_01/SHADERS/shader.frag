#version 450
layout(set=0,binding=0) uniform SceneUBO {
    mat4 view;
    mat4 proj;
    vec3 lightPos1;
    vec3 lightPos2;
    vec3 eyePos;
    vec2 texSize;
    int  filterMode;
} ubo;

layout(set=0, binding=4) uniform samplerCube skySampler;

layout(location=0) in vec3 inWorldPos;
layout(location=1) in vec3 inWorldNormal;

layout(location=0) out vec4 outColor;

void main() {
    vec3 N = normalize(inWorldNormal);
    vec3 V = normalize(ubo.eyePos - inWorldPos);
    float IOR = 1.00 / 1.33; // Index of Refraction (air to water)
    // Calculate the refraction vector
    vec3 R = refract(-V, N, IOR);
    vec3 refractionColor = texture(skySampler, R).rgb;
    outColor = vec4(refractionColor, 1.0);
}