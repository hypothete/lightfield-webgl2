import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const apertureInput = document.querySelector('#aperture');
const focusInput = document.querySelector('#focus');
const stInput = document.querySelector('#stplane');

const scene = new THREE.Scene();
let width = window.innerWidth;
let height = window.innerHeight;
const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 100);
const renderer = new THREE.WebGLRenderer();
let fragmentShader, vertexShader;

renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);
camera.position.z = 2;
scene.add(camera);

let fieldTexture;
let plane, planeMat, planePts;
let textureList; // populated from textures.txt
const camsX = 17;
const camsY = 17;
const resX = 256;
const resY = 256;
const cameraGap = 0.08; // cm hardcoded for now
let aperture = Number(apertureInput.value);
let focus = Number(focusInput.value);

// const helper = new THREE.AxesHelper(0.1);
// scene.add(helper);

const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
controls.target = new THREE.Vector3(0,0,1);


window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width/height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.render(scene, camera);
});

apertureInput.addEventListener('input', e => {
  aperture = Number(apertureInput.value);
  planeMat.uniforms.aperture.value = aperture;
});

focusInput.addEventListener('input', e => {
  focus = Number(focusInput.value);
  planeMat.uniforms.focus.value = focus;
});

stInput.addEventListener('input', () => {
  planePts.visible = stInput.checked;
});

loadScene();

function animate() {
	requestAnimationFrame(animate);
  controls.update();
	renderer.render(scene, camera);

}

async function loadScene() {
  await loadTextureList();
  await loadShaders();
  await loadField();
  loadPlane();
  animate();
}

async function loadShaders() {
  vertexShader = await fetch('./vertex.glsl').then(res => res.text());
  fragmentShader = await fetch('./fragment.glsl').then(res => res.text());
  console.log('Loaded shaders');
}

async function loadTextureList() {
  const list = await fetch('./textures.txt').then(res => res.text());
  textureList = list.split('\n').filter(line => line.length);
  console.log('Loaded texture list')
}

function imgToRGBABuffer(img,w,h) {
  const can = document.createElement('canvas');
  const ctx =  can.getContext('2d');
  can.width = w;
  can.height = h;
  // ctx.save();
  // ctx.translate(0,h);
  // ctx.scale(1, -1);
  ctx.drawImage(img,0,0);
  // ctx.restore();
  const imgData = ctx.getImageData(0,0,w,h);
  return imgData.data;
}

async function loadField() {
  const textureLoader = new THREE.TextureLoader();
  const bufferTx = await Promise.all(textureList.map(async filename => {
    const loadedTx = await textureLoader.loadAsync(`./data/${filename}`);
    return imgToRGBABuffer(loadedTx.image, resX, resY);
  }));
  const totalBytes = bufferTx.reduce((acc, buf) => acc + buf.byteLength, 0);
  const allBuffer = new Uint8Array(totalBytes);
  let offset = 0;
  bufferTx.forEach(buf => {
    allBuffer.set(buf, offset);
    offset += buf.byteLength;
  });
  fieldTexture = new THREE.DataTexture2DArray(allBuffer, resX, resY, camsX * camsY);
  console.log('Loaded field data');
}

function loadPlane() {
  const planeGeo = new THREE.PlaneGeometry(camsX * cameraGap, camsY * cameraGap, camsX, camsY);
  planeMat = new THREE.ShaderMaterial({
    uniforms: {
      field: { value: fieldTexture },
      camArraySize: new THREE.Uniform(new THREE.Vector2(camsX, camsY)),
      aperture: { value: aperture },
      focus: { value: focus }
    },
    vertexShader,
    fragmentShader,
  });
  plane = new THREE.Mesh(planeGeo, planeMat);
  const ptsMat = new THREE.PointsMaterial({ size: 0.01, color: 0xeeccff });
  planePts = new THREE.Points(planeGeo, ptsMat);
  planePts.visible = stInput.checked;
  plane.add(planePts);
  scene.add(plane);
  console.log('Loaded plane');
}