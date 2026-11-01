import fs from 'fs';
import { execSync } from 'child_process';

const sampleRate = 44100;
const stepDuration = 0.20; // 200ms
const totalSteps = 96;
const totalDuration = totalSteps * stepDuration; // 19.2 seconds
const totalSamples = Math.floor(sampleRate * totalDuration);

const melodyPattern = [
  // Movement A: Playful Carnival Hook (0-23)
  523.25, 659.25, 783.99, 659.25,
  880.00, 783.99, 659.25, 523.25,
  587.33, 659.25, 587.33, 440.00,
  523.25, 0,      659.25, 783.99,
  880.00, 1046.5, 880.00, 783.99,
  659.25, 783.99, 587.33, 523.25,

  // Movement B: Uplifting Soaring Chorus (24-47)
  783.99, 880.00, 1046.5, 1174.66,
  1318.51, 1174.66, 1046.5, 880.00,
  698.46, 783.99, 880.00, 1046.5,
  987.77, 880.00, 783.99, 0,
  783.99, 1046.5, 1174.66, 1318.51,
  1567.98, 1318.51, 1174.66, 1046.5,

  // Movement C: Funky Syncopated Bridge (48-71)
  659.25, 0,      659.25, 783.99,
  587.33, 0,      587.33, 659.25,
  523.25, 587.33, 659.25, 523.25,
  440.00, 493.88, 523.25, 587.33,
  659.25, 783.99, 880.00, 1046.5,
  1174.66, 987.77, 880.00, 783.99,

  // Movement D: Fairytale Music Box Cadence (72-95)
  1046.5, 0,      1318.51, 0,
  1174.66, 0,     987.77, 0,
  880.00, 1046.5, 783.99, 659.25,
  587.33, 659.25, 783.99, 880.00,
  1046.5, 1174.66, 1318.51, 1567.98,
  1318.51, 1174.66, 1046.5, 0
];

const glockPattern = [
  0, 1046.5, 0, 1318.51, 0, 1567.98, 0, 1318.51,
  0, 1174.66, 0, 1046.5, 0, 880.00, 0, 1046.5,
  0, 1318.51, 0, 1567.98, 0, 1760.00, 0, 1567.98,

  1567.98, 0, 1760.00, 0, 2093.00, 0, 1760.00, 0,
  1396.91, 0, 1567.98, 0, 1760.00, 0, 1396.91, 0,
  1567.98, 0, 2093.00, 0, 2349.32, 0, 2093.00, 0,

  1318.51, 0, 0, 1567.98, 1174.66, 0, 0, 1318.51,
  1046.5, 0, 1174.66, 0, 1318.51, 0, 1046.5, 0,
  880.00, 0, 1046.5, 0, 1174.66, 0, 1318.51, 0,

  2093.00, 1760.00, 1567.98, 1318.51, 1760.00, 1567.98, 1318.51, 1174.66,
  1567.98, 1318.51, 1174.66, 1046.5, 1318.51, 1174.66, 1046.5, 880.00,
  1046.5, 1318.51, 1567.98, 2093.00, 1567.98, 1318.51, 1046.5, 0
];

const harmonyPattern = [
  329.63, 0, 392.00, 0, 329.63, 0, 261.63, 0,
  293.66, 0, 329.63, 0, 261.63, 0, 220.00, 0,
  440.00, 0, 523.25, 0, 392.00, 0, 329.63, 0,

  392.00, 0, 440.00, 0, 523.25, 0, 392.00, 0,
  349.23, 0, 392.00, 0, 440.00, 0, 349.23, 0,
  392.00, 0, 523.25, 0, 587.33, 0, 392.00, 0,

  329.63, 0, 392.00, 0, 293.66, 0, 329.63, 0,
  261.63, 0, 329.63, 0, 220.00, 0, 261.63, 0,
  329.63, 0, 392.00, 0, 440.00, 0, 523.25, 0,

  523.25, 0, 659.25, 0, 587.33, 0, 493.88, 0,
  440.00, 0, 523.25, 0, 392.00, 0, 329.63, 0,
  293.66, 0, 392.00, 0, 523.25, 0, 261.63, 0
];

const bassPattern = [
  130.81, 130.81, 196.00, 130.81,
  110.00, 110.00, 164.81, 110.00,
  87.31,  87.31,  130.81, 87.31,
  98.00,  98.00,  146.83, 98.00,
  130.81, 130.81, 196.00, 130.81,
  110.00, 110.00, 164.81, 110.00,

  130.81, 196.00, 130.81, 196.00,
  110.00, 164.81, 110.00, 164.81,
  87.31,  130.81, 87.31,  130.81,
  98.00,  146.83, 98.00,  146.83,
  130.81, 196.00, 130.81, 196.00,
  87.31,  130.81, 98.00,  146.83,

  130.81, 130.81, 164.81, 196.00,
  98.00,  98.00,  123.47, 146.83,
  110.00, 110.00, 130.81, 164.81,
  87.31,  87.31,  110.00, 130.81,
  130.81, 164.81, 196.00, 261.63,
  98.00,  123.47, 146.83, 196.00,

  130.81, 0,      164.81, 0,
  98.00,  0,      146.83, 0,
  110.00, 0,      164.81, 0,
  87.31,  0,      130.81, 0,
  130.81, 164.81, 196.00, 261.63,
  130.81, 130.81, 130.81, 0
];

const leftChannel = new Float32Array(totalSamples);
const rightChannel = new Float32Array(totalSamples);

function triangleWave(phase) {
  const norm = (phase % (2 * Math.PI)) / (2 * Math.PI);
  return 4 * Math.abs(norm - 0.5) - 1;
}

function sineWave(phase) {
  return Math.sin(phase);
}

for (let step = 0; step < totalSteps; step++) {
  const stepStartTime = step * stepDuration;
  const startSample = Math.floor(stepStartTime * sampleRate);

  // 1. Marimba Melody (triangle wave)
  const melFreq = melodyPattern[step];
  if (melFreq > 0) {
    const noteDuration = 0.18;
    const noteSamples = Math.floor(noteDuration * sampleRate);
    for (let i = 0; i < noteSamples; i++) {
      const idx = (startSample + i) % totalSamples;
      const t = i / sampleRate;
      const env = Math.exp(-t * 22) * 0.18;
      const sample = triangleWave(2 * Math.PI * melFreq * t) * env;
      leftChannel[idx] += sample * 0.85;
      rightChannel[idx] += sample * 0.85;
    }
  }

  // 2. Glockenspiel Counter-melody (sine wave, slightly panned right)
  const glockFreq = glockPattern[step];
  if (glockFreq > 0) {
    const noteDuration = 0.16;
    const noteSamples = Math.floor(noteDuration * sampleRate);
    for (let i = 0; i < noteSamples; i++) {
      const idx = (startSample + i) % totalSamples;
      const t = i / sampleRate;
      const env = Math.exp(-t * 24) * 0.08;
      const sample = sineWave(2 * Math.PI * glockFreq * t) * env;
      leftChannel[idx] += sample * 0.6;
      rightChannel[idx] += sample * 0.95;
    }
  }

  // 3. Harmony Chords (triangle wave, slightly panned left)
  const harmFreq = harmonyPattern[step];
  if (harmFreq > 0) {
    const noteDuration = 0.18;
    const noteSamples = Math.floor(noteDuration * sampleRate);
    for (let i = 0; i < noteSamples; i++) {
      const idx = (startSample + i) % totalSamples;
      const t = i / sampleRate;
      const env = Math.exp(-t * 20) * 0.09;
      const sample = triangleWave(2 * Math.PI * harmFreq * t) * env;
      leftChannel[idx] += sample * 0.95;
      rightChannel[idx] += sample * 0.6;
    }
  }

  // 4. Upright Bass (Every 2 beats)
  if (step % 2 === 0) {
    const bassFreq = bassPattern[step % bassPattern.length];
    if (bassFreq > 0) {
      const noteDuration = 0.20;
      const noteSamples = Math.floor(noteDuration * sampleRate);
      for (let i = 0; i < noteSamples; i++) {
        const idx = (startSample + i) % totalSamples;
        const t = i / sampleRate;
        // Pitch sweep
        const sweepFreq = bassFreq * (1.04 - 0.04 * Math.min(1, t / 0.04));
        const env = Math.exp(-t * 18) * 0.22;
        const sample = sineWave(2 * Math.PI * sweepFreq * t) * env;
        leftChannel[idx] += sample * 0.9;
        rightChannel[idx] += sample * 0.9;
      }
    }
  }
}

// Normalize & write 16-bit WAV
let maxAmp = 0;
for (let i = 0; i < totalSamples; i++) {
  maxAmp = Math.max(maxAmp, Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
}
const normFactor = maxAmp > 0 ? 0.88 / maxAmp : 1;

const wavBuffer = Buffer.alloc(44 + totalSamples * 4);
wavBuffer.write('RIFF', 0);
wavBuffer.writeUInt32LE(36 + totalSamples * 4, 4);
wavBuffer.write('WAVE', 8);
wavBuffer.write('fmt ', 12);
wavBuffer.writeUInt32LE(16, 16); // subchunk1 size
wavBuffer.writeUInt16LE(1, 20);  // PCM
wavBuffer.writeUInt16LE(2, 22);  // Stereo 2 channels
wavBuffer.writeUInt32LE(sampleRate, 24);
wavBuffer.writeUInt32LE(sampleRate * 4, 28); // byte rate
wavBuffer.writeUInt16LE(4, 32);  // block align
wavBuffer.writeUInt16LE(16, 34); // bits per sample
wavBuffer.write('data', 36);
wavBuffer.writeUInt32LE(totalSamples * 4, 40);

let offset = 44;
for (let i = 0; i < totalSamples; i++) {
  const l = Math.max(-1, Math.min(1, leftChannel[i] * normFactor));
  const r = Math.max(-1, Math.min(1, rightChannel[i] * normFactor));
  wavBuffer.writeInt16LE(Math.floor(l * 32767), offset);
  wavBuffer.writeInt16LE(Math.floor(r * 32767), offset + 2);
  offset += 4;
}

const rawWavPath = '/tmp/bgm_temp.wav';
fs.writeFileSync(rawWavPath, wavBuffer);

// Encode to MP3 using ffmpeg
const outputMp3 = 'public/assets/bgm_fantasy.mp3';
execSync(`ffmpeg -y -i ${rawWavPath} -codec:a libmp3lame -b:a 128k ${outputMp3}`);
console.log(`Successfully generated ${outputMp3} (${fs.statSync(outputMp3).size} bytes)`);
fs.unlinkSync(rawWavPath);
