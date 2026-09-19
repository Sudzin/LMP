"""
Aurora Player — Tag & Metadata Reader (mutagen)
"""
import os
from pathlib import Path
import mutagen
from mutagen.id3 import ID3, APIC

def read_media_metadata(file_path: str) -> dict:
    """Извлечение метаданных и обложки из аудио/видео файла"""
    p = Path(file_path)
    metadata = {
        "file_path": str(p.resolve()),
        "title": p.stem,
        "artist": "Неизвестный исполнитель",
        "album": "Неизвестный альбом",
        "genre": "Разное",
        "year": 0,
        "duration": 0,
        "cover_data": None
    }

    try:
        audio = mutagen.File(file_path)
        if audio is not None:
            if hasattr(audio, 'info') and hasattr(audio.info, 'length'):
                metadata["duration"] = int(audio.info.length)

            # Теги EasyID3 / Vorbis
            if hasattr(audio, 'tags') and audio.tags:
                tags = audio.tags
                if 'TIT2' in tags: metadata["title"] = str(tags['TIT2'])
                elif 'title' in tags: metadata["title"] = str(tags['title'][0])

                if 'TPE1' in tags: metadata["artist"] = str(tags['TPE1'])
                elif 'artist' in tags: metadata["artist"] = str(tags['artist'][0])

                if 'TALB' in tags: metadata["album"] = str(tags['TALB'])
                elif 'album' in tags: metadata["album"] = str(tags['album'][0])

                if 'TCON' in tags: metadata["genre"] = str(tags['TCON'])
                elif 'genre' in tags: metadata["genre"] = str(tags['genre'][0])

                if 'TDRC' in tags:
                    try:
                        metadata["year"] = int(str(tags['TDRC'])[:4])
                    except Exception:
                        pass

                # Обложка
                for tag in tags.values():
                    if isinstance(tag, APIC):
                        metadata["cover_data"] = tag.data
                        break
    except Exception as e:
        print(f"Error reading tags for {file_path}: {e}")

    return metadata
