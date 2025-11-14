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
    int   texIndex;
} pc;

// Samplers: color, normal, height
layout(set=0,binding=1) uniform sampler2D colSampler;
layout(set=0,binding=2) uniform sampler2D normalSampler;
layout(set=0,binding=3) uniform sampler2D heightSampler;

layout(location=0) in vec3 fragWorldPos;
layout(location=1) in vec3 fragWorldNormal;
layout(location=2) in vec2 fragTexCoord;

layout(location=0) out vec4 outColor;

// Derivative-based TBN (replace with vertex tangents for production)
mat3 computeTBN(vec3 N, vec3 P, vec2 uv)
{
    vec3 dpdx = dFdx(P);
    vec3 dpdy = dFdy(P);
    vec2 dtdx = dFdx(uv);
    vec2 dtdy = dFdy(uv);

    float r = 1.0 / (dtdx.x * dtdy.y - dtdx.y * dtdy.x);
    vec3 T = (dpdx * dtdy.y - dpdy * dtdx.y) * r;
    vec3 B = (dpdy * dtdx.x - dpdx * dtdy.x) * r;

    vec3 n = normalize(N);
    vec3 t = normalize(T - n * dot(n, T));
    vec3 b = normalize(cross(n, t));
    return mat3(t, b, n);
}

// Parallax Occlusion Mapping (ray march + linear refinement)
vec2 parallaxOcclusionMapping(vec2 uv, vec3 viewDirTan)
{
    // Prevent extreme division issues
    if (viewDirTan.z <= 0.001)
        return uv;

    // Parameters
    float heightScale = 0.05;       // Depth strength (tune)
    int   minLayers   = 16;         // Performance vs quality
    int   maxLayers   = 48;
    float numLayers = mix(float(maxLayers), float(minLayers), abs(viewDirTan.z));
    float layerDepth = 1.0 / numLayers;

    // Direction to step in UV space
    vec2 deltaUV = (viewDirTan.xy / viewDirTan.z) * heightScale / numLayers;

    float currentDepth = 0.0;
    float currentHeight = texture(heightSampler, uv).r;

    // March until we pass surface height
    while (currentDepth < currentHeight && numLayers > 0.0)
    {
        uv -= deltaUV;
        currentDepth += layerDepth;
        currentHeight = texture(heightSampler, uv).r;
    }

    // Linear refinement between last two positions
    vec2 uvAfter = uv;
    vec2 uvBefore = uv + deltaUV;

    float depthAfter  = currentDepth;
    float depthBefore = currentDepth - layerDepth;

    float heightAfter  = currentHeight;
    float heightBefore = texture(heightSampler, uvBefore).r;

    float weight = (heightBefore - depthBefore) /
                   ((heightBefore - depthBefore) - (heightAfter - depthAfter));
    weight = clamp(weight, 0.0, 1.0);

    vec2 refinedUV = mix(uvAfter, uvBefore, weight);
    return refinedUV;
}

void main()
{
    // Base TBN
    mat3 TBN = computeTBN(normalize(fragWorldNormal), fragWorldPos, fragTexCoord);

    // View direction world -> tangent
    vec3 viewDirWorld = normalize(ubo.eyePos - fragWorldPos);
    vec3 viewDirTan   = transpose(TBN) * viewDirWorld; // world->tangent

    // Displaced UV via parallax occlusion mapping
    vec2 displacedUV = parallaxOcclusionMapping(fragTexCoord, viewDirTan);

    // Optional: discard if outside (prevents stretching)
    if (displacedUV.x < 0.0 || displacedUV.x > 1.0 ||
        displacedUV.y < 0.0 || displacedUV.y > 1.0)
    {
        // Fade out instead of hard discard if desired:
        // outColor = vec4(0.0); return;
        displacedUV = clamp(displacedUV, 0.0, 1.0);
    }

    // Sample color
    vec3 albedo = texture(colSampler, displacedUV).rgb;
    if (albedo == vec3(0.0)) albedo = vec3(0.6);

    // Sample and unpack normal map (tangent space)
    vec3 nMap = texture(normalSampler, displacedUV).rgb * 2.0 - 1.0;
    nMap = normalize(nMap);

    // Final world space normal
    vec3 N = normalize(TBN * nMap);

    // Lighting
    vec3 V = viewDirWorld;

    vec3 L1 = normalize(ubo.lightPos1 - fragWorldPos);
    vec3 H1 = normalize(L1 + V);
    float NdotL1 = max(dot(N, L1), 0.0);
    float spec1  = (NdotL1 > 0.0) ? pow(max(dot(N, H1), 0.0), max(pc.shininess, 1.0)) : 0.0;

    vec3 L2 = normalize(ubo.lightPos2 - fragWorldPos);
    vec3 H2 = normalize(L2 + V);
    float NdotL2 = max(dot(N, L2), 0.0);
    float spec2  = (NdotL2 > 0.0) ? pow(max(dot(N, H2), 0.0), max(pc.shininess, 1.0)) : 0.0;

    vec3 ambient  = pc.ambientMat.rgb * 0.06;
    vec3 diffuse  = albedo * (NdotL1 + NdotL2);
    vec3 specular = pc.specularMat.rgb * (spec1 + spec2);

    vec3 color = ambient + diffuse + specular;
    outColor = vec4(color, 1.0);
}