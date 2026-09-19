import { SubtitleCue } from '../types';

export function parseSrt(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n\n');

  let idCounter = 1;
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    // First line might be an index number or timestamp
    let timeLine = lines[0];
    let textStartIndex = 1;

    if (/^\d+$/.test(timeLine) && lines.length >= 3) {
      timeLine = lines[1];
      textStartIndex = 2;
    }

    const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!timeMatch) continue;

    const startSeconds =
      parseInt(timeMatch[1], 10) * 3600 +
      parseInt(timeMatch[2], 10) * 60 +
      parseInt(timeMatch[3], 10) +
      parseInt(timeMatch[4], 10) / 1000;

    const endSeconds =
      parseInt(timeMatch[5], 10) * 3600 +
      parseInt(timeMatch[6], 10) * 60 +
      parseInt(timeMatch[7], 10) +
      parseInt(timeMatch[8], 10) / 1000;

    const text = lines.slice(textStartIndex).join(' ');

    cues.push({
      id: idCounter++,
      start: startSeconds,
      end: endSeconds,
      text: text.replace(/<[^>]+>/g, ''), // strip simple tags
    });
  }

  return cues;
}

export function parseVtt(content: string): SubtitleCue[] {
  // WEBVTT parser
  const clean = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n');
  const cues: SubtitleCue[] = [];
  let idCounter = 1;

  let i = 0;
  // skip WEBVTT header
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const match = line.match(/(?:(\d{2}):)?(\d{2}):(\d{2})[.](\d{3})\s*-->\s*(?:(\d{2}):)?(\d{2}):(\d{2})[.](\d{3})/);
      if (match) {
        const start =
          (match[1] ? parseInt(match[1], 10) * 3600 : 0) +
          parseInt(match[2], 10) * 60 +
          parseInt(match[3], 10) +
          parseInt(match[4], 10) / 1000;

        const end =
          (match[5] ? parseInt(match[5], 10) * 3600 : 0) +
          parseInt(match[6], 10) * 60 +
          parseInt(match[7], 10) +
          parseInt(match[8], 10) / 1000;

        i++;
        const textLines: string[] = [];
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i].trim());
          i++;
        }

        cues.push({
          id: idCounter++,
          start,
          end,
          text: textLines.join(' ').replace(/<[^>]+>/g, ''),
        });
      }
    }
    i++;
  }

  return cues;
}

export function parseSubtitles(content: string, filename?: string): SubtitleCue[] {
  if (filename && filename.toLowerCase().endsWith('.vtt')) {
    return parseVtt(content);
  }
  if (content.startsWith('WEBVTT')) {
    return parseVtt(content);
  }
  return parseSrt(content);
}
