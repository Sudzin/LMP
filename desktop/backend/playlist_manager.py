"""
Aurora Player — Playlist Manager
"""
from PySide6.QtCore import QObject, Signal, Slot
from backend.library_db import LibraryDB

class PlaylistManager(QObject):
    playlistsChanged = Signal()

    def __init__(self, db: LibraryDB, parent=None):
        super().__init__(parent)
        self.db = db

    @Slot(str, str, result=int)
    def create_playlist(self, name: str, description: str = "") -> int:
        import sqlite3
        with sqlite3.connect(self.db.db_path) as conn:
            cur = conn.cursor()
            cur.execute("INSERT INTO playlists (name, description) VALUES (?, ?)", (name, description))
            conn.commit()
            self.playlistsChanged.emit()
            return cur.lastrowid or 0

    @Slot(int, int)
    def add_track_to_playlist(self, playlist_id: int, track_id: int):
        import sqlite3
        with sqlite3.connect(self.db.db_path) as conn:
            conn.execute("INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id) VALUES (?, ?)", (playlist_id, track_id))
            conn.commit()
            self.playlistsChanged.emit()
