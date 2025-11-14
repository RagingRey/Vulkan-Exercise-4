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

// Optional albedo texture (use a bound texture if you have one)
layout(set=0,binding=1) uniform sampler2D colSampler;

layout(location=0) in vec3 fragWorldPos;
layout(location=1) in vec3 fragWorldNormal;
layout(location=2) in vec2 fragTexCoord;

layout(location=0) out vec4 outColor;

// Build TBN from screen-space derivatives (no vertex tangents needed)
mat3 computeTBN(vec3 N, vec3 P, vec2 uv)
{
    vec3 dpdx = dFdx(P);
    vec3 dpdy = dFdy(P);
    vec2 dtdx = dFdx(uv);
    vec2 dtdy = dFdy(uv);

    float r = 1.0 / (dtdx.x * dtdy.y - dtdx.y * dtdy.x);
    vec3 T = (dpdx * dtdy.y - dpdy * dtdx.y) * r;
    vec3 B = (dpdy * dtdx.x - dpdx * dtdy.x) * r;

    // Orthonormalize
    vec3 n = normalize(N);
    vec3 t = normalize(T - n * dot(n, T));
    vec3 b = normalize(cross(n, t));
    return mat3(t, b, n);
}

// Generate a tiled hemisphere normal in tangent space
vec3 hemisphereBumpTS(vec2 uv, float tiles, float radius)
{
    // Local uv in [-1, 1] within each tile
    vec2 uvLocal = fract(uv * tiles) * 2.0 - 1.0;

    float R2 = radius * radius;
    float r2 = dot(uvLocal, uvLocal);

    // Default: flat surface
    vec3 N_tan = vec3(0.0, 0.0, 1.0);

    if (r2 < R2)
    {
        // Hemisphere of radius=1 mapped onto disk of radius "radius"
        vec2 p = uvLocal / radius;
        float z = sqrt(max(0.0, 1.0 - dot(p, p)));
        N_tan = normalize(vec3(p.x, p.y, z));
    }
    return N_tan;
}

void main()
{
    // Base color (fallback to gray if no texture bound)
    vec3 albedo = texture(colSampler, fragTexCoord).rgb;
    if (albedo == vec3(0.0)) { albedo = vec3(0.6); }

    // TBN from derivatives
    mat3 TBN = computeTBN(normalize(fragWorldNormal), fragWorldPos, fragTexCoord);

    // Procedural normal in tangent space
    float tiles  = 5.0;   // number of bumps per UV axis
    float radius = 0.7;   // bump radius inside each tile (0..1)
    vec3 N_tan   = hemisphereBumpTS(fragTexCoord, tiles, radius);

    // Transform to world space
    vec3 N = normalize(TBN * N_tan);

    // Phong lighting with two lights
    vec3 V = normalize(ubo.eyePos - fragWorldPos);

    vec3 L1 = normalize(ubo.lightPos1 - fragWorldPos);
    vec3 H1 = normalize(L1 + V);
    float NdotL1 = max(dot(N, L1), 0.0);
    float spec1  = (NdotL1 > 0.0) ? pow(max(dot(N, H1), 0.0), max(pc.shininess, 1.0)) : 0.0;

    vec3 L2 = normalize(ubo.lightPos2 - fragWorldPos);
    vec3 H2 = normalize(L2 + V);
    float NdotL2 = max(dot(N, L2), 0.0);
    float spec2  = (NdotL2 > 0.0) ? pow(max(dot(N, H2), 0.0), max(pc.shininess, 1.0)) : 0.0;

    vec3 ambient  = pc.ambientMat.rgb * 0.08;
    vec3 diffuse  = albedo * (NdotL1 + NdotL2);
    vec3 specular = pc.specularMat.rgb * (spec1 + spec2);

    vec3 color = ambient + diffuse + specular;
    outColor = vec4(color, 1.0);
}