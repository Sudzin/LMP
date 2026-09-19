import { Track, MediaType } from '../types';
import { generateCoverArt } from './sampleMedia';

const AUDIO_EXTS = ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac', 'weba'];
const VIDEO_EXTS = ['mp4', 'mkv', 'avi', 'mov', 'webm'];

export interface ScanResult {
  tracks: Track[];
  files: File[];
  subtitleFiles: File[];
  skippedCount: number;
}

export async function processFileList(files: FileList | File[]): Promise<ScanResult> {
  const fileArray = Array.from(files);
  const tracks: Track[] = [];
  const trackFiles: File[] = [];
  const subtitleFiles: File[] = [];
  let skippedCount = 0;

  for (const file of fileArray) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (ext === 'srt' || ext === 'vtt' || ext === 'ass') {
      subtitleFiles.push(file);
      continue;
    }

    const isAudio = AUDIO_EXTS.includes(ext);
    const isVideo = VIDEO_EXTS.includes(ext);

    if (!isAudio && !isVideo) {
      skippedCount++;
      continue;
    }

    const mediaType: MediaType = isVideo ? 'video' : 'audio';

    // Parse filename: e.g. "Artist - Song Title.mp3" or "01 - Title.mp3" or "Song.mp3"
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    let artist = 'Локальный исполнитель';
    let title = nameWithoutExt;
    let album = isVideo ? 'Локальные видео' : 'Неизвестный альбом';

    if (nameWithoutExt.includes(' - ')) {
      const parts = nameWithoutExt.split(' - ');
      artist = parts[0].trim().replace(/^\d+\s*/, '');
      title = parts.slice(1).join(' - ').trim();
    } else {
      title = nameWithoutExt.replace(/^\d+[\s._-]+/, '').trim();
    }

    // Try to get duration
    const objectUrl = URL.createObjectURL(file);
    const duration = await getMediaDuration(objectUrl, mediaType);

    const trackId = 'local-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    const coverUrl = generateCoverArt(title, artist, tracks.length % 5);

    const track: Track = {
      id: trackId,
      title: title || 'Без названия',
      artist: artist || 'Неизвестный автор',
      album: album,
      genre: isVideo ? 'Видео' : 'Локальный файл',
      year: new Date().getFullYear(),
      duration: Math.round(duration) || 180,
      url: objectUrl,
      coverUrl,
      addedAt: Date.now(),
      playCount: 0,
      isFavorite: false,
      type: mediaType,
      format: ext,
      file,
      palette: ['#4a154b', '#ff4d6d', '#2d1b4e'],
    };

    tracks.push(track);
    trackFiles.push(file);
  }

  return {
    tracks,
    files: trackFiles,
    subtitleFiles,
    skippedCount,
  };
}

function getMediaDuration(url: string, type: MediaType): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement(type);
    el.preload = 'metadata';
    el.src = url;

    const cleanup = () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('error', onError);
    };

    const onLoaded = () => {
      const d = el.duration;
      cleanup();
      resolve(Number.isFinite(d) ? d : 180);
    };

    const onError = () => {
      cleanup();
      resolve(180);
    };

    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('error', onError);

    // Timeout fallback after 2s
    setTimeout(() => {
      cleanup();
      resolve(180);
    }, 2000);
  });
}
