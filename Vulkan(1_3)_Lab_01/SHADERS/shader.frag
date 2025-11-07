#version 450

layout(location = 0) in vec3 vColor;
layout(location = 1) in vec2 vUV;

layout(location = 0) out vec4 outColor;

layout(set = 0, binding = 1) uniform sampler2D coinTex;
layout(set = 0, binding = 2) uniform sampler2D tileTex;

void main() {
    vec3 coin = texture(coinTex, vUV).rgb;

    // Repeat the tile texture to add detail
    vec2 tileUV = vUV * 4.0;
    vec3 tile = texture(tileTex, tileUV).rgb;

    // Detail multiply (keeps coin as main albedo, modulated by tiles)
    vec3 combined = coin * (tile * 0.9 + 0.1);
    outColor = vec4(combined, 1.0);
}