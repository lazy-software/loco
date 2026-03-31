export class AudioManager {
  constructor(train, stationManager) {
    this.train = train;
    this.stationManager = stationManager;
    this.initialized = false;
    this.wasStopped = true;
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
  playDoorChime(isOpen) {
    if (!this.initialized) return;

    const freq = isOpen ? 880 : 660; // 880Hz (A5) for open, 660Hz (E5) for close
    
    const osc = this.audioCtx.createOscillator();
    osc.type = 'sine'; // pure, clean tone for a chime

    const gainNode = this.audioCtx.createGain();
    
    // Attack and decay
    gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.05); // quick fade in
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.2); // smooth ring-out fade

    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 1.5);
  }

  update() {
    if (!this.initialized) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const currentSpeed = Math.abs(this.train.velocity);
    const isStopped = currentSpeed === 0;

    // Announce station perfectly upon halting
    if (isStopped && !this.wasStopped && this.stationManager && window.speechSynthesis) {
      const stationId = this.stationManager.getNearestStation(this.train.t);
      if (stationId) {
        const msg = new SpeechSynthesisUtterance(`This is the Long Island Railroad to Montauk. The next stop is Station ${stationId}.`);
        
        // Find a high-quality human-sounding voice instead of the default robot
        const voices = window.speechSynthesis.getVoices();
        const bestVoice = voices.find(v => 
          v.name.includes('Google US English') || 
          v.name.includes('Samantha') || // macOS
          v.name.includes('Zira') ||     // Windows
          v.name.includes('Serena') || 
          (v.lang === 'en-US' && v.name.includes('Female'))
        );
        
        if (bestVoice) msg.voice = bestVoice;
        
        msg.rate = 0.85; // Slight slow down for transit announcer cadence
        msg.pitch = 1.1;
        window.speechSynthesis.speak(msg);
      }
    }
    this.wasStopped = isStopped;
    
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
