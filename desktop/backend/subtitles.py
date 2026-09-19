"""
Aurora Player — Subtitles Parser (.srt, .vtt, .ass)
"""
import re
from typing import List, Dict

def parse_srt(content: str) -> List[Dict]:
    cues = []
    blocks = content.replace("\r\n", "\n").replace("\r", "\n").strip().split("\n\n")
    for block in blocks:
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if len(lines) < 2:
            continue
        time_line = lines[1] if lines[0].isdigit() and len(lines) >= 3 else lines[0]
        match = re.search(r"(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})", time_line)
        if match:
            start_ms = (int(match.group(1))*3600 + int(match.group(2))*60 + int(match.group(3)))*1000 + int(match.group(4))
            end_ms = (int(match.group(5))*3600 + int(match.group(6))*60 + int(match.group(7)))*1000 + int(match.group(8))
            text = " ".join(lines[2:] if lines[0].isdigit() and len(lines) >= 3 else lines[1:])
            cues.append({"start": start_ms, "end": end_ms, "text": re.sub(r"<[^>]+>", "", text)})
    return cues
