import React, { useRef, useState, useEffect } from 'react';
import {
  Video as VideoIcon,
  Upload,
  Subtitles,
  Maximize,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Track, SubtitleCue } from '../types';
import { parseSubtitles } from '../services/subtitles';
import { VisualizerCanvas } from './VisualizerCanvas';
import { translations } from '../services/i18n';

interface VideoViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onOpenEqualizer: () => void;
  language: 'ru' | 'en';
}

export const VideoView: React.FC<VideoViewProps> = ({
  tracks,
  currentTrack,
  videoRef,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onOpenEqualizer,
  language,
}) => {
  const t = translations[language];
  const videoTracks = tracks.filter((t) => t.type === 'video');

  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(true);
  const subtitleInputRef = useRef<HTMLInputElement | null>(null);

  // Parse default subtitles if current track has subtitlesUrl or content
  useEffect(() => {
    // Default sample subtitle text
    const defaultSrt = `1
00:00:00,500 --> 00:00:03,000
Aurora Player: Видео-движок и 10-полосный эквалайзер

2
00:00:03,200 --> 00:00:06,000
Поддержка внешних субтитров .srt / .vtt активна

3
00:00:06,200 --> 00:00:09,500
Звук видео проходит через IIR эквалайзер и визуализатор!
`;
    setCues(parseSubtitles(defaultSrt));
  }, []);

  // Update current subtitle text as video plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!subtitlesEnabled || cues.length === 0) {
        setCurrentSubtitle('');
        return;
      }
      const time = video.currentTime;
      const matched = cues.find((c) => time >= c.start && time <= c.end);
      setCurrentSubtitle(matched ? matched.text : '');
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoRef, cues, subtitlesEnabled]);

  const handleSubtitleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        const parsed = parseSubtitles(content, file.name);
        setCues(parsed);
        setSubtitlesEnabled(true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFullscreenVideo = () => {
    const container = document.getElementById('video-viewport-container');
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      container.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div id="video-view-container" className="relative z-10 w-full space-y-6 pb-20">
      {/* Hidden subtitle input */}
      <input
        type="file"
        ref={subtitleInputRef}
        accept=".srt,.vtt,.ass"
        className="hidden"
        onChange={handleSubtitleFile}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {t.videoTitle}
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            Воспроизведение локальных видео (MP4, MKV, MOV, WEBM) со звуком через эквалайзер
          </p>
        </div>

        {/* Subtitles & Equalizer Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="video-load-subtitles-btn"
            onClick={() => subtitleInputRef.current?.click()}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10 hover:border-white/20 transition"
          >
            <Subtitles className="h-4 w-4 text-rose-400" />
            {t.loadSubtitles}
          </button>

          <button
            id="video-open-eq-btn"
            onClick={onOpenEqualizer}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition"
          >
            <Sliders className="h-4 w-4 text-fuchsia-400" />
            {t.equalizer}
          </button>
        </div>
      </div>

      {/* Main Video Stage */}
      <div
        id="video-viewport-container"
        className="relative group w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center"
      >
        <video
          ref={videoRef}
          crossOrigin="anonymous"
          playsInline
          className="h-full w-full object-contain"
          onClick={onTogglePlay}
        />

        {/* Synchronized Subtitle Overlay */}
        {subtitlesEnabled && currentSubtitle && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-[85%] text-center pointer-events-none z-30 transition-opacity">
            <span className="inline-block rounded-lg bg-black/85 px-4 py-1.5 text-base sm:text-lg font-bold text-white shadow-2xl backdrop-blur-sm border border-white/10">
              {currentSubtitle}
            </span>
          </div>
        )}

        {/* Floating Quick Controls on Hover */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={onTogglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg hover:scale-105 transition"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
              title={subtitlesEnabled ? t.subtitlesActive : t.noSubtitles}
              className={`rounded-lg p-2 text-xs font-semibold transition ${
                subtitlesEnabled ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-neutral-400'
              }`}
            >
              <Subtitles className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <VisualizerCanvas mode="wave" isPlaying={isPlaying} width={120} height={28} />

            <button
              onClick={handleFullscreenVideo}
              title="Fullscreen video"
              className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Playlist Carousel */}
      {videoTracks.length > 0 ? (
        <div>
          <h3 className="text-lg font-bold text-white mb-3">
            Видеофайлы в библиотеке ({videoTracks.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videoTracks.map((vt) => {
              const isCurrent = currentTrack?.id === vt.id;
              return (
                <div
                  key={vt.id}
                  onClick={() => onPlayTrack(vt)}
                  className={`group relative flex flex-col rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-rose-500/40 cursor-pointer transition ${
                    isCurrent ? 'ring-2 ring-rose-500' : ''
                  }`}
                >
                  <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                    <img
                      src={vt.coverUrl}
                      alt={vt.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-8 w-8 text-white fill-current" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="truncate text-xs font-bold text-white group-hover:text-rose-300">
                      {vt.title}
                    </h4>
                    <p className="truncate text-[11px] text-neutral-400 mt-0.5">
                      {vt.artist} • {vt.format.toUpperCase()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-8 text-center text-neutral-400">
          <VideoIcon className="h-10 w-10 text-neutral-500 mx-auto mb-2" />
          <p className="text-sm font-semibold">{t.selectVideo}</p>
          <p className="text-xs text-neutral-500 mt-1">
            Перетащите видеофайл в окно Aurora Player или выберите в меню «Открыть файлы»
          </p>
        </div>
      )}
    </div>
  );
};
