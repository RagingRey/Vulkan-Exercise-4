#version 450

layout(location = 0) in vec3 vWorldPos;
layout(location = 1) in vec3 vNormal;
layout(location = 3) in vec2 fragTexCoord;

layout(location = 0) out vec4 outColor;

layout(set = 0, binding = 0) uniform SceneUBO {
    mat4 view;
    mat4 proj;
    vec3 lightPos1; float _pad0;
    vec3 lightPos2; float _pad1;
    vec3 eyePos;    float _pad2;
} UBO;

layout(push_constant) uniform ObjectPush {
    mat4 model;
    vec4 ambientMat;
    vec4 specularMat;
    float shininess;
    float _pcPad0; float _pcPad1; float _pcPad2;
} PC;

layout(binding = 1) uniform sampler2D texSampler;

void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(UBO.eyePos - vWorldPos);

    // Base albedo: white (ignores per-vertex color)
    vec3 baseDiffuse = vec3(1.0);

    // Light colors
    vec3 light1Color = vec3(1.0, 1.0, 1.0); // white
    vec3 light2Color = vec3(1.0, 0.1, 0.1); // red

    // Light 1
    vec3 L1 = normalize(UBO.lightPos1 - vWorldPos);
    float diff1 = max(dot(N, L1), 0.0);
    vec3 H1 = normalize(L1 + V);
    float spec1 = pow(max(dot(N, H1), 0.0), PC.shininess);

    // Light 2
    vec3 L2 = normalize(UBO.lightPos2 - vWorldPos);
    float diff2 = max(dot(N, L2), 0.0);
    vec3 H2 = normalize(L2 + V);
    float spec2 = pow(max(dot(N, H2), 0.0), PC.shininess);

    vec4 texColor = texture(texSampler, fragTexCoord);

    vec3 ambient = PC.ambientMat.rgb;
    vec3 diffuse = baseDiffuse * (diff1 * light1Color + diff2 * light2Color);
    vec3 specular = PC.specularMat.rgb * (spec1 * light1Color + spec2 * light2Color);

    vec3 color = (ambient + diffuse) * texColor.rgb + specular;
    outColor = vec4(color, 1.0);
}