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

function createArc(lat1, lon1, lat2, lon2) {
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
    new THREE.MeshBasicMaterial({ color: COLORS.arc, transparent: true, opacity: 0.95 }),
  )
  const glow = new THREE.Mesh(
    glowGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xffe28a,
      transparent: true,
      opacity: 0.16,
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

    this.resultTime = 0
    this.resultAnimating = false
    this.revealNotified = false

    this.pointer = new THREE.Vector2()
    this.raycaster = new THREE.Raycaster()
    this.clock = new THREE.Clock()

    this._flagBase = new THREE.Vector3()
    this._flagTop = new THREE.Vector3()
    this._toCamera = new THREE.Vector3()

    this.downX = 0
    this.downY = 0

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
    const textureLoader = new THREE.TextureLoader()
    const earthTexture = textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-day.jpg',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
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

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.14, 64, 64),
      makeAtmosphereMaterial(),
    )
    this.scene.add(atmosphere)

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

    // Face the midpoint between the pin and the answer, keeping the current
    // zoom level so the reveal never feels like a jump cut.
    const a = latLonToVector3(this.guess.lat, this.guess.lon, 1)
    const b = latLonToVector3(location.lat, location.lon, 1)
    let mid = a.clone().add(b)
    if (mid.lengthSq() < 0.0001) mid = a.clone().cross(Y_AXIS)
    mid.normalize()

    const distance = THREE.MathUtils.clamp(this.camera.position.length(), 17.5, 24)
    this.flyTo(mid.multiplyScalar(distance), 1.5)
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

  flyTo(target, duration = 1.2) {
    this.controls.autoRotate = false
    this.flight = {
      from: this.camera.position.clone(),
      to: target.clone(),
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

    // Clamp long pauses (tab switches) but keep the scene running at real
    // speed even on low frame rates.
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
    const eased = easeInOutCubic(this.flight.t)
    this.camera.position.lerpVectors(this.flight.from, this.flight.to, eased)

    if (this.flight.t >= 1) this.flight = null
  }

  updateFlags() {
    ;[this.guessFlag, this.answerFlag].forEach((flag) => {
      if (flag) waveFlag(flag, this.elapsed)
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
    this.answerFlag.scale.setScalar(Math.max(0.0001, easeOutBack(popT)))

    const drawT = Math.min(Math.max((this.resultTime - POP_TIME) / DRAW_TIME, 0), 1)
    const fraction = easeOutCubic(drawT)

    this.arc.userData.meshes.forEach((mesh) => {
      const indexCount = mesh.geometry.index.count
      const visible = Math.ceil((fraction * indexCount) / 3) * 3
      mesh.geometry.setDrawRange(0, visible)
    })

    if (drawT >= 1) {
      const dotT = ((this.resultTime - POP_TIME - DRAW_TIME) % DOT_TIME) / DOT_TIME
      this.travelDot.position.copy(this.arc.userData.curve.getPoint(dotT))
      this.travelDot.visible = true
      this.travelDot.scale.setScalar(1 + Math.sin(this.elapsed * 8) * 0.08)
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
  }
}
