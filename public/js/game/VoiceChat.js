class VoiceChat {
  constructor(networkManager) {
    this.network = networkManager;
    this.enabled = false;
    this.localStream = null;
    this.peers = new Map();
    this.isMuted = false;

    this.setupSignaling();
  }

  setupSignaling() {
    if (!this.network.socket) return;

    this.network.socket.on('voiceOffer', async (data) => {
      if (!this.enabled) return;
      await this.handleOffer(data.from, data.offer);
    });

    this.network.socket.on('voiceAnswer', async (data) => {
      const peer = this.peers.get(data.from);
      if (peer && peer.connection) {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    this.network.socket.on('voiceIceCandidate', async (data) => {
      const peer = this.peers.get(data.from);
      if (peer && peer.connection) {
        await peer.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    this.network.socket.on('voiceUserJoined', (data) => {
      if (this.enabled) this.connectToPeer(data.userId);
    });

    this.network.socket.on('voiceUserLeft', (data) => {
      this.removePeer(data.userId);
    });
  }

  async toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      await this.enable();
    }
    this.updateUI();
    return this.enabled;
  }

  async enable() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.enabled = true;
      this.network.socket.emit('voiceJoin');
      this.updateUI();

    } catch (err) {
      console.log('Microphone access denied:', err.message);
      this.showError('Microphone access denied! Check browser permissions.');
      this.enabled = false;
    }
  }

  disable() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.peers.forEach((peer) => {
      if (peer.connection) peer.connection.close();
    });
    this.peers.clear();

    this.enabled = false;
    this.network.socket.emit('voiceLeave');
    this.updateUI();
  }

  async connectToPeer(userId) {
    if (this.peers.has(userId)) return;

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    peerConnection.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play().catch(() => {});

      const peer = this.peers.get(userId);
      if (peer) peer.audio = audio;
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.network.socket.emit('voiceIceCandidate', {
          to: userId,
          candidate: event.candidate
        });
      }
    };

    this.peers.set(userId, { connection: peerConnection, audio: null });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    this.network.socket.emit('voiceOffer', {
      to: userId,
      offer: offer
    });
  }

  async handleOffer(fromId, offer) {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    peerConnection.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play().catch(() => {});

      const peer = this.peers.get(fromId);
      if (peer) peer.audio = audio;
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.network.socket.emit('voiceIceCandidate', {
          to: fromId,
          candidate: event.candidate
        });
      }
    };

    this.peers.set(fromId, { connection: peerConnection, audio: null });

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    this.network.socket.emit('voiceAnswer', {
      to: fromId,
      answer: answer
    });
  }

  removePeer(userId) {
    const peer = this.peers.get(userId);
    if (peer) {
      if (peer.connection) peer.connection.close();
      if (peer.audio) { peer.audio.pause(); peer.audio.srcObject = null; }
      this.peers.delete(userId);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMuted;
      });
    }
    this.updateUI();
    return this.isMuted;
  }

  showError(msg) {
    const el = document.getElementById('voice-error');
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }
  }

  updateUI() {
    const btn = document.getElementById('voice-btn');
    if (btn) {
      if (this.enabled) {
        btn.textContent = this.isMuted ? '🔇 Muted' : '🎤 Voice ON';
        btn.className = 'voice-btn ' + (this.isMuted ? 'muted' : 'active');
      } else {
        btn.textContent = '🎤 Voice OFF';
        btn.className = 'voice-btn';
      }
    }

    const count = document.getElementById('voice-count');
    if (count) {
      count.textContent = `${this.peers.size} connected`;
      count.style.display = this.enabled ? 'block' : 'none';
    }
  }
}