import { $adu } from "./runtime.js";

import * as THREE from "https://esm.sh/three";
const speed = $adu.state(1);
const particleSpeed = $adu.state(1.2);
const wireframe = $adu.state(false);
const activeGeometry = $adu.state("torusKnot");
const lightColor = $adu.state("#6366f1");
const pulseRate = $adu.state(0.02);
const pointCount = $adu.state(2400);
function degToRad(deg) {
  return (deg * (Math.PI / 180));
}
function clamp(val, minVal, maxVal) {
  return Math.max(minVal, Math.min(maxVal, val));
}
function calculateWave(t, i, factor) {
  return (Math.sin(((t * factor) + (i * 0.05))) * 0.4);
}
const container = (document.getElementById("canvas-container") || document.body);
const width = (container.clientWidth || window.innerWidth);
const height = (container.clientHeight || window.innerHeight);
const scene = new THREE().Scene();
scene.fog = new THREE().FogExp2(658454, 0.025);
const camera = new THREE().PerspectiveCamera(60, (width / height), 0.1, 1000);
camera.position.set(0, 1.5, 7);
const renderer = new THREE().WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);
const ambientLight = new THREE().AmbientLight(2236987, 1.8);
scene.add(ambientLight);
const primaryLight = new THREE().PointLight(6514417, 4, 30);
primaryLight.position.set(4, 5, 4);
scene.add(primaryLight);
const secondaryLight = new THREE().PointLight(15485081, 3, 30);
secondaryLight.position.set(-4, -3, -2);
scene.add(secondaryLight);
const rimLight = new THREE().DirectionalLight(3718648, 1.5);
rimLight.position.set(0, 10, -5);
scene.add(rimLight);
function createGeometry(shapeName) {
  return $adu.match(shapeName, [
  { test: $adu.matchLiteral("torusKnot"), guard: null, body: (val) => (new THREE().TorusKnotGeometry(1.6, 0.45, 160, 32)) },
  { test: $adu.matchLiteral("icosahedron"), guard: null, body: (val) => (new THREE().IcosahedronGeometry(2.1, 4)) },
  { test: $adu.matchLiteral("octahedron"), guard: null, body: (val) => (new THREE().OctahedronGeometry(2.2, 3)) },
  { test: $adu.matchLiteral("dodecahedron"), guard: null, body: (val) => (new THREE().DodecahedronGeometry(2, 2)) },
  { test: $adu.matchWildcard(), guard: null, body: (val) => (new THREE().SphereGeometry(2, 48, 48)) }
]);
}
let currentGeo = createGeometry(activeGeometry.value);
const mainMaterial = new THREE().MeshPhysicalMaterial({ color: 5195493, emissive: 1973067, roughness: 0.15, metalness: 0.85, clearcoat: 1, clearcoatRoughness: 0.1, wireframe: wireframe.value });
const mainMesh = new THREE().Mesh(currentGeo, mainMaterial);
scene.add(mainMesh);
function createParticleVortex(count) {
  const geo = new THREE().BufferGeometry();
  const positions = new Float32Array((count * 3));
  const colors = new Float32Array((count * 3));
  const color1 = new THREE().Color(3718648);
  const color2 = new THREE().Color(11032055);
  for (const i of $adu.range(0, count)) {
    const i3 = (i * 3);
    const radius = ((Math.random() * 8) + 2.5);
    const theta = ((Math.random() * Math.PI) * 2);
    const spiral = ((radius * 0.6) + theta);
    positions[i3] = (Math.cos(spiral) * radius);
    positions[(i3 + 1)] = ((Math.random() - 0.5) * 3.5);
    positions[(i3 + 2)] = (Math.sin(spiral) * radius);
    const mixedColor = color1.clone().lerp(color2, (radius / 10.5));
    colors[i3] = mixedColor.r;
    colors[(i3 + 1)] = mixedColor.g;
    colors[(i3 + 2)] = mixedColor.b;
  }
  geo.setAttribute("position", new THREE().BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE().BufferAttribute(colors, 3));
  const mat = new THREE().PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
  return new THREE().Points(geo, mat);
}
const particles = createParticleVortex(pointCount.value);
scene.add(particles);
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
window.addEventListener("pointermove", ((e) => {
  mouse.targetX = (((e.clientX / window.innerWidth) * 2) - 1);
  mouse.targetY = ((-(e.clientY / window.innerHeight) * 2) + 1);
}));
$adu.watch(activeGeometry, () => {
  scene.remove(mainMesh);
  mainMesh.geometry.dispose();
  mainMesh.geometry = createGeometry(activeGeometry.value);
  scene.add(mainMesh);
});
$adu.watch(wireframe, () => {
  mainMaterial.wireframe = wireframe.value;
});
let clock = new THREE().Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  mouse.x += ((mouse.targetX - mouse.x) * 0.05);
  mouse.y += ((mouse.targetY - mouse.y) * 0.05);
  const rotSpeed = (speed.value * delta);
  mainMesh.rotation.x += (rotSpeed * 0.6);
  mainMesh.rotation.y += (rotSpeed * 0.8);
  mainMesh.rotation.z += (rotSpeed * 0.2);
  mainMesh.position.x = (mouse.x * 0.8);
  mainMesh.position.y = (mouse.y * 0.8);
  particles.rotation.y += (0.003 * particleSpeed.value);
  particles.rotation.z = (Math.sin((elapsed * 0.2)) * 0.1);
  primaryLight.intensity = (3.5 + (Math.sin((elapsed * 3)) * 1.5));
  secondaryLight.intensity = (2.5 + (Math.cos((elapsed * 2.5)) * 1));
  renderer.render(scene, camera);
}
window.addEventListener("resize", (() => {
  const w = (container.clientWidth || window.innerWidth);
  const h = (container.clientHeight || window.innerHeight);
  camera.aspect = (w / h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}));
animate();
console.log("🚀 AduScript 3D Three.js Scene initialized with full reactivity and zero boilerplate!");
