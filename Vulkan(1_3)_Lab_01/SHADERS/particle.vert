#version 450

layout(set = 0, binding = 0) uniform ParticleUBO {
    mat4 view;
    mat4 proj;
    float time;
    float _pad0; // std140 padding
    float _pad1;
    float _pad2;
} ubo;

layout(location = 0) in vec3 inParticlePos;   // xyz = particle center in world (z also used as seed)
layout(location = 1) in vec2 inCornerOffset;  // quad corner offsets: (-1,-1), (1,-1), (1,1), (-1,1)

layout(location = 0) out vec2 texCoord;
layout(location = 1) out float t;

#define particleSpeed         0.48
#define particleSpread        20.48
#define particleShape          0.37
#define particleSize           6.0
#define particleSystemHeight  60.0

void main() {
    // Loop particles over time using z as a unique seed per particle
    t = fract(inParticlePos.z + particleSpeed * ubo.time);

    // Base position: rise in +Y, add semi-random lateral motion
    vec3 pos = vec3(inParticlePos.xy, 0.0);
    pos.y += particleSystemHeight * t;
    pos.x += particleSpread * t * cos(50.0 * inParticlePos.z);
    pos.z += particleSpread * t * sin(120.0 * inParticlePos.z);

    // View-facing billboard using inverse(view)
    mat4 viewInv = inverse(ubo.view);
    vec3 camRight = viewInv[0].xyz;
    vec3 camUp    = viewInv[1].xyz;

    vec3 bb = particleSize * (inCornerOffset.x * camRight + inCornerOffset.y * camUp);
    vec3 worldPos = pos + bb;

    gl_Position = ubo.proj * ubo.view * vec4(worldPos, 1.0);

    // Map offsets [-1,1] to [0,1] UVs
    texCoord = inCornerOffset * 0.5 + 0.5;
}