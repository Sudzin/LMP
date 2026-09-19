"""
Aurora Player — SQLite Media Library Database
Хранение в %APPDATA%/AuroraPlayer/library.db
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
                CREATE TABLE IF NOT EXISTS play_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    track_id INTEGER,
                    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
