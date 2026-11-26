# Three.js Concepts Used in the Geo Guesser

This guide explains every Three.js idea used in `game.js`, with small examples you can paste in and experiment with. Each section matches a numbered section in the code.

---

## 1. The Big Picture: Scene, Camera, Renderer

Every Three.js app needs three things:

| Piece | Analogy | Role |
|---|---|---|
| **Scene** | A film set | Holds all objects, lights, etc. |
| **Camera** | The film camera | Decides *what point of view* we see |
| **Renderer** | The film projector | Draws the camera's view onto a `<canvas>` |

```js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement); // the <canvas>

renderer.render(scene, camera); // draw ONE frame
```

**PerspectiveCamera arguments**

- `45`: field of view in degrees (bigger = more "wide angle")
- `width / height`: aspect ratio, so circles don't look like ovals
- `0.1`, `1000`: near and far clipping planes (nothing outside is drawn)

---

## 2. Coordinates

Three.js uses a 3D coordinate system:

- **x**: right
- **y**: up
- **z**: toward you (out of the screen)

```js
camera.position.set(0, 0, 15); // 15 units in front of the center
mesh.position.set(1, 2, 3);    // same as mesh.position.x = 1, etc.
```

Units are arbitrary: in our game 1 unit is just "a bit", and the globe has radius 5.

---

## 3. Mesh = Geometry + Material

Anything visible is a **Mesh**, built from two parts:

- **Geometry**: the shape (vertices and triangles)
- **Material**: the surface look (color, texture, shininess)

```js
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
```

In the game we use `SphereGeometry(radius, widthSegments, heightSegments)`. More segments make the sphere rounder but cost more performance.

### Common materials

| Material | Needs light? | Use for |
|---|---|---|
| `MeshBasicMaterial` | No | Flat colors, UI markers (our pins) |
| `MeshStandardMaterial` | Yes | Realistic surfaces (our globe) |
| `PointsMaterial` | No | Point clouds (our stars) |
| `LineBasicMaterial` | No | Lines (our result arc) |

---

## 4. Textures and UV Mapping

A **texture** is an image applied to a material.

```js
const texture = new THREE.TextureLoader().load("earth.jpg");
const material = new THREE.MeshStandardMaterial({ map: texture });
```

How does a flat image wrap around a sphere? Each vertex has **UV coordinates**: a `(u, v)` pair from 0 to 1 saying which pixel of the image belongs to it.

- `u` goes left → right (longitude, in our case)
- `v` goes bottom → top (latitude)

`SphereGeometry` generates these UVs for us, which is why an ordinary world map (equirectangular projection) fits perfectly.

---

## 5. Lights

`MeshStandardMaterial` calculates how light hits the surface. Without lights, it renders black.

```js
scene.add(new THREE.AmbientLight(0xffffff, 0.8));     // soft light from everywhere

const sun = new THREE.DirectionalLight(0xffffff, 0.6); // parallel rays, like the Sun
sun.position.set(10, 5, 10);
scene.add(sun);
```

Try changing the intensity (second argument) and watch the globe change.

---

## 6. The Scene Graph (Parent / Child)

Objects can be nested. A child moves, rotates and scales together with its parent.

```js
globe.add(pin);        // pin is now a child of globe
globe.rotation.y += 0.01; // the pin rotates with the globe!
```

In the game, pins and lines are children of the globe, so they stay on the correct spot on Earth even if the globe is rotated. Related helpers:

- `parent.add(child)` / `parent.remove(child)`
- `object.worldToLocal(vec)`: converts a world position into that object's own coordinates (used when saving where the user clicked)

---

## 7. Vector3

`THREE.Vector3` stores a 3D point or direction `(x, y, z)` and has many handy methods:

```js
const a = new THREE.Vector3(1, 0, 0);
const b = new THREE.Vector3(0, 1, 0);

a.clone();             // a copy (so we don't change the original)
a.length();            // distance from the origin
a.normalize();         // scale so length = 1
a.lerp(b, 0.5);        // point halfway between a and b
a.multiplyScalar(5);   // scale by 5
mesh.position.copy(a); // copy values into another object
```

Our arc between the two pins is built by repeating `lerp` (interpolate), then `normalize` + `multiplyScalar` to push each point back onto a sphere.

---

## 8. Latitude / Longitude <-> 3D (Spherical Coordinates)

A point on a sphere is described by two angles:

- **phi**: angle down from the north pole = `90 - latitude`
- **theta**: angle around the equator = `longitude + 180`

```js
x = -r * sin(phi) * cos(theta)
y =  r * cos(phi)
z =  r * sin(phi) * sin(theta)
```

The `+ 180` and the minus sign on `x` are there because `SphereGeometry` starts its texture at longitude -180. If your pins appear in the wrong place, this is the first thing to check.

Three.js also has `THREE.Spherical` if you want a built-in helper:

```js
const s = new THREE.Spherical(radius, phi, theta);
const v = new THREE.Vector3().setFromSpherical(s);
```

(Its axis convention differs slightly, so verify against your texture.)

`THREE.MathUtils.degToRad()` and `radToDeg()` convert between degrees and radians. Math functions work in radians.

---

## 9. Raycasting (Clicking on 3D Objects)

The mouse gives a 2D position, but we want a 3D location on the globe. A **Raycaster** casts an invisible ray from the camera through the mouse position and returns what it hits.

```js
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// 1. pixels -> normalized device coordinates (-1 to +1)
mouse.x =  (event.clientX / width)  * 2 - 1;
mouse.y = -(event.clientY / height) * 2 + 1;   // y is flipped

// 2. shoot the ray
raycaster.setFromCamera(mouse, camera);
const hits = raycaster.intersectObject(globe);

// 3. use the result
if (hits.length > 0) {
  console.log(hits[0].point);    // exact 3D point (closest hit first)
  console.log(hits[0].distance); // distance from camera
}
```

Use `intersectObjects([a, b, c])` to test several objects at once.

---

## 10. OrbitControls

An add-on that lets the user drag to rotate the camera around a target and scroll to zoom.

```js
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smooth inertia
controls.minDistance = 7;      // zoom limits
controls.maxDistance = 25;
controls.enablePan = false;    // disable right-click dragging

// in the animation loop:
controls.update();
```

Important: the camera moves, **not** the globe. That keeps the globe's coordinates stable, which makes the lat/lon math simpler.

---

## 11. BufferGeometry, Points and Lines

All geometries are built on `BufferGeometry`, which stores raw arrays of numbers.

**Stars** (many points):

```js
const positions = [];
for (let i = 0; i < 1500; i++) {
  positions.push(Math.random() * 400 - 200, Math.random() * 400 - 200, Math.random() * 400 - 200);
}
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); // 3 numbers per vertex
scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.6 })));
```

**A line** from an array of `Vector3` points:

```js
const geo = new THREE.BufferGeometry().setFromPoints([p1, p2, p3]);
scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffff00 })));
```

---

## 12. The Animation Loop

Three.js draws a single image when you call `renderer.render()`. To animate, call it repeatedly:

```js
function animate() {
  requestAnimationFrame(animate); // ask the browser to call us again next frame
  globe.rotation.y += 0.002;      // example: slow auto-rotation
  controls.update();
  renderer.render(scene, camera);
}
animate();
```

`requestAnimationFrame` syncs with the screen refresh (usually 60 times per second) and pauses when the tab is hidden, which saves battery.

---

## 12b. Time-Based Animation (Clock, Easing, setDrawRange)

The result animation in `game.js` (section 8b) combines three ideas.

**THREE.Clock and delta time.** `clock.getDelta()` returns the seconds since it was last called. Adding it up gives the animation time, and the speed stays the same on slow and fast computers.

```js
const clock = new THREE.Clock();
let time = 0;

function animate() {
  requestAnimationFrame(animate);
  time += clock.getDelta();            // seconds, not frames
  cube.position.x = Math.sin(time);    // moves smoothly at any frame rate
  renderer.render(scene, camera);
}
```

**Progress and easing.** Convert time into a progress value `t` from 0 to 1, then shape it with an easing function so the motion feels natural.

```js
const t = Math.min(time / DURATION, 1);  // 0 -> 1, then stays at 1
const eased = 1 - Math.pow(1 - t, 3);    // easeOutCubic: fast start, soft landing
```

**`geometry.setDrawRange(start, count)`** draws only part of a line or mesh. Growing `count` each frame makes a line "draw itself":

```js
geometry.setDrawRange(0, Math.ceil(eased * totalPoints));
```

Scaling an object from 0 to 1 (`mesh.scale.set(s, s, s)`) makes it pop in, and an "easeOutBack" curve adds a small bounce. A sphere that follows `points[index]` over time becomes a travelling dot.

---

## 12c. Placing HTML Elements on 3D Objects (`project`)

Raycasting goes from 2D screen to 3D. `Vector3.project(camera)` goes the other way: it tells you where a 3D point appears on screen. The game uses it to keep the Confirm button floating above the pin.

```js
const p = pin.getWorldPosition(new THREE.Vector3()).project(camera);
// p.x and p.y are now between -1 and +1 (-1 = left/bottom, +1 = right/top)

button.style.left = (p.x * 0.5 + 0.5) * canvasWidth  + "px";
button.style.top  = (-p.y * 0.5 + 0.5) * canvasHeight + "px";  // y is flipped
```

Run this every frame, because the camera moves. To hide labels on the back of a globe, compare the sphere's surface normal (`position.normalize()`) with the direction to the camera using `dot()`: a positive result means the point faces the camera.

---

## 12d. Sound with the Web Audio API (not part of Three.js)

Three.js has its own `THREE.Audio`, but a game like this only needs short effects, so `game.js` synthesizes them with the browser's Web Audio API: no audio files to download.

```js
const ctx = new AudioContext();
const osc = ctx.createOscillator();   // generates a wave
const gain = ctx.createGain();        // volume

osc.type = "sine";                    // "sine", "triangle", "square", "sawtooth"
osc.frequency.setValueAtTime(400, ctx.currentTime);
osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.2); // pitch glide

osc.connect(gain);                    // oscillator -> gain -> speakers
gain.connect(ctx.destination);
osc.start();
osc.stop(ctx.currentTime + 0.2);
```

Tips: browsers only allow audio after a user click or tap, so the `AudioContext` is created on first use. Pass a `delay` and the sound is scheduled on the audio clock, which is how the result jingle lines up with the end of the line animation.

---

## 12e. Building Objects from Several Meshes (Group) and the Flags

The flags are made of three meshes, held together by a `THREE.Group`:

```js
const flag = new THREE.Group();

const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8), poleMaterial);
pole.position.y = 0.45;            // cylinders are centered: lift by half the height
flag.add(pole);

const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.38, 10, 4), clothMaterial);
flag.add(cloth);

scene.add(flag);                   // moving/rotating/scaling `flag` moves all parts
```

**Standing "up" on a sphere.** The flag is built pointing along +Y, but on a globe "up" means "away from the center". A quaternion (a rotation) that turns one direction into another does it in one line:

```js
flag.quaternion.setFromUnitVectors(
  new THREE.Vector3(0, 1, 0),          // the direction the flag points now
  position.clone().normalize()         // the direction we want (surface normal)
);
```

**Waving cloth = changing vertices every frame.** `PlaneGeometry(w, h, 10, 4)` is split into small squares, so its vertices can move independently. Each frame we set the Z position of every vertex from a sine wave, and the wave strength grows with the distance from the pole:

```js
const pos = geometry.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  pos.setZ(i, Math.sin(x * 12 - time * 6) * 0.05 * (x / width));
}
pos.needsUpdate = true;            // upload the new vertices to the GPU
geometry.computeVertexNormals();   // recompute lighting data
```

The `- time * 6` part makes the wave travel; without it the flag would be frozen in a wavy shape.

**TubeGeometry: a thick line.** WebGL lines are always 1 pixel wide. To get a thick glowing path, build a pipe along a curve:

```js
const curve = new THREE.CatmullRomCurve3(arrayOfVector3);   // smooth curve through points
const tube = new THREE.Mesh(
  new THREE.TubeGeometry(curve, 80, 0.035, 8, false),       // curve, segments, radius, sides, closed
  new THREE.MeshBasicMaterial({ color: 0xffd34d })
);
curve.getPoint(0.5);               // position halfway along the curve (t from 0 to 1)
```

To "draw" the tube progressively, reveal a growing number of triangle indices: `geometry.setDrawRange(0, Math.ceil(progress * geometry.index.count / 3) * 3)`.

**Other small things used in the code**

- `new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.13, side: THREE.BackSide })` creates the blue atmosphere glow. `BackSide` draws only the inside faces of a slightly bigger sphere.
- `controls.autoRotate = true` spins the camera slowly around the globe until the user interacts.
- `object.traverse(fn)` runs a function on an object and all its descendants. We use it to dispose every geometry and material of a flag, because a flag is a group of several meshes.

---

## 12f. Richer Sound Synthesis

Section 12d showed the basic oscillator → gain → speakers chain. The game adds three tricks to make sounds richer:

**Bells = several sine waves at once.** Real bells ring at non-integer multiples of the base pitch, and the higher parts die out faster:

```js
[[1, 1, 1.3], [2.76, 0.45, 0.8], [5.4, 0.2, 0.45]]   // [pitch ratio, loudness, ring time]
```

**Noise + filter = whooshes.** Fill an `AudioBuffer` with random numbers to get white noise, play it through a `BiquadFilter` of type `"bandpass"`, and slide the filter's frequency upward. A short sweep sounds like a tap, a long rising sweep like wind or a "whoosh".

```js
const bandpass = ctx.createBiquadFilter();
bandpass.type = "bandpass";
bandpass.frequency.setValueAtTime(300, t);
bandpass.frequency.exponentialRampToValueAtTime(3200, t + 0.4);
```

**Echo = delay with feedback.** A `DelayNode` repeats its input later; sending its output back into itself (through a quieter gain) makes the repeats fade away. A `DynamicsCompressor` at the end stops many overlapping sounds from distorting.

---

## 13. Handling Window Resize

When the window changes size, update both the camera and the renderer:

```js
window.addEventListener("resize", () => {
  camera.aspect = width / height;
  camera.updateProjectionMatrix(); // REQUIRED after changing camera settings
  renderer.setSize(width, height);
});
```

---

## 14. Cleaning Up (dispose)

Geometries, materials and textures live in GPU memory. JavaScript's garbage collector does not free that automatically, so when you remove objects permanently, call:

```js
scene.remove(mesh);
mesh.geometry.dispose();
mesh.material.dispose();
```

We do this in `clearMarkers()` for the pins and lines of the previous round.

---

## Experiments to Try

1. Add `globe.rotation.y += 0.001;` in `animate()` for a spinning globe.
2. Change `SphereGeometry(5, 64, 64)` to `(5, 8, 8)` and see the polygons.
3. Add a semi-transparent atmosphere: a second, slightly larger sphere with `new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.15 })`.
4. Change the flag colors, size, or wave speed (`time * 6`) and wave strength (`0.05`) in `createFlag` / `waveFlag`.
5. Add a `bumpMap` texture to the globe material to give mountains some relief.
6. Add your own locations to the `LOCATIONS` array in `game.js`.

## Further Reading

- Official docs: https://threejs.org/docs/
- Official examples: https://threejs.org/examples/
- Beginner-friendly lessons: https://threejs.org/manual/
