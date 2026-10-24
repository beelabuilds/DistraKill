const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function createWavHeader(numSamples) {
  const byteRate = SAMPLE_RATE * 2; // 16-bit mono = 2 bytes/sample
  const blockAlign = 2;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22); // NumChannels (1 = mono)
  buffer.writeUInt32LE(SAMPLE_RATE, 24); // SampleRate
  buffer.writeUInt32LE(byteRate, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

function writeWavFile(filePath, samples) {
  const numSamples = samples.length;
  const header = createWavHeader(numSamples);
  const data = Buffer.alloc(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    // Clamp to 16-bit signed range [-32768, 32767]
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const intSample = Math.round(clamped * 32760);
    data.writeInt16LE(intSample, i * 2);
  }

  const completeWav = Buffer.concat([header, data]);
  fs.writeFileSync(filePath, completeWav);
  console.log(`Generated: ${filePath} (${(completeWav.length / 1024).toFixed(1)} KB)`);
}

// 1. Zen Singing Bowl (6.5s) - Deep fundamental with rich harmonic overtone swell & long natural decay
function generateZenBowl() {
  const duration = 6.5;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  const f0 = 432; // A4 (Verdi tuning)
  const f1 = f0 * 2.76; // Harmonic overtone
  const f2 = f0 * 5.4; // Shimmer overtone

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Exponential decay envelope
    const env0 = Math.exp(-t * 0.75);
    const env1 = Math.exp(-t * 1.2) * 0.45;
    const env2 = Math.exp(-t * 2.2) * 0.25;

    // Gentle strike transient at t = 0
    const attack = Math.min(1, t / 0.04);

    // Warm vibrato modulation
    const vibrato = Math.sin(2 * Math.PI * 5.2 * t) * 1.5;

    const s0 = Math.sin(2 * Math.PI * (f0 + vibrato) * t) * env0;
    const s1 = Math.sin(2 * Math.PI * (f1 + vibrato * 1.2) * t) * env1;
    const s2 = Math.sin(2 * Math.PI * f2 * t) * env2;

    // Secondary strike at t = 2.2s for a two-stage meditative ring
    let sExtra = 0;
    if (t > 2.2) {
      const t2 = t - 2.2;
      const envExtra = Math.exp(-t2 * 0.8) * Math.min(1, t2 / 0.03);
      sExtra = Math.sin(2 * Math.PI * (f0 * 1.5) * t2) * envExtra * 0.55;
    }

    samples[i] = (s0 * 0.5 + s1 * 0.25 + s2 * 0.15 + sExtra * 0.3) * attack;
  }
  return samples;
}

// 2. Marimba Delight (6.0s) - Upbeat 8-note ascending melody with warm wooden resonance
function generateMarimbaDelight() {
  const duration = 6.0;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  // Pentatonic notes: C5, D5, E5, G5, A5, C6, D6, E6
  const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
  const noteDuration = 0.36; // spacing between notes

  for (let noteIdx = 0; noteIdx < notes.length; noteIdx++) {
    const freq = notes[noteIdx];
    const startTime = noteIdx * noteDuration;

    for (let i = 0; i < numSamples; i++) {
      const t = i / SAMPLE_RATE;
      if (t >= startTime) {
        const dt = t - startTime;
        // Marimba attack: quick strike, wooden thump + fundamental
        const attack = Math.min(1, dt / 0.005);
        const decay = Math.exp(-dt * 3.5);
        // Overtone (4x fundamental with rapid decay)
        const overtone = Math.sin(2 * Math.PI * freq * 3.9 * dt) * Math.exp(-dt * 12) * 0.3;
        const fundamental = Math.sin(2 * Math.PI * freq * dt);

        samples[i] += (fundamental + overtone) * decay * attack * 0.28;
      }
    }
  }

  // Final sustained chord at t = 3.2s
  const finalChord = [523.25, 659.25, 783.99, 1046.5];
  for (const f of finalChord) {
    for (let i = 0; i < numSamples; i++) {
      const t = i / SAMPLE_RATE;
      if (t >= 3.2) {
        const dt = t - 3.2;
        const decay = Math.exp(-dt * 1.4);
        samples[i] += Math.sin(2 * Math.PI * f * dt) * decay * 0.16;
      }
    }
  }

  return samples;
}

// 3. Celestial Harp (6.5s) - Flowing celestial arpeggio with shimmering decay
function generateCelestialHarp() {
  const duration = 6.5;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  // Arpeggio notes (F# minor 9 / Pentatonic): F#4, A4, C#5, E5, G#5, C#6
  const notes = [369.99, 440.0, 554.37, 659.25, 830.61, 1108.73];
  const delay = 0.28;

  for (let n = 0; n < notes.length; n++) {
    const freq = notes[n];
    const start = n * delay;

    for (let i = 0; i < numSamples; i++) {
      const t = i / SAMPLE_RATE;
      if (t >= start) {
        const dt = t - start;
        const attack = Math.min(1, dt / 0.015);
        const decay = Math.exp(-dt * 1.2);
        // Plucked string harmonic series
        const h1 = Math.sin(2 * Math.PI * freq * dt);
        const h2 = Math.sin(2 * Math.PI * freq * 2 * dt) * 0.4;
        const h3 = Math.sin(2 * Math.PI * freq * 3 * dt) * 0.15;

        samples[i] += (h1 + h2 + h3) * decay * attack * 0.25;
      }
    }
  }

  // Echo flourish at t = 2.4s
  const echoNotes = [830.61, 1108.73, 1318.51];
  for (let e = 0; e < echoNotes.length; e++) {
    const freq = echoNotes[e];
    const start = 2.4 + e * 0.22;
    for (let i = 0; i < numSamples; i++) {
      const t = i / SAMPLE_RATE;
      if (t >= start) {
        const dt = t - start;
        const decay = Math.exp(-dt * 1.1);
        samples[i] += Math.sin(2 * Math.PI * freq * dt) * decay * 0.18;
      }
    }
  }

  return samples;
}

// 4. Digital Pulse (5.5s) - Modern futuristic rhythmic focus alert
function generateDigitalPulse() {
  const duration = 5.5;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  // 4 pulse bursts spaced 0.8s apart
  const pulses = [
    { start: 0.0, freqs: [660, 880] },
    { start: 0.7, freqs: [660, 990] },
    { start: 1.4, freqs: [770, 1100] },
    { start: 2.1, freqs: [880, 1320] },
    { start: 2.8, freqs: [880, 1320, 1760] },
  ];

  for (const pulse of pulses) {
    for (let i = 0; i < numSamples; i++) {
      const t = i / SAMPLE_RATE;
      if (t >= pulse.start && t < pulse.start + 0.6) {
        const dt = t - pulse.start;
        const env = Math.sin(Math.PI * (dt / 0.6)); // Smooth bell curve pulse
        let pulseVal = 0;
        for (const f of pulse.freqs) {
          // Soft triangle/sine blend
          pulseVal += (Math.sin(2 * Math.PI * f * dt) + 0.3 * Math.sin(6 * Math.PI * f * dt)) * 0.18;
        }
        samples[i] += pulseVal * env;
      }
    }
  }

  return samples;
}

// 5. Gentle Wind Chimes (6.5s) - Relaxing ambient metallic chime chords
function generateWindChimes() {
  const duration = 6.5;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  // High metallic chimes
  const chimes = [
    { time: 0.0, freq: 1174.66 }, // D6
    { time: 0.25, freq: 1396.91 }, // F6
    { time: 0.6, freq: 1760.0 }, // A6
    { time: 1.1, freq: 2093.0 }, // C7
    { time: 1.7, freq: 1760.0 }, // A6
    { time: 2.3, freq: 1396.91 }, // F6
    { time: 2.8, freq: 1174.66 }, // D6
    { time: 3.4, freq: 2349.32 }, // D7 shimmer
  ];

  for (const chime of chimes) {
    for (let i = 0; i < numSamples; i++) {
      const t = i / SAMPLE_RATE;
      if (t >= chime.time) {
        const dt = t - chime.time;
        const decay = Math.exp(-dt * 1.8);
        const attack = Math.min(1, dt / 0.008);
        // Pure chime with high harmonic overtone
        const chimeWave =
          Math.sin(2 * Math.PI * chime.freq * dt) * 0.7 +
          Math.sin(2 * Math.PI * chime.freq * 2.756 * dt) * 0.3;
        samples[i] += chimeWave * decay * attack * 0.22;
      }
    }
  }

  return samples;
}

// Main execution
const outDir = path.join(__dirname, '..', 'assets', 'sounds');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating high-quality focus timer ringtones in:', outDir);
writeWavFile(path.join(outDir, 'zen_bowl.wav'), generateZenBowl());
writeWavFile(path.join(outDir, 'marimba_delight.wav'), generateMarimbaDelight());
writeWavFile(path.join(outDir, 'celestial_harp.wav'), generateCelestialHarp());
writeWavFile(path.join(outDir, 'digital_pulse.wav'), generateDigitalPulse());
writeWavFile(path.join(outDir, 'gentle_chimes.wav'), generateWindChimes());

console.log('All ringtones generated successfully!');
