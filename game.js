// =====================================================================
//  GEO GUESSER - a small Three.js teaching example
//
//  Idea: a photo of a real place is shown. The player rotates a 3D globe,
//  plants a flag where they think the photo was taken, and confirms. We then
//  reveal the real location and score them by distance.
//
//  Read this file top to bottom: each numbered section is one concept.
// =====================================================================


// ---------------------------------------------------------------------
// 1. GAME DATA
// ---------------------------------------------------------------------
// Each location has a photo URL plus its real latitude / longitude.
// (Photos come from Wikimedia Commons. If one fails to load, swap the URL
//  for any image you like - the game keeps working.)
const LOCATIONS = [
  { name: "Eiffel Tower, Paris",        lat: 48.8584,  lon: 2.2945,
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Tour_Eiffel_Wikimedia_Commons.jpg?width=700" },
  { name: "Statue of Liberty, New York", lat: 40.6892,  lon: -74.0445,
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Statue_of_Liberty_7.jpg?width=700" },
  { name: "Sydney Opera House",          lat: -33.8568, lon: 151.2153,
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Sydney_Opera_House_-_Dec_2008.jpg?width=700" },
  { name: "Taj Mahal, Agra",             lat: 27.1751,  lon: 78.0421,
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Taj_Mahal_(Edited).jpeg?width=700" },
  { name: "Great Pyramid of Giza",       lat: 29.9792,  lon: 31.1342,
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Kheops-Pyramid.jpg?width=700" },
  { name: "Colosseum, Rome",             lat: 41.8902,  lon: 12.4922,
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Colosseo_2020.jpg?width=700" },
  { name: "Christ the Redeemer, Rio",    lat: -22.9519, lon: -43.2105,
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Christ_the_Redeemer_-_Cristo_Redentor.jpg?width=700" },
];

const ROUNDS = 5;            // how many rounds per game
const MAX_POINTS = 5000;     // points for a perfect guess
const GLOBE_RADIUS = 5;      // size of our sphere in "Three.js units"


// ---------------------------------------------------------------------
// 2. THE THREE ESSENTIALS: scene, camera, renderer
// ---------------------------------------------------------------------
const container = document.getElementById("globe-container");

// Scene = the "world" that holds every object we want to draw.
const scene = new THREE.Scene();

// Camera = our eyes. PerspectiveCamera(fieldOfView, aspectRatio, near, far)
// Objects closer than `near` or farther than `far` are not drawn.
const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 15);   // x, y, z : 15 units away from the center

// Renderer = the thing that actually draws the scene onto a <canvas>.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);   // sharp on retina screens
container.appendChild(renderer.domElement);        // add the canvas to the page


// ---------------------------------------------------------------------
// 3. LIGHTS
// ---------------------------------------------------------------------
// MeshStandardMaterial (used for the globe) needs light, otherwise it is black.
// AmbientLight lights everything equally; DirectionalLight adds highlights & shape.
scene.add(new THREE.AmbientLight(0xffffff, 1.3));

// Attach a directional light to the camera so whichever side the player views is always bright
scene.add(camera);
const cameraLight = new THREE.DirectionalLight(0xffffff, 1.0);
cameraLight.position.set(0, 0, 1);
camera.add(cameraLight);

// Balanced directional lights on opposite sides ensure the entire globe is brightly illuminated
const sun = new THREE.DirectionalLight(0xffffff, 0.85);
sun.position.set(10, 8, 10);
scene.add(sun);

const sunOpposite = new THREE.DirectionalLight(0xffffff, 0.85);
sunOpposite.position.set(-10, -8, -10);
scene.add(sunOpposite);


// ---------------------------------------------------------------------
// 4. THE GLOBE: Geometry + Material = Mesh
// ---------------------------------------------------------------------
// Geometry = the SHAPE (a sphere made of many small triangles).
// 64x64 are the number of horizontal / vertical segments: more = smoother.
const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);

// A texture is just an image wrapped around the geometry.
// SphereGeometry already knows how to map a flat world map onto itself (UV mapping).
const earthTexture = new THREE.TextureLoader().load(
  "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
);

// Material = the SURFACE look (color, texture, shininess...).
const globeMaterial = new THREE.MeshStandardMaterial({
  map: earthTexture,
  roughness: 0.65,
  metalness: 0.0,
});

// Mesh = Geometry + Material. This is the actual object we add to the scene.
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// Every flag/line we add later is added as a CHILD of the globe,
// so it always stays glued to the same spot on the Earth.

// A soft blue "atmosphere": a slightly bigger, transparent sphere.
// side: BackSide draws the INSIDE faces only, so we see a glow around the edge.
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(GLOBE_RADIUS * 1.06, 64, 64),
  new THREE.MeshBasicMaterial({
    color: 0x4facfe,
    transparent: true,
    opacity: 0.13,
    side: THREE.BackSide,
  })
);
scene.add(atmosphere);


// ---------------------------------------------------------------------
// 5. BONUS: a simple starry background using Points
// ---------------------------------------------------------------------
function createStars() {
  const positions = [];
  for (let i = 0; i < 1500; i++) {
    // random position in a cube from -200 to +200 on each axis
    positions.push(
      (Math.random() - 0.5) * 400,
      (Math.random() - 0.5) * 400,
      (Math.random() - 0.5) * 400
    );
  }
  // BufferGeometry is a "blank" geometry where we provide raw numbers ourselves.
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); // 3 numbers per point
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6 });
  scene.add(new THREE.Points(geometry, material));
}
createStars();


// ---------------------------------------------------------------------
// 6. CAMERA CONTROLS
// ---------------------------------------------------------------------
// OrbitControls makes the camera orbit around the center when you drag
// and move closer / farther when you scroll. We don't write any math ourselves.
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;     // smooth, "inertia" movement
controls.minDistance = 7;          // can't zoom inside the globe
controls.maxDistance = 25;
controls.enablePan = false;        // keep the globe centered

// Slowly spin while nobody touches it; stop for good on the first interaction.
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.addEventListener("start", () => { controls.autoRotate = false; });


// ---------------------------------------------------------------------
// 7. LATITUDE / LONGITUDE  <->  3D POINT   (the key math of this project)
// ---------------------------------------------------------------------
// Latitude: -90 (south pole) to +90 (north pole)
// Longitude: -180 to +180 (0 = Greenwich)
// Three.js's SphereGeometry wraps the texture starting at longitude -180,
// so these formulas are matched to that layout.

// lat/lon -> THREE.Vector3 on the sphere surface
function latLonToVector3(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat);    // angle from the north pole
  const theta = THREE.MathUtils.degToRad(lon + 180); // angle around the equator

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

// THREE.Vector3 (a point on the sphere) -> { lat, lon }
function vector3ToLatLon(point) {
  const p = point.clone().normalize();               // length 1: simplifies the math
  const lat = 90 - THREE.MathUtils.radToDeg(Math.acos(p.y));
  let lon = THREE.MathUtils.radToDeg(Math.atan2(p.z, -p.x)) - 180;
  if (lon < -180) lon += 360;                        // keep inside -180..180
  return { lat, lon };
}

// Distance between two lat/lon points over the Earth's surface, in km.
// This is the famous "haversine" formula.
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = THREE.MathUtils.degToRad(lat2 - lat1);
  const dLon = THREE.MathUtils.degToRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(THREE.MathUtils.degToRad(lat1)) *
    Math.cos(THREE.MathUtils.degToRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}


// ---------------------------------------------------------------------
// 8. FLAGS AND THE RESULT LINE
// ---------------------------------------------------------------------
// A flag is built from several meshes (pole + golden ball + cloth) put
// together in a THREE.Group. A Group is an empty "container": when we move,
// rotate or scale the group, all its children follow.
const FLAG_POLE_HEIGHT = 0.9;
const FLAG_W = 0.6;
const FLAG_H = 0.38;

function createFlag(color) {
  const flag = new THREE.Group();

  // The pole: a thin cylinder. Cylinders are centered on their middle and
  // stand along the Y axis, so we lift it by half its height to make its
  // bottom touch the group's origin (the ground).
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, FLAG_POLE_HEIGHT, 8),
    new THREE.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 0.4, roughness: 0.4 })
  );
  pole.position.y = FLAG_POLE_HEIGHT / 2;
  flag.add(pole);

  // A golden ball on top of the pole
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd34d, metalness: 0.6, roughness: 0.3 })
  );
  ball.position.y = FLAG_POLE_HEIGHT;
  flag.add(ball);

  // The cloth: a flat plane cut into 10x4 little squares so it can bend.
  // translate() shifts the geometry itself so its LEFT edge sits on the pole.
  const clothGeometry = new THREE.PlaneGeometry(FLAG_W, FLAG_H, 10, 4);
  clothGeometry.translate(FLAG_W / 2, FLAG_POLE_HEIGHT - FLAG_H / 2 - 0.04, 0);

  const cloth = new THREE.Mesh(
    clothGeometry,
    new THREE.MeshLambertMaterial({
      color: color,
      emissive: color,            // a little self-glow so it is visible in shadow
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide,     // visible from both sides
    })
  );
  flag.add(cloth);

  flag.userData.cloth = cloth;    // keep a reference for the waving animation
  return flag;
}

// Put a flag on the globe surface at lat/lon, standing straight "up"
// (up = pointing away from the center of the Earth).
function placeFlag(flag, lat, lon) {
  const position = latLonToVector3(lat, lon, GLOBE_RADIUS);
  flag.position.copy(position);

  // The flag is built pointing along +Y. setFromUnitVectors computes the
  // rotation that turns +Y into the surface normal at this location.
  const up = new THREE.Vector3(0, 1, 0);
  flag.quaternion.setFromUnitVectors(up, position.clone().normalize());
}

// Make the cloth wave by moving its vertices every frame.
// Vertices near the pole (small x) barely move; the far edge moves the most.
function waveFlag(flag, time) {
  const geometry = flag.userData.cloth.geometry;
  const pos = geometry.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);                                   // 0 (pole) ... FLAG_W (tip)
    const z = Math.sin(x * 12 - time * 6) * 0.05 * (x / FLAG_W);
    pos.setZ(i, z);
  }
  pos.needsUpdate = true;          // tell the GPU the vertices changed
  geometry.computeVertexNormals(); // recompute shading so the folds are lit
}

let guessFlag = null;    // the player's flag (red)
let answerFlag = null;   // the real location (green)
let resultLine = null;   // glowing arc connecting guess and answer
let travelDot = null;    // small bright sphere running along the arc

// A tiny glowing ball (used for the travelling dot)
function createDot(color) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    new THREE.MeshBasicMaterial({ color })   // Basic = ignores light, always bright
  );
}

// Draw a curved "flight path" above the surface between two lat/lon points.
// We use a TubeGeometry (a pipe along a curve) because WebGL lines are
// always 1 pixel thin, while a tube can be as thick as we like.
function createArc(lat1, lon1, lat2, lon2) {
  const start = latLonToVector3(lat1, lon1, 1);
  const end = latLonToVector3(lat2, lon2, 1);

  // Longer trips fly higher: height depends on the angle between the points.
  const angle = start.angleTo(end);
  const maxHeight = Math.min(0.2 + angle * 0.9, 2.2);

  const points = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // lerp = "linear interpolate": a point part-way between start and end.
    // normalize() pushes it back onto the sphere surface...
    const p = start.clone().lerp(end, t).normalize();
    // ...and sin(PI * t) makes the height 0 at both ends and maximum in the middle.
    p.multiplyScalar(GLOBE_RADIUS + 0.05 + Math.sin(Math.PI * t) * maxHeight);
    points.push(p);
  }

  // CatmullRomCurve3 turns our points into a smooth curve.
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 80, 0.035, 8, false);
  const line = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffd34d }));

  line.userData.curve = curve;      // the dot will follow this curve

  // setDrawRange(start, count) tells Three.js to only draw part of the mesh.
  // We start with nothing and grow it every frame: see section 8b.
  geometry.setDrawRange(0, 0);
  return line;
}

// Remove an object and free its GPU memory (geometry + material).
function disposeObject(obj) {
  if (!obj) return;
  obj.parent.remove(obj);
  obj.traverse((child) => {          // traverse visits the object and ALL its children
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  });
}

// Remove everything we drew during the previous round.
function clearMarkers() {
  disposeObject(guessFlag);
  disposeObject(answerFlag);
  disposeObject(resultLine);
  disposeObject(travelDot);
  guessFlag = answerFlag = resultLine = travelDot = null;
  resultAnimating = false;
}


// ---------------------------------------------------------------------
// 8b. ANIMATION HELPERS AND THE RESULT ANIMATION
// ---------------------------------------------------------------------
// Animations need to know "how much time has passed". THREE.Clock gives us
// the time between two frames (delta), so the animation runs at the same
// speed on slow and fast computers.
const clock = new THREE.Clock();
let elapsed = 0;                 // total seconds since the page opened

// Easing functions turn a straight 0->1 progress into a more natural motion.
// easeOutCubic: fast at the start, slows down at the end.
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
// easeOutBack: goes a bit past 1 and comes back, giving a "bounce" effect.
function easeOutBack(t) {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

// Every frame: wave the flags, and "plant" the player's flag with a bounce.
const PLANT_TIME = 0.35;
function updateFlags() {
  [guessFlag, answerFlag].forEach((flag) => {
    if (flag) waveFlag(flag, elapsed);
  });

  if (guessFlag && guessFlag.userData.plantStart !== undefined) {
    const t = Math.min((elapsed - guessFlag.userData.plantStart) / PLANT_TIME, 1);
    guessFlag.scale.setScalar(easeOutBack(t));   // setScalar(s) = scale.set(s, s, s)
  }
}

// The result animation has three steps, one after the other:
//   1. the green answer flag pops in (scale 0 -> 1, with a little overshoot)
//   2. the yellow arc is drawn from the guess to the answer
//   3. a bright dot keeps travelling along the arc, over and over
const POP_TIME = 0.5;    // seconds for the flag to pop in
const DRAW_TIME = 1.5;   // seconds for the arc to be drawn
const DOT_TIME = 2.0;    // seconds for the dot to travel the whole arc

let resultTime = 0;          // seconds since the result animation started
let resultAnimating = false;

function startResultAnimation() {
  resultTime = 0;
  resultAnimating = true;

  answerFlag.scale.setScalar(0);   // hidden until it pops in

  travelDot = createDot(0xffffff);
  travelDot.visible = false;
  globe.add(travelDot);

  sounds.pop();                    // sound for the flag pop...
  sounds.draw(POP_TIME);           // ...then a whoosh while the arc draws
}

// Called every frame from animate() with the elapsed seconds.
function updateResultAnimation(delta) {
  if (!resultAnimating) return;
  resultTime += delta;

  // Step 1: flag pop (first POP_TIME seconds)
  const popT = Math.min(resultTime / POP_TIME, 1);
  answerFlag.scale.setScalar(easeOutBack(popT));

  // Step 2: arc draw (starts after the flag popped).
  // A tube is made of triangles; index.count is how many vertex indices it has,
  // and we reveal a growing share of them (always a multiple of 3 = whole triangles).
  const indexCount = resultLine.geometry.index.count;
  const drawT = Math.min(Math.max((resultTime - POP_TIME) / DRAW_TIME, 0), 1);
  const visible = Math.ceil((easeOutCubic(drawT) * indexCount) / 3) * 3;
  resultLine.geometry.setDrawRange(0, visible);

  // Step 3: travelling dot (starts when the arc is fully drawn).
  // curve.getPoint(t) returns the position at t = 0 (start) ... 1 (end).
  if (drawT >= 1) {
    const dotT = ((resultTime - POP_TIME - DRAW_TIME) % DOT_TIME) / DOT_TIME;
    travelDot.position.copy(resultLine.userData.curve.getPoint(dotT));
    travelDot.visible = true;
  }
}


// ---------------------------------------------------------------------
// 8c. SOUND EFFECTS (Web Audio API - no audio files needed!)
// ---------------------------------------------------------------------
// Instead of loading .mp3 files, we SYNTHESIZE sounds in code.
// The building blocks ("nodes") are connected like guitar pedals:
//
//   Oscillator (makes a tone) -> Filter (shapes it) -> Gain (volume)
//        -> master volume -> compressor -> speakers
//                     \-> echo (delay + feedback) -> master volume
//
// We have three kinds of voices:
//   playTone  - a simple pitch (can glide up or down)
//   playBell  - several tones stacked at "bell" ratios: a pleasant ding
//   playNoise - filtered random noise: whooshes, taps, "air"
let audioCtx = null;
let masterGain = null;      // master volume
let echoSend = null;        // sounds connected here get an echo
let noiseBuffer = null;     // one second of random numbers = white noise
let muted = false;

// Browsers only allow audio after a user click, so we build everything lazily.
function getAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // A compressor keeps loud overlapping sounds from distorting.
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.connect(audioCtx.destination);

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(compressor);

    // Echo: a DelayNode repeats the sound 0.22 s later; feeding part of its
    // output back into its input makes it repeat several times, fading out.
    echoSend = audioCtx.createGain();
    echoSend.gain.value = 0.3;
    const delay = audioCtx.createDelay();
    delay.delayTime.value = 0.22;
    const feedback = audioCtx.createGain();
    feedback.gain.value = 0.35;
    echoSend.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(masterGain);

    // White noise = random values between -1 and 1
    noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Connect a finished voice to the speakers (and optionally to the echo).
function output(node, echo) {
  node.connect(masterGain);
  if (echo) node.connect(echoSend);
}

// A tone that glides from `freq` to `endFreq`. `filter` (optional) is a
// low-pass cutoff in Hz: it removes the harsh high frequencies.
function playTone({ freq, endFreq = freq, duration = 0.15, type = "sine", volume = 0.2, delay = 0, filter = 0, echo = false }) {
  if (muted) return;
  const ctx = getAudio();
  const start = ctx.currentTime + delay;       // audio has its own precise clock

  const osc = ctx.createOscillator();
  osc.type = type;                             // "sine" soft, "triangle" mellow, "sawtooth" buzzy
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);

  // Envelope: fade in very fast, then fade out. Avoids ugly "clicks".
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  let last = osc;
  if (filter) {
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = filter;
    osc.connect(lowpass);
    last = lowpass;
  }
  last.connect(gain);
  output(gain, echo);

  osc.start(start);
  osc.stop(start + duration + 0.05);
}

// A bell: real bells ring at several frequencies at once, each fading at
// its own speed. [ratio to base pitch, loudness, ring time in seconds]
const BELL_PARTIALS = [[1, 1, 1.3], [2.76, 0.45, 0.8], [5.4, 0.2, 0.45]];

function playBell(freq, volume = 0.2, delay = 0) {
  if (muted) return;
  const ctx = getAudio();
  const start = ctx.currentTime + delay;

  BELL_PARTIALS.forEach(([ratio, loudness, ring]) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * ratio;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume * loudness, start + 0.006);  // sharp "strike"
    gain.gain.exponentialRampToValueAtTime(0.0001, start + ring);              // long ring-out

    osc.connect(gain);
    output(gain, true);                                                        // bells get echo
    osc.start(start);
    osc.stop(start + ring + 0.05);
  });
}

// Filtered noise whose center frequency sweeps from `from` to `to` Hz:
// a rising sweep sounds like a whoosh, a short one like a tap.
function playNoise({ from, to, duration = 0.3, volume = 0.2, delay = 0, q = 1.2, echo = false }) {
  if (muted) return;
  const ctx = getAudio();
  const start = ctx.currentTime + delay;

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const bandpass = ctx.createBiquadFilter();     // only lets a band of frequencies through
  bandpass.type = "bandpass";
  bandpass.Q.value = q;
  bandpass.frequency.setValueAtTime(from, start);
  bandpass.frequency.exponentialRampToValueAtTime(to, start + duration);

  const gain = ctx.createGain();                 // swell up, then fade out
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + duration * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(bandpass);
  bandpass.connect(gain);
  output(gain, echo);
  source.start(start);
  source.stop(start + duration + 0.05);
}

// Note frequencies in Hz
const D4 = 294, F4 = 349, A4 = 440;
const C5 = 523, E5 = 659, G5 = 784;
const C6 = 1047, E6 = 1319;

// Named sound effects used by the game
const sounds = {
  // flag planted: a soft thud + a little tap + a high "ting"
  pin: () => {
    playTone({ freq: 180, endFreq: 60, duration: 0.16, volume: 0.35 });
    playNoise({ from: 1800, to: 700, duration: 0.07, volume: 0.15 });
    playBell(880, 0.12, 0.04);
  },
  // UI click
  click: () => playTone({ freq: 700, endFreq: 480, duration: 0.05, type: "triangle", volume: 0.12 }),
  // confirm: whoosh followed by two rising bells
  confirm: () => {
    playNoise({ from: 300, to: 3200, duration: 0.4, volume: 0.22 });
    playBell(G5, 0.18, 0.25);
    playBell(C6, 0.15, 0.36);
  },
  // answer flag pops into existence
  pop: () => {
    playTone({ freq: 350, endFreq: 1000, duration: 0.12, volume: 0.25 });
    playBell(E6, 0.1, 0.05);
  },
  // shimmering whoosh for as long as the arc takes to draw
  draw: (delay) => {
    playNoise({ from: 500, to: 3600, duration: DRAW_TIME, volume: 0.13, delay, q: 3 });
    playTone({ freq: 400, endFreq: 1600, duration: DRAW_TIME, volume: 0.05, delay, echo: true });
  },
  // result jingles, depending on how close the guess was
  great: (delay) => [C5, E5, G5, C6, E6].forEach((f, i) => playBell(f, 0.2, delay + i * 0.09)),
  okay:  (delay) => [E5, G5].forEach((f, i) => playBell(f, 0.2, delay + i * 0.14)),
  // "sad trombone": buzzy notes that droop in pitch, softened by the filter
  bad: (delay) => [A4, F4, D4].forEach((f, i) =>
    playTone({ freq: f, endFreq: f * 0.93, duration: 0.3, type: "sawtooth", volume: 0.14, delay: delay + i * 0.24, filter: 900 })
  ),
  // end of game: melody + a final chord
  fanfare: () => {
    [C5, C5, G5, E5, G5].forEach((f, i) => playBell(f, 0.2, i * 0.13));
    [C5, E5, G5, C6].forEach((f) => playBell(f, 0.16, 0.8));
  },
};

// Mute button
const muteBtn = document.getElementById("mute-btn");
muteBtn.addEventListener("click", () => {
  muted = !muted;
  muteBtn.textContent = muted ? "🔇" : "🔊";
});


// ---------------------------------------------------------------------
// 8d. UI HELPERS
// ---------------------------------------------------------------------
// Smoothly count a number up (e.g. 0 -> 4530) for the score displays.
function animateNumber(el, from, to, duration, format = (n) => n.toLocaleString()) {
  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    el.textContent = format(Math.round(from + (to - from) * easeOutCubic(t)));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// The Confirm button is a normal HTML element. To place it above the flag we
// need to know where the flag appears ON THE SCREEN. Vector3.project(camera)
// does exactly that: it returns x/y in the range -1..+1 (the same
// "normalized device coordinates" we use for raycasting, but reversed).
const flagBase = new THREE.Vector3();
const flagTop = new THREE.Vector3();
const toCamera = new THREE.Vector3();

function updateConfirmButton() {
  if (!guessFlag || roundFinished) return;

  // Is the flag on the side of the globe facing the camera?
  // The "normal" of the sphere at the flag points away from the center.
  guessFlag.getWorldPosition(flagBase);
  toCamera.copy(camera.position).sub(flagBase).normalize();
  const facingCamera = flagBase.clone().normalize().dot(toCamera) > 0;
  confirmBtn.style.visibility = facingCamera ? "visible" : "hidden";

  // Project the TOP of the flag (local point above the pole) to the screen.
  flagTop.set(0, FLAG_POLE_HEIGHT + 0.08, 0);
  guessFlag.localToWorld(flagTop);              // local coordinates -> world coordinates
  flagTop.project(camera);

  const rect = renderer.domElement.getBoundingClientRect();
  confirmBtn.style.left = rect.left + (flagTop.x * 0.5 + 0.5) * rect.width + "px";
  confirmBtn.style.top = rect.top + (-flagTop.y * 0.5 + 0.5) * rect.height + "px";
}


// ---------------------------------------------------------------------
// 9. CLICKING ON THE GLOBE  (Raycasting)
// ---------------------------------------------------------------------
// A mouse click is 2D, but the globe is 3D. A "Raycaster" shoots an invisible
// ray from the camera through the mouse position and tells us which 3D
// objects it hits, and exactly where.
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let guess = null;            // { lat, lon } chosen by the player
let roundFinished = false;   // true after the player pressed Confirm

let downX = 0, downY = 0;    // where the mouse was pressed

// We want to tell a CLICK apart from a DRAG (dragging rotates the globe).
renderer.domElement.addEventListener("pointerdown", (e) => {
  downX = e.clientX;
  downY = e.clientY;
});

renderer.domElement.addEventListener("pointerup", (e) => {
  const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (moved > 5) return;          // it was a drag, not a click
  if (roundFinished) return;      // can't move the flag after confirming
  placeGuess(e);
});

function placeGuess(event) {
  // Convert the mouse position from pixels to "normalized device coordinates":
  // the screen becomes a square going from -1 to +1 on both axes (y is flipped).
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Shoot the ray and check if it hits the globe.
  // (Flags are children of the globe, but intersectObject does not look at
  //  children unless asked, so flags never block the click.)
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(globe);
  if (hits.length === 0) return;   // clicked on empty space

  // hits[0] is the closest hit. `point` is in world coordinates, so we
  // convert it to the globe's own coordinate system with worldToLocal.
  const localPoint = globe.worldToLocal(hits[0].point.clone());
  guess = vector3ToLatLon(localPoint);

  // Create the flag the first time, then just move it.
  if (!guessFlag) {
    guessFlag = createFlag(0xff4d4d);
    globe.add(guessFlag);
  }
  placeFlag(guessFlag, guess.lat, guess.lon);
  guessFlag.userData.plantStart = elapsed;     // restarts the "planting" bounce

  confirmBtn.hidden = false;   // the floating Confirm button appears...
  updateConfirmButton();       // ...right above the flag
  setHint("Happy with your guess? Press Confirm, or click elsewhere to move the flag.");
  sounds.pin();
}


// ---------------------------------------------------------------------
// 10. GAME FLOW (plain JavaScript + HTML elements)
// ---------------------------------------------------------------------
const photoEl = document.getElementById("photo");
const photoFrame = document.getElementById("photo-frame");
const hintEl = document.getElementById("hint");
const confirmBtn = document.getElementById("confirm-btn");
const nextBtn = document.getElementById("next-btn");
const roundTextEl = document.getElementById("round-text");
const roundDotsEl = document.getElementById("round-dots");
const scoreEl = document.getElementById("score");
const scoreBox = document.getElementById("score-box");
const resultCard = document.getElementById("result-card");
const resultPlaceEl = document.getElementById("result-place");
const resultDistanceEl = document.getElementById("result-distance");
const resultPointsEl = document.getElementById("result-points");
const resultBarFill = document.getElementById("result-bar-fill");
const finalOverlay = document.getElementById("final-overlay");
const finalScoreEl = document.getElementById("final-score");
const finalRatingEl = document.getElementById("final-rating");
const finalMaxEl = document.getElementById("final-max");
const playAgainBtn = document.getElementById("play-again-btn");

let round = 0;
let totalScore = 0;
let currentLocation = null;
let remaining = [];   // locations not yet used in this game

function setHint(text) {
  hintEl.textContent = text;
}

// One dot per round: green = finished, blue = current
function updateRoundDots() {
  roundDotsEl.innerHTML = "";
  for (let i = 0; i < ROUNDS; i++) {
    const dot = document.createElement("span");
    if (i < round - 1) dot.className = "done";
    if (i === round - 1) dot.className = "active";
    roundDotsEl.appendChild(dot);
  }
  roundTextEl.textContent = `${round}/${ROUNDS}`;
}

function startGame() {
  round = 0;
  totalScore = 0;
  // Shuffle a copy of the list, and keep only as many as we need
  remaining = [...LOCATIONS].sort(() => Math.random() - 0.5).slice(0, ROUNDS);
  scoreEl.textContent = 0;
  nextRound();
}

function nextRound() {
  clearMarkers();
  guess = null;
  roundFinished = false;

  round++;
  updateRoundDots();
  currentLocation = remaining.pop();

  // Show the placeholder shimmer until the image has loaded
  photoFrame.classList.remove("error");
  photoFrame.classList.add("loading");
  photoEl.src = currentLocation.img;

  setHint("Drag to rotate · Scroll to zoom · Click the globe to plant your flag");

  resultCard.classList.remove("show");
  resultBarFill.style.width = "0%";
  confirmBtn.hidden = true;   // only shown once the player plants a flag
}

photoEl.addEventListener("load", () => photoFrame.classList.remove("loading"));
photoEl.addEventListener("error", () => {
  photoFrame.classList.remove("loading");
  photoFrame.classList.add("error");
});

confirmBtn.addEventListener("click", () => {
  if (!guess || roundFinished) return;
  roundFinished = true;
  confirmBtn.hidden = true;
  sounds.confirm();
  setHint("Revealing the answer...");

  // Reveal the real location with a green flag and an arc to the guess
  answerFlag = createFlag(0x2ecc71);
  placeFlag(answerFlag, currentLocation.lat, currentLocation.lon);
  globe.add(answerFlag);

  resultLine = createArc(guess.lat, guess.lon, currentLocation.lat, currentLocation.lon);
  globe.add(resultLine);

  startResultAnimation();   // flag pops in, arc draws itself, dot travels

  // Score: MAX_POINTS for a perfect guess, dropping off with distance.
  const km = distanceKm(guess.lat, guess.lon, currentLocation.lat, currentLocation.lon);
  const points = Math.round(MAX_POINTS * Math.exp(-km / 1500));
  const previousTotal = totalScore;
  totalScore += points;

  const tier = points > 3500 ? "great" : points > 1000 ? "okay" : "bad";

  // Play a jingle when the arc finishes drawing (after pop + draw time)
  const revealDelay = POP_TIME + DRAW_TIME;     // seconds
  sounds[tier](revealDelay);

  // When the animation ends, slide in the result card and count up the score
  setTimeout(() => {
    resultCard.dataset.tier = tier;             // CSS colors the bar by tier
    resultPlaceEl.textContent = "📍 " + currentLocation.name;
    resultDistanceEl.innerHTML = `You were <b>${Math.round(km).toLocaleString()} km</b> away`;
    nextBtn.textContent = round < ROUNDS ? "Next round →" : "See final score";
    resultCard.classList.add("show");
    resultBarFill.style.width = (points / MAX_POINTS) * 100 + "%";

    animateNumber(resultPointsEl, 0, points, 1000, (n) => "+" + n.toLocaleString() + " pts");
    animateNumber(scoreEl, previousTotal, totalScore, 1000);
    scoreBox.classList.remove("bump");
    void scoreBox.offsetWidth;                  // trick: forces the browser to restart the CSS animation
    scoreBox.classList.add("bump");
    setHint("Nice! Continue when you are ready.");
  }, revealDelay * 1000);
});

nextBtn.addEventListener("click", () => {
  sounds.click();
  resultCard.classList.remove("show");

  if (round < ROUNDS) {
    nextRound();
  } else {
    showFinalScreen();
  }
});

function showFinalScreen() {
  const ratio = totalScore / (ROUNDS * MAX_POINTS);
  finalRatingEl.textContent =
    ratio > 0.8 ? "🌍 Globe-trotter!" :
    ratio > 0.5 ? "✈️ Seasoned traveler" :
    ratio > 0.25 ? "🧭 Getting warmer" :
                   "🗺️ Keep exploring";
  finalMaxEl.textContent = `out of ${(ROUNDS * MAX_POINTS).toLocaleString()} points`;

  finalOverlay.classList.add("show");
  animateNumber(finalScoreEl, 0, totalScore, 1500);
  sounds.fanfare();
}

playAgainBtn.addEventListener("click", () => {
  sounds.click();
  finalOverlay.classList.remove("show");
  startGame();
});


// ---------------------------------------------------------------------
// 11. THE ANIMATION LOOP
// ---------------------------------------------------------------------
// Three.js does not redraw on its own. We ask the browser to call `animate`
// before every screen refresh (about 60 times a second), and each time we
// update everything that moves and render the scene from the camera's point of view.
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();    // seconds since the last frame
  elapsed += delta;

  controls.update();                 // needed for damping and auto-rotate
  updateResultAnimation(delta);      // result sequence (flag pop, arc, dot)
  updateFlags();                     // waving cloth + planting bounce
  updateConfirmButton();             // keep the Confirm button above the flag
  renderer.render(scene, camera);
}
animate();


// ---------------------------------------------------------------------
// 12. HANDLE WINDOW RESIZE
// ---------------------------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();   // must be called after changing the camera
  renderer.setSize(container.clientWidth, container.clientHeight);
});


// Let's play!
startGame();
