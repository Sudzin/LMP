import React, { useState } from 'react';
import {
  Play,
  Pause,
  Disc3,
  Users,
  Radio,
  Plus,
  Trash2,
  ListMusic,
  Clock,
  Sparkles,
  Heart,
  X,
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { translations } from '../services/i18n';

interface MediaViewsCommonProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  language: 'ru' | 'en';
}

/**
 * Albums View
 */
export const AlbumsView: React.FC<
  MediaViewsCommonProps & { onSelectAlbum?: (albumName: string) => void }
> = ({ tracks, currentTrack, isPlaying, onPlayTrack, onTogglePlay, language }) => {
  const t = translations[language];
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  // Group tracks by album
  const albumsMap = new Map<string, { artist: string; coverUrl: string; tracks: Track[] }>();
  for (const tr of tracks) {
    if (!albumsMap.has(tr.album)) {
      albumsMap.set(tr.album, {
        artist: tr.artist,
        coverUrl: tr.coverUrl,
        tracks: [],
      });
    }
    albumsMap.get(tr.album)!.tracks.push(tr);
  }

  const albumList = Array.from(albumsMap.entries()).map(([title, data]) => ({
    title,
    artist: data.artist,
    coverUrl: data.coverUrl,
    tracks: data.tracks,
  }));

  if (selectedAlbum) {
    const albumData = albumsMap.get(selectedAlbum);
    if (albumData) {
      return (
        <div className="relative z-10 w-full space-y-6 pb-20">
          <button
            onClick={() => setSelectedAlbum(null)}
            className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/10 transition"
          >
            ← {t.albums}
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 border-b border-white/10 pb-6">
            <img
              src={albumData.coverUrl}
              alt={selectedAlbum}
              className="h-44 w-44 rounded-2xl object-cover shadow-2xl bg-neutral-800"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-rose-400">
                {t.totalAlbums.slice(0, -2)}
              </span>
              <h2 className="text-3xl font-black text-white sm:text-4xl mt-1">
                {selectedAlbum}
              </h2>
              <p className="text-sm text-neutral-400 mt-2">
                {albumData.artist} • {albumData.tracks.length} {t.tracks.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {albumData.tracks.map((tr, idx) => (
              <div
                key={tr.id}
                onClick={() => onPlayTrack(tr)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition"
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-center font-mono text-xs text-neutral-400">
                    {idx + 1}
                  </span>
                  <div>
                    <div className={`text-sm font-semibold ${currentTrack?.id === tr.id ? 'text-rose-400' : 'text-white'}`}>
                      {tr.title}
                    </div>
                    <div className="text-xs text-neutral-400">{tr.artist}</div>
                  </div>
                </div>
                <div className="text-xs font-mono text-neutral-400">
                  {Math.floor(tr.duration / 60)}:{(tr.duration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="relative z-10 w-full space-y-6 pb-20">
      <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
        {t.albums}
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {albumList.map((alb) => (
          <div
            key={alb.title}
            id={`album-card-${alb.title.replace(/\s+/g, '-')}`}
            onClick={() => setSelectedAlbum(alb.title)}
            className="group relative flex flex-col rounded-2xl bg-white/5 p-3.5 backdrop-blur-sm border border-white/5 hover:bg-white/10 hover:border-white/15 cursor-pointer transition-all"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-800 shadow-md">
              <img
                src={alb.coverUrl}
                alt={alb.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (alb.tracks[0]) onPlayTrack(alb.tracks[0]);
                }}
                className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
              >
                <Play className="h-4 w-4 fill-current ml-0.5" />
              </button>
            </div>
            <div className="mt-3">
              <h4 className="truncate text-sm font-bold text-white group-hover:text-rose-300 transition">
                {alb.title}
              </h4>
              <p className="mt-0.5 truncate text-xs text-neutral-400">
                {alb.artist} • {alb.tracks.length} {t.tracks.toLowerCase()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Artists View
 */
export const ArtistsView: React.FC<MediaViewsCommonProps> = ({
  tracks,
  onPlayTrack,
  language,
}) => {
  const t = translations[language];

  // Group by artist
  const artistsMap = new Map<string, { coverUrl: string; tracks: Track[] }>();
  for (const tr of tracks) {
    if (!artistsMap.has(tr.artist)) {
      artistsMap.set(tr.artist, { coverUrl: tr.coverUrl, tracks: [] });
    }
    artistsMap.get(tr.artist)!.tracks.push(tr);
  }

  const artistList = Array.from(artistsMap.entries()).map(([name, data]) => ({
    name,
    coverUrl: data.coverUrl,
    tracks: data.tracks,
  }));

  return (
    <div className="relative z-10 w-full space-y-6 pb-20">
      <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
        {t.artists}
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {artistList.map((art) => (
          <div
            key={art.name}
            id={`artist-card-${art.name.replace(/\s+/g, '-')}`}
            onClick={() => {
              if (art.tracks[0]) onPlayTrack(art.tracks[0]);
            }}
            className="group relative flex flex-col items-center text-center rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/5 hover:bg-white/10 hover:border-white/15 cursor-pointer transition-all"
          >
            <div className="relative h-32 w-32 overflow-hidden rounded-full shadow-lg bg-neutral-800">
              <img
                src={art.coverUrl}
                alt={art.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-3.5">
              <h4 className="truncate text-sm font-bold text-white group-hover:text-rose-300 transition">
                {art.name}
              </h4>
              <p className="mt-0.5 text-xs text-neutral-400">
                {art.tracks.length} {t.tracks.toLowerCase()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Genres View
 */
export const GenresView: React.FC<MediaViewsCommonProps> = ({
  tracks,
  onPlayTrack,
  language,
}) => {
  const t = translations[language];

  // Group by genre
  const genresMap = new Map<string, Track[]>();
  for (const tr of tracks) {
    const g = tr.genre || 'Общее';
    if (!genresMap.has(g)) genresMap.set(g, []);
    genresMap.get(g)!.push(tr);
  }

  const genreGradients = [
    'from-fuchsia-900 to-rose-600',
    'from-rose-900 to-amber-600',
    'from-purple-900 to-fuchsia-600',
    'from-amber-900 to-rose-600',
    'from-pink-900 to-purple-600',
  ];

  return (
    <div className="relative z-10 w-full space-y-6 pb-20">
      <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
        {t.genres}
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from(genresMap.entries()).map(([genre, genreTracks], idx) => (
          <div
            key={genre}
            id={`genre-card-${genre.replace(/\s+/g, '-')}`}
            onClick={() => {
              if (genreTracks[0]) onPlayTrack(genreTracks[0]);
            }}
            className={`group relative h-36 overflow-hidden rounded-2xl bg-gradient-to-br ${
              genreGradients[idx % genreGradients.length]
            } p-4 shadow-xl cursor-pointer hover:scale-[1.02] active:scale-95 transition-all`}
          >
            <span className="text-lg font-black text-white tracking-tight">
              {genre}
            </span>
            <p className="text-xs text-white/80 mt-1">
              {genreTracks.length} {t.tracks.toLowerCase()}
            </p>

            <img
              src={genreTracks[0]?.coverUrl}
              alt={genre}
              className="absolute -bottom-4 -right-4 h-24 w-24 rotate-12 rounded-lg object-cover shadow-2xl group-hover:rotate-0 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Queue View
 */
export const QueueView: React.FC<{
  queue: Track[];
  currentTrack: Track | null;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  language: 'ru' | 'en';
}> = ({ queue, currentTrack, onPlayTrack, onRemoveFromQueue, onClearQueue, language }) => {
  const t = translations[language];

  return (
    <div className="relative z-10 w-full space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {t.queue}
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            {queue.length} {t.tracks.toLowerCase()} в очереди
          </p>
        </div>

        {queue.length > 0 && (
          <button
            onClick={onClearQueue}
            className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/10 hover:text-white transition"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            Очистить очередь
          </button>
        )}
      </div>

      {/* Currently Playing Card */}
      {currentTrack && (
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-fuchsia-950/20 to-transparent p-4 backdrop-blur-md">
          <div className="text-[10px] uppercase font-bold tracking-wider text-rose-400 mb-2">
            {t.nowPlaying}
          </div>
          <div className="flex items-center gap-4">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="h-16 w-16 rounded-xl object-cover shadow-lg"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-base font-bold text-white">{currentTrack.title}</h3>
              <p className="text-xs text-neutral-400">{currentTrack.artist}</p>
              <p className="text-[11px] text-neutral-400 mt-1">{currentTrack.album}</p>
            </div>
          </div>
        </div>
      )}

      {/* Queue items */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
          Далее в очереди
        </h4>

        {queue.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/5 py-10 text-center text-xs text-neutral-400">
            {t.queueEmpty}
          </div>
        ) : (
          queue.map((tr, idx) => (
            <div
              key={`${tr.id}-${idx}`}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 group transition"
            >
              <div
                onClick={() => onPlayTrack(tr)}
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
              >
                <span className="w-5 text-center font-mono text-xs text-neutral-400">
                  {idx + 1}
                </span>
                <img
                  src={tr.coverUrl}
                  alt={tr.title}
                  className="h-10 w-10 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-white group-hover:text-rose-300">
                    {tr.title}
                  </div>
                  <div className="truncate text-[11px] text-neutral-400">{tr.artist}</div>
                </div>
              </div>

              <button
                onClick={() => onRemoveFromQueue(idx)}
                className="p-1.5 text-neutral-500 hover:text-rose-400 transition"
                title="Remove from queue"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
