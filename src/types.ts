export type MediaType = 'audio' | 'video';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  year?: number;
  duration: number; // in seconds
  url: string; // audio/video source URL (blob or sample)
  coverUrl: string;
  addedAt: number;
  playCount: number;
  isFavorite: boolean;
  type: MediaType;
  format: string;
  file?: File;
  subtitlesUrl?: string;
  palette?: string[]; // primary, accent colors for dynamic blur
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: number;
  isFavorite?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  year?: number;
  genre: string;
  trackIds: string[];
}

export interface Artist {
  id: string;
  name: string;
  coverUrl: string;
  trackIds: string[];
}

export interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type VisualizerMode = 'bars' | 'wave' | 'glow';

export type AppTheme = 'classic-dark' | 'sunset-aurora' | 'lavender-mist' | 'custom';

export interface EqualizerBand {
  frequency: number;
  gain: number; // -12 to +12 dB
}

export type EqPresetName = 'Flat' | 'Рок' | 'Поп' | 'Джаз' | 'Электронная' | 'Бас-буст' | 'Кастомный';

export interface EqualizerConfig {
  enabled: boolean;
  preset: EqPresetName;
  bands: EqualizerBand[];
}

export interface AppSettings {
  language: 'ru' | 'en';
  theme: AppTheme;
  customGradient: {
    from: string;
    via: string;
    to: string;
  };
  visualizerEnabled: boolean;
  visualizerMode: VisualizerMode;
  particlesEnabled: boolean;
  playbackSpeed: number;
  sleepTimerMinutes: number | null;
}

export type ScreenType =
  | 'home'
  | 'tracks'
  | 'albums'
  | 'artists'
  | 'genres'
  | 'playlists'
  | 'queue'
  | 'video'
  | 'settings'
  | 'desktop-code';
