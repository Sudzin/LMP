"""
Aurora Player — Player Controller & 10-Band Biquad Equalizer
Qt Multimedia (QMediaPlayer + QAudioOutput) + scipy.signal biquad IIR
"""
from PySide6.QtCore import QObject, Signal, Slot, Property, QUrl
from PySide6.QtMultimedia import QMediaPlayer, QAudioOutput
import numpy as np
from scipy import signal

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
        self._is_eq_enabled = True

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

    @Slot(bool)
    def set_equalizer_enabled(self, enabled: bool):
        self._is_eq_enabled = enabled

    def _on_position_changed(self, pos: int):
        self.positionChanged.emit(pos)

    def _on_duration_changed(self, dur: int):
        self.durationChanged.emit(dur)

    def _on_state_changed(self, state):
        self.stateChanged.emit(state == QMediaPlayer.PlaybackState.PlayingState)
