import { Track } from '../types';

/**
 * Generates an in-memory WAV audio buffer and returns an object URL.
 * Creates varied procedural musical loops (chords, bass, melody, drums)
 * so that the user immediately has high-fidelity offline audio to test the
 * 10-band equalizer, FFT visualizer, queue, playlists, etc.
 */
function createWavDataUrl(
  type: 'synthwave' | 'lofi' | 'ambient' | 'funk' | 'cinematic',
  durationSec = 45
): string {
  const sampleRate = 22050;
  const totalSamples = sampleRate * durationSec;
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate musical waveforms
  let offset = 44;
  const bpm = type === 'synthwave' ? 120 : type === 'lofi' ? 84 : type === 'funk' ? 112 : 72;
  const beatSec = 60 / bpm;

  // Chord roots in Hz
  const scales: Record<string, number[][]> = {
    synthwave: [
      [220.0, 261.63, 329.63], // Am
      [174.61, 220.0, 261.63], // F
      [196.0, 246.94, 293.66], // G
      [164.81, 196.0, 246.94], // Em
    ],
    lofi: [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ],
    ambient: [
      [130.81, 196.0, 261.63, 392.0],
      [146.83, 220.0, 293.66, 440.0],
      [110.0, 164.81, 220.0, 329.63],
    ],
    funk: [
      [146.83, 220.0, 261.63], // Dm7
      [196.0, 246.94, 293.66],  // G7
      [146.83, 220.0, 261.63],
      [220.0, 277.18, 329.63],  // A7
    ],
    cinematic: [
      [110.0, 164.81, 220.0],
      [130.81, 196.0, 261.63],
      [98.0, 146.83, 196.0],
      [87.31, 130.81, 174.61],
    ],
  };

  const chordProg = scales[type] || scales.synthwave;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const beatIndex = Math.floor(t / beatSec);
    const chordIndex = Math.floor(beatIndex / 4) % chordProg.length;
    const chord = chordProg[chordIndex];
    const beatPhase = (t % beatSec) / beatSec;

    let left = 0;
    let right = 0;

    // Pad chords (soft saw & sine)
    for (let c = 0; c < chord.length; c++) {
      const freq = chord[c];
      const padVol = 0.12 / chord.length;
      const wave = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t);
      left += wave * padVol;
      right += wave * padVol * (1 + 0.1 * Math.sin(2 * Math.PI * 0.2 * t));
    }

    // Bass line
    const bassFreq = chord[0] / 2;
    const bassEnv = Math.max(0, 1 - beatPhase * 1.5);
    const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.25 * bassEnv;
    left += bass;
    right += bass;

    // Drum beat (kick on 0, snare on 2)
    const measurePhase = (t % (beatSec * 4)) / beatSec;
    const isKick = measurePhase < 0.2 || (measurePhase >= 2 && measurePhase < 2.2);
    const isSnare = (measurePhase >= 1 && measurePhase < 1.3) || (measurePhase >= 3 && measurePhase < 3.3);

    if (isKick) {
      const kickT = (t % beatSec);
      const kickFreq = Math.max(45, 120 - kickT * 400);
      const kickEnv = Math.max(0, 1 - kickT * 7);
      const kick = Math.sin(2 * Math.PI * kickFreq * kickT) * kickEnv * 0.35;
      left += kick;
      right += kick;
    }

    if (isSnare) {
      const snareT = (t % beatSec);
      const noise = (Math.random() * 2 - 1) * Math.max(0, 1 - snareT * 6) * 0.18;
      left += noise;
      right += noise;
    }

    // Melody arpeggio
    const arpSpeed = type === 'synthwave' ? 4 : 2;
    const arpStep = Math.floor((t / (beatSec / arpSpeed)) % chord.length);
    const arpFreq = chord[arpStep] * 2;
    const arpEnv = Math.max(0, 1 - ((t / (beatSec / arpSpeed)) % 1) * 2);
    const arp = Math.sin(2 * Math.PI * arpFreq * t) * 0.12 * arpEnv;
    left += arp * 0.7;
    right += arp * 1.1;

    // Clipping protection
    left = Math.max(-0.95, Math.min(0.95, left));
    right = Math.max(-0.95, Math.min(0.95, right));

    view.setInt16(offset, left * 32767, true);
    view.setInt16(offset + 2, right * 32767, true);
    offset += 4;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Generates an aesthetic SVG / Canvas data URL cover art
 * strictly respecting the color rules (gradients of purple, magenta, orange, rose, lavender; NO dominant green/blue).
 */
export function generateCoverArt(title: string, artist: string, paletteIndex = 0): string {
  const palettes = [
    ['#4a154b', '#9b1c5a', '#ff4d6d'], // Deep berry, magenta, rose
    ['#2d1b4e', '#6b21a8', '#c026d3'], // Midnight violet, royal purple, fuchsia
    ['#431407', '#9a3412', '#f97316'], // Deep ember, burnt orange, bright orange
    ['#31103f', '#701a75', '#ec4899'], // Twilight plum, deep lavender, hot pink
    ['#3b0764', '#86198f', '#fb7185'], // Dark amethyst, violet, coral rose
  ];

  const colors = palettes[paletteIndex % palettes.length];
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="%234a154b"/></svg>';
  }

  // Draw rich gradient
  const grad = ctx.createLinearGradient(0, 0, 400, 400);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.5, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 400);

  // Soft geometric glowing circles
  ctx.save();
  ctx.filter = 'blur(40px)';
  ctx.fillStyle = colors[2];
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(280, 120, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors[1];
  ctx.beginPath();
  ctx.arc(120, 300, 160, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Subtle grid/waves
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  for (let y = 80; y <= 320; y += 40) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.bezierCurveTo(150, y - 20, 250, y + 20, 360, y);
    ctx.stroke();
  }

  // Inner border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, 352, 352);

  // Logo / Title initials
  const initials = (title.charAt(0) + (title.split(' ')[1]?.charAt(0) || '')).toUpperCase() || 'AP';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 16;
  ctx.fillText(initials, 200, 180);

  // Subtitle
  ctx.font = '600 16px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowBlur = 8;
  ctx.fillText(artist.toUpperCase(), 200, 240);

  return canvas.toDataURL('image/png');
}

/**
 * Creates a playable sample video with procedural graphics and subtitles.
 */
export function createSampleVideoData(): { videoUrl: string; subtitleContent: string } {
  // We use an MP4 / WebM canvas-recorded loop or standard compliant video
  // Canvas recorded into WebM
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');

  let videoUrl = '';
  try {
    const stream = canvas.captureStream(30);
    // Add audio track using AudioContext oscillator
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const actx = new AudioCtx();
    const dest = actx.createMediaStreamDestination();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, actx.currentTime);
    gain.gain.setValueAtTime(0.08, actx.currentTime);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    // combine audio track
    const audioTrack = dest.stream.getAudioTracks()[0];
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }

    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      actx.close().catch(() => {});
    };

    recorder.start();

    // Render 4 seconds of smooth animations
    let frame = 0;
    const maxFrames = 120; // 4 seconds at 30fps
    const draw = () => {
      if (!ctx) return;
      const t = frame / 30;

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 640, 360);
      grad.addColorStop(0, '#1e0828');
      grad.addColorStop(0.5, '#4c114f');
      grad.addColorStop(1, '#9b1c5a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 360);

      // Rotating glow rings
      ctx.save();
      ctx.translate(320, 180);
      ctx.rotate(t * 0.8);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 20;
      ctx.strokeRect(-80, -80, 160, 160);

      ctx.rotate(-t * 1.5);
      ctx.strokeStyle = '#c026d3';
      ctx.strokeRect(-120, -120, 240, 240);
      ctx.restore();

      // Pulsing center orb
      const radius = 40 + Math.sin(t * 4) * 10;
      ctx.beginPath();
      ctx.arc(320, 180, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#fb7185';
      ctx.shadowColor = '#fb7185';
      ctx.shadowBlur = 30;
      ctx.fill();

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText('AURORA PLAYER • VIDEO ENGINE', 320, 80);

      ctx.font = '16px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(`Time: ${t.toFixed(1)}s • 10-Band EQ & Subtitles Active`, 320, 310);

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(draw);
      } else {
        recorder.stop();
      }
    };
    draw();

    // After recording completes, return blob url
    const blobPromise = new Promise<string>((resolve) => {
      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        resolve(URL.createObjectURL(videoBlob));
      };
    });

    // Synchronous placeholder or fallback
    videoUrl = '';
    blobPromise.then((url) => {
      videoUrl = url;
    });
  } catch {
    // If MediaRecorder isn't supported in container, use standard fallback
    videoUrl = '';
  }

  const subtitleContent = `1
00:00:00,500 --> 00:00:02,000
Добро пожаловать в видеоплеер Aurora Player!

2
00:00:02,200 --> 00:00:04,500
Поддержка внешних субтитров .srt и .vtt активна.

3
00:00:04,700 --> 00:00:07,000
10-полосный эквалайзер также обрабатывает звуковую дорожку видео!
`;

  return { videoUrl, subtitleContent };
}

/**
 * Generates initial demo library tracks.
 */
export function getInitialDemoTracks(): Track[] {
  const url1 = createWavDataUrl('synthwave', 45);
  const url2 = createWavDataUrl('lofi', 48);
  const url3 = createWavDataUrl('ambient', 60);
  const url4 = createWavDataUrl('funk', 40);
  const url5 = createWavDataUrl('cinematic', 52);

  const tracks: Track[] = [
    {
      id: 'demo-1',
      title: 'Neon Horizon',
      artist: 'Aurora Synth',
      album: 'Retrowave Nights',
      genre: 'Synthwave',
      year: 2025,
      duration: 45,
      url: url1,
      coverUrl: generateCoverArt('Neon Horizon', 'Aurora Synth', 0),
      addedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
      playCount: 14,
      isFavorite: true,
      type: 'audio',
      format: 'wav',
      palette: ['#4a154b', '#ff4d6d', '#2d1b4e'],
    },
    {
      id: 'demo-2',
      title: 'Midnight Coffee',
      artist: 'Velvet Echo',
      album: 'Autumn Beats',
      genre: 'Lo-Fi',
      year: 2024,
      duration: 48,
      url: url2,
      coverUrl: generateCoverArt('Midnight Coffee', 'Velvet Echo', 1),
      addedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      playCount: 9,
      isFavorite: true,
      type: 'audio',
      format: 'wav',
      palette: ['#2d1b4e', '#c026d3', '#31103f'],
    },
    {
      id: 'demo-3',
      title: 'Lavender Haze',
      artist: 'Solaris Cloud',
      album: 'Atmospheres Vol. 1',
      genre: 'Ambient',
      year: 2025,
      duration: 60,
      url: url3,
      coverUrl: generateCoverArt('Lavender Haze', 'Solaris Cloud', 2),
      addedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
      playCount: 22,
      isFavorite: false,
      type: 'audio',
      format: 'wav',
      palette: ['#431407', '#f97316', '#701a75'],
    },
    {
      id: 'demo-4',
      title: 'Cosmic Groove',
      artist: 'Starlight Rhythm',
      album: 'Funk Odyssey',
      genre: 'Electronic',
      year: 2024,
      duration: 40,
      url: url4,
      coverUrl: generateCoverArt('Cosmic Groove', 'Starlight Rhythm', 3),
      addedAt: Date.now() - 1000 * 60 * 60 * 12,
      playCount: 6,
      isFavorite: true,
      type: 'audio',
      format: 'wav',
      palette: ['#31103f', '#ec4899', '#4a154b'],
    },
    {
      id: 'demo-5',
      title: 'Crimson Eclipse',
      artist: 'Vanguard Cinema',
      album: 'Epic Dimensions',
      genre: 'Cinematic',
      year: 2026,
      duration: 52,
      url: url5,
      coverUrl: generateCoverArt('Crimson Eclipse', 'Vanguard Cinema', 4),
      addedAt: Date.now() - 1000 * 60 * 60 * 2,
      playCount: 4,
      isFavorite: false,
      type: 'audio',
      format: 'wav',
      palette: ['#3b0764', '#fb7185', '#9a3412'],
    },
  ];

  return tracks;
}
