import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';

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
let plane, planeMat;
let textureList; // populated from textures.txt
const camsX = 17;
const camsY = 17;
const resX = 256;
const resY = 256;
const camInterval = 0.08; // cm hardcoded for now

// const helper = new THREE.AxesHelper(0.1);
// scene.add(helper);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width/height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.render(scene, camera);
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
  ctx.drawImage(img,0,0);
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
  const planeGeo = new THREE.PlaneGeometry(camsX * camInterval, camsY * camInterval, camsX, camsY);
  planeMat = new THREE.ShaderMaterial({
    uniforms: {
      field: { value: fieldTexture },
      camArraySize: new THREE.Uniform(new THREE.Vector2(camsX, camsY))
    },
    vertexShader,
    fragmentShader,
  });
  plane = new THREE.Mesh(planeGeo, planeMat);
  scene.add(plane);
  console.log('Loaded plane');
}