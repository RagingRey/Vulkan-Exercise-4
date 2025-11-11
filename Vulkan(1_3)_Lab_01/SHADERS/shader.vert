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

layout(push_constant) uniform ObjectData {
    mat4 model;
    vec4 ambientMat;
    vec4 specularMat;
    float shininess;
    int texIndex;
} pc;

layout(location=0) in vec3 inPosition;
layout(location=1) in vec3 inColor;
layout(location=2) in vec3 inNormal;
layout(location=3) in vec2 inTexCoord;

layout(location=0) out vec3 fragWorldPos;
layout(location=1) out vec3 fragWorldNormal;
layout(location=2) out vec2 fragTexCoord;

void main() {
    vec4 worldPos = pc.model * vec4(inPosition, 1.0);
    fragWorldPos = worldPos.xyz;

    mat3 normalMatrix = transpose(inverse(mat3(pc.model)));
    fragWorldNormal = normalize(normalMatrix * inNormal);

    fragTexCoord = inTexCoord;

    gl_Position = ubo.proj * ubo.view * worldPos;
}