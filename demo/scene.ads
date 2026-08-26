// ========================================================
// AduScript 3D Interactive Three.js Showcase
// Pure .ads syntax demonstrating:
// - Zero-boilerplate CDN imports ('use cdn:three')
// - Pipeline transformations ('|>')
// - First-class Reactive State ('state') & Effects ('effect')
// - Auto-returning expression functions ('fn ... -> ...')
// - Pattern Matching ('match ... with')
// ========================================================

use cdn:three as THREE

// 1. Reactive State Primitives
state speed = 1.0
state particleSpeed = 1.2
state wireframe = false
state activeGeometry = "torusKnot"
state lightColor = "#6366f1"
state pulseRate = 0.02
state pointCount = 2400

// 2. Pure Helper Functions
fn degToRad(deg) -> deg * (Math.PI / 180)
fn clamp(val, minVal, maxVal) -> Math.max(minVal, Math.min(maxVal, val))
fn calculateWave(t, i, factor) -> Math.sin(t * factor + i * 0.05) * 0.4

// 3. Setup Three.js WebGL Core
let container = document.getElementById("canvas-container") || document.body
let width = container.clientWidth || window.innerWidth
let height = container.clientHeight || window.innerHeight

let scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x0a0c16, 0.025)

let camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
camera.position.set(0, 1.5, 7)

let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setSize(width, height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2
container.appendChild(renderer.domElement)

// 4. Lighting Rig
let ambientLight = new THREE.AmbientLight(0x22223b, 1.8)
scene.add(ambientLight)

let primaryLight = new THREE.PointLight(0x6366f1, 4, 30)
primaryLight.position.set(4, 5, 4)
scene.add(primaryLight)

let secondaryLight = new THREE.PointLight(0xec4899, 3, 30)
secondaryLight.position.set(-4, -3, -2)
scene.add(secondaryLight)

let rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5)
rimLight.position.set(0, 10, -5)
scene.add(rimLight)

// 5. Pattern Matching for Dynamic Geometric Mesh
fn createGeometry(shapeName) -> match shapeName with {
  "torusKnot"   => new THREE.TorusKnotGeometry(1.6, 0.45, 160, 32),
  "icosahedron" => new THREE.IcosahedronGeometry(2.1, 4),
  "octahedron"  => new THREE.OctahedronGeometry(2.2, 3),
  "dodecahedron"=> new THREE.DodecahedronGeometry(2.0, 2),
  _             => new THREE.SphereGeometry(2.0, 48, 48)
}

mut currentGeo = createGeometry(activeGeometry.value)
let mainMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x4f46e5,
  emissive: 0x1e1b4b,
  roughness: 0.15,
  metalness: 0.85,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  wireframe: wireframe.value
})

let mainMesh = new THREE.Mesh(currentGeo, mainMaterial)
scene.add(mainMesh)

// 6. Particle Vortex Galaxy Generation (Using AduScript Pipeline)
fn createParticleVortex(count) {
  let geo = new THREE.BufferGeometry()
  let positions = new Float32Array(count * 3)
  let colors = new Float32Array(count * 3)
  let color1 = new THREE.Color(0x38bdf8)
  let color2 = new THREE.Color(0xa855f7)

  for i in 0..count {
    let i3 = i * 3
    let radius = Math.random() * 8 + 2.5
    let theta = Math.random() * Math.PI * 2
    let spiral = radius * 0.6 + theta

    positions[i3] = Math.cos(spiral) * radius
    positions[i3 + 1] = (Math.random() - 0.5) * 3.5
    positions[i3 + 2] = Math.sin(spiral) * radius

    let mixedColor = color1.clone().lerp(color2, radius / 10.5)
    colors[i3] = mixedColor.r
    colors[i3 + 1] = mixedColor.g
    colors[i3 + 2] = mixedColor.b
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))

  let mat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  })

  return new THREE.Points(geo, mat)
}

let particles = createParticleVortex(pointCount.value)
scene.add(particles)

// 7. Interactive Mouse / Pointer Tracking
let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }
window.addEventListener("pointermove", (e) -> {
  mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1
  mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1
})

// 8. Reactive Effects & Watchers
watch activeGeometry => {
  scene.remove(mainMesh)
  mainMesh.geometry.dispose()
  mainMesh.geometry = createGeometry(activeGeometry.value)
  scene.add(mainMesh)
}

watch wireframe => {
  mainMaterial.wireframe = wireframe.value
}

// 9. Main Animation Loop
mut clock = new THREE.Clock()

fn animate() {
  requestAnimationFrame(animate)

  let delta = clock.getDelta()
  let elapsed = clock.getElapsedTime()

  // Smooth lerp mouse
  mouse.x += (mouse.targetX - mouse.x) * 0.05
  mouse.y += (mouse.targetY - mouse.y) * 0.05

  // Animate main geometric mesh
  let rotSpeed = speed.value * delta
  mainMesh.rotation.x += rotSpeed * 0.6
  mainMesh.rotation.y += rotSpeed * 0.8
  mainMesh.rotation.z += rotSpeed * 0.2

  // Interactive tilting
  mainMesh.position.x = mouse.x * 0.8
  mainMesh.position.y = mouse.y * 0.8

  // Particle vortex rotation
  particles.rotation.y += 0.003 * particleSpeed.value
  particles.rotation.z = Math.sin(elapsed * 0.2) * 0.1

  // Dynamic light pulsation
  primaryLight.intensity = 3.5 + Math.sin(elapsed * 3) * 1.5
  secondaryLight.intensity = 2.5 + Math.cos(elapsed * 2.5) * 1.0

  // Render Frame
  renderer.render(scene, camera)
}

// 10. Window Resize Handling
window.addEventListener("resize", () -> {
  let w = container.clientWidth || window.innerWidth
  let h = container.clientHeight || window.innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
})

// Start 3D Loop
animate()

console.log("🚀 AduScript 3D Three.js Scene initialized with full reactivity and zero boilerplate!")
