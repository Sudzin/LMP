import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Track,
  Playlist,
  RepeatMode,
  ScreenType,
  AppSettings,
  EqualizerConfig,
} from './types';
import { dbService } from './services/db';
import { audioEngine } from './services/audioEngine';
import { processFileList } from './services/fileScanner';
import { Sidebar } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { DynamicBackground } from './components/DynamicBackground';
import { ParticlesBackground } from './components/ParticlesBackground';
import { EqualizerModal } from './components/EqualizerModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { ResumeBanner } from './components/ResumeBanner';
import { HomeView } from './components/HomeView';
import { TracksView } from './components/TracksView';
import { AlbumsView, ArtistsView, GenresView, QueueView } from './components/MediaViews';
import { VideoView } from './components/VideoView';
import { SettingsView } from './components/SettingsView';
import { DesktopCodeView } from './components/DesktopCodeView';
import { generateCoverArt } from './services/sampleMedia';

export default function App() {
  // State
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Settings & Equalizer
  const [settings, setSettings] = useState<AppSettings>(() => dbService.getSettings());
  const [eqConfig, setEqConfig] = useState<EqualizerConfig>(() => dbService.getEqualizerConfig());
  const [isEqOpen, setIsEqOpen] = useState<boolean>(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState<boolean>(false);
  const [resumePrompt, setResumePrompt] = useState<{ track: Track; position: number } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Media references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentActiveMedia = currentTrack?.type === 'video' ? videoRef.current : audioRef.current;

  // Sleep timer ref
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial tracks and playlists from DB
  useEffect(() => {
    async function loadData() {
      const loadedTracks = await dbService.getTracks();
      const loadedPlaylists = await dbService.getPlaylists();
      setTracks(loadedTracks);
      setPlaylists(loadedPlaylists);

      if (loadedTracks.length > 0) {
        // Check last session
        const lastSession = dbService.getLastSession();
        if (lastSession?.trackId && lastSession.position > 5) {
          const match = loadedTracks.find((t) => t.id === lastSession.trackId);
          if (match) {
            setResumePrompt({ track: match, position: lastSession.position });
          }
        }
        // Set first track as ready
        setCurrentTrack(loadedTracks[0]);
        setQueue(loadedTracks.slice(1));
      }
    }
    loadData();
  }, []);

  // Sync settings & eq to storage
  useEffect(() => {
    dbService.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    dbService.saveEqualizerConfig(eqConfig);
  }, [eqConfig]);

  // Audio Engine Hookup on active media element
  const connectAudioPipeline = useCallback(
    (el: HTMLMediaElement) => {
      audioEngine.init(el);
      audioEngine.setEqEnabled(eqConfig.enabled);
      audioEngine.setAllBands(eqConfig.bands.map((b) => b.gain));
    },
    [eqConfig]
  );

  // Periodic position saver
  useEffect(() => {
    if (!currentTrack || currentTime <= 2) return;
    const interval = setInterval(() => {
      dbService.saveLastSession({
        trackId: currentTrack.id,
        position: currentTime,
        updatedAt: Date.now(),
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentTrack, currentTime]);

  // Sleep timer effect
  useEffect(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    if (settings.sleepTimerMinutes !== null) {
      sleepTimerRef.current = setTimeout(() => {
        if (currentActiveMedia) {
          currentActiveMedia.pause();
          setIsPlaying(false);
        }
        setSettings((prev) => ({ ...prev, sleepTimerMinutes: null }));
      }, settings.sleepTimerMinutes * 60 * 1000);
    }

    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [settings.sleepTimerMinutes, currentActiveMedia]);

  // Handle Play Track
  const handlePlayTrack = useCallback(
    (track: Track, startTime = 0) => {
      setCurrentTrack(track);

      // Prepare target element
      const targetEl = track.type === 'video' ? videoRef.current : audioRef.current;
      const otherEl = track.type === 'video' ? audioRef.current : videoRef.current;

      if (otherEl) {
        otherEl.pause();
      }

      if (targetEl) {
        targetEl.src = track.url;
        targetEl.playbackRate = settings.playbackSpeed;
        targetEl.currentTime = startTime;

        connectAudioPipeline(targetEl);

        targetEl
          .play()
          .then(() => {
            setIsPlaying(true);
            // Increment playCount
            setTracks((prev) =>
              prev.map((t) => (t.id === track.id ? { ...t, playCount: t.playCount + 1 } : t))
            );
          })
          .catch((err) => {
            console.warn('Playback error:', err);
          });
      }

      if (track.type === 'video' && currentScreen !== 'video') {
        setCurrentScreen('video');
      }
    },
    [connectAudioPipeline, settings.playbackSpeed, currentScreen]
  );

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(() => {
    const el = currentTrack?.type === 'video' ? videoRef.current : audioRef.current;
    if (!el) {
      if (tracks.length > 0) {
        handlePlayTrack(tracks[0]);
      }
      return;
    }

    audioEngine.resume();

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      connectAudioPipeline(el);
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, [currentTrack, tracks, isPlaying, handlePlayTrack, connectAudioPipeline]);

  // Next Track
  const handleNext = useCallback(() => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue((prev) => prev.slice(1));
      handlePlayTrack(nextTrack);
      return;
    }

    if (tracks.length === 0) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      handlePlayTrack(tracks[randomIndex]);
    } else {
      const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
      const nextIndex = (currentIndex + 1) % tracks.length;
      handlePlayTrack(tracks[nextIndex]);
    }
  }, [queue, tracks, isShuffle, currentTrack, handlePlayTrack]);

  // Prev Track
  const handlePrev = useCallback(() => {
    const el = currentActiveMedia;
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      return;
    }

    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    handlePlayTrack(tracks[prevIndex]);
  }, [currentActiveMedia, tracks, currentTrack, handlePlayTrack]);

  // Seek
  const handleSeek = (time: number) => {
    const el = currentActiveMedia;
    if (el) {
      el.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Volume
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(false);
    if (audioRef.current) audioRef.current.volume = vol;
    if (videoRef.current) videoRef.current.volume = vol;
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) audioRef.current.muted = nextMuted;
    if (videoRef.current) videoRef.current.muted = nextMuted;
  };

  const handleToggleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  const handleToggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const handleSpeedChange = (speed: number) => {
    setSettings((prev) => ({ ...prev, playbackSpeed: speed }));
    if (audioRef.current) audioRef.current.playbackRate = speed;
    if (videoRef.current) videoRef.current.playbackRate = speed;
  };

  const handleToggleFavorite = (trackId: string) => {
    setTracks((prev) => {
      const updated = prev.map((t) =>
        t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t
      );
      dbService.saveTracks(updated);
      return updated;
    });
  };

  const handleAddToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const handlePlayNext = (track: Track) => {
    setQueue((prev) => [track, ...prev]);
  };

  const handleDeleteTrack = async (id: string) => {
    await dbService.deleteTrack(id);
    setTracks((prev) => prev.filter((t) => t.id !== id));
    setQueue((prev) => prev.filter((t) => t.id !== id));
    if (currentTrack?.id === id) {
      handleNext();
    }
  };

  // Add files or folders
  const handleAddFiles = async (fileList: FileList | File[]) => {
    const { tracks: newTracks, files } = await processFileList(fileList);
    if (newTracks.length > 0) {
      for (let i = 0; i < newTracks.length; i++) {
        await dbService.addTrackWithFile(newTracks[i], files[i]);
      }
      setTracks((prev) => [...newTracks, ...prev]);
      if (!currentTrack) {
        handlePlayTrack(newTracks[0]);
      }
    }
  };

  // Playlists
  const handleCreatePlaylist = async (name: string, description: string) => {
    const newPl: Playlist = {
      id: 'pl-' + Date.now(),
      name,
      description,
      trackIds: [],
      createdAt: Date.now(),
      coverUrl: generateCoverArt(name, 'Aurora Playlist', playlists.length % 5),
    };
    const updated = [...playlists, newPl];
    setPlaylists(updated);
    await dbService.savePlaylists(updated);
  };

  const handleAddToPlaylist = async (trackId: string, playlistId: string) => {
    const updated = playlists.map((pl) => {
      if (pl.id === playlistId && !pl.trackIds.includes(trackId)) {
        return { ...pl, trackIds: [...pl.trackIds, trackId] };
      }
      return pl;
    });
    setPlaylists(updated);
    await dbService.savePlaylists(updated);
  };

  const handleResetLibrary = async () => {
    localStorage.clear();
    const req = indexedDB.deleteDatabase('AuroraPlayerDB');
    req.onsuccess = () => {
      window.location.reload();
    };
    req.onerror = () => {
      window.location.reload();
    };
  };

  // Keyboard Shortcuts (SPEC.md §3.5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;

        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.min(1.0, v + 0.05);
            handleVolumeChange(nv);
            return nv;
          });
          break;

        case 'ArrowDown':
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.max(0.0, v - 0.05);
            handleVolumeChange(nv);
            return nv;
          });
          break;

        case 'ArrowRight':
          e.preventDefault();
          {
            const step = e.shiftKey ? 5 : 10;
            const el = currentActiveMedia;
            if (el) handleSeek(Math.min(el.duration || 0, el.currentTime + step));
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          {
            const step = e.shiftKey ? 5 : 10;
            const el = currentActiveMedia;
            if (el) handleSeek(Math.max(0, el.currentTime - step));
          }
          break;

        case 'KeyM':
          e.preventDefault();
          handleToggleMute();
          break;

        case 'KeyF':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else {
            document.documentElement.requestFullscreen().catch(() => {});
          }
          break;

        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, currentActiveMedia]);

  // Drag and Drop files onto window
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) {
        setIsDraggingOver(false);
      }
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleAddFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // HTML Audio listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNext();
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, [repeatMode, handleNext]);

  // Video listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onEnded = () => {
      if (repeatMode === 'one') {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        handleNext();
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('ended', onEnded);
    };
  }, [repeatMode, handleNext]);

  // Selected playlist tracks
  const currentPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const playlistTracks = currentPlaylist
    ? tracks.filter((t) => currentPlaylist.trackIds.includes(t.id))
    : [];

  return (
    <div
      id="aurora-player-root"
      className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#0c0a0f] text-neutral-100 font-sans select-none antialiased"
    >
      {/* Hidden Audio Element */}
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" />

      {/* Dynamic Spotify-Style Album Color Blur Background */}
      <DynamicBackground
        currentTrack={currentTrack}
        theme={settings.theme}
        customGradient={settings.customGradient}
      />

      {/* Floating Particles Canvas on Home */}
      {currentScreen === 'home' && (
        <ParticlesBackground enabled={settings.particlesEnabled} />
      )}

      {/* Resume Session Banner */}
      {resumePrompt && (
        <ResumeBanner
          track={resumePrompt.track}
          position={resumePrompt.position}
          onResume={() => {
            handlePlayTrack(resumePrompt.track, resumePrompt.position);
            setResumePrompt(null);
          }}
          onDismiss={() => setResumePrompt(null)}
          language={settings.language}
        />
      )}

      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md border-4 border-dashed border-rose-500 text-white animate-in fade-in">
          <div className="text-4xl font-extrabold mb-2">Отпустите файлы сюда</div>
          <p className="text-sm text-neutral-300">
            Aurora Player добавит аудио и видео файлы прямо в вашу локальную медиатеку
          </p>
        </div>
      )}

      {/* Main App Layout: Sidebar + Content */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentScreen={currentScreen}
          onSelectScreen={(s) => {
            setCurrentScreen(s);
            setSelectedPlaylistId(null);
          }}
          playlists={playlists}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={(id) => {
            setSelectedPlaylistId(id);
            setCurrentScreen('playlists');
          }}
          onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
          onAddFiles={handleAddFiles}
          onAddFolder={handleAddFiles}
          language={settings.language}
          onToggleLanguage={() =>
            setSettings((prev) => ({
              ...prev,
              language: prev.language === 'ru' ? 'en' : 'ru',
            }))
          }
        />

        {/* Scrollable Center Main Screen */}
        <main
          id="main-scroll-container"
          className="relative flex-1 overflow-y-auto px-6 py-8 scrollbar-thin scrollbar-thumb-white/10"
        >
          {selectedPlaylistId && currentPlaylist ? (
            <div className="space-y-6 pb-20">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 border-b border-white/10 pb-6">
                <img
                  src={currentPlaylist.coverUrl || tracks[0]?.coverUrl}
                  alt={currentPlaylist.name}
                  className="h-44 w-44 rounded-2xl object-cover shadow-2xl bg-neutral-800"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-400">
                    Плейлист
                  </span>
                  <h2 className="text-3xl font-black text-white sm:text-4xl mt-1">
                    {currentPlaylist.name}
                  </h2>
                  <p className="text-sm text-neutral-400 mt-2">
                    {currentPlaylist.description} • {playlistTracks.length} треков
                  </p>
                </div>
              </div>

              {playlistTracks.length > 0 ? (
                <TracksView
                  tracks={playlistTracks}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlayTrack={handlePlayTrack}
                  onTogglePlay={handleTogglePlay}
                  onToggleFavorite={handleToggleFavorite}
                  onAddToQueue={handleAddToQueue}
                  onPlayNext={handlePlayNext}
                  onAddToPlaylist={handleAddToPlaylist}
                  onDeleteTrack={handleDeleteTrack}
                  playlists={playlists}
                  onOpenAddFiles={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files) handleAddFiles(files);
                    };
                    input.click();
                  }}
                  language={settings.language}
                />
              ) : (
                <div className="py-16 text-center text-neutral-400">
                  В этом плейлисте пока нет треков. Добавьте треки из вкладки «Треки».
                </div>
              )}
            </div>
          ) : currentScreen === 'home' ? (
            <HomeView
              tracks={tracks}
              playlists={playlists}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              onTogglePlay={handleTogglePlay}
              onToggleFavorite={handleToggleFavorite}
              onSelectPlaylist={(id) => {
                setSelectedPlaylistId(id);
                setCurrentScreen('playlists');
              }}
              onOpenAddFiles={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files) handleAddFiles(files);
                };
                input.click();
              }}
              language={settings.language}
            />
          ) : currentScreen === 'tracks' ? (
            <TracksView
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              onTogglePlay={handleTogglePlay}
              onToggleFavorite={handleToggleFavorite}
              onAddToQueue={handleAddToQueue}
              onPlayNext={handlePlayNext}
              onAddToPlaylist={handleAddToPlaylist}
              onDeleteTrack={handleDeleteTrack}
              playlists={playlists}
              onOpenAddFiles={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files) handleAddFiles(files);
                };
                input.click();
              }}
              language={settings.language}
            />
          ) : currentScreen === 'albums' ? (
            <AlbumsView
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              onTogglePlay={handleTogglePlay}
              language={settings.language}
            />
          ) : currentScreen === 'artists' ? (
            <ArtistsView
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              onTogglePlay={handleTogglePlay}
              language={settings.language}
            />
          ) : currentScreen === 'genres' ? (
            <GenresView
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              onTogglePlay={handleTogglePlay}
              language={settings.language}
            />
          ) : currentScreen === 'queue' ? (
            <QueueView
              queue={queue}
              currentTrack={currentTrack}
              onPlayTrack={handlePlayTrack}
              onRemoveFromQueue={(idx) =>
                setQueue((prev) => prev.filter((_, i) => i !== idx))
              }
              onClearQueue={() => setQueue([])}
              language={settings.language}
            />
          ) : currentScreen === 'video' ? (
            <VideoView
              tracks={tracks}
              currentTrack={currentTrack}
              videoRef={videoRef}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              onTogglePlay={handleTogglePlay}
              onOpenEqualizer={() => setIsEqOpen(true)}
              language={settings.language}
            />
          ) : currentScreen === 'settings' ? (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              onResetLibrary={handleResetLibrary}
              language={settings.language}
            />
          ) : currentScreen === 'desktop-code' ? (
            <DesktopCodeView language={settings.language} />
          ) : null}
        </main>
      </div>

      {/* Bottom Full-Width "Now Playing" Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        playbackSpeed={settings.playbackSpeed}
        visualizerEnabled={settings.visualizerEnabled}
        sleepTimerMinutes={settings.sleepTimerMinutes}
        isFavorite={currentTrack?.isFavorite ?? false}
        language={settings.language}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleRepeat={handleToggleRepeat}
        onToggleShuffle={handleToggleShuffle}
        onSpeedChange={handleSpeedChange}
        onToggleFavorite={() => {
          if (currentTrack) handleToggleFavorite(currentTrack.id);
        }}
        onOpenEqualizer={() => setIsEqOpen(true)}
        onToggleQueue={() => setCurrentScreen('queue')}
        onSetSleepTimer={(mins) =>
          setSettings((prev) => ({ ...prev, sleepTimerMinutes: mins }))
        }
        onToggleFullscreen={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        }}
        onOpenVideo={() => setCurrentScreen('video')}
      />

      {/* 10-Band IIR Biquad Equalizer Modal */}
      <EqualizerModal
        isOpen={isEqOpen}
        onClose={() => setIsEqOpen(false)}
        config={eqConfig}
        onChangeConfig={setEqConfig}
        language={settings.language}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreate={handleCreatePlaylist}
        language={settings.language}
      />
    </div>
  );
}
