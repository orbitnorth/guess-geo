import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { latLonToVector3, vector3ToLatLon } from './geo'

// ---------------------------------------------------------------------
//  GLOBE ENGINE
//  All Three.js work lives here so the React components can stay focused
//  on the interface. The engine exposes a tiny imperative API:
//
//    setInteractive(true)   allow pin drops
//    setGuess(lat, lon)     place / move the player's flag
//    reveal(location)       answer flag + arc + fly-to animation
//    startRound()           clear the board and return the camera home
//    zoom(factor)           step the camera in / out
//    resetView()            fly back to the opening shot
//
//  Callbacks: onPick({lat, lon}), onRevealComplete(), onFlagScreen(info)
// ---------------------------------------------------------------------

const GLOBE_RADIUS = 5
const FLAG_POLE_HEIGHT = 1
const FLAG_W = 0.66
const FLAG_H = 0.42
const FLAG_SCALE = 0.85

const POP_TIME = 0.55
const DRAW_TIME = 1.5
const DOT_TIME = 2.2

const COLORS = {
  guess: 0xff4b4b,
  answer: 0x58cc02,
  arc: 0xffc800,
  hover: 0xffffff,
  atmosphere: 0x8fd9ff,
  p1: 0x1cb0f6,
  p2: 0xff4b4b,
}

export const GLOBE_TEXTURES = {
  day: {
    id: 'day',
    name: 'Day Satellite',
    description: 'Vibrant natural daylight photography',
    url: 'https://unpkg.com/three-globe/example/img/earth-day.jpg',
    atmosphereColor: 0x8fd9ff,
    atmosphereIntensity: 0.55,
  },
  night: {
    id: 'night',
    name: 'Night Lights',
    description: 'Illuminated city networks & dark oceans',
    url: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
    atmosphereColor: 0x4da8ff,
    atmosphereIntensity: 0.65,
  },
  dark: {
    id: 'dark',
    name: 'Dark Minimal',
    description: 'High-contrast midnight aesthetic',
    url: 'https://unpkg.com/three-globe/example/img/earth-dark.jpg',
    atmosphereColor: 0x38bdf8,
    atmosphereIntensity: 0.45,
  },
}

const Y_AXIS = new THREE.Vector3(0, 1, 0)
const Z_AXIS = new THREE.Vector3(0, 0, 1)

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutBack(t) {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function createFlag(color) {
  const flag = new THREE.Group()
  const visual = new THREE.Group()
  visual.scale.setScalar(FLAG_SCALE)

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, FLAG_POLE_HEIGHT, 8),
    new THREE.MeshStandardMaterial({ color: 0xf3f6ff, metalness: 0.35, roughness: 0.35 }),
  )
  pole.position.y = FLAG_POLE_HEIGHT / 2
  visual.add(pole)

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 14, 14),
    new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.7, roughness: 0.25 }),
  )
  ball.position.y = FLAG_POLE_HEIGHT
  visual.add(ball)

  const clothGeometry = new THREE.PlaneGeometry(FLAG_W, FLAG_H, 12, 5)
  clothGeometry.translate(FLAG_W / 2, FLAG_POLE_HEIGHT - FLAG_H / 2 - 0.05, 0)

  const cloth = new THREE.Mesh(
    clothGeometry,
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
  )
  visual.add(cloth)

  // A ring at the base anchors the flag to the surface and reads clearly
  // from a distance.
  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.11, 0.145, 36),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  baseRing.quaternion.setFromUnitVectors(Z_AXIS, Y_AXIS)
  baseRing.position.y = 0.004
  visual.add(baseRing)

  flag.add(visual)
  flag.userData.cloth = cloth
  return flag
}

function placeFlag(flag, lat, lon) {
  const position = latLonToVector3(lat, lon, GLOBE_RADIUS)
  flag.position.copy(position)
  flag.quaternion.setFromUnitVectors(Y_AXIS, position.clone().normalize())
}

function waveFlag(flag, time) {
  const geometry = flag.userData.cloth.geometry
  const position = geometry.attributes.position

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const z = Math.sin(x * 11 - time * 5.5) * 0.05 * (x / FLAG_W)
    position.setZ(i, z)
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
}

function createArc(lat1, lon1, lat2, lon2, color = COLORS.arc) {
  const start = latLonToVector3(lat1, lon1, 1)
  const end = latLonToVector3(lat2, lon2, 1)

  const angle = start.angleTo(end)
  const maxHeight = Math.min(0.18 + angle * 0.85, 2.1)

  const points = []
  const steps = 64
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const point = start
      .clone()
      .lerp(end, t)
      .normalize()
      .multiplyScalar(GLOBE_RADIUS + 0.06 + Math.sin(Math.PI * t) * maxHeight)
    points.push(point)
  }

  const curve = new THREE.CatmullRomCurve3(points)
  const coreGeometry = new THREE.TubeGeometry(curve, 90, 0.038, 8, false)
  const glowGeometry = new THREE.TubeGeometry(curve, 90, 0.11, 8, false)

  const core = new THREE.Mesh(
    coreGeometry,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
  )
  const glow = new THREE.Mesh(
    glowGeometry,
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )

  const group = new THREE.Group()
  group.add(glow, core)
  group.userData.curve = curve
  group.userData.meshes = [core, glow]

  coreGeometry.setDrawRange(0, 0)
  glowGeometry.setDrawRange(0, 0)

  return group
}

function createDot() {
  const group = new THREE.Group()

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  )
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffe6a3,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )

  group.add(core, halo)
  return group
}

function disposeObject(object) {
  if (!object) return
  if (object.parent) object.parent.remove(object)
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => material.dispose())
    }
  })
}

function makeAtmosphereMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(COLORS.atmosphere) },
      intensity: { value: 0.55 },
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float intensity;
      varying vec3 vNormal;
      void main() {
        float rim = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
        gl_FragColor = vec4(glowColor, 1.0) * clamp(rim * intensity, 0.0, 1.0);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
}

export class GlobeEngine {
  constructor(container, callbacks = {}) {
    this.container = container
    this.callbacks = callbacks

    this.guess = null
    this.roundFinished = false
    this.interactive = false
    this.elapsed = 0
    this.flight = null
    this.raf = 0

    this.guessFlag = null
    this.answerFlag = null
    this.arc = null
    this.travelDot = null

    this.duelFlags = []
    this.duelArcs = []
    this.duelDots = []

    this.resultTime = 0
    this.resultAnimating = false
    this.revealNotified = false

    this.pointer = new THREE.Vector2()
    this.raycaster = new THREE.Raycaster()
    this.clock = new THREE.Timer()

    this._flagBase = new THREE.Vector3()
    this._flagTop = new THREE.Vector3()
    this._toCamera = new THREE.Vector3()

    this.downX = 0
    this.downY = 0

    this.textureCache = new Map()
    this.currentTextureKey = this.callbacks.initialTexture || 'day'

    this.buildScene()
    this.buildHoverRing()
    this.bindEvents()

    this.tick = this.tick.bind(this)
    this.raf = requestAnimationFrame(this.tick)
  }

  // ------------------------------------------------------------------
  //  SCENE SETUP
  // ------------------------------------------------------------------
  buildScene() {
    const width = this.container.clientWidth || window.innerWidth
    const height = this.container.clientHeight || window.innerHeight

    this.scene = new THREE.Scene()
    this.scene.background = null

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 600)
    this.homePosition = this.getHomePosition()
    this.camera.position.copy(this.homePosition)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setSize(width, height)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.18
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.outline = 'none'
    this.container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.07
    this.controls.rotateSpeed = 0.55
    this.controls.zoomSpeed = 0.8
    this.controls.minDistance = 10
    this.controls.maxDistance = 40
    this.controls.enablePan = false
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 0.35
    this.controls.minPolarAngle = 0.15
    this.controls.maxPolarAngle = Math.PI - 0.15
    this.controls.addEventListener('start', () => {
      this.flight = null
      this.controls.autoRotate = false
    })

    this.scene.add(this.camera)
    const cameraLight = new THREE.DirectionalLight(0xffffff, 1.1)
    cameraLight.position.set(0, 0, 1)
    this.camera.add(cameraLight)

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.3))
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xcbe8ff, 0.9))

    const sunFront = new THREE.DirectionalLight(0xffffff, 0.85)
    sunFront.position.set(10, 8, 10)
    this.scene.add(sunFront)

    const sunBack = new THREE.DirectionalLight(0xffffff, 0.85)
    sunBack.position.set(-10, -8, -10)
    this.scene.add(sunBack)

    this.buildGlobe()

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.container)
  }

  buildGlobe() {
    const initialKey = this.currentTextureKey || 'day'
    const config = GLOBE_TEXTURES[initialKey] || GLOBE_TEXTURES.day
    const textureLoader = new THREE.TextureLoader()

    const earthTexture = textureLoader.load(
      config.url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
        this.textureCache.set(config.url, texture)
      },
      undefined,
      () => {
        // If the texture cannot load the globe still stays visible.
        this.globe.material.map = null
        this.globe.material.color.set(0x3cc6f7)
        this.globe.material.needsUpdate = true
      },
    )

    this.globeMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.0,
    })

    this.globe = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS, 72, 72),
      this.globeMaterial,
    )
    this.scene.add(this.globe)

    this.atmosphereMaterial = makeAtmosphereMaterial()
    if (config.atmosphereColor) {
      this.atmosphereMaterial.uniforms.glowColor.value.set(config.atmosphereColor)
    }
    if (config.atmosphereIntensity) {
      this.atmosphereMaterial.uniforms.intensity.value = config.atmosphereIntensity
    }

    this.atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.14, 64, 64),
      this.atmosphereMaterial,
    )
    this.scene.add(this.atmosphere)

    // A pale outline keeps the globe crisp against the bright sky.
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.21, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0xbfeaff,
        transparent: true,
        opacity: 0.05,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    this.scene.add(halo)
  }

  setTexture(key = 'day') {
    const config = GLOBE_TEXTURES[key] || GLOBE_TEXTURES.day
    this.currentTextureKey = key

    if (this.textureCache.has(config.url)) {
      const cached = this.textureCache.get(config.url)
      if (this.globeMaterial) {
        this.globeMaterial.map = cached
        this.globeMaterial.needsUpdate = true
      }
    } else {
      const loader = new THREE.TextureLoader()
      loader.load(
        config.url,
        (loaded) => {
          loaded.colorSpace = THREE.SRGBColorSpace
          if (this.renderer) {
            loaded.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
          }
          this.textureCache.set(config.url, loaded)
          if (this.currentTextureKey === key && this.globeMaterial) {
            this.globeMaterial.map = loaded
            this.globeMaterial.needsUpdate = true
          }
        },
        undefined,
        (err) => {
          console.warn('Failed to load globe texture:', config.url, err)
        },
      )
    }

    if (this.atmosphereMaterial && this.atmosphereMaterial.uniforms) {
      if (config.atmosphereColor) {
        this.atmosphereMaterial.uniforms.glowColor.value.set(config.atmosphereColor)
      }
      if (config.atmosphereIntensity) {
        this.atmosphereMaterial.uniforms.intensity.value = config.atmosphereIntensity
      }
    }
  }

  buildHoverRing() {
    this.hoverRing = new THREE.Group()

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.055, 0.083, 32),
      new THREE.MeshBasicMaterial({
        color: COLORS.hover,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.016, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    this.hoverRing.add(ring, dot)
    this.hoverRing.visible = false
    this.globe.add(this.hoverRing)
  }

  getHomePosition() {
    const width = this.container.clientWidth || window.innerWidth
    const height = this.container.clientHeight || window.innerHeight
    const aspect = width / Math.max(height, 1)
    const distance = aspect < 0.8 ? 28 : aspect < 1.15 ? 26 : 23.5
    return new THREE.Vector3(0.9, 2.2, distance)
  }

  // ------------------------------------------------------------------
  //  PUBLIC API
  // ------------------------------------------------------------------
  setInteractive(value) {
    this.interactive = Boolean(value)
    this.renderer.domElement.style.cursor = this.interactive ? 'crosshair' : 'default'
    if (!this.interactive) this.hoverRing.visible = false
  }

  setGuess(lat, lon) {
    this.guess = { lat, lon }

    if (!this.guessFlag) {
      this.guessFlag = createFlag(COLORS.guess)
      this.globe.add(this.guessFlag)
    }

    placeFlag(this.guessFlag, lat, lon)
    this.guessFlag.scale.setScalar(0.0001)
    this.guessFlag.userData.plantStart = this.elapsed
    this.guessFlag.visible = true
    this.hoverRing.visible = false
  }

  startRound() {
    this.clearMarkers()
    this.guess = null
    this.roundFinished = false
    this.interactive = true
    this.controls.autoRotate = false
    this.hoverRing.visible = false
    this.setHintCursor()
    this.flyTo(this.getHomePosition(), 1)
  }

  reveal(location) {
    if (!this.guess || !location) return

    this.roundFinished = true
    this.hoverRing.visible = false
    this.renderer.domElement.style.cursor = 'default'

    this.answerFlag = createFlag(COLORS.answer)
    placeFlag(this.answerFlag, location.lat, location.lon)
    this.answerFlag.scale.setScalar(0.0001)
    this.globe.add(this.answerFlag)

    this.arc = createArc(this.guess.lat, this.guess.lon, location.lat, location.lon)
    this.globe.add(this.arc)

    this.travelDot = createDot()
    this.travelDot.visible = false
    this.globe.add(this.travelDot)

    this.resultTime = 0
    this.resultAnimating = true
    this.revealNotified = false

    // Vectors to both pins on the unit sphere
    const a = latLonToVector3(this.guess.lat, this.guess.lon, 1)
    const b = latLonToVector3(location.lat, location.lon, 1)

    // Angular distance between pins in radians [0..PI]
    const angle = a.angleTo(b)

    // Calculate midpoint on unit sphere so camera faces the exact center between pins
    let mid = a.clone().add(b)
    if (mid.lengthSq() < 0.0001) {
      mid = a.clone().cross(Y_AXIS)
    }
    mid.normalize()

    // Prevent pole gimbal lock if pins are at exact north/south pole
    if (Math.abs(mid.y) > 0.985) {
      mid.x += mid.x >= 0 ? 0.04 : -0.04
      mid.normalize()
    }

    // Dynamic zoom distance tuned to frame the distance between pins clearly:
    // - Close guesses (e.g. < 500 km, angle < 0.08): camera zooms in close (~10.5)
    //   so both pins, the gap, and the connecting arc are large and crystal clear!
    // - Medium distance (~2,000 km, angle ~ 0.3): camera is at ~13.5
    // - Continental (~5,000 km, angle ~ 0.8): camera is at ~17.5
    // - Global span (> 10,000 km): camera zooms out to ~22 - 24 to comfortably fit both
    const spanFactor = Math.sin(angle * 0.5)
    const arcHeight = Math.min(0.18 + angle * 0.85, 2.1)
    const targetDistance = THREE.MathUtils.clamp(
      10.2 + spanFactor * 12.0 + (angle / Math.PI) * 2.5 + arcHeight * 0.8,
      10.2,
      24.5,
    )

    // Fly to face the midpoint directly with the optimal zoom
    this.flyTo(mid.multiplyScalar(targetDistance), 1.6)
  }

  revealDuel({ p1, p2, location }) {
    if (!p1 || !p2 || !location) return

    this.roundFinished = true
    this.hoverRing.visible = false
    this.renderer.domElement.style.cursor = 'default'

    this.clearMarkers()

    // 1. Player 1 Flag (Blue default)
    const p1Color = p1.color || COLORS.p1
    const p1Flag = createFlag(p1Color)
    placeFlag(p1Flag, p1.lat, p1.lon)
    this.globe.add(p1Flag)

    // 2. Player 2 Flag (Coral/Red default)
    const p2Color = p2.color || COLORS.p2
    const p2Flag = createFlag(p2Color)
    placeFlag(p2Flag, p2.lat, p2.lon)
    p2Flag.scale.setScalar(0.0001)
    this.globe.add(p2Flag)

    // 3. Target Answer Flag (Green)
    const answerFlag = createFlag(COLORS.answer)
    placeFlag(answerFlag, location.lat, location.lon)
    answerFlag.scale.setScalar(0.0001)
    this.globe.add(answerFlag)

    // 4. Arcs from both players toward the answer
    const arc1 = createArc(p1.lat, p1.lon, location.lat, location.lon, p1Color)
    const arc2 = createArc(p2.lat, p2.lon, location.lat, location.lon, p2Color)
    this.globe.add(arc1)
    this.globe.add(arc2)

    // 5. Travel dots
    const dot1 = createDot()
    const dot2 = createDot()
    dot1.visible = false
    dot2.visible = false
    this.globe.add(dot1)
    this.globe.add(dot2)

    this.duelFlags = [p1Flag, p2Flag, answerFlag]
    this.duelArcs = [arc1, arc2]
    this.duelDots = [dot1, dot2]
    this.answerFlag = answerFlag

    this.resultTime = 0
    this.resultAnimating = true
    this.revealNotified = false

    // Camera framing for all 3 coordinates
    const v1 = latLonToVector3(p1.lat, p1.lon, 1)
    const v2 = latLonToVector3(p2.lat, p2.lon, 1)
    const vAns = latLonToVector3(location.lat, location.lon, 1)

    let mid = v1.clone().add(v2).add(vAns)
    if (mid.lengthSq() < 0.0001) {
      mid = vAns.clone()
    }
    mid.normalize()

    if (Math.abs(mid.y) > 0.985) {
      mid.x += mid.x >= 0 ? 0.04 : -0.04
      mid.normalize()
    }

    const a12 = v1.angleTo(v2)
    const a1Ans = v1.angleTo(vAns)
    const a2Ans = v2.angleTo(vAns)
    const maxAngle = Math.max(a12, a1Ans, a2Ans)

    const spanFactor = Math.sin(maxAngle * 0.5)
    const arcHeight = Math.min(0.18 + maxAngle * 0.85, 2.1)
    const targetDistance = THREE.MathUtils.clamp(
      11.0 + spanFactor * 13.5 + (maxAngle / Math.PI) * 3.0 + arcHeight * 0.9,
      11.0,
      26.0,
    )

    this.flyTo(mid.multiplyScalar(targetDistance), 1.6)
  }

  clearMarkers() {
    disposeObject(this.guessFlag)
    disposeObject(this.answerFlag)
    disposeObject(this.arc)
    disposeObject(this.travelDot)
    this.guessFlag = null
    this.answerFlag = null
    this.arc = null
    this.travelDot = null

    if (this.duelFlags) {
      this.duelFlags.forEach((flag) => disposeObject(flag))
      this.duelFlags = []
    }
    if (this.duelArcs) {
      this.duelArcs.forEach((arc) => disposeObject(arc))
      this.duelArcs = []
    }
    if (this.duelDots) {
      this.duelDots.forEach((dot) => disposeObject(dot))
      this.duelDots = []
    }

    this.resultAnimating = false
    this.revealNotified = false
  }

  setHintCursor() {
    if (this.interactive) this.renderer.domElement.style.cursor = 'crosshair'
  }

  zoom(factor) {
    const distance = this.camera.position.length()
    const next = THREE.MathUtils.clamp(
      distance * factor,
      this.controls.minDistance,
      this.controls.maxDistance,
    )
    this.camera.position.setLength(next)
    this.controls.update()
  }

  resetView() {
    this.flyTo(this.getHomePosition(), 1.1)
  }

  flyTo(target, duration = 1.4) {
    this.controls.autoRotate = false

    const from = this.camera.position.clone()
    const fromLen = from.length()
    const fromDir = from.clone().normalize()

    const to = target.clone()
    const toLen = to.length()
    const toDir = to.clone().normalize()

    // Spherical orientation quaternions from Z_AXIS (0,0,1) to directions
    const qFrom = new THREE.Quaternion().setFromUnitVectors(Z_AXIS, fromDir)
    const qTo = new THREE.Quaternion().setFromUnitVectors(Z_AXIS, toDir)

    this.flight = {
      qFrom,
      qTo,
      fromLen,
      toLen,
      t: 0,
      duration,
    }
  }

  // ------------------------------------------------------------------
  //  EVENTS
  // ------------------------------------------------------------------
  bindEvents() {
    const canvas = this.renderer.domElement

    this.onPointerDown = (event) => {
      this.downX = event.clientX
      this.downY = event.clientY
    }

    this.onPointerUp = (event) => {
      if (event.button !== undefined && event.button !== 0) return
      const moved = Math.hypot(event.clientX - this.downX, event.clientY - this.downY)
      if (moved > 6) return
      if (!this.interactive || this.roundFinished) return

      const hit = this.raycastGlobe(event)
      if (!hit) return

      const localPoint = this.globe.worldToLocal(hit.point.clone())
      const { lat, lon } = vector3ToLatLon(localPoint)
      this.callbacks.onPick?.({ lat, lon })
    }

    this.onPointerMove = (event) => {
      if (event.pointerType === 'touch') return
      if (!this.interactive || this.roundFinished) {
        this.hoverRing.visible = false
        return
      }

      const hit = this.raycastGlobe(event)
      if (!hit) {
        this.hoverRing.visible = false
        canvas.style.cursor = 'default'
        return
      }

      const normal = hit.point.clone().normalize()
      this.hoverRing.position.copy(normal).multiplyScalar(GLOBE_RADIUS + 0.012)
      this.hoverRing.quaternion.setFromUnitVectors(Z_AXIS, normal)
      this.hoverRing.visible = true
      canvas.style.cursor = 'crosshair'
    }

    this.onPointerLeave = () => {
      this.hoverRing.visible = false
    }

    this.onPointerDownCursor = () => {
      canvas.style.cursor = 'grabbing'
    }

    this.onPointerUpCursor = () => {
      canvas.style.cursor = this.interactive ? 'crosshair' : 'default'
    }

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointerdown', this.onPointerDownCursor)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointerup', this.onPointerUpCursor)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerleave', this.onPointerLeave)
  }

  raycastGlobe(event) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObject(this.globe, false)
    return hits[0] ?? null
  }

  // ------------------------------------------------------------------
  //  FRAME LOOP
  // ------------------------------------------------------------------
  tick() {
    this.raf = requestAnimationFrame(this.tick)

    this.clock.update(performance.now())
    const delta = Math.min(this.clock.getDelta(), 0.25)
    this.elapsed += delta

    this.updateFlight(delta)
    this.controls.update()
    this.updateFlags()
    this.updateHover()
    this.updateReveal(delta)

    this.reportFlagScreen()
    this.renderer.render(this.scene, this.camera)
  }

  updateFlight(delta) {
    if (!this.flight) return

    this.flight.t = Math.min(this.flight.t + delta / this.flight.duration, 1)
    const t = easeInOutCubic(this.flight.t)

    // Spherical great-circle rotation (slerp) to look directly at the midpoint
    const currentQ = new THREE.Quaternion().slerpQuaternions(
      this.flight.qFrom,
      this.flight.qTo,
      t,
    )
    const currentDir = Z_AXIS.clone().applyQuaternion(currentQ).normalize()

    // Smoothly interpolate distance with a gentle outward lift during flight
    const lift = Math.sin(t * Math.PI) * Math.min(this.flight.fromLen, this.flight.toLen) * 0.08
    const currentDist = THREE.MathUtils.lerp(this.flight.fromLen, this.flight.toLen, t) + lift

    this.camera.position.copy(currentDir).multiplyScalar(currentDist)
    this.camera.lookAt(0, 0, 0)
    this.controls.target.set(0, 0, 0)

    if (this.flight.t >= 1) {
      this.flight = null
    }
  }

  updateFlags() {
    const flagsToWave = [this.guessFlag, this.answerFlag, ...this.duelFlags].filter(Boolean)
    flagsToWave.forEach((flag) => {
      waveFlag(flag, this.elapsed)
    })

    if (this.guessFlag && this.guessFlag.userData.plantStart !== undefined) {
      const t = Math.min((this.elapsed - this.guessFlag.userData.plantStart) / 0.38, 1)
      this.guessFlag.scale.setScalar(Math.max(0.0001, easeOutBack(t)))
    }
  }

  updateHover() {
    if (!this.hoverRing.visible) return
    const pulse = 1 + Math.sin(this.elapsed * 5) * 0.07
    this.hoverRing.scale.setScalar(pulse)
    const ring = this.hoverRing.children[0]
    if (ring) ring.material.opacity = 0.55 + Math.sin(this.elapsed * 5) * 0.2
  }

  updateReveal(delta) {
    if (!this.resultAnimating) return

    this.resultTime += delta

    const popT = Math.min(this.resultTime / POP_TIME, 1)
    if (this.answerFlag) {
      this.answerFlag.scale.setScalar(Math.max(0.0001, easeOutBack(popT)))
    }
    // In duel mode, also pop in the second player's flag (p2)
    if (this.duelFlags && this.duelFlags[1]) {
      this.duelFlags[1].scale.setScalar(Math.max(0.0001, easeOutBack(popT)))
    }

    const drawT = Math.min(Math.max((this.resultTime - POP_TIME) / DRAW_TIME, 0), 1)
    const fraction = easeOutCubic(drawT)

    const activeArcs = this.duelArcs.length ? this.duelArcs : this.arc ? [this.arc] : []
    activeArcs.forEach((arc) => {
      arc.userData.meshes.forEach((mesh) => {
        const indexCount = mesh.geometry.index.count
        const visible = Math.ceil((fraction * indexCount) / 3) * 3
        mesh.geometry.setDrawRange(0, visible)
      })
    })

    if (drawT >= 1) {
      const dotT = ((this.resultTime - POP_TIME - DRAW_TIME) % DOT_TIME) / DOT_TIME
      if (this.duelArcs.length && this.duelDots.length) {
        this.duelDots.forEach((dot, idx) => {
          const arc = this.duelArcs[idx]
          if (arc) {
            dot.position.copy(arc.userData.curve.getPoint(dotT))
            dot.visible = true
            dot.scale.setScalar(1 + Math.sin(this.elapsed * 8) * 0.08)
          }
        })
      } else if (this.travelDot && this.arc) {
        this.travelDot.position.copy(this.arc.userData.curve.getPoint(dotT))
        this.travelDot.visible = true
        this.travelDot.scale.setScalar(1 + Math.sin(this.elapsed * 8) * 0.08)
      }
    }

    if (!this.revealNotified && this.resultTime >= POP_TIME + DRAW_TIME + 0.1) {
      this.revealNotified = true
      this.callbacks.onRevealComplete?.()
    }
  }

  reportFlagScreen() {
    const callback = this.callbacks.onFlagScreen
    if (!callback) return

    if (!this.guessFlag || this.roundFinished) {
      callback(null)
      return
    }

    this.guessFlag.getWorldPosition(this._flagBase)

    const normal = this._flagBase.clone().normalize()
    this._toCamera.copy(this.camera.position).sub(this._flagBase).normalize()
    const facingCamera = normal.dot(this._toCamera) > 0.02

    this._flagTop.set(0, FLAG_POLE_HEIGHT * FLAG_SCALE + 0.14, 0)
    this.guessFlag.localToWorld(this._flagTop)
    this._flagTop.project(this.camera)

    const rect = this.renderer.domElement.getBoundingClientRect()
    const x = rect.left + (this._flagTop.x * 0.5 + 0.5) * rect.width
    const y = rect.top + (-this._flagTop.y * 0.5 + 0.5) * rect.height
    const onScreen = this._flagTop.x > -1.1 && this._flagTop.x < 1.1 && this._flagTop.y > -1.1 && this._flagTop.y < 1.1

    callback({
      x,
      y,
      visible: facingCamera && onScreen && this._flagTop.z < 1,
    })
  }

  resize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    if (!width || !height) return

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  // ------------------------------------------------------------------
  //  CLEANUP
  // ------------------------------------------------------------------
  dispose() {
    cancelAnimationFrame(this.raf)
    this.resizeObserver?.disconnect()

    const canvas = this.renderer.domElement
    canvas.removeEventListener('pointerdown', this.onPointerDown)
    canvas.removeEventListener('pointerdown', this.onPointerDownCursor)
    canvas.removeEventListener('pointerup', this.onPointerUp)
    canvas.removeEventListener('pointerup', this.onPointerUpCursor)
    canvas.removeEventListener('pointermove', this.onPointerMove)
    canvas.removeEventListener('pointerleave', this.onPointerLeave)

    this.controls?.dispose()

    this.scene.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((material) => {
          if (material.map) material.map.dispose()
          material.dispose()
        })
      }
    })

    this.renderer.dispose()
    this.renderer.forceContextLoss?.()
    this.renderer.domElement.remove()

    this.textureCache.forEach((tex) => tex.dispose())
    this.textureCache.clear()
  }
}
