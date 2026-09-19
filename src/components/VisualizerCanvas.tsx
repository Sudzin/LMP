import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { VisualizerMode } from '../types';

interface VisualizerCanvasProps {
  mode: VisualizerMode;
  isPlaying: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  mode,
  isPlaying,
  width = 240,
  height = 48,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(64);

    const render = () => {
      if (mode === 'wave') {
        audioEngine.getTimeDomainData(dataArray);
      } else {
        audioEngine.getFrequencyData(dataArray);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (mode === 'bars') {
        const barCount = 28;
        const barWidth = (canvas.width / barCount) - 2;
        const step = Math.floor(dataArray.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = isPlaying ? dataArray[i * step] || 0 : 0;
          const percent = val / 255;
          const barHeight = Math.max(3, percent * (canvas.height - 4));
          const x = i * (barWidth + 2);
          const y = canvas.height - barHeight;

          // Gradient: lavender to hot rose/fuchsia (NO dominant green/blue)
          const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, '#c026d3');
          grad.addColorStop(0.6, '#f43f5e');
          grad.addColorStop(1, '#fb7185');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
        }
      } else if (mode === 'wave') {
        ctx.lineWidth = 2.5;
        const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
        grad.addColorStop(0, '#e879f9');
        grad.addColorStop(0.5, '#f43f5e');
        grad.addColorStop(1, '#fb923c');
        ctx.strokeStyle = grad;

        ctx.beginPath();
        const sliceWidth = canvas.width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = isPlaying ? dataArray[i] / 128.0 : 1.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      } else {
        // Glow mirror
        const count = 20;
        const halfWidth = canvas.width / 2;
        const barWidth = (halfWidth / count) - 1.5;
        const step = Math.floor(dataArray.length / count);

        for (let i = 0; i < count; i++) {
          const val = isPlaying ? dataArray[i * step] || 0 : 0;
          const percent = val / 255;
          const h = Math.max(2, percent * (canvas.height / 2 - 2));

          const grad = ctx.createLinearGradient(0, canvas.height / 2 - h, 0, canvas.height / 2 + h);
          grad.addColorStop(0, '#fb7185');
          grad.addColorStop(0.5, '#c026d3');
          grad.addColorStop(1, '#9333ea');
          ctx.fillStyle = grad;

          // Right half
          ctx.fillRect(halfWidth + i * (barWidth + 1.5), canvas.height / 2 - h, barWidth, h * 2);
          // Left half (mirror)
          ctx.fillRect(halfWidth - (i + 1) * (barWidth + 1.5), canvas.height / 2 - h, barWidth, h * 2);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [mode, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`rounded ${className}`}
      style={{ display: 'block' }}
    />
  );
};
