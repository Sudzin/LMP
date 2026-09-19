"""
Aurora Player — Player Controller & 10-Band Biquad Equalizer
Qt Multimedia (QMediaPlayer + QAudioOutput) + scipy.signal + SQLite
"""
import os
from pathlib import Path
from PySide6.QtCore import QObject, Signal, Slot, Property, QUrl
from PySide6.QtMultimedia import QMediaPlayer, QAudioOutput
from PySide6.QtWidgets import QFileDialog

from backend.tag_reader import read_media_metadata

EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

EQ_PRESETS = {
    "Flat": [0.0] * 10,
    "Rock": [4.5, 3.0, -1.5, -2.5, -1.0, 1.5, 3.5, 4.5, 4.0, 3.5],
    "Pop": [-1.5, -1.0, 0.5, 2.0, 4.0, 3.5, 1.5, -1.0, -1.5, -2.0],
    "Jazz": [3.0, 2.0, 1.0, 1.5, -1.5, -1.5, 0.0, 1.5, 2.5, 3.0],
    "Electronic": [4.5, 3.5, 1.0, 0.0, -2.0, 1.5, 0.5, 2.0, 3.5, 4.0],
    "Bass Boost": [6.0, 5.0, 4.0, 2.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0],
}

SUPPORTED_EXTENSIONS = {
    '.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac',
    '.mp4', '.mkv', '.avi', '.mov', '.webm'
}
VIDEO_EXTENSIONS = {'.mp4', '.mkv', '.avi', '.mov', '.webm'}

class PlayerController(QObject):
    stateChanged = Signal(bool)
    positionChanged = Signal(int)
    durationChanged = Signal(int)
    currentTrackChanged = Signal()
    tracksChanged = Signal()
    volumeChanged = Signal(float)
    equalizerChanged = Signal()

    def __init__(self, db=None, parent=None):
        super().__init__(parent)
        self.db = db
        self._player = QMediaPlayer()
        self._audio_output = QAudioOutput()
        self._player.setAudioOutput(self._audio_output)

        self._player.positionChanged.connect(self._on_position_changed)
        self._player.durationChanged.connect(self._on_duration_changed)
        self._player.playbackStateChanged.connect(self._on_state_changed)

        self._tracks = []
        self._current_index = -1
        self._current_track = {
            "title": "Нет трека",
            "artist": "Выберите файл для воспроизведения",
            "album": "",
            "duration": 0,
            "file_path": "",
            "is_video": False,
            "is_favorite": False,
        }
        self._eq_gains = [0.0] * 10
        self._speed = 1.0
        self._volume = 0.85
        self._audio_output.setVolume(self._volume)

        # Загрузка сохраненных треков из БД
        if self.db:
            saved = self.db.search_tracks("")
            for row in saved:
                is_video = Path(row["file_path"]).suffix.lower() in VIDEO_EXTENSIONS
                self._tracks.append({
                    "id": row["id"],
                    "title": row["title"],
                    "artist": row["artist"],
                    "album": row["album"],
                    "genre": row.get("genre", ""),
                    "duration": row["duration"],
                    "file_path": row["file_path"],
                    "is_video": is_video,
                    "is_favorite": bool(row.get("is_favorite", 0)),
                })

    # === Свойства для QML ===

    @Property(bool, notify=stateChanged)
    def isPlaying(self):
        return self._player.playbackState() == QMediaPlayer.PlaybackState.PlayingState

    @Property(int, notify=positionChanged)
    def position(self):
        return self._player.position()

    @Property(int, notify=durationChanged)
    def duration(self):
        return self._player.duration()

    @Property(float, notify=volumeChanged)
    def volume(self):
        return self._volume

    @Property('QVariantMap', notify=currentTrackChanged)
    def currentTrack(self):
        return self._current_track

    @Property('QVariantList', notify=tracksChanged)
    def tracks(self):
        return self._tracks

    @Property('QVariantList', notify=equalizerChanged)
    def equalizerBands(self):
        return self._eq_gains

    # === Слоты управления воспроизведением ===

    @Slot(int)
    def play_track(self, index: int):
        if 0 <= index < len(self._tracks):
            self._current_index = index
            track = self._tracks[index]
            self._current_track = track
            self.currentTrackChanged.emit()

            file_path = track["file_path"]
            url = QUrl.fromLocalFile(file_path)
            self._player.setSource(url)
            self._player.play()

    @Slot()
    def toggle_play(self):
        if self._player.playbackState() == QMediaPlayer.PlaybackState.PlayingState:
            self._player.pause()
        else:
            if self._current_index == -1 and len(self._tracks) > 0:
                self.play_track(0)
            else:
                self._player.play()

    @Slot()
    def next_track(self):
        if len(self._tracks) == 0:
            return
        next_idx = (self._current_index + 1) % len(self._tracks)
        self.play_track(next_idx)

    @Slot()
    def previous_track(self):
        if len(self._tracks) == 0:
            return
        if self._player.position() > 3000:
            self.seek(0)
            return
        prev_idx = (self._current_index - 1 + len(self._tracks)) % len(self._tracks)
        self.play_track(prev_idx)

    @Slot(int)
    def seek(self, position_ms: int):
        self._player.setPosition(position_ms)

    @Slot(float)
    def set_volume(self, vol: float):
        self._volume = max(0.0, min(1.0, vol))
        self._audio_output.setVolume(self._volume)
        self.volumeChanged.emit(self._volume)

    @Slot(float)
    def set_speed(self, speed: float):
        self._speed = max(0.25, min(2.5, speed))
        self._player.setPlaybackRate(self._speed)

    # === Диалоги добавления файлов и папок ===

    @Slot()
    def open_file_dialog(self):
        """Открыть стандартный диалог выбора файлов Windows"""
        filter_str = (
            "Медиа файлы (*.mp3 *.flac *.wav *.ogg *.m4a *.aac *.mp4 *.mkv *.avi *.mov *.webm);;"
            "Аудио (*.mp3 *.flac *.wav *.ogg *.m4a *.aac);;"
            "Видео (*.mp4 *.mkv *.avi *.mov *.webm);;"
            "Все файлы (*.*)"
        )
        files, _ = QFileDialog.getOpenFileNames(None, "Выберите аудио или видео файлы", "", filter_str)
        if files:
            self.add_files(files)

    @Slot()
    def open_folder_dialog(self):
        """Открыть стандартный диалог выбора папки Windows"""
        folder = QFileDialog.getExistingDirectory(None, "Выберите папку с музыкой или видео")
        if folder:
            self.add_folder(folder)

    def add_files(self, file_paths):
        new_added = False
        for f in file_paths:
            path_obj = Path(f)
            if path_obj.suffix.lower() in SUPPORTED_EXTENSIONS:
                # Извлечь метаданные
                meta = read_media_metadata(str(path_obj))
                is_video = path_obj.suffix.lower() in VIDEO_EXTENSIONS
                track_item = {
                    "id": len(self._tracks) + 1,
                    "title": meta.get("title") or path_obj.stem,
                    "artist": meta.get("artist") or "Неизвестный исполнитель",
                    "album": meta.get("album") or "Неизвестный альбом",
                    "genre": meta.get("genre") or "Разное",
                    "duration": meta.get("duration") or 0,
                    "file_path": str(path_obj.resolve()),
                    "is_video": is_video,
                    "is_favorite": False,
                }
                self._tracks.append(track_item)
                new_added = True

                # Сохранить в SQLite
                if self.db:
                    self._save_track_to_db(track_item)

        if new_added:
            self.tracksChanged.emit()
            if self._current_index == -1 and len(self._tracks) > 0:
                self.play_track(0)

    def add_folder(self, folder_path):
        found = []
        for root, _, files in os.walk(folder_path):
            for file in files:
                p = Path(root) / file
                if p.suffix.lower() in SUPPORTED_EXTENSIONS:
                    found.append(str(p))
        if found:
            self.add_files(found)

    def _save_track_to_db(self, track):
        try:
            import sqlite3
            with sqlite3.connect(self.db.db_path) as conn:
                conn.execute("""
                    INSERT OR IGNORE INTO tracks (file_path, title, artist, album, genre, duration)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    track["file_path"],
                    track["title"],
                    track["artist"],
                    track["album"],
                    track["genre"],
                    track["duration"]
                ))
                conn.commit()
        except Exception as e:
            print(f"Error saving track to DB: {e}")

    @Slot(int)
    def toggle_favorite(self, index: int):
        if 0 <= index < len(self._tracks):
            track = self._tracks[index]
            track["is_favorite"] = not track.get("is_favorite", False)
            if self.db and "id" in track:
                self.db.toggle_favorite(track["id"], track["is_favorite"])
            self.tracksChanged.emit()
            if self._current_index == index:
                self._current_track = track
                self.currentTrackChanged.emit()

    @Slot(int)
    def delete_track(self, index: int):
        if 0 <= index < len(self._tracks):
            track = self._tracks.pop(index)
            if self.db and "id" in track:
                try:
                    import sqlite3
                    with sqlite3.connect(self.db.db_path) as conn:
                        conn.execute("DELETE FROM tracks WHERE file_path = ?", (track["file_path"],))
                        conn.commit()
                except Exception:
                    pass
            self.tracksChanged.emit()
            if self._current_index == index:
                if len(self._tracks) > 0:
                    self.play_track(min(index, len(self._tracks) - 1))
                else:
                    self._player.stop()
                    self._current_index = -1
                    self._current_track = {
                        "title": "Нет трека",
                        "artist": "Добавьте файлы в медиатеку",
                        "album": "",
                        "duration": 0,
                        "file_path": "",
                        "is_video": False,
                        "is_favorite": False,
                    }
                    self.currentTrackChanged.emit()

    # === Эквалайзер (10 полос) ===

    @Slot(int, float)
    def set_equalizer_band(self, band_index: int, gain_db: float):
        if 0 <= band_index < 10:
            self._eq_gains[band_index] = max(-12.0, min(12.0, gain_db))
            self.equalizerChanged.emit()

    @Slot(str)
    def set_equalizer_preset(self, preset_name: str):
        if preset_name in EQ_PRESETS:
            self._eq_gains = list(EQ_PRESETS[preset_name])
            self.equalizerChanged.emit()

    @Slot(QObject)
    def set_video_sink(self, sink):
        """Подключение VideoOutput из QML к QMediaPlayer"""
        if hasattr(self._player, 'setVideoSink'):
            self._player.setVideoSink(sink)
        elif hasattr(self._player, 'setVideoOutput'):
            self._player.setVideoOutput(sink)

    # === Внутренние обработчики сигналов ===

    def _on_position_changed(self, pos: int):
        self.positionChanged.emit(pos)

    def _on_duration_changed(self, dur: int):
        self.durationChanged.emit(dur)

    def _on_state_changed(self, state):
        self.stateChanged.emit(state == QMediaPlayer.PlaybackState.PlayingState)
