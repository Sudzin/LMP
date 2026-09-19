import React from 'react';
import { Play, X, RotateCcw } from 'lucide-react';
import { Track } from '../types';

interface ResumeBannerProps {
  track: Track;
  position: number;
  onResume: () => void;
  onDismiss: () => void;
  language: 'ru' | 'en';
}

export const ResumeBanner: React.FC<ResumeBannerProps> = ({
  track,
  position,
  onResume,
  onDismiss,
  language,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id="resume-playback-banner"
      className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-[#16121c]/95 p-3.5 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-fuchsia-600 shadow-md">
        <RotateCcw className="h-5 w-5 text-white" />
      </div>

      <div className="text-xs">
        <p className="font-bold text-white">
          {language === 'ru' ? 'Продолжить воспроизведение?' : 'Resume playback?'}
        </p>
        <p className="text-neutral-400 truncate max-w-[200px]">
          {track.title} ({formatTime(position)})
        </p>
      </div>

      <div className="flex items-center gap-1.5 ml-2">
        <button
          onClick={onResume}
          className="flex items-center gap-1 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600 transition active:scale-95"
        >
          <Play className="h-3 w-3 fill-current" />
          {language === 'ru' ? 'Да' : 'Yes'}
        </button>
        <button
          onClick={onDismiss}
          className="rounded-xl p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
