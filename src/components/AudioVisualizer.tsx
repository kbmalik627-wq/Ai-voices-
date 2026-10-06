import React, { useEffect, useRef, useState } from 'react';
import { studioEngine } from '../utils/audioEngine';
import { Activity, BarChart3, Volume2 } from 'lucide-react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  voiceColor?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visualMode, setVisualMode] = useState<'bars' | 'wave'>('bars');
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = studioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background subtle gradient grid
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.6)');
      bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw faint center grid line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (analyser && isPlaying) {
        if (visualMode === 'bars') {
          analyser.getByteFrequencyData(dataArray);

          const barCount = 48;
          const step = Math.floor(bufferLength / barCount) || 1;
          const barWidth = (width / barCount) - 2;

          for (let i = 0; i < barCount; i++) {
            const val = dataArray[i * step] || 0;
            const percent = val / 255;
            const barHeight = Math.max(4, percent * (height - 12));
            const x = i * (barWidth + 2);
            const y = height - barHeight;

            // Gradient per bar
            const grad = ctx.createLinearGradient(0, height, 0, y);
            grad.addColorStop(0, '#8b5cf6'); // Violet
            grad.addColorStop(0.5, '#06b6d4'); // Cyan
            grad.addColorStop(1, '#10b981'); // Emerald tip

            ctx.fillStyle = grad;
            ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
            ctx.shadowBlur = percent > 0.5 ? 8 : 2;

            // Bar drawing with safe fallback
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
            } else {
              ctx.rect(x, y, barWidth, barHeight);
            }
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else {
          // Oscilloscope wave
          analyser.getByteTimeDomainData(dataArray);

          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 10;
          ctx.beginPath();

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }

          ctx.lineTo(width, height / 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else {
        // Idle heartbeat wave
        const time = Date.now() / 600;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.beginPath();

        for (let x = 0; x < width; x += 3) {
          const y = height / 2 + Math.sin(x * 0.03 + time) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, visualMode]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-900/60 shadow-xl backdrop-blur-sm p-3.5">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPlaying ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isPlaying ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            ></span>
          </span>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300 font-mono flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-violet-400" />
            {isPlaying ? 'Live Audio Output' : 'Studio Meter Ready'}
          </span>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setVisualMode('bars')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition ${
              visualMode === 'bars'
                ? 'bg-violet-600/30 text-violet-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Spectrum</span>
          </button>
          <button
            onClick={() => setVisualMode('wave')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition ${
              visualMode === 'wave'
                ? 'bg-violet-600/30 text-violet-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Waveform</span>
          </button>
        </div>
      </div>

      <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden ring-1 ring-slate-800/60">
        <canvas
          ref={canvasRef}
          width={640}
          height={112}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};
