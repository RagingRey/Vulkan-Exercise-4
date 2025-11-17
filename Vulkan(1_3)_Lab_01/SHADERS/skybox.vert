#version 450
layout(binding = 0) uniform SceneUBO {
    mat4 view;
    mat4 proj;
    vec3 lightPos1;
    vec3 lightPos2;
    vec3 eyePos;
    vec2 texSize;
    int  filterMode;
} ubo;
// Using existing UBO layout; we only need view/proj, eyePos.
layout(location = 0) in vec3 inPosition;
layout(location = 0) out vec3 vDir;
void main() {
    // Remove translation from view to keep cube centered
    mat4 viewNoTrans = mat4(mat3(ubo.view));
    vDir = inPosition;
    gl_Position = ubo.proj * viewNoTrans * vec4(inPosition, 1.0);
}