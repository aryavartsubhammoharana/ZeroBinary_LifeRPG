/**
 * LifeRPG — Integrated Music Player & Audio Engine
 * Supports:
 * 1. Procedural Retro 8-bit & Lo-Fi Web Audio Synthesizer (Zero-lag, in-browser, no external dependencies)
 * 2. Spotify Web Player Embeds & Focus Playlists
 * 3. YouTube Music Focus Streams & Custom URL Embeds
 * 4. Seamless Background Audio Playback across all dashboard tabs & screens with persistent floating mini dock
 */

class MusicPlayerEngine {
    constructor() {
        this.audioCtx = null;
        this.isPlaying = false;
        this.currentMode = 'synth'; // 'synth' | 'spotify' | 'youtube'
        this.currentTrackIndex = 0;
        this.synthVolume = 0.35;
        this.isMuted = false;
        this.schedulerTimer = null;
        this.visualizerInterval = null;
        this.activeCustomTitle = null;

        this.synthTracks = [
            {
                id: 'lofi-study',
                title: '☕ 8-Bit Lo-Fi Study Beats',
                genre: 'Lo-Fi Chill',
                bpm: 72,
                root: 220, // A3
                chords: [
                    [220, 261.63, 329.63, 392.00], // Am7
                    [174.61, 220, 261.63, 329.63], // Fmaj7
                    [130.81, 164.81, 196.00, 246.94], // Cmaj7
                    [196.00, 246.94, 293.66, 349.23]  // G7
                ]
            },
            {
                id: 'synth-sunset',
                title: '🌆 Synthwave Sunset Run',
                genre: 'Retro Synthwave',
                bpm: 110,
                root: 146.83, // D3
                chords: [
                    [146.83, 174.61, 220, 261.63], // Dm7
                    [116.54, 146.83, 174.61, 220], // Bbmaj7
                    [130.81, 164.81, 196.00, 246.94], // Cmaj7
                    [164.81, 196.00, 246.94, 293.66]  // Em7
                ]
            },
            {
                id: 'cozy-tavern',
                title: '🍺 Cozy Pixel Tavern',
                genre: 'Medieval RPG',
                bpm: 84,
                root: 196.00, // G3
                chords: [
                    [196.00, 246.94, 293.66, 370.00], // Gmaj7
                    [164.81, 196.00, 246.94, 293.66], // Em7
                    [130.81, 164.81, 196.00, 246.94], // Cmaj7
                    [146.83, 185.00, 220, 293.66]   // D7
                ]
            },
            {
                id: 'dungeon-quest',
                title: '⚔️ Questing Realm Ambient',
                genre: 'Deep Focus',
                bpm: 60,
                root: 130.81, // C3
                chords: [
                    [130.81, 155.56, 196.00, 233.08], // Cm7
                    [116.54, 138.59, 174.61, 207.65], // Bbm7
                    [103.83, 130.81, 155.56, 196.00], // Abmaj7
                    [130.81, 164.81, 196.00, 246.94]  // Cmaj7
                ]
            }
        ];

        this.loadSettings();
    }

    loadSettings() {
        const savedVol = localStorage.getItem('liferpg_music_vol');
        if (savedVol !== null) this.synthVolume = parseFloat(savedVol);
        const savedMode = localStorage.getItem('liferpg_music_mode');
        if (savedMode) this.currentMode = savedMode;
    }

    initAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // =========================================================================
    // PROCEDURAL SYNTHESIZER ENGINE
    // =========================================================================

    playSynthTrack(index = this.currentTrackIndex) {
        this.initAudioContext();
        if (!this.audioCtx) return;

        this.stopSynth();
        this.currentMode = 'synth';
        this.activeCustomTitle = null;
        this.currentTrackIndex = (index + this.synthTracks.length) % this.synthTracks.length;
        const track = this.synthTracks[this.currentTrackIndex];
        this.isPlaying = true;

        let chordStep = 0;
        let beatStep = 0;
        const secondsPerBeat = 60 / track.bpm;

        const masterGain = this.audioCtx.createGain();
        masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.synthVolume, this.audioCtx.currentTime);
        masterGain.connect(this.audioCtx.destination);
        this.masterGain = masterGain;

        const playChord = (chord, time, duration) => {
            if (!this.isPlaying || !this.audioCtx) return;

            chord.forEach((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const noteGain = this.audioCtx.createGain();

                // Gentle retro triangle & warm sine blend
                osc.type = idx === 0 ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(freq, time);

                // Slight retro vibrato
                const lfo = this.audioCtx.createOscillator();
                const lfoGain = this.audioCtx.createGain();
                lfo.frequency.setValueAtTime(4.5, time);
                lfoGain.gain.setValueAtTime(1.2, time);
                lfo.connect(osc.frequency);
                lfo.start(time);
                lfo.stop(time + duration);

                const volume = (idx === 0 ? 0.22 : 0.12);
                noteGain.gain.setValueAtTime(0.001, time);
                noteGain.gain.linearRampToValueAtTime(volume, time + 0.1);
                noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

                osc.connect(noteGain);
                noteGain.connect(masterGain);

                osc.start(time);
                osc.stop(time + duration);
            });

            // Gentle Lo-Fi Noise / Percussion click
            if (beatStep % 2 === 0) {
                const hatOsc = this.audioCtx.createOscillator();
                const hatGain = this.audioCtx.createGain();
                hatOsc.type = 'square';
                hatOsc.frequency.setValueAtTime(1200 + Math.random() * 400, time);
                hatGain.gain.setValueAtTime(0.015, time);
                hatGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
                hatOsc.connect(hatGain);
                hatGain.connect(masterGain);
                hatOsc.start(time);
                hatOsc.stop(time + 0.04);
            }
        };

        const loop = () => {
            if (!this.isPlaying || !this.audioCtx) return;
            const now = this.audioCtx.currentTime;
            const currentChord = track.chords[chordStep % track.chords.length];

            playChord(currentChord, now + 0.05, secondsPerBeat * 2);

            beatStep++;
            if (beatStep % 2 === 0) {
                chordStep++;
            }

            this.schedulerTimer = setTimeout(loop, secondsPerBeat * 1000);
        };

        loop();
        this.startVisualizer();
        this.updatePresetPills();
        this.updateUI();
    }

    stopSynth() {
        if (this.schedulerTimer) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        if (this.masterGain) {
            try {
                this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
                this.masterGain.disconnect();
            } catch (e) {}
            this.masterGain = null;
        }
    }

    togglePlay() {
        if (this.currentMode === 'synth') {
            if (this.isPlaying) {
                this.isPlaying = false;
                this.stopSynth();
                this.stopVisualizer();
                this.updateUI();
            } else {
                this.playSynthTrack(this.currentTrackIndex);
            }
        } else {
            // For YouTube / Spotify stream toggle
            this.isPlaying = !this.isPlaying;
            if (this.isPlaying) {
                this.startVisualizer();
            } else {
                this.stopVisualizer();
            }
            this.updateUI();
        }
    }

    nextTrack() {
        if (this.currentMode === 'synth') {
            this.playSynthTrack(this.currentTrackIndex + 1);
        }
    }

    prevTrack() {
        if (this.currentMode === 'synth') {
            this.playSynthTrack(this.currentTrackIndex - 1);
        }
    }

    setVolume(val) {
        this.synthVolume = Math.max(0, Math.min(1, parseFloat(val)));
        localStorage.setItem('liferpg_music_vol', this.synthVolume);
        if (this.masterGain && this.audioCtx && !this.isMuted) {
            this.masterGain.gain.setValueAtTime(this.synthVolume, this.audioCtx.currentTime);
        }
        const slider = document.getElementById('music-vol-slider');
        if (slider) slider.value = this.synthVolume;
        const pct = document.getElementById('music-vol-pct');
        if (pct) pct.textContent = `${Math.round(this.synthVolume * 100)}%`;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.audioCtx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.synthVolume, this.audioCtx.currentTime);
        }
        const muteBtn = document.getElementById('synth-mute-btn');
        if (muteBtn) muteBtn.textContent = this.isMuted ? '🔊' : '🔇';
        const dockMuteBtn = document.getElementById('fmd-mute-btn');
        if (dockMuteBtn) dockMuteBtn.textContent = this.isMuted ? '🔇' : '🔊';
        this.updateUI();
    }

    updatePresetPills() {
        const pills = document.querySelectorAll('.synth-preset-pill');
        pills.forEach((p, idx) => {
            p.classList.toggle('active', idx === this.currentTrackIndex);
        });
    }

    // =========================================================================
    // VISUALIZER & DOCK ANIMATIONS
    // =========================================================================

    startVisualizer() {
        this.stopVisualizer();
        this.visualizerInterval = setInterval(() => {
            const bars = document.querySelectorAll('.music-eq-bar');
            bars.forEach((bar) => {
                if (this.isPlaying && !this.isMuted) {
                    const h = Math.floor(Math.random() * 75 + 25);
                    bar.style.height = `${h}%`;
                } else {
                    bar.style.height = '15%';
                }
            });
        }, 110);
    }

    stopVisualizer() {
        if (this.visualizerInterval) {
            clearInterval(this.visualizerInterval);
            this.visualizerInterval = null;
        }
        const bars = document.querySelectorAll('.music-eq-bar');
        bars.forEach(b => b.style.height = '15%');
    }

    // =========================================================================
    // MODES, SPOTIFY & YOUTUBE STREAM LOADERS
    // =========================================================================

    switchMode(mode) {
        this.currentMode = mode;
        localStorage.setItem('liferpg_music_mode', mode);
        if (mode !== 'synth' && this.isPlaying) {
            this.stopSynth();
        }

        const tabs = document.querySelectorAll('.music-tab-btn');
        tabs.forEach(t => t.classList.remove('active'));
        const activeTab = document.getElementById(`music-tab-${mode}`);
        if (activeTab) activeTab.classList.add('active');

        const panels = document.querySelectorAll('.music-view-panel');
        panels.forEach(p => p.classList.add('hidden'));
        const activePanel = document.getElementById(`music-panel-${mode}`);
        if (activePanel) activePanel.classList.remove('hidden');

        this.updateUI();
    }

    loadSpotifyPlaylist(uri, title = null) {
        this.stopSynth();
        this.currentMode = 'spotify';
        this.activeCustomTitle = title || '🎧 Spotify Focus Stream';
        const frame = document.getElementById('spotify-embed-frame');
        if (frame) {
            frame.src = `https://open.spotify.com/embed/${uri}?utm_source=generator&theme=0`;
            this.isPlaying = true;
            this.startVisualizer();
            this.updateUI();
        }
    }

    loadYouTubeStream(url, title = null) {
        this.stopSynth();
        this.currentMode = 'youtube';
        this.activeCustomTitle = title || '▶️ YouTube Focus Stream';
        const frame = document.getElementById('youtube-embed-frame');
        if (frame) {
            frame.src = url;
            this.isPlaying = true;
            this.startVisualizer();
            this.updateUI();
        }
    }

    loadCustomUrl(inputUrl) {
        if (!inputUrl) return;
        const clean = inputUrl.trim();

        if (clean.includes('spotify.com')) {
            let uriMatch = clean.match(/open\.spotify\.com\/(playlist|track|album|artist)\/([a-zA-Z0-9]+)/);
            let embedUrl = clean;
            let displayTitle = '🎧 Custom Spotify Stream';
            if (uriMatch) {
                embedUrl = `https://open.spotify.com/embed/${uriMatch[1]}/${uriMatch[2]}?utm_source=generator&theme=0`;
                displayTitle = `🎧 Spotify ${uriMatch[1].toUpperCase()}`;
            } else if (!clean.includes('/embed/')) {
                embedUrl = clean.replace('open.spotify.com/', 'open.spotify.com/embed/');
            }
            this.switchMode('spotify');
            this.loadSpotifyPlaylist(uriMatch ? `${uriMatch[1]}/${uriMatch[2]}` : '', displayTitle);
            const frame = document.getElementById('spotify-embed-frame');
            if (frame) frame.src = embedUrl;
        } else if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
            let videoId = '';
            // Regex for all YouTube, YouTube Music, Live, Shorts URLs
            const regExp = /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
            const match = clean.match(regExp);
            if (match && match[1]) {
                videoId = match[1];
            } else if (clean.includes('v=')) {
                videoId = clean.split('v=')[1].split('&')[0];
            } else if (clean.includes('youtu.be/')) {
                videoId = clean.split('youtu.be/')[1].split('?')[0];
            }

            if (videoId) {
                this.switchMode('youtube');
                this.loadYouTubeStream(`https://www.youtube.com/embed/${videoId}?autoplay=1`, '▶️ Custom YouTube Audio Stream');
            } else if (clean.includes('/embed/')) {
                this.switchMode('youtube');
                this.loadYouTubeStream(clean, '▶️ Custom YouTube Stream');
            }
        }
    }

    // =========================================================================
    // BACKGROUND PLAY & FLOATING MINI DOCK CONTROLS
    // =========================================================================

    minimizePlayer() {
        playSound('click');
        const modal = document.getElementById('music-player-modal');
        if (modal) {
            // Hide modal visually but preserve iframe/audio context in memory
            modal.classList.add('bg-playing-hidden');
            modal.classList.add('hidden');
        }

        const dock = document.getElementById('floating-mini-music-dock');
        if (dock) {
            dock.classList.remove('hidden');
        }
        this.updateUI();
    }

    expandPlayer() {
        playSound('click');
        const modal = document.getElementById('music-player-modal');
        if (modal) {
            modal.classList.remove('bg-playing-hidden');
            modal.classList.remove('hidden');
        }

        const dock = document.getElementById('floating-mini-music-dock');
        if (dock) {
            dock.classList.add('hidden');
        }
        this.updateUI();
    }

    stopAllAudio() {
        playSound('click');
        this.isPlaying = false;
        this.stopSynth();
        this.stopVisualizer();

        // Pause/clear iframe sources
        const ytFrame = document.getElementById('youtube-embed-frame');
        if (ytFrame) {
            ytFrame.src = 'about:blank';
        }
        const spFrame = document.getElementById('spotify-embed-frame');
        if (spFrame) {
            spFrame.src = 'about:blank';
        }

        const dock = document.getElementById('floating-mini-music-dock');
        if (dock) {
            dock.classList.add('hidden');
        }

        const modalStatus = document.getElementById('music-dock-status-text');
        if (modalStatus) modalStatus.textContent = '⏹ Audio Stopped • Select a track to play';

        this.updateUI();
    }

    updateUI() {
        const curTrack = this.synthTracks[this.currentTrackIndex];
        let displayTitle = '';
        let badgeText = '8-BIT LO-FI';

        if (this.currentMode === 'synth') {
            displayTitle = curTrack.title;
            badgeText = '8-BIT SYNTH';
        } else if (this.currentMode === 'spotify') {
            displayTitle = this.activeCustomTitle || '🎧 Spotify Focus Stream';
            badgeText = 'SPOTIFY';
        } else if (this.currentMode === 'youtube') {
            displayTitle = this.activeCustomTitle || '▶️ YouTube Music Stream';
            badgeText = 'YT MUSIC';
        }

        // Modal elements
        const modalPlayBtn = document.getElementById('modal-music-play-btn');
        const modalTrackTitle = document.getElementById('modal-music-track-title');
        const genreBadge = document.getElementById('modal-music-genre');
        const bpmBadge = document.getElementById('modal-music-bpm');
        const modalStatus = document.getElementById('music-dock-status-text');

        if (modalPlayBtn) modalPlayBtn.textContent = this.isPlaying ? '⏸ PAUSE' : '▶ PLAY SYNTH';
        if (modalTrackTitle) modalTrackTitle.textContent = displayTitle;
        if (genreBadge && this.currentMode === 'synth') genreBadge.textContent = curTrack.genre;
        if (bpmBadge && this.currentMode === 'synth') bpmBadge.textContent = `${curTrack.bpm} BPM`;
        if (modalStatus) {
            modalStatus.textContent = this.isPlaying 
                ? `🟢 Playing: ${displayTitle} • Background Play Active` 
                : '🟡 Standby • Ready to Focus';
        }

        // Top HUD boombox button elements
        const hudTrackTitle = document.getElementById('hud-music-track-title');
        const hudBoombox = document.getElementById('hud-music-btn');
        if (hudTrackTitle) hudTrackTitle.textContent = displayTitle.slice(0, 18);
        if (hudBoombox) hudBoombox.classList.toggle('playing', this.isPlaying);

        // Floating Mini Music Dock elements
        const dockTitle = document.getElementById('fmd-track-title');
        const dockBadge = document.getElementById('fmd-stream-badge');
        const dockPlayBtn = document.getElementById('fmd-play-btn');
        if (dockTitle) dockTitle.textContent = displayTitle;
        if (dockBadge) dockBadge.textContent = badgeText;
        if (dockPlayBtn) dockPlayBtn.textContent = this.isPlaying ? '⏸' : '▶';

        // Auto-show/hide floating dock if audio is playing in background (modal closed)
        const modal = document.getElementById('music-player-modal');
        const isModalVisible = modal && !modal.classList.contains('hidden') && !modal.classList.contains('bg-playing-hidden');
        const dock = document.getElementById('floating-mini-music-dock');
        if (dock) {
            if (this.isPlaying && !isModalVisible) {
                dock.classList.remove('hidden');
            } else if (isModalVisible) {
                dock.classList.add('hidden');
            }
        }
    }
}

// Global Music Player Singleton
window.musicPlayer = new MusicPlayerEngine();

function openMusicModal() {
    playSound('click');
    window.musicPlayer.expandPlayer();
}

function closeMusicModal() {
    playSound('click');
    if (window.musicPlayer.isPlaying) {
        window.musicPlayer.minimizePlayer();
    } else {
        const modal = document.getElementById('music-player-modal');
        if (modal) modal.classList.add('hidden');
    }
}

function expandMusicPlayer() {
    window.musicPlayer.expandPlayer();
}
