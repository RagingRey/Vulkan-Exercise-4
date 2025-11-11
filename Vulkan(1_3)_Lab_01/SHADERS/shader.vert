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
layout(location=4) in vec3 inTangent;
layout(location=5) in vec3 inBinormal;

layout(location=0) out vec3 passColor;        // (optional if needed)
layout(location=1) out vec3 passNormal;       // (debug)
layout(location=2) out vec3 passWorldPos;     // (debug)
layout(location=3) out vec2 fragTexCoord;
layout(location=4) out vec3 fragLightPos_tangent;
layout(location=5) out vec3 fragViewPos_tangent;
layout(location=6) out vec3 fragPos_tangent;

void main() {
    mat4 MVP = ubo.proj * ubo.view * pc.model;
    gl_Position = MVP * vec4(inPosition, 1.0);

    vec3 worldPos = vec3(pc.model * vec4(inPosition,1.0));
    passWorldPos = worldPos;
    fragTexCoord = inTexCoord;

    // Normal matrix
    mat3 normalMatrix = transpose(inverse(mat3(pc.model)));
    vec3 T = normalize(normalMatrix * inTangent);
    vec3 B = normalize(normalMatrix * inBinormal);
    vec3 N = normalize(normalMatrix * inNormal);

    mat3 TBN = transpose(mat3(T,B,N)); // world->tangent

    // Positions (can also send vectors subtracting fragPos)
    vec3 lightPos_world = ubo.lightPos1;
    vec3 viewPos_world  = ubo.eyePos;

    fragLightPos_tangent = TBN * lightPos_world;
    fragViewPos_tangent  = TBN * viewPos_world;
    fragPos_tangent      = TBN * worldPos;

    passColor  = inColor;
    passNormal = N;
}