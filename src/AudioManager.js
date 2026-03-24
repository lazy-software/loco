export class AudioManager {
  constructor(train) {
    this.train = train;
    this.initialized = false;
    this.audioCtx = null;
    this.masterGain = null;
    
    // Engine state
    this.engineOsc = null;
    this.engineGain = null;

    // Clack state
    this.lastClackDist = 0;
    this.clackInterval = 12; // Play a clack sound every 12 meters
    this.noiseBuffer = null;
  }

  init() {
    if (this.initialized) return;
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();
    
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.connect(this.audioCtx.destination);
    this.masterGain.gain.value = 0.5; // Global volume

    // 1. Procedural Engine Humming
    this.engineOsc = this.audioCtx.createOscillator();
    this.engineOsc.type = 'triangle'; // Smooth electric motor style
    this.engineOsc.frequency.value = 40; 
    
    this.engineGain = this.audioCtx.createGain();
    this.engineGain.gain.value = 0; 

    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineOsc.start();

    // 2. Procedural Wheel Clack (Burst of white noise parsed through low-pass EQ)
    const bufferSize = this.audioCtx.sampleRate * 0.1; // 0.1 seconds
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1; // Pure White Noise
    }
    this.noiseBuffer = buffer;

    this.initialized = true;
  }

  playClack() {
    if (!this.initialized) return;
    
    const source = this.audioCtx.createBufferSource();
    source.buffer = this.noiseBuffer;
    
    // Lowpass filter drops the hiss off white-noise to sound like deep heavy metal bumping
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600; 
    
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.8, this.audioCtx.currentTime);
    // Immediate decay so it sounds like a sharp fast "clack" and doesn't echo
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
    
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    source.start();
  }

  update() {
    if (!this.initialized) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const currentSpeed = Math.abs(this.train.velocity);
    
    // Link pitch directly to the physics velocity!
    const targetFreq = 40 + (currentSpeed * 4);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.1);
    
    const targetVolume = Math.min(0.6, 0.05 + currentSpeed * 0.02); 
    this.engineGain.gain.setTargetAtTime(targetVolume, this.audioCtx.currentTime, 0.1);

    // Track the physical odometer to perfectly trigger the clacks exactly when rolling over ties
    // Odometer prevents loop wrapping/teleport glitches
    if (this.train.odometer - this.lastClackDist >= this.clackInterval) {
        this.playClack();
        this.lastClackDist += this.clackInterval;
    }
  }
}
