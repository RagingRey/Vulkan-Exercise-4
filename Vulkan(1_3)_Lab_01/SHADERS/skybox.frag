#version 450
layout(location = 0) in vec3 vDir;
layout(binding = 4) uniform samplerCube skySampler; // matches descriptor binding
layout(location = 0) out vec4 outColor;
void main() {
    outColor = texture(skySampler, normalize(vDir));
}