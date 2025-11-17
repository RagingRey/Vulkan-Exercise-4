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
    vec3 R = reflect(-V, N);
    vec3 reflectionColor = texture(skySampler, R).rgb;
    outColor = vec4(reflectionColor, 1.0);
}