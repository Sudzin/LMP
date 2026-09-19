import React, { useRef } from 'react';
import {
  Home,
  Music2,
  Disc3,
  Users,
  Radio,
  ListPlus,
  Video,
  Settings,
  FolderOpen,
  FilePlus2,
  Terminal,
  Compass,
} from 'lucide-react';
import { ScreenType, Playlist } from '../types';
import { translations } from '../services/i18n';

interface SidebarProps {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (id: string) => void;
  onCreatePlaylist: () => void;
  onAddFiles: (files: FileList) => void;
  onAddFolder: (files: FileList) => void;
  language: 'ru' | 'en';
  onToggleLanguage: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  onAddFiles,
  onAddFolder,
  language,
  onToggleLanguage,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const mainNavItems = [
    { id: 'home' as ScreenType, label: t.home, icon: Home },
    { id: 'tracks' as ScreenType, label: t.tracks, icon: Music2 },
    { id: 'albums' as ScreenType, label: t.albums, icon: Disc3 },
    { id: 'artists' as ScreenType, label: t.artists, icon: Users },
    { id: 'genres' as ScreenType, label: t.genres, icon: Radio },
    { id: 'video' as ScreenType, label: t.video, icon: Video },
  ];

  return (
    <aside
      id="sidebar-navigation"
      className="flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-[#0e0c14]/90 p-3 backdrop-blur-xl select-none"
    >
      {/* Hidden file inputs for local scanning */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="audio/*,video/*,.mp3,.flac,.wav,.ogg,.m4a,.aac,.mp4,.mkv,.avi,.mov,.webm"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAddFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />
      <input
        type="file"
        ref={folderInputRef}
        multiple
        // @ts-expect-error webkitdirectory is standard in Chromium/Firefox
        webkitdirectory=""
        directory=""
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAddFolder(e.target.files);
          }
          e.target.value = '';
        }}
      />

      {/* Brand Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-fuchsia-600 to-rose-500 shadow-md shadow-rose-500/20">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              AURORA
              <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[9px] font-bold text-rose-300">
                PRO
              </span>
            </h1>
          </div>
        </div>

        {/* RU / EN Switch */}
        <button
          id="lang-toggle-btn"
          onClick={onToggleLanguage}
          title="Switch RU / EN"
          className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-bold text-neutral-300 hover:border-rose-500/40 hover:text-white transition"
        >
          {language.toUpperCase()}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="mt-4 flex flex-col gap-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id && selectedPlaylistId === null;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectScreen(item.id)}
              className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-rose-500/20 to-fuchsia-600/10 text-white font-bold border border-rose-500/30'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? 'text-rose-400' : 'text-neutral-400'
                }`}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Actions: Scan Folder & Add Files */}
      <div className="mt-5 border-t border-white/10 pt-4 px-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 px-2.5 flex items-center justify-between">
          <span>{t.library}</span>
        </div>

        <div className="flex flex-col gap-1">
          <button
            id="sidebar-add-files-btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-white/5 hover:text-white transition"
          >
            <FilePlus2 className="h-4 w-4 text-rose-400" />
            {t.addFiles}
          </button>

          <button
            id="sidebar-scan-folder-btn"
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-white/5 hover:text-white transition"
          >
            <FolderOpen className="h-4 w-4 text-fuchsia-400" />
            {t.addFolder}
          </button>

          <button
            id="sidebar-create-playlist-btn"
            onClick={onCreatePlaylist}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-white/5 hover:text-white transition"
          >
            <ListPlus className="h-4 w-4 text-amber-400" />
            {t.createPlaylist}
          </button>
        </div>
      </div>

      {/* Playlists List */}
      <div className="mt-3 flex-1 overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-white/10">
        <div className="space-y-0.5">
          {playlists.map((pl) => {
            const isSelected = selectedPlaylistId === pl.id;
            return (
              <button
                key={pl.id}
                id={`playlist-item-${pl.id}`}
                onClick={() => onSelectPlaylist(pl.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                  isSelected
                    ? 'bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/20'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                }`}
              >
                <span className="truncate">{pl.name}</span>
                <span className="text-[10px] text-neutral-400 shrink-0 ml-1">
                  {pl.trackIds.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Links */}
      <div className="mt-auto border-t border-white/10 pt-3 px-1 space-y-1">
        <button
          id="nav-item-settings"
          onClick={() => onSelectScreen('settings')}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition ${
            currentScreen === 'settings'
              ? 'bg-white/10 text-white'
              : 'text-neutral-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Settings className="h-4 w-4" />
          {t.settings}
        </button>

        <button
          id="nav-item-desktop-code"
          onClick={() => onSelectScreen('desktop-code')}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition ${
            currentScreen === 'desktop-code'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-neutral-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Terminal className="h-4 w-4 text-rose-400" />
          {t.desktopCode}
        </button>
      </div>
    </aside>
  );
};
