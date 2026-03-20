class AudioManager {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
    this.musicVolume = 0.15;
    this.sfxVolume = 0.5;
    this.musicPlaying = false;
    this.currentMusic = null;
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) { console.log('Audio not supported'); }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  startAmbient() {
    if (!this.initialized) return;
    this.playBackgroundMusic();
    this.playWindAmbient();
  }

  playBackgroundMusic() {
    if (!this.audioContext || this.musicPlaying) return;
    this.musicPlaying = true;

    const playNote = (freq, startTime, duration, type) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      osc.type = type || 'sine';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 800;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.musicVolume * 0.3, startTime + 0.2);
      gain.gain.setValueAtTime(this.musicVolume * 0.3, startTime + duration - 0.3);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const playLoop = () => {
      if (!this.musicPlaying || !this.audioContext) return;

      const now = this.audioContext.currentTime;
      const notes = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94];
      const minorNotes = [130.81, 155.56, 164.81, 196.00, 207.65, 233.08, 261.63];

      const scale = this.isNightTime ? minorNotes : notes;

      for (let i = 0; i < 8; i++) {
        const note = scale[Math.floor(Math.random() * scale.length)];
        const octave = Math.random() > 0.5 ? 1 : 0.5;
        playNote(note * octave, now + i * 2, 2.5, 'sine');
      }

      // Pad
      playNote(scale[0] * 0.5, now, 16, 'triangle');
      playNote(scale[3] * 0.5, now + 4, 12, 'triangle');

      this.currentMusic = setTimeout(playLoop, 15000);
    };

    playLoop();
  }

  playWindAmbient() {
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { data[i] = (Math.random() * 2 - 1) * 0.01; }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const gain = this.audioContext.createGain();
    gain.gain.value = this.musicVolume * 0.3;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);

    try { source.start(); } catch (e) {}
    this.windGain = gain;
  }

  setNightAmbience(isNight) {
    this.isNightTime = isNight;
    if (this.windGain) {
      const target = isNight ? this.musicVolume * 0.5 : this.musicVolume * 0.2;
      this.windGain.gain.setTargetAtTime(target, this.audioContext.currentTime, 0.5);
    }
  }

  playFootstep() {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'square'; osc.frequency.value = 80 + Math.random() * 40;
    gain.gain.setValueAtTime(this.sfxVolume * 0.1, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
    osc.connect(gain); gain.connect(this.audioContext.destination);
    osc.start(); osc.stop(this.audioContext.currentTime + 0.1);
  }

  playPickup() {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.15);
    gain.gain.setValueAtTime(this.sfxVolume * 0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
    osc.connect(gain); gain.connect(this.audioContext.destination);
    osc.start(); osc.stop(this.audioContext.currentTime + 0.2);
  }

  playDamage() {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = 150;
    gain.gain.setValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
    osc.connect(gain); gain.connect(this.audioContext.destination);
    osc.start(); osc.stop(this.audioContext.currentTime + 0.3);
  }

  playMonsterSound() {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 1);
    gain.gain.setValueAtTime(this.sfxVolume * 0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
    osc.connect(gain); gain.connect(this.audioContext.destination);
    osc.start(); osc.stop(this.audioContext.currentTime + 1);
  }

  playAttackSound(weaponType) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    if (weaponType === 'pistol' || weaponType === 'shotgun') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);
      gain.gain.setValueAtTime(this.sfxVolume * 0.5, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.value = 300;
      gain.gain.setValueAtTime(this.sfxVolume * 0.2, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
    }

    osc.connect(gain); gain.connect(this.audioContext.destination);
    osc.start(); osc.stop(this.audioContext.currentTime + 0.2);
  }

  playBossMusic() {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 55;
    gain.gain.setValueAtTime(this.musicVolume * 0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
    osc.connect(gain); gain.connect(this.audioContext.destination);
    osc.start(); osc.stop(this.audioContext.currentTime + 2);
  }

  playBuildSound() {
    if (!this.audioContext) return;
    for (let i = 0; i < 3; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'square'; osc.frequency.value = 200 + i * 100;
      const t = this.audioContext.currentTime + i * 0.08;
      gain.gain.setValueAtTime(this.sfxVolume * 0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain); gain.connect(this.audioContext.destination);
      osc.start(t); osc.stop(t + 0.08);
    }
  }

  playShopSound() {
    if (!this.audioContext) return;
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = this.audioContext.currentTime + i * 0.1;
      gain.gain.setValueAtTime(this.sfxVolume * 0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain); gain.connect(this.audioContext.destination);
      osc.start(t); osc.stop(t + 0.15);
    });
  }
}