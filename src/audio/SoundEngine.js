// ---------------------------------------------------------------------
//  SOUND ENGINE
//  Every effect is synthesised with the Web Audio API, so there are no
//  audio files to download. The signal chain is:
//
//    voice -> stereo panner -> dry bus ---------------------.
//          \-> reverb send -> convolution reverb -> wet bus --+-> master
//                                                              -> compressor
//                                                              -> speakers
//
//  Sounds are built from three primitives:
//    tone()   a filtered oscillator with a pitch glide
//    noise()  filtered white noise (whooshes, taps, air)
//    bell()   stacked inharmonic partials (chimes, dings, fanfares)
// ---------------------------------------------------------------------

const STORAGE_KEY = 'geoguess.muted'
const MASTER_VOLUME = 0.85

// MIDI-style note helpers keep the musical cues readable.
const NOTE = {
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5,
  E6: 1318.51,
  G6: 1567.98,
}

class SoundEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.reverbSend = null
    this.noiseBuffer = null

    this.muted = false
    try {
      this.muted = window.localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      this.muted = false
    }
  }

  get isMuted() {
    return this.muted
  }

  unlock() {
    const ctx = this.ensure()
    if (ctx && ctx.state === 'suspended') ctx.resume()
  }

  setMuted(muted) {
    this.muted = Boolean(muted)
    try {
      window.localStorage.setItem(STORAGE_KEY, this.muted ? '1' : '0')
    } catch {
      // Storage can be unavailable in private mode - ignore.
    }

    if (this.ctx && this.master) {
      const now = this.ctx.currentTime
      this.master.gain.cancelScheduledValues(now)
      this.master.gain.setTargetAtTime(this.muted ? 0 : MASTER_VOLUME, now, 0.04)
    }

    if (!this.muted) this.unlock()
  }

  // ------------------------------------------------------------------
  //  GRAPH
  // ------------------------------------------------------------------
  ensure() {
    if (this.ctx) return this.ctx

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null

    const ctx = new AudioContextClass()

    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -16
    compressor.knee.value = 22
    compressor.ratio.value = 3
    compressor.attack.value = 0.004
    compressor.release.value = 0.24
    compressor.connect(ctx.destination)

    this.master = ctx.createGain()
    this.master.gain.value = this.muted ? 0 : MASTER_VOLUME
    this.master.connect(compressor)

    // A generated impulse response gives the sounds a little space without
    // shipping an .mp3 reverb tail.
    const convolver = ctx.createConvolver()
    convolver.buffer = this.makeImpulse(ctx, 2.3, 2.6)

    const wet = ctx.createGain()
    wet.gain.value = 0.34
    convolver.connect(wet)
    wet.connect(this.master)

    this.reverbSend = ctx.createGain()
    this.reverbSend.gain.value = 0.5
    this.reverbSend.connect(convolver)

    this.noiseBuffer = this.makeNoise(ctx, 2)

    this.ctx = ctx
    return ctx
  }

  makeImpulse(ctx, seconds, decay) {
    const rate = ctx.sampleRate
    const length = Math.floor(rate * seconds)
    const impulse = ctx.createBuffer(2, length, rate)

    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel)
      let smoothed = 0
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1
        smoothed = smoothed * 0.74 + white * 0.26
        data[i] = smoothed * Math.pow(1 - i / length, decay)
      }
    }

    return impulse
  }

  makeNoise(ctx, seconds) {
    const length = Math.floor(ctx.sampleRate * seconds)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
    return buffer
  }

  connectOut(node, reverb, pan) {
    const ctx = this.ctx
    let tail = node

    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner()
      panner.pan.value = Math.max(-1, Math.min(1, pan || 0))
      node.connect(panner)
      tail = panner
    }

    tail.connect(this.master)

    if (reverb > 0 && this.reverbSend) {
      const send = ctx.createGain()
      send.gain.value = reverb
      tail.connect(send)
      send.connect(this.reverbSend)
    }
  }

  // ------------------------------------------------------------------
  //  PRIMITIVES
  // ------------------------------------------------------------------
  tone({
    freq,
    endFreq = freq,
    duration = 0.2,
    type = 'sine',
    volume = 0.15,
    delay = 0,
    attack = 0.008,
    filter = 0,
    filterEnd = 0,
    q = 0.8,
    reverb = 0.16,
    pan = 0,
    detune = 0,
  }) {
    if (this.muted) return
    const ctx = this.ensure()
    if (!ctx) return

    const start = ctx.currentTime + Math.max(delay, 0)
    const safeDuration = Math.max(duration, 0.02)
    const safeAttack = Math.min(Math.max(attack, 0.003), safeDuration * 0.6)
    const peak = Math.max(volume, 0.0002)

    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(Math.max(freq, 1), start)
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), start + safeDuration)
    }
    osc.detune.value = detune + (Math.random() * 2 - 1) * 3

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + safeAttack)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + safeDuration)

    let tail = osc
    if (filter) {
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.Q.value = q
      lowpass.frequency.setValueAtTime(filter, start)
      if (filterEnd) {
        lowpass.frequency.exponentialRampToValueAtTime(
          Math.max(filterEnd, 20),
          start + safeDuration,
        )
      }
      osc.connect(lowpass)
      tail = lowpass
    }

    tail.connect(gain)
    this.connectOut(gain, reverb, pan)

    osc.start(start)
    osc.stop(start + safeDuration + 0.06)
  }

  noise({
    from = 900,
    to = 2200,
    duration = 0.25,
    volume = 0.12,
    delay = 0,
    q = 1.1,
    type = 'bandpass',
    attack = 0.02,
    reverb = 0.18,
    pan = 0,
  }) {
    if (this.muted) return
    const ctx = this.ensure()
    if (!ctx) return

    const start = ctx.currentTime + Math.max(delay, 0)
    const safeDuration = Math.max(duration, 0.02)
    const safeAttack = Math.min(Math.max(attack, 0.002), safeDuration * 0.7)

    const source = ctx.createBufferSource()
    source.buffer = this.noiseBuffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.Q.value = q
    filter.frequency.setValueAtTime(Math.max(from, 20), start)
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(to, 20),
      start + safeDuration,
    )

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), start + safeAttack)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + safeDuration)

    source.connect(filter)
    filter.connect(gain)
    this.connectOut(gain, reverb, pan)

    source.start(start, Math.random() * 0.8)
    source.stop(start + safeDuration + 0.06)
  }

  bell(freq, { volume = 0.14, delay = 0, ring = 1.4, pan = 0, reverb = 0.36 } = {}) {
    // Inharmonic ratios give a metallic, bell-like character. [ratio, amp, life]
    const partials = [
      [1, 1, 1],
      [2.01, 0.42, 0.78],
      [3.03, 0.22, 0.52],
      [4.19, 0.12, 0.36],
      [5.43, 0.06, 0.24],
    ]

    partials.forEach(([ratio, amp, life]) => {
      this.tone({
        freq: freq * ratio,
        duration: ring * life,
        type: 'sine',
        volume: volume * amp,
        delay,
        attack: 0.006,
        filter: 9000,
        reverb,
        pan,
      })
    })
  }

  chord(notes, { volume = 0.12, delay = 0, ring = 1.8, spread = 0, pan = 0 } = {}) {
    notes.forEach((freq, index) => {
      this.bell(freq, {
        volume,
        delay: delay + spread * index,
        ring,
        pan: pan + (index - (notes.length - 1) / 2) * 0.08,
      })
    })
  }

  // ------------------------------------------------------------------
  //  GAME EFFECTS
  // ------------------------------------------------------------------

  // Soft interface tick.
  click() {
    this.tone({
      freq: 940,
      endFreq: 660,
      duration: 0.06,
      type: 'triangle',
      volume: 0.07,
      attack: 0.003,
      reverb: 0.04,
    })
    this.noise({
      from: 4200,
      to: 2600,
      duration: 0.03,
      volume: 0.022,
      q: 1.4,
      reverb: 0,
    })
  }

  // The opening swoosh when the player starts a game.
  start() {
    this.noise({
      from: 420,
      to: 3200,
      duration: 0.6,
      volume: 0.075,
      q: 0.9,
      attack: 0.12,
      reverb: 0.4,
    })
    this.bell(NOTE.C5, { volume: 0.1, delay: 0.4, ring: 1.3 })
    this.bell(NOTE.G5, { volume: 0.075, delay: 0.5, ring: 1.5 })
    this.bell(NOTE.C6, { volume: 0.055, delay: 0.62, ring: 1.6 })
  }

  // Airy transition into a fresh round.
  roundStart() {
    this.noise({
      from: 2800,
      to: 440,
      duration: 0.55,
      volume: 0.045,
      q: 1.2,
      attack: 0.05,
      reverb: 0.3,
    })
    this.bell(NOTE.G6, { volume: 0.05, delay: 0.24, ring: 0.7 })
  }

  // Pin planted on the globe: sub thump + fabric snap + small chime.
  pin() {
    this.tone({
      freq: 165,
      endFreq: 52,
      duration: 0.22,
      type: 'sine',
      volume: 0.3,
      attack: 0.004,
      reverb: 0.08,
    })
    this.noise({
      from: 2400,
      to: 700,
      duration: 0.08,
      volume: 0.11,
      q: 0.9,
      reverb: 0.05,
    })
    this.bell(NOTE.E6, { volume: 0.055, delay: 0.025, ring: 0.55 })
    this.tone({
      freq: 2100,
      endFreq: 1500,
      duration: 0.05,
      type: 'triangle',
      volume: 0.035,
      delay: 0.01,
      reverb: 0.1,
    })
  }

  // Confirm guess: a rising whoosh with a bright two-tone lift.
  confirm() {
    this.noise({
      from: 320,
      to: 4200,
      duration: 0.5,
      volume: 0.1,
      q: 0.9,
      attack: 0.04,
      reverb: 0.32,
    })
    this.tone({
      freq: 220,
      endFreq: 880,
      duration: 0.44,
      type: 'triangle',
      volume: 0.06,
      attack: 0.05,
      reverb: 0.24,
    })
    this.tone({
      freq: 440,
      endFreq: 1320,
      duration: 0.46,
      type: 'sine',
      volume: 0.045,
      attack: 0.08,
      reverb: 0.3,
    })
    this.bell(NOTE.E5, { volume: 0.07, delay: 0.3, ring: 0.9 })
    this.bell(NOTE.A5, { volume: 0.055, delay: 0.4, ring: 1.1 })
  }

  // Answer flag popping into existence.
  pop(delay = 0) {
    this.tone({
      freq: 300,
      endFreq: 980,
      duration: 0.13,
      type: 'sine',
      volume: 0.11,
      delay,
      attack: 0.004,
      reverb: 0.2,
    })
    this.bell(NOTE.G6, { volume: 0.07, delay: delay + 0.02, ring: 0.65 })
  }

  // Sparkle that runs while the arc is drawn.
  arc(delay = 0, duration = 1.5) {
    this.noise({
      from: 700,
      to: 5200,
      duration,
      volume: 0.04,
      q: 2.4,
      delay,
      attack: 0.1,
      reverb: 0.42,
    })
    this.tone({
      freq: 300,
      endFreq: 1500,
      duration,
      type: 'sine',
      volume: 0.02,
      delay,
      attack: 0.2,
      reverb: 0.35,
    })
  }

  // End of round stinger. The tier decides the melody.
  result(tier = 'okay') {
    if (tier === 'great') {
      const melody = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6]
      melody.forEach((freq, index) => {
        this.bell(freq, { volume: 0.13, delay: index * 0.085, ring: 1.6 })
      })
      this.noise({
        from: 2400,
        to: 7200,
        duration: 0.9,
        volume: 0.03,
        q: 3,
        delay: 0.1,
        attack: 0.15,
        reverb: 0.5,
      })
      return
    }

    if (tier === 'okay') {
      this.bell(NOTE.E5, { volume: 0.12, delay: 0, ring: 1.1 })
      this.bell(NOTE.G5, { volume: 0.1, delay: 0.14, ring: 1.3 })
      this.bell(NOTE.C6, { volume: 0.07, delay: 0.3, ring: 1.5 })
      return
    }

    // Far away: a gentle descending figure with a soft landing thud.
    const fall = [NOTE.A4, NOTE.F4, NOTE.D4]
    fall.forEach((freq, index) => {
      this.tone({
        freq,
        endFreq: freq * 0.93,
        duration: 0.34,
        type: 'sawtooth',
        volume: 0.075,
        delay: index * 0.22,
        attack: 0.02,
        filter: 900,
        filterEnd: 500,
        reverb: 0.2,
      })
    })
    this.tone({
      freq: 110,
      endFreq: 48,
      duration: 0.32,
      type: 'sine',
      volume: 0.16,
      delay: 0.6,
      attack: 0.01,
      reverb: 0.1,
    })
  }

  // Final screen celebration.
  fanfare() {
    const melody = [NOTE.C5, NOTE.C5, NOTE.G5, NOTE.E5, NOTE.G5]
    melody.forEach((freq, index) => {
      this.bell(freq, { volume: 0.12, delay: index * 0.14, ring: 1.4 })
    })

    this.chord([NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5], {
      volume: 0.09,
      delay: 0.78,
      ring: 2.4,
      spread: 0.015,
    })
    this.tone({
      freq: NOTE.C3,
      endFreq: NOTE.C3,
      duration: 1.2,
      type: 'sine',
      volume: 0.1,
      delay: 0.78,
      attack: 0.03,
      reverb: 0.2,
    })
    this.noise({
      from: 1800,
      to: 6000,
      duration: 1.1,
      volume: 0.025,
      q: 3,
      delay: 0.75,
      attack: 0.2,
      reverb: 0.55,
    })
  }

  damage() {
    this.tone({
      freq: 180,
      endFreq: 55,
      duration: 0.28,
      type: 'triangle',
      volume: 0.22,
      attack: 0.005,
      reverb: 0.25,
    })
    this.noise({
      from: 1400,
      to: 200,
      duration: 0.22,
      volume: 0.12,
      attack: 0.01,
      reverb: 0.2,
    })
  }

  countdownTick() {
    this.tone({
      freq: 680,
      endFreq: 640,
      duration: 0.04,
      type: 'sine',
      volume: 0.06,
      attack: 0.002,
    })
  }

  duelStart() {
    const notes = [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5]
    notes.forEach((freq, index) => {
      this.bell(freq, { volume: 0.12, delay: index * 0.09, ring: 1.2 })
    })
  }
}

export const sound = new SoundEngine()
