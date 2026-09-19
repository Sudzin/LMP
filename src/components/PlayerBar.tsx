import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Volume1,
  Sliders,
  ListMusic,
  Maximize2,
  Heart,
  Moon,
  Video,
} from 'lucide-react';
import { Track, RepeatMode } from '../types';
import { VisualizerCanvas } from './VisualizerCanvas';
import { translations } from '../services/i18n';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  playbackSpeed: number;
  visualizerEnabled: boolean;
  sleepTimerMinutes: number | null;
  isFavorite: boolean;
  language: 'ru' | 'en';
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleFavorite: () => void;
  onOpenEqualizer: () => void;
  onToggleQueue: () => void;
  onSetSleepTimer: (mins: number | null) => void;
  onToggleFullscreen: () => void;
  onOpenVideo?: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  repeatMode,
  isShuffle,
  playbackSpeed,
  visualizerEnabled,
  sleepTimerMinutes,
  isFavorite,
  language,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleRepeat,
  onToggleShuffle,
  onSpeedChange,
  onToggleFavorite,
  onOpenEqualizer,
  onToggleQueue,
  onSetSleepTimer,
  onToggleFullscreen,
  onOpenVideo,
}) => {
  const t = translations[language];
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const speeds = [0.5, 0.8, 1.0, 1.25, 1.5, 2.0];
  const sleepOptions = [null, 5, 15, 30, 45, 60];

  const effectiveVol = isMuted ? 0 : volume;

  return (
    <footer
      id="now-playing-bar"
      className="relative z-40 flex h-24 w-full items-center justify-between border-t border-white/10 bg-[#120f18]/95 px-4 backdrop-blur-xl md:px-6 shadow-2xl"
    >
      {/* LEFT: Current Track Info */}
      <div className="flex w-1/4 min-w-[200px] items-center gap-3.5">
        {currentTrack ? (
          <>
            <div className="relative group shrink-0 h-14 w-14 overflow-hidden rounded-lg shadow-md bg-white/5 border border-white/10">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
              {currentTrack.type === 'video' && (
                <button
                  id="player-open-video-btn"
                  onClick={onOpenVideo}
                  title="Open video player"
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Video className="h-5 w-5 text-white" />
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="truncate text-sm font-semibold text-white">
                  {currentTrack.title}
                </h4>
                {currentTrack.type === 'video' && (
                  <span className="shrink-0 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                    VIDEO
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-neutral-400">
                {currentTrack.artist}
              </p>
            </div>

            <button
              id="player-favorite-btn"
              onClick={onToggleFavorite}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`shrink-0 p-1.5 transition-colors ${
                isFavorite
                  ? 'text-rose-500 hover:text-rose-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Heart
                className="h-4 w-4"
                fill={isFavorite ? 'currentColor' : 'none'}
              />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-neutral-400">
            <div className="h-14 w-14 rounded-lg bg-white/5 border border-white/5" />
            <div className="text-xs">{t.emptyLibraryTitle}</div>
          </div>
        )}
      </div>

      {/* CENTER: Main Controls & Seek Slider */}
      <div className="flex max-w-[620px] flex-1 flex-col items-center gap-1.5 px-4">
        {/* Buttons Row */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            id="player-shuffle-btn"
            onClick={onToggleShuffle}
            title={t.shufflePlay}
            className={`p-1.5 transition-colors ${
              isShuffle
                ? 'text-rose-400 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shuffle className="h-4 w-4" />
          </button>

          <button
            id="player-prev-btn"
            onClick={onPrev}
            title="Previous track"
            className="p-1.5 text-neutral-300 hover:text-white transition-transform active:scale-95"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          {/* Big Play / Pause Button with Pulsing Glow */}
          <button
            id="player-play-btn"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-fuchsia-600 text-white shadow-lg transition-all active:scale-95 ${
              isPlaying
                ? 'shadow-rose-500/40 ring-4 ring-rose-500/20'
                : 'hover:scale-105 shadow-black/50'
            }`}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            id="player-next-btn"
            onClick={onNext}
            title="Next track"
            className="p-1.5 text-neutral-300 hover:text-white transition-transform active:scale-95"
          >
            <SkipForward className="h-5 w-5" />
          </button>

          <button
            id="player-repeat-btn"
            onClick={onToggleRepeat}
            title={`Repeat mode: ${repeatMode}`}
            className={`p-1.5 transition-colors ${
              repeatMode !== 'off'
                ? 'text-rose-400 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="h-4 w-4" />
            ) : (
              <Repeat className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex w-full items-center gap-2.5 text-xs text-neutral-400 font-mono">
          <span className="w-10 text-right">{formatTime(currentTime)}</span>

          <div className="relative flex-1 group py-1 cursor-pointer">
            <input
              id="player-seek-slider"
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="h-1 w-full appearance-none rounded-full bg-white/20 accent-rose-500 outline-none cursor-pointer group-hover:h-1.5 transition-all"
            />
          </div>

          <span className="w-10 text-left">{formatTime(duration)}</span>
        </div>
      </div>

      {/* RIGHT: Spectrum, Tools, Volume, Speed, Sleep */}
      <div className="flex w-1/4 min-w-[220px] items-center justify-end gap-2.5">
        {/* Real-time Visualizer spectrum */}
        {visualizerEnabled && (
          <div
            id="player-visualizer-preview"
            className="hidden lg:block shrink-0 px-1 py-1"
            title="Live FFT audio spectrum"
          >
            <VisualizerCanvas
              mode="bars"
              isPlaying={isPlaying}
              width={64}
              height={26}
              className="opacity-80"
            />
          </div>
        )}

        {/* Playback speed selector */}
        <div className="relative">
          <button
            id="player-speed-btn"
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            title={t.speed}
            className="rounded px-1.5 py-0.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition"
          >
            {playbackSpeed}x
          </button>

          {showSpeedMenu && (
            <div className="absolute bottom-9 right-0 z-50 rounded-xl border border-white/10 bg-[#1e1724] p-1 shadow-xl">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onSpeedChange(s);
                    setShowSpeedMenu(false);
                  }}
                  className={`block w-full rounded-lg px-3 py-1 text-left text-xs font-mono transition ${
                    playbackSpeed === s
                      ? 'bg-rose-500 text-white'
                      : 'text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sleep timer dropdown */}
        <div className="relative">
          <button
            id="player-sleep-btn"
            onClick={() => setShowSleepMenu(!showSleepMenu)}
            title={t.sleepTimer}
            className={`p-1.5 transition ${
              sleepTimerMinutes !== null
                ? 'text-fuchsia-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Moon className="h-4 w-4" />
          </button>

          {showSleepMenu && (
            <div className="absolute bottom-9 right-0 z-50 w-36 rounded-xl border border-white/10 bg-[#1e1724] p-1 shadow-xl">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-neutral-400">
                {t.sleepTimer}
              </div>
              {sleepOptions.map((opt) => (
                <button
                  key={opt ?? 'off'}
                  onClick={() => {
                    onSetSleepTimer(opt);
                    setShowSleepMenu(false);
                  }}
                  className={`block w-full rounded-lg px-2.5 py-1 text-left text-xs transition ${
                    sleepTimerMinutes === opt
                      ? 'bg-rose-500 text-white font-semibold'
                      : 'text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {opt === null ? t.sleepTimerOff : `${opt} ${t.min}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 10-band Equalizer button */}
        <button
          id="player-eq-btn"
          onClick={onOpenEqualizer}
          title={t.equalizer}
          className="p-1.5 text-neutral-400 hover:text-white transition"
        >
          <Sliders className="h-4 w-4" />
        </button>

        {/* Queue button */}
        <button
          id="player-queue-btn"
          onClick={onToggleQueue}
          title={t.queue}
          className="p-1.5 text-neutral-400 hover:text-white transition"
        >
          <ListMusic className="h-4 w-4" />
        </button>

        {/* Volume & Mute */}
        <div className="flex items-center gap-1.5">
          <button
            id="player-volume-btn"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            className="p-1 text-neutral-400 hover:text-white transition"
          >
            {effectiveVol === 0 ? (
              <VolumeX className="h-4 w-4 text-rose-400" />
            ) : effectiveVol < 0.5 ? (
              <Volume1 className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          <input
            id="player-volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={effectiveVol}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="h-1 w-16 appearance-none rounded-full bg-white/20 accent-rose-500 outline-none cursor-pointer hover:h-1.5 transition-all"
          />
        </div>

        {/* Fullscreen button */}
        <button
          id="player-fullscreen-btn"
          onClick={onToggleFullscreen}
          title="Fullscreen (F)"
          className="hidden sm:block p-1.5 text-neutral-400 hover:text-white transition"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </footer>
  );
};
