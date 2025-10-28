#version 450

// INs
layout(location = 0) in vec3 fragColor;       // Diffuse Material from vertex color
layout(location = 1) in vec3 fragWorldPos;
layout(location = 2) in vec3 fragWorldNormal;
layout(location = 3) in vec3 fragAmbientMat;
layout(location = 4) in vec3 fragSpecularMat;
layout(location = 5) in float fragShininess;

// UBO (Scene Data)
layout(binding = 0) uniform SceneUBO {
    mat4 view;      // Not used in frag, but must match vert
    mat4 proj;      // Not used in frag, but must match vert
    vec3 lightPos1; // Static White
    vec3 lightPos2; // Rotating Red
    vec3 eyePos;
} ubo;

// OUT
layout(location = 0) out vec4 outColor;

// Function to calculate lighting for one light source (Diffuse + Specular)
vec3 calcLight(vec3 lightPos, vec3 lightColor, vec3 norm, vec3 viewDir, 
               vec3 diffuseMat, vec3 specularMat, float shininess) 
{
    // --- Compute vectors ---
    vec3 lightDir = normalize(lightPos - fragWorldPos);
    
    // --- Diffuse ---
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diffuseMat * lightColor * diff;

    // --- Specular ---
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = specularMat * lightColor * spec;

    return (diffuse + specular);
}

void main() {
    // --- Material properties from vertex shader ---
    vec3 diffuseMaterial = fragColor;       // from inColor
    vec3 ambientMaterial = fragAmbientMat;
    vec3 specularMaterial = fragSpecularMat;
    float shininess = fragShininess;

    // --- Light properties ---
    vec3 lightColor1 = vec3(1.0, 1.0, 1.0); // Static White
    vec3 lightColor2 = vec3(1.0, 0.0, 0.0); // Rotating Red

    // --- Compute common vectors ---
    vec3 norm = normalize(fragWorldNormal);
    vec3 viewDir = normalize(ubo.eyePos - fragWorldPos);

    // --- Ambient component (global, not per-light) ---
    // Apply a dim white global ambient light
    vec3 globalAmbientLight = vec3(0.1, 0.1, 0.1); 
    vec3 ambient = ambientMaterial * globalAmbientLight;
    
    // --- Calculate for Light 1 (Static White) ---
    vec3 light1 = calcLight(ubo.lightPos1, lightColor1, norm, viewDir,
                            diffuseMaterial, specularMaterial, shininess);

    // --- Calculate for Light 2 (Rotating Red) ---
    vec3 light2 = calcLight(ubo.lightPos2, lightColor2, norm, viewDir,
                            diffuseMaterial, specularMaterial, shininess);

    // --- Combine components ---
    vec3 result = ambient + light1 + light2;
    outColor = vec4(result, 1.0);
}