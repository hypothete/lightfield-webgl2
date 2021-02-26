precision highp float;
precision highp int;
precision highp sampler2DArray;

uniform sampler2DArray field;
uniform vec2 camArraySize;
in vec2 vSt;
in vec2 vUv;

void main() {
  vec4 color = vec4(0.0);

  vec2 camScale = camArraySize - 1.0;

  vec2 camFract = fract(vec2(
    (vSt.x) * camScale.x,
    (vSt.y) * camScale.y
  ));

  vec2 uvOffset = vec2(1.0 / camScale.x, 1.0 / camScale.y);

  vec2 cUv = clamp(vUv, 0.0, 1.0);
  if (cUv == vUv) {

    vec2 camA = floor(vSt * camScale);
    float camOffA = camA.x + camArraySize.x * camA.y;
    vec4 colA = texture(field, vec3(vUv, camOffA));

    vec2 camB = floor((vSt + vec2(uvOffset.x, 0.0)) * camScale);
    float camOffB = camB.x + camArraySize.x * camB.y;
    vec4 colB = texture(field, vec3(vUv, camOffB));

    vec2 camC = floor((vSt + vec2(0.0, uvOffset.y)) * camScale);
    float camOffC = camC.x + camArraySize.x * camC.y;
    vec4 colC = texture(field, vec3(vUv, camOffC));

    vec2 camD = floor((vSt + uvOffset) * camScale);
    float camOffD = camD.x + camArraySize.x * camD.y;
    vec4 colD = texture(field, vec3(vUv, camOffD));

    color = mix(mix(colA, colC, camFract.y), mix(colB, colD, camFract.y), camFract.x);

  }

  gl_FragColor = vec4(color.rgb, 1.0);
}