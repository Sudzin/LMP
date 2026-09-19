import { Track, Playlist, AppSettings, EqualizerConfig } from '../types';
import { getInitialDemoTracks, generateCoverArt } from './sampleMedia';
import { EQ_PRESETS, EQ_FREQUENCIES } from './audioEngine';

const DB_NAME = 'AuroraPlayerDB';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'ru',
  theme: 'classic-dark',
  customGradient: {
    from: '#4a154b',
    via: '#9b1c5a',
    to: '#ff4d6d',
  },
  visualizerEnabled: true,
  visualizerMode: 'bars',
  particlesEnabled: true,
  playbackSpeed: 1.0,
  sleepTimerMinutes: null,
};

export const DEFAULT_EQ_CONFIG: EqualizerConfig = {
  enabled: true,
  preset: 'Flat',
  bands: EQ_FREQUENCIES.map((freq, idx) => ({
    frequency: freq,
    gain: EQ_PRESETS.Flat[idx] ?? 0,
  })),
};

export interface StoredSession {
  trackId: string | null;
  position: number;
  updatedAt: number;
}

class DatabaseService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('tracks')) {
            db.createObjectStore('tracks', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('files')) {
            db.createObjectStore('files', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('playlists')) {
            db.createObjectStore('playlists', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  }

  public async getTracks(): Promise<Track[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['tracks', 'files'], 'readonly');
      const store = tx.objectStore('tracks');
      const fileStore = tx.objectStore('files');

      const tracksReq = store.getAll();
      const tracks: Track[] = await new Promise((resolve, reject) => {
        tracksReq.onsuccess = () => resolve(tracksReq.result || []);
        tracksReq.onerror = () => reject(tracksReq.error);
      });

      if (tracks.length === 0) {
        // Seed demo tracks
        const initial = getInitialDemoTracks();
        await this.saveTracks(initial);
        return initial;
      }

      // Rehydrate blob URLs for imported files if present in files store
      for (const track of tracks) {
        if (!track.url || track.url.startsWith('blob:')) {
          const fileReq = fileStore.get(track.id);
          const fileRecord = await new Promise<{ id: string; file: Blob } | null>((resolve) => {
            fileReq.onsuccess = () => resolve(fileReq.result);
            fileReq.onerror = () => resolve(null);
          });
          if (fileRecord?.file) {
            track.url = URL.createObjectURL(fileRecord.file);
          } else if (track.id.startsWith('demo-')) {
            // Re-generate audio if needed
            const demos = getInitialDemoTracks();
            const found = demos.find((d) => d.id === track.id);
            if (found) track.url = found.url;
          }
        }
      }

      return tracks;
    } catch {
      // Fallback
      return getInitialDemoTracks();
    }
  }

  public async saveTracks(tracks: Track[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('tracks', 'readwrite');
      const store = tx.objectStore('tracks');
      for (const t of tracks) {
        // Exclude file blob directly from metadata record to keep it light
        const { file, ...serializable } = t;
        store.put(serializable);
      }
    } catch (e) {
      console.warn('saveTracks error', e);
    }
  }

  public async addTrackWithFile(track: Track, file: File): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['tracks', 'files'], 'readwrite');
      const trackStore = tx.objectStore('tracks');
      const fileStore = tx.objectStore('files');

      const { file: _, ...serializable } = track;
      trackStore.put(serializable);
      fileStore.put({ id: track.id, file });
    } catch (e) {
      console.warn('addTrackWithFile error', e);
    }
  }

  public async deleteTrack(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['tracks', 'files'], 'readwrite');
      tx.objectStore('tracks').delete(id);
      tx.objectStore('files').delete(id);
    } catch (e) {
      console.warn('deleteTrack error', e);
    }
  }

  public async getPlaylists(): Promise<Playlist[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('playlists', 'readonly');
      const store = tx.objectStore('playlists');
      const req = store.getAll();
      const list: Playlist[] = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      if (list.length === 0) {
        const defaultList: Playlist[] = [
          {
            id: 'pl-favorites',
            name: 'Любимые треки',
            description: 'Ваша персональная коллекция избранного',
            trackIds: ['demo-1', 'demo-2', 'demo-4'],
            createdAt: Date.now() - 1000 * 60 * 60 * 48,
            coverUrl: generateCoverArt('Любимые', 'Aurora', 0),
            isFavorite: true,
          },
          {
            id: 'pl-chill',
            name: 'Ночной чилл & Lo-Fi',
            description: 'Спокойный саундтрек для вечерней работы и отдыха',
            trackIds: ['demo-2', 'demo-3'],
            createdAt: Date.now() - 1000 * 60 * 60 * 24,
            coverUrl: generateCoverArt('Ночной', 'Lo-Fi', 1),
          },
        ];
        await this.savePlaylists(defaultList);
        return defaultList;
      }

      return list;
    } catch {
      return [];
    }
  }

  public async savePlaylists(playlists: Playlist[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('playlists', 'readwrite');
      const store = tx.objectStore('playlists');
      for (const pl of playlists) {
        store.put(pl);
      }
    } catch (e) {
      console.warn('savePlaylists error', e);
    }
  }

  public async deletePlaylist(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('playlists', 'readwrite');
      tx.objectStore('playlists').delete(id);
    } catch (e) {
      console.warn('deletePlaylist error', e);
    }
  }

  public getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem('aurora_settings');
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  }

  public saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem('aurora_settings', JSON.stringify(settings));
    } catch {
      // fallback
    }
  }

  public getEqualizerConfig(): EqualizerConfig {
    try {
      const raw = localStorage.getItem('aurora_eq_config');
      if (raw) return { ...DEFAULT_EQ_CONFIG, ...JSON.parse(raw) };
    } catch {
      // fallback
    }
    return DEFAULT_EQ_CONFIG;
  }

  public saveEqualizerConfig(config: EqualizerConfig): void {
    try {
      localStorage.setItem('aurora_eq_config', JSON.stringify(config));
    } catch {
      // fallback
    }
  }

  public getLastSession(): StoredSession | null {
    try {
      const raw = localStorage.getItem('aurora_last_session');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  }

  public saveLastSession(session: StoredSession): void {
    try {
      localStorage.setItem('aurora_last_session', JSON.stringify(session));
    } catch {
      // ignore
    }
  }
}

export const dbService = new DatabaseService();
