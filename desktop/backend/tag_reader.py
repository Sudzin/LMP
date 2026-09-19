"""
Aurora Player — Tag & Metadata Reader (mutagen) + Cover Art Cache
"""
import os
import hashlib
from pathlib import Path
import mutagen
from mutagen.id3 import ID3, APIC
from mutagen.flac import Picture

CACHE_DIR = Path(os.environ.get("APPDATA", ".")) / "AuroraPlayer" / "covers"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

def read_media_metadata(file_path: str) -> dict:
    """Извлечение метаданных и сохранение обложки в кэш"""
    p = Path(file_path)
    metadata = {
        "file_path": str(p.resolve()),
        "title": p.stem,
        "artist": "Неизвестный исполнитель",
        "album": "Неизвестный альбом",
        "genre": "Разное",
        "year": 0,
        "duration": 0,
        "cover_url": ""
    }

    try:
        audio = mutagen.File(file_path)
        if audio is not None:
            if hasattr(audio, 'info') and hasattr(audio.info, 'length'):
                metadata["duration"] = int(audio.info.length)

            cover_bytes = None

            # Чтение тегов
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

                # Обложка ID3 APIC
                for tag in tags.values():
                    if isinstance(tag, APIC):
                        cover_bytes = tag.data
                        break
                    elif isinstance(tag, list):
                        for sub in tag:
                            if isinstance(sub, Picture):
                                cover_bytes = sub.data
                                break

            # FLAC pictures
            if not cover_bytes and hasattr(audio, 'pictures') and audio.pictures:
                cover_bytes = audio.pictures[0].data

            # Если обложка найдена, кэшируем на диск
            if cover_bytes:
                h = hashlib.md5(str(p).encode('utf-8')).hexdigest()
                cover_path = CACHE_DIR / f"{h}.jpg"
                if not cover_path.exists():
                    with open(cover_path, "wb") as f:
                        f.write(cover_bytes)
                metadata["cover_url"] = cover_path.as_uri()

    except Exception as e:
        print(f"Error reading tags for {file_path}: {e}")

    return metadata
