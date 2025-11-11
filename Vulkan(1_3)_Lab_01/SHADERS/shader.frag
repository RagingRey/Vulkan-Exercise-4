#version 450

layout(set=0,binding=1) uniform sampler2D colSampler;
layout(set=0,binding=2) uniform sampler2D normalSampler;

layout(push_constant) uniform ObjectData {
    mat4 model;
    vec4 ambientMat;
    vec4 specularMat;
    float shininess;
    int texIndex;
} pc;

layout(location=3) in vec2 fragTexCoord;
layout(location=4) in vec3 fragLightPos_tangent;
layout(location=5) in vec3 fragViewPos_tangent;
layout(location=6) in vec3 fragPos_tangent;

layout(location=0) out vec4 outColor;

void main() {
    vec3 albedo = texture(colSampler, fragTexCoord).rgb;

    // Fetch and unpack normal
    vec3 N = texture(normalSampler, fragTexCoord).rgb;
    N = normalize(N * 2.0 - 1.0);

    // Convert positions to vectors in tangent space
    vec3 L = normalize(fragLightPos_tangent - fragPos_tangent);
    vec3 V = normalize(fragViewPos_tangent - fragPos_tangent);
    vec3 H = normalize(L + V);

    float diff = max(dot(N, L), 0.0);
    float spec = 0.0;
    if (diff > 0.0) {
        spec = pow(max(dot(N, H), 0.0), pc.shininess);
    }

    vec3 ambient  = pc.ambientMat.rgb * albedo;
    vec3 diffuse  = diff * albedo;
    vec3 specular = spec * pc.specularMat.rgb;

    vec3 result = ambient + diffuse + specular;
    outColor = vec4(result, 1.0);
}