import React from 'react';
import { Play, Pause, Heart, Sparkles, Plus, Clock, Disc3 } from 'lucide-react';
import { Track, Playlist } from '../types';
import { translations } from '../services/i18n';

interface HomeViewProps {
  tracks: Track[];
  playlists: Playlist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onToggleFavorite: (trackId: string) => void;
  onSelectPlaylist: (id: string) => void;
  onOpenAddFiles: () => void;
  language: 'ru' | 'en';
}

export const HomeView: React.FC<HomeViewProps> = ({
  tracks,
  playlists,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onToggleFavorite,
  onSelectPlaylist,
  onOpenAddFiles,
  language,
}) => {
  const t = translations[language];

  // Greeting based on hour
  const hour = new Date().getHours();
  let greeting = language === 'ru' ? 'Добрый день' : 'Good afternoon';
  if (hour < 6) greeting = language === 'ru' ? 'Доброй ночи' : 'Good night';
  else if (hour < 12) greeting = language === 'ru' ? 'Доброе утро' : 'Good morning';
  else if (hour >= 18) greeting = language === 'ru' ? 'Добрый вечер' : 'Good evening';

  // Quick 6 items for top grid (combination of favorite tracks & playlists)
  const quickItems = tracks.slice(0, 6);
  const recentTracks = [...tracks].sort((a, b) => b.addedAt - a.addedAt).slice(0, 8);
  const favoriteTracks = tracks.filter((t) => t.isFavorite);

  const totalDurationSeconds = tracks.reduce((acc, tr) => acc + tr.duration, 0);
  const totalHours = Math.floor(totalDurationSeconds / 3600);
  const totalMinutes = Math.floor((totalDurationSeconds % 3600) / 60);

  return (
    <div id="home-view-container" className="relative z-10 w-full space-y-8 pb-16">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {greeting}
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            {tracks.length} {t.totalTracks} • {totalHours > 0 ? `${totalHours} ${t.hours} ` : ''}{totalMinutes} {t.minutes} {t.totalDuration}
          </p>
        </div>

        <button
          id="home-quick-add-btn"
          onClick={onOpenAddFiles}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/25 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          {t.addFiles}
        </button>
      </div>

      {/* Spotify-style Top 6 Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickItems.map((item) => {
          const isItemActive = currentTrack?.id === item.id;
          return (
            <div
              key={item.id}
              id={`quick-card-${item.id}`}
              onClick={() => {
                if (isItemActive) onTogglePlay();
                else onPlayTrack(item);
              }}
              className="group relative flex h-20 items-center gap-3 overflow-hidden rounded-xl bg-white/5 pr-4 backdrop-blur-sm border border-white/5 hover:bg-white/10 hover:border-white/15 cursor-pointer transition-all"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-white/5">
                <img
                  src={item.coverUrl}
                  alt={item.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-white group-hover:text-rose-300 transition">
                  {item.title}
                </h4>
                <p className="truncate text-xs text-neutral-400">
                  {item.artist}
                </p>
              </div>

              {/* Play button overlay that pops up on hover */}
              <button
                id={`quick-play-${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isItemActive) onTogglePlay();
                  else onPlayTrack(item);
                }}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/40 transition-all ${
                  isItemActive
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'
                }`}
              >
                {isItemActive && isPlaying ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Featured Playlists Carousel */}
      {playlists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold tracking-tight text-white">
              {t.playlists}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                id={`home-playlist-${pl.id}`}
                onClick={() => onSelectPlaylist(pl.id)}
                className="group relative flex flex-col rounded-2xl bg-white/5 p-3.5 backdrop-blur-sm border border-white/5 hover:bg-white/10 hover:border-white/15 cursor-pointer transition-all"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-800 shadow-md">
                  <img
                    src={pl.coverUrl || tracks[0]?.coverUrl}
                    alt={pl.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="mt-3">
                  <h4 className="truncate text-sm font-bold text-white group-hover:text-rose-300 transition">
                    {pl.name}
                  </h4>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">
                    {pl.trackIds.length} {t.tracks.toLowerCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Added Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-rose-400" />
            <h3 className="text-xl font-bold tracking-tight text-white">
              {t.recentlyAdded}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {recentTracks.map((item) => {
            const isItemActive = currentTrack?.id === item.id;
            return (
              <div
                key={item.id}
                id={`recent-card-${item.id}`}
                onClick={() => {
                  if (isItemActive) onTogglePlay();
                  else onPlayTrack(item);
                }}
                className="group relative flex flex-col rounded-2xl bg-white/5 p-3 backdrop-blur-sm border border-white/5 hover:bg-white/10 hover:border-white/15 cursor-pointer transition-all"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-800 shadow-md">
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Play button */}
                  <button
                    id={`recent-play-${item.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isItemActive) onTogglePlay();
                      else onPlayTrack(item);
                    }}
                    className={`absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white shadow-xl shadow-rose-500/40 transition-all ${
                      isItemActive
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100'
                    }`}
                  >
                    {isItemActive && isPlaying ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>

                <div className="mt-3">
                  <h4 className="truncate text-sm font-semibold text-white group-hover:text-rose-300 transition">
                    {item.title}
                  </h4>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">
                    {item.artist}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Favorite Spotlight if any */}
      {favoriteTracks.length > 0 && (
        <section className="rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-950/30 via-fuchsia-950/20 to-transparent p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-5 w-5 text-rose-500 fill-current" />
            <h3 className="text-lg font-bold text-white">{t.favorites}</h3>
            <span className="text-xs text-neutral-400">({favoriteTracks.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {favoriteTracks.slice(0, 3).map((f) => (
              <div
                key={f.id}
                onClick={() => onPlayTrack(f)}
                className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition"
              >
                <img
                  src={f.coverUrl}
                  alt={f.title}
                  className="h-12 w-12 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{f.title}</div>
                  <div className="text-[11px] text-neutral-400 truncate">{f.artist}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(f.id);
                  }}
                  className="p-1 text-rose-500 hover:text-rose-400"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
