"""
Aurora Player — Desktop Entry Point (Windows 10/11)
Локальный медиаплеер (аудио + видео) в стиле Spotify
"""
import sys
import os
from PySide6.QtGui import QGuiApplication, QIcon
from PySide6.QtQml import QQmlApplicationEngine
from PySide6.QtCore import QUrl

from backend.player_controller import PlayerController
from backend.library_db import LibraryDB
from backend.playlist_manager import PlaylistManager
from backend.hotkeys import HotkeyManager
from backend.settings import SettingsManager

def resource_path(relative_path: str) -> str:
    """Получить абсолютный путь к ресурсам (для PyInstaller)"""
    try:
        base_path = sys._MEIPASS  # type: ignore
    except Exception:
        base_path = os.path.abspath(os.path.dirname(__file__))
    return os.path.join(base_path, relative_path)

def main():
    # Настройка приложения
    app = QGuiApplication(sys.argv)
    app.setOrganizationName("AuroraMedia")
    app.setApplicationName("AuroraPlayer")

    icon_path = resource_path("assets/app.ico")
    if os.path.exists(icon_path):
        app.setWindowIcon(QIcon(icon_path))

    # Инициализация сервисов архитектуры
    db = LibraryDB()
    player = PlayerController()
    playlist_mgr = PlaylistManager(db)
    settings = SettingsManager()
    hotkeys = HotkeyManager(player)

    engine = QQmlApplicationEngine()

    # Регистрация контекстных свойств для QML
    ctx = engine.rootContext()
    ctx.setContextProperty("playerController", player)
    ctx.setContextProperty("libraryDb", db)
    ctx.setContextProperty("playlistManager", playlist_mgr)
    ctx.setContextProperty("settingsManager", settings)

    qml_file = resource_path("ui/qml/Main.qml")
    engine.load(QUrl.fromLocalFile(qml_file))

    if not engine.rootObjects():
        sys.exit(-1)

    sys.exit(app.exec())

if __name__ == "__main__":
    main()
