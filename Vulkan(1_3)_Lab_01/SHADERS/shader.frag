#version 450
#define DEBUG_VIEW 1  // 0=shaded, 1=height grayscale, 2=perturbed normal RGB

layout(set=0,binding=0) uniform SceneUBO {
    mat4 view;
    mat4 proj;
    vec3 lightPos1;
    vec3 lightPos2;
    vec3 eyePos;
    vec2 texSize;
    int  filterMode;
} ubo;

layout(set=0,binding=1) uniform sampler2D colSampler;     // diffuse
layout(set=0,binding=2) uniform sampler2D heightSampler;  // height map

layout(push_constant) uniform ObjectData {
    mat4 model;
    vec4 ambientMat;
    vec4 specularMat;
    float shininess;
    int texIndex;
} pc;

layout(location=0) in vec3 fragWorldPos;
layout(location=1) in vec3 fragWorldNormal;
layout(location=2) in vec2 fragTexCoord;

layout(location=0) out vec4 outColor;

const float bumpHeight = 0.4f; // between 0.1 and 1.0

void main() {
    vec3 albedo = texture(colSampler, fragTexCoord).rgb;

    // Height (grayscale)
    float h  = texture(heightSampler, fragTexCoord).r;

    // Debug view: height map as grayscale
    #if DEBUG_VIEW == 1
        outColor = vec4(vec3(h), 1.0);
        return;
    #endif

    // Derivatives in screen space
    float dHx = dFdx(h);
    float dHy = dFdy(h);

    // Pseudo "screen" normal, then remap onto a basis around the world normal
    vec3 screenNormal = normalize(vec3(-dHx, -dHy, bumpHeight));

    vec3 N = normalize(fragWorldNormal);
    vec3 helper = abs(N.z) < 0.9 ? vec3(0,0,1) : vec3(0,1,0);
    vec3 T = normalize(cross(helper, N));
    vec3 B = normalize(cross(N, T));

    vec3 perturbed = normalize(screenNormal.x * T + screenNormal.y * B + screenNormal.z * N);

    // Debug view: show perturbed normal in RGB
    #if DEBUG_VIEW == 2
        outColor = vec4(perturbed * 0.5 + 0.5, 1.0);
        return;
    #endif

    // Shaded result (world-space Phong)
    vec3 lightPos = ubo.lightPos1;
    vec3 L = normalize(lightPos - fragWorldPos);
    vec3 V = normalize(ubo.eyePos - fragWorldPos);
    vec3 H = normalize(L + V);

    float diff = max(dot(perturbed, L), 0.0);
    float spec = diff > 0.0 ? pow(max(dot(perturbed, H), 0.0), pc.shininess) : 0.0;

    vec3 ambient  = pc.ambientMat.rgb * albedo;
    vec3 diffuse  = diff * albedo;
    vec3 specular = spec * pc.specularMat.rgb;

    vec3 result = ambient + diffuse + specular;
    outColor = vec4(result, 1.0);
}