precision highp float;
precision highp int;
precision highp sampler2DArray;

uniform sampler2DArray field;
uniform vec2 camArraySize;
in vec2 vSt;
in vec2 vUv;

void main() {
  vec4 color = vec4(0.0);
  vec2 cVuv = clamp(vUv, vec2(0.0), vec2(1.0));
  if (vUv == cVuv) {
    float camX = floor((vSt.x) * (camArraySize.x - 1.0));
    float camY = floor((vSt.y) * (camArraySize.y - 1.0));
    float camOff = camX + camArraySize.x * camY;
    color = texture(field, vec3(vUv, camOff));
  } else {
    color = vec4(0.0,0.0,1.0,1.0);
  }
  
  gl_FragColor = vec4(color.rgb, 1.0);
}