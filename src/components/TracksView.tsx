import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Heart,
  Search,
  ArrowUpDown,
  MoreVertical,
  Plus,
  Clock,
  ListPlus,
  Trash2,
  Video,
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { translations } from '../services/i18n';

interface TracksViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onToggleFavorite: (id: string) => void;
  onAddToQueue: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onAddToPlaylist: (trackId: string, playlistId: string) => void;
  onDeleteTrack: (id: string) => void;
  playlists: Playlist[];
  onOpenAddFiles: () => void;
  language: 'ru' | 'en';
}

type SortField = 'title' | 'artist' | 'album' | 'duration' | 'addedAt';

export const TracksView: React.FC<TracksViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onToggleFavorite,
  onAddToQueue,
  onPlayNext,
  onAddToPlaylist,
  onDeleteTrack,
  playlists,
  onOpenAddFiles,
  language,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('addedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredAndSortedTracks = useMemo(() => {
    let result = tracks.filter((tr) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        tr.title.toLowerCase().includes(q) ||
        tr.artist.toLowerCase().includes(q) ||
        tr.album.toLowerCase().includes(q) ||
        tr.genre.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortField === 'artist') cmp = a.artist.localeCompare(b.artist);
      else if (sortField === 'album') cmp = a.album.localeCompare(b.album);
      else if (sortField === 'duration') cmp = a.duration - b.duration;
      else if (sortField === 'addedAt') cmp = a.addedAt - b.addedAt;

      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [tracks, searchQuery, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div id="tracks-view-container" className="relative z-10 w-full space-y-6 pb-20">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {t.allTracks}
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            {filteredAndSortedTracks.length} {t.tracks.toLowerCase()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Instant Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              id="tracks-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-xs text-white placeholder:text-neutral-500 focus:border-rose-500/50 focus:bg-white/10 focus:outline-none transition"
            />
          </div>

          <button
            id="tracks-add-files-btn"
            onClick={onOpenAddFiles}
            className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            {t.addFiles}
          </button>
        </div>
      </div>

      {/* Tracks Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#14101a]/70 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="w-12 py-3.5 pl-4 text-center">#</th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-white transition"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1.5">
                  <span>{t.popularTracks.split(' ')[0]}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="hidden md:table-cell py-3.5 px-3 cursor-pointer hover:text-white transition"
                onClick={() => handleSort('album')}
              >
                <div className="flex items-center gap-1.5">
                  <span>{t.totalAlbums.charAt(0).toUpperCase() + t.totalAlbums.slice(1)}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="hidden lg:table-cell py-3.5 px-3 cursor-pointer hover:text-white transition"
                onClick={() => handleSort('addedAt')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Дата</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="w-24 py-3.5 pr-4 text-right cursor-pointer hover:text-white transition"
                onClick={() => handleSort('duration')}
              >
                <div className="flex items-center justify-end gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="w-16 py-3.5 pr-4 text-center"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {filteredAndSortedTracks.map((tr, index) => {
              const isCurrent = currentTrack?.id === tr.id;
              const isPlayingThis = isCurrent && isPlaying;

              return (
                <tr
                  key={tr.id}
                  id={`track-row-${tr.id}`}
                  onDoubleClick={() => onPlayTrack(tr)}
                  className={`group transition-colors hover:bg-white/5 cursor-pointer ${
                    isCurrent ? 'bg-rose-500/10 text-white' : ''
                  }`}
                >
                  {/* # or Play button */}
                  <td className="py-2.5 pl-4 text-center">
                    <div className="flex items-center justify-center">
                      <span className="group-hover:hidden font-mono text-neutral-400">
                        {isPlayingThis ? (
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="h-3 w-0.5 animate-pulse bg-rose-400" />
                            <span className="h-4 w-0.5 animate-pulse bg-rose-400 delay-75" />
                            <span className="h-2 w-0.5 animate-pulse bg-rose-400 delay-150" />
                          </div>
                        ) : (
                          index + 1
                        )}
                      </span>

                      <button
                        id={`track-play-btn-${tr.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrent) onTogglePlay();
                          else onPlayTrack(tr);
                        }}
                        className="hidden group-hover:flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm"
                      >
                        {isPlayingThis ? (
                          <Pause className="h-3.5 w-3.5 fill-current" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Title & Artist */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={tr.coverUrl}
                        alt={tr.title}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover bg-white/5"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`truncate font-semibold ${
                              isCurrent ? 'text-rose-400' : 'text-white'
                            }`}
                          >
                            {tr.title}
                          </p>
                          {tr.type === 'video' && (
                            <span className="flex items-center gap-1 rounded bg-rose-500/20 px-1 py-0.2 text-[9px] font-bold text-rose-300">
                              <Video className="h-2.5 w-2.5" /> VIDEO
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-neutral-400">
                          {tr.artist}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Album */}
                  <td className="hidden md:table-cell py-2.5 px-3 truncate text-neutral-400 max-w-[180px]">
                    {tr.album}
                  </td>

                  {/* Date */}
                  <td className="hidden lg:table-cell py-2.5 px-3 text-neutral-400">
                    {formatDate(tr.addedAt)}
                  </td>

                  {/* Duration */}
                  <td className="py-2.5 pr-4 text-right font-mono text-neutral-400">
                    {formatTime(tr.duration)}
                  </td>

                  {/* Actions & Heart */}
                  <td className="py-2.5 pr-4 text-center relative">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        id={`track-fav-btn-${tr.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(tr.id);
                        }}
                        className={`p-1.5 transition ${
                          tr.isFavorite
                            ? 'text-rose-500'
                            : 'text-neutral-500 opacity-0 group-hover:opacity-100 hover:text-white'
                        }`}
                      >
                        <Heart
                          className="h-3.5 w-3.5"
                          fill={tr.isFavorite ? 'currentColor' : 'none'}
                        />
                      </button>

                      {/* More Menu Toggle */}
                      <div className="relative">
                        <button
                          id={`track-menu-btn-${tr.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuTrackId(
                              activeMenuTrackId === tr.id ? null : tr.id
                            );
                          }}
                          className="p-1.5 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-white transition"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {activeMenuTrackId === tr.id && (
                          <div
                            id={`track-dropdown-${tr.id}`}
                            className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-white/10 bg-[#1c1524] p-1.5 text-left shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                onPlayNext(tr);
                                setActiveMenuTrackId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-white/10 hover:text-white transition"
                            >
                              <Play className="h-3 w-3" />
                              {t.playNext}
                            </button>

                            <button
                              onClick={() => {
                                onAddToQueue(tr);
                                setActiveMenuTrackId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-white/10 hover:text-white transition"
                            >
                              <ListPlus className="h-3 w-3" />
                              {t.addToQueue}
                            </button>

                            {playlists.length > 0 && (
                              <div className="my-1 border-t border-white/10 pt-1">
                                <div className="px-2 py-0.5 text-[10px] uppercase font-bold text-neutral-400">
                                  {t.addToPlaylist}
                                </div>
                                {playlists.map((pl) => (
                                  <button
                                    key={pl.id}
                                    onClick={() => {
                                      onAddToPlaylist(tr.id, pl.id);
                                      setActiveMenuTrackId(null);
                                    }}
                                    className="flex w-full items-center gap-1.5 truncate rounded-lg px-2.5 py-1 text-xs text-neutral-300 hover:bg-white/10 hover:text-white transition"
                                  >
                                    <span className="truncate">{pl.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="my-1 border-t border-white/10 pt-1">
                              <button
                                onClick={() => {
                                  onDeleteTrack(tr.id);
                                  setActiveMenuTrackId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                              >
                                <Trash2 className="h-3 w-3" />
                                {t.deleteTrack}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredAndSortedTracks.length === 0 && (
          <div className="py-12 text-center text-neutral-400">
            <p className="text-sm font-semibold">{t.noTracksFound}</p>
          </div>
        )}
      </div>
    </div>
  );
};
