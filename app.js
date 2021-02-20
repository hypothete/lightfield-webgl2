import * as THREE from './node_modules/three/build/three.module.js';
import textureList from './textures.js';

const scene = new THREE.Scene();
let width = window.innerWidth;
let height = window.innerHeight;
const camera = new THREE.PerspectiveCamera(45, width/height, 1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);
camera.rotation.y = Math.PI;
scene.add(camera);

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width/height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.render(scene, camera);
});

let fieldTexture;
let plane;

loadScene();

async function loadScene() {
  await loadField();
  loadPlane();
  renderer.render(scene, camera);
}

function imgToRGBABuffer(img,w,h) {
  const can = document.createElement('canvas');
  const ctx =  can.getContext('2d');
  can.width = w;
  can.height = h;
  ctx.save();
  ctx.translate(0,h);
  ctx.scale(1,-1);
  ctx.drawImage(img,0,0);
  ctx.restore();
  const imgData = ctx.getImageData(0,0,w,h);
  return imgData.data;
}

async function loadField() {
  const textureLoader = new THREE.TextureLoader();
  const bufferTx = await Promise.all(textureList.map(async filename => {
    const loadedTx = await textureLoader.loadAsync(`./data/${filename}`);
    return imgToRGBABuffer(loadedTx.image, 1024, 1024);
  }));
  const totalBytes = bufferTx.reduce((acc, buf) => acc + buf.byteLength, 0);
  const allBuffer = new Uint8Array(totalBytes);
  let offset = 0;
  bufferTx.forEach(buf => {
    allBuffer.set(buf, offset);
    offset += buf.byteLength;
  });
  fieldTexture = new THREE.DataTexture2DArray(allBuffer, 1024, 1024, 17 * 17);
  console.log('Loaded field data.');
}

function loadPlane() {
  const planeGeo = new THREE.PlaneGeometry(1,1,1,1);
  const planeMat = new THREE.ShaderMaterial({
    uniforms: {
      field: { value: fieldTexture },
    },
    vertexShader: document.querySelector('script[type="x-shader/x-vertex"]').textContent,
    fragmentShader: document.querySelector('script[type="x-shader/x-fragment"]').textContent,
  });
  plane = new THREE.Mesh(planeGeo, planeMat);
  scene.add(plane);
  plane.position.z = 1.2;
  plane.rotation.y = Math.PI;
  console.log('Loaded plane.');
}