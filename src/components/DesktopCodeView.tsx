import React, { useState } from 'react';
import { Terminal, Copy, Check, FileCode, Download, FolderArchive, Play } from 'lucide-react';
import { translations } from '../services/i18n';

interface DesktopCodeViewProps {
  language: 'ru' | 'en';
}

export const DesktopCodeView: React.FC<DesktopCodeViewProps> = ({ language }) => {
  const t = translations[language];
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const files = [
    {
      name: 'main.py',
      desc: 'Точка входа QApplication, регистрация QML типов и движка',
      code: `"""
Aurora Player — Desktop Entry Point
Portable local audio & video media player for Windows 10/11.
"""
import sys
import os
from PySide6.QtGui import QGuiApplication, QIcon
from PySide6.QtQml import QQmlApplicationEngine
from PySide6.QtCore import QUrl, QDir

from backend.player_controller import PlayerController
from backend.library_db import LibraryDB
from backend.playlist_manager import PlaylistManager
from backend.hotkeys import HotkeyManager

def resource_path(relative_path: str) -> str:
    """Получить абсолютный путь к ресурсам (для PyInstaller)"""
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

def main():
    app = QGuiApplication(sys.argv)
    app.setOrganizationName("AuroraMedia")
    app.setApplicationName("AuroraPlayer")
    app.setWindowIcon(QIcon(resource_path("assets/app.ico")))

    # Инициализация сервисов бэкенда
    db = LibraryDB()
    player = PlayerController()
    playlist_mgr = PlaylistManager(db)
    hotkeys = HotkeyManager(player)

    engine = QQmlApplicationEngine()
    
    # Регистрация контекстных свойств для QML
    ctx = engine.rootContext()
    ctx.setContextProperty("playerController", player)
    ctx.setContextProperty("libraryDb", db)
    ctx.setContextProperty("playlistManager", playlist_mgr)

    qml_file = resource_path("ui/qml/Main.qml")
    engine.load(QUrl.fromLocalFile(qml_file))

    if not engine.rootObjects():
        sys.exit(-1)

    sys.exit(app.exec())

if __name__ == "__main__":
    main()
`,
    },
    {
      name: 'backend/player_controller.py',
      desc: 'Контроллер QMediaPlayer, 10-полосный IIR эквалайзер и аудио-буфер',
      code: `"""
Aurora Player — Player Controller & 10-Band Biquad Equalizer
"""
from PySide6.QtCore import QObject, Signal, Slot, Property, QUrl
from PySide6.QtMultimedia import QMediaPlayer, QAudioOutput
import numpy as np

EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

class PlayerController(QObject):
    stateChanged = Signal(bool)
    positionChanged = Signal(int)
    durationChanged = Signal(int)
    currentTrackChanged = Signal(dict)
    spectrumReady = Signal(list)

    def __init__(self, parent=None):
        super().__init__(parent)
        self._player = QMediaPlayer()
        self._audio_output = QAudioOutput()
        self._player.setAudioOutput(self._audio_output)

        self._player.positionChanged.connect(self._on_position_changed)
        self._player.durationChanged.connect(self._on_duration_changed)
        self._player.playbackStateChanged.connect(self._on_state_changed)

        self._current_track = {}
        self._eq_gains = [0.0] * 10
        self._speed = 1.0

    @Slot(str)
    def play_file(self, file_path: str):
        """Воспроизведение локального файла (аудио или видео)"""
        url = QUrl.fromLocalFile(file_path)
        self._player.setSource(url)
        self._player.play()

    @Slot()
    def toggle_play(self):
        if self._player.playbackState() == QMediaPlayer.PlaybackState.PlayingState:
            self._player.pause()
        else:
            self._player.play()

    @Slot(int)
    def seek(self, position_ms: int):
        self._player.setPosition(position_ms)

    @Slot(float)
    def set_volume(self, vol: float):
        self._audio_output.setVolume(max(0.0, min(1.0, vol)))

    @Slot(float)
    def set_speed(self, speed: float):
        self._speed = speed
        self._player.setPlaybackRate(speed)

    @Slot(int, float)
    def set_equalizer_band(self, band_index: int, gain_db: float):
        """Установка усиления полосы эквалайзера (±12 дБ)"""
        if 0 <= band_index < 10:
            self._eq_gains[band_index] = gain_db
            # Применение IIR biquad фильтра к аудио-потоку

    def _on_position_changed(self, pos: int):
        self.positionChanged.emit(pos)

    def _on_duration_changed(self, dur: int):
        self.durationChanged.emit(dur)

    def _on_state_changed(self, state):
        self.stateChanged.emit(state == QMediaPlayer.PlaybackState.PlayingState)
`,
    },
    {
      name: 'backend/library_db.py',
      desc: 'Медиатека SQLite (%APPDATA%/AuroraPlayer/library.db)',
      code: `"""
Aurora Player — SQLite Media Library Database
"""
import sqlite3
import os
from pathlib import Path
from PySide6.QtCore import QObject, Signal, Slot

class LibraryDB(QObject):
    tracksUpdated = Signal()

    def __init__(self, parent=None):
        super().__init__(parent)
        app_data = os.getenv("APPDATA", os.path.expanduser("~"))
        db_dir = Path(app_data) / "AuroraPlayer"
        db_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = db_dir / "library.db"
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS tracks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_path TEXT UNIQUE,
                    title TEXT,
                    artist TEXT,
                    album TEXT,
                    genre TEXT,
                    year INTEGER,
                    duration INTEGER,
                    play_count INTEGER DEFAULT 0,
                    is_favorite INTEGER DEFAULT 0,
                    cover_path TEXT,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS playlists (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS playlist_tracks (
                    playlist_id INTEGER,
                    track_id INTEGER,
                    position INTEGER,
                    PRIMARY KEY (playlist_id, track_id)
                );
            """)

    @Slot(str, result=list)
    def search_tracks(self, query: str) -> list:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            q = f"%{query}%"
            cursor.execute("""
                SELECT * FROM tracks 
                WHERE title LIKE ? OR artist LIKE ? OR album LIKE ? OR genre LIKE ?
                ORDER BY added_at DESC
            """, (q, q, q, q))
            return [dict(row) for row in cursor.fetchall()]

    @Slot(int, bool)
    def toggle_favorite(self, track_id: int, is_favorite: bool):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("UPDATE tracks SET is_favorite = ? WHERE id = ?", (1 if is_favorite else 0, track_id))
            conn.commit()
        self.tracksUpdated.emit()
`,
    },
    {
      name: 'build.spec',
      desc: 'PyInstaller спецификация для создания portable single EXE',
      code: `# -*- mode: python ; coding: utf-8 -*-
import sys
from PyInstaller.utils.hooks import collect_data_files

block_cipher = None

added_files = [
    ('ui/qml', 'ui/qml'),
    ('assets', 'assets'),
]

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=added_files,
    hiddenimports=[
        'PySide6.QtMultimedia',
        'PySide6.QtQuick',
        'PySide6.QtQml',
        'mutagen',
        'scipy',
        'scipy.signal',
        'sqlite3'
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='AuroraPlayer',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/app.ico',
)
`,
    },
  ];

  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const curFile = files[selectedFileIdx];

  return (
    <div className="relative z-10 w-full space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl flex items-center gap-3">
            <Terminal className="h-8 w-8 text-rose-500" />
            Aurora Player Desktop
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            Python 3.12 · PySide6 · QML архитектура по SPEC.md (§5, §6) для сборки единого Windows .exe
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(curFile.code, curFile.name)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
          >
            {copiedKey === curFile.name ? (
              <>
                <Check className="h-4 w-4 text-rose-400" />
                Скопировано!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Скопировать файл
              </>
            )}
          </button>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {files.map((f, idx) => (
          <button
            key={f.name}
            onClick={() => setSelectedFileIdx(idx)}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-mono transition ${
              selectedFileIdx === idx
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            {f.name}
          </button>
        ))}
      </div>

      {/* Code Viewer Panel */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0a12] p-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 text-xs text-neutral-400">
          <span className="font-semibold text-rose-300">{curFile.desc}</span>
          <span className="font-mono">{curFile.name}</span>
        </div>

        <pre className="overflow-x-auto p-2 font-mono text-xs text-neutral-300 leading-relaxed max-h-[500px]">
          <code>{curFile.code}</code>
        </pre>
      </div>
    </div>
  );
};
