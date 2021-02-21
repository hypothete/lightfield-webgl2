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
camera.position.z = -3;
scene.add(camera);

let fieldTexture;
let plane, planeMat;
let focusingPlane = 1;
const virtualCam = new THREE.Vector3(0,0,-1);
const cameraData = [];
const camsX = 17;
const camsY = 17;
const resX = 1024;
const resY = 1024;
const camInterval = 0.08; // cm hardcoded for now

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width/height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.render(scene, camera);
});

window.addEventListener('wheel', (e) => {
  focusingPlane += e.deltaY / (Math.abs(e.deltaY) * 10);
  planeMat.uniforms.focusingPlane.value = focusingPlane;
});

window.addEventListener('keydown', (e) => {
  const dMove = 0.01;
  switch(e.key) {
    case 'ArrowLeft':
      virtualCam.x -= dMove;
      break;
    case 'ArrowRight':
      virtualCam.x += dMove;
      break;
    case 'ArrowUp':
      virtualCam.y += dMove;
      break;
    case 'ArrowDown':
      virtualCam.y -= dMove;
    default:
  }
});

loadScene();

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );

}

async function loadScene() {
  await loadField();
  loadPlane();
  animate();
}

function addCameraData(filename) {
  // out_00_00_-230.697815_929.138916_.png
  const dataStr = filename.split('_');
  const datum = {
    x: Number(dataStr[1]),
    y: Number(dataStr[2]),
    dx: Number(dataStr[3]),
    dy: Number(dataStr[4]),
  };
  cameraData.push(datum);
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
    addCameraData(filename);
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
  console.log('Loaded field data.');
}

function loadPlane() {
  const planeGeo = new THREE.PlaneGeometry(camsX * camInterval, camsY * camInterval, camsX, camsY);
  planeMat = new THREE.ShaderMaterial({
    uniforms: {
      field: { value: fieldTexture },
      virtualCam: new THREE.Uniform(virtualCam),
      focusingPlane: { value: focusingPlane },
      camArraySize: new THREE.Uniform(new THREE.Vector2(camsX, camsY))
    },
    vertexShader: document.querySelector('script[type="x-shader/x-vertex"]').textContent,
    fragmentShader: document.querySelector('script[type="x-shader/x-fragment"]').textContent,
  });
  plane = new THREE.Mesh(planeGeo, planeMat);
  scene.add(plane);
  plane.rotation.y = Math.PI;
  console.log('Loaded plane.');
}