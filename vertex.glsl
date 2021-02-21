out vec2 vSt;
out vec2 vUv;
uniform float uvZ;

void main() {
  vec3 posToCam = cameraPosition - position;
  vec3 nDir = normalize(posToCam);
  // given similar triangles we can project the focusing plane point
  float zRatio = (posToCam.z + uvZ) / nDir.z;
  vec3 uvPoint = zRatio * nDir;
  // offset the uv into 0-1.0 coords
  vUv = uvPoint.xy + 0.5;
  vSt = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}