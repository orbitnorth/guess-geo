# 3D Concepts & Three.js Architecture in GeoGuess Globe

This document provides a concise overview of the 3D computer graphics, WebGL concepts, and Three.js techniques used in the **GeoGuess Globe** project.

---

## 1. WebGL & Scene Pipeline

All 3D logic is encapsulated inside `src/game/GlobeEngine.js`, decoupling rendering performance from React component re-renders.

```javascript
// High-performance WebGL renderer with ACES filmic tone mapping
this.renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
})
this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
this.renderer.outputColorSpace = THREE.SRGBColorSpace
this.renderer.toneMapping = THREE.ACESFilmicToneMapping
this.renderer.toneMappingExposure = 1.18
```

- **Perspective Camera**: `THREE.PerspectiveCamera(42, width / height, 0.1, 600)` provides a natural field of view.
- **OrbitControls**: Features inertial damping (`dampingFactor = 0.07`), clamped zoom distances (`10` to `40`), locked polar angles to prevent pole inversions, and subtle auto-rotation when idle.

---

## 2. Globe Mesh & Multi-Texture System

The planet is a sphere geometry mapped with high-resolution equirectangular textures:

```javascript
// Globe Sphere: 5 units radius with 72x72 segments for high spherical fidelity
this.globe = new THREE.Mesh(
  new THREE.SphereGeometry(GLOBE_RADIUS, 72, 72),
  this.globeMaterial
)
```

### Dynamic Texture Swapping & Anisotropic Filtering
Textures are loaded via `THREE.TextureLoader()`, cached in a `Map`, and configured with anisotropic filtering for crisp continental textures at grazing angles:

```javascript
const earthTexture = textureLoader.load(config.url, (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
})
```
Three visual presets are supported on-the-fly without rebuilding the scene:
1. **Day Satellite** (`earth-day.jpg`)
2. **NASA Blue Marble** (`earth-blue-marble.jpg`)
3. **Cartographic Atlas** (`earth-atlas.jpg`)

---

## 3. Atmospheric Glow with Custom GLSL Shaders

Surrounding the globe is an atmosphere mesh scaled to `1.14x` the globe radius, rendered with a custom GLSL Fresnel rim shader:

```javascript
function makeAtmosphereMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0x8fd9ff) },
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
        // Fresnel rim equation based on angle between surface normal and view ray
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
```

---

## 4. 3-Point Lighting Rig

To ensure every continent is clearly visible while rotating without harsh black shadows:
- **Ambient Light**: `AmbientLight(0xffffff, 1.3)` fills deep shadowed regions.
- **Hemisphere Light**: `HemisphereLight(0xffffff, 0xcbe8ff, 0.9)` simulates sky-to-ground natural bounce.
- **Dual Directional Suns**: Opposing lights placed at `(10, 8, 10)` and `(-10, -8, -10)` illuminate both hemispheres.
- **Camera Fill Light**: A `DirectionalLight(0xffffff, 1.1)` parented directly to the camera acts as a directional headlight following the player's view.

---

## 5. Spherical Math & Coordinate Mapping

Latitude ($-90^\circ$ to $+90^\circ$) and Longitude ($-180^\circ$ to $+180^\circ$) are translated to 3D Cartesian coordinates (`Vector3`):

```javascript
// src/game/geo.js
export function latLonToVector3(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lon + 180)

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}
```

Great-circle distance between two pins is calculated using the **Haversine formula** ($R = 6,371\text{ km}$):
$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta\text{lon}}{2}\right)}\right)$$

---

## 6. Raycasting & Interactive Pin Dropping

When the player clicks or drags across the globe, screen pixels are unprojected into 3D world space:

```javascript
// Pointer coordinates normalized between -1.0 and +1.0
this.raycaster.setFromCamera(this.pointer, this.camera)
const intersects = this.raycaster.intersectObject(this.globe, false)

if (intersects.length > 0) {
  const localPoint = this.globe.worldToLocal(intersects[0].point.clone())
  const { lat, lon } = vector3ToLatLon(localPoint)
  this.callbacks.onPick?.({ lat, lon })
}
```

---

## 7. 3D Flags & Procedural Cloth Wave Animation

Pins are composite `THREE.Group` objects made of 4 geometries:
1. **Pole**: `CylinderGeometry(0.024, 0.024, 1.0, 8)`
2. **Finial**: `SphereGeometry(0.055, 14, 14)`
3. **Anchor Ring**: `RingGeometry(0.11, 0.145, 36)`
4. **Cloth**: `PlaneGeometry(0.66, 0.42, 12, 5)`

### Surface Alignment via Quaternion
The pin's Y-axis is aligned to the sphere normal using:
```javascript
flag.position.copy(position)
flag.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), position.clone().normalize())
```

### Real-Time Cloth Wave
Every frame, the flag's vertex positions are displaced with a propagating sine wave:
```javascript
function waveFlag(flag, time) {
  const position = flag.userData.cloth.geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const z = Math.sin(x * 11 - time * 5.5) * 0.05 * (x / FLAG_W)
    position.setZ(i, z)
  }
  position.needsUpdate = true
}
```

---

## 8. Animated Geodesic 3D Arcs

Connecting the guess pin to the actual answer pin is a 3D curved tube that vaults above the surface:

```javascript
// Elevated midpoint trajectory
const points = []
for (let i = 0; i <= 64; i++) {
  const t = i / 64
  const point = start.clone().lerp(end, t).normalize()
    .multiplyScalar(GLOBE_RADIUS + 0.06 + Math.sin(Math.PI * t) * maxHeight)
  points.push(point)
}

const curve = new THREE.CatmullRomCurve3(points)
const geometry = new THREE.TubeGeometry(curve, 90, 0.038, 8, false)
// Progressive draw range animation from 0% to 100%
geometry.setDrawRange(0, count)
```

---

## 9. Dynamic Cinematic Camera Flights

When revealing the results:
- **SLERP (Spherical Linear Interpolation)**: The camera smoothly rotates across the sphere surface toward the midpoint between pins.
- **Adaptive Framing**: The camera distance scales based on the angular separation between the guess and answer pins, ensuring both flags remain visible within the viewport.
