precision highp float;
precision highp int;
precision highp sampler2DArray;

uniform sampler2DArray field;
uniform vec2 camArraySize;
uniform float aperture;
uniform float focus;

in vec2 vSt;
in vec2 vUv;


void main() {
  vec4 color = vec4(0.0);

  float colorCount = 0.0; // proportional exposure

  float cc = camArraySize.x * camArraySize.y; // exact exposure

  vec2 camCenter = vSt;

  if (vUv.x >= 0.0 && vUv.x <= 1.0 && vUv.y >= 0.0 && vUv.y <= 1.0) {

    for (float i = 0.0; i < camArraySize.x; i++) {
      for (float j = 0.0; j < camArraySize.y; j++) {
        float dx = i - (camCenter.x * camArraySize.x - 0.5);
        float dy = j - (camCenter.y * camArraySize.y - 0.5);
        if (dx * dx + dy * dy < aperture) {
          float camOff = i + camArraySize.x * j;
          color += texture(field, vec3(vUv, camOff));
          colorCount++;
        }
      }
    }
  }

  gl_FragColor = vec4(color.rgb / colorCount, 1.0);
}