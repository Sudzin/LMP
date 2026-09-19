import React from 'react';
import { Sliders, X, RotateCcw, Check, Sparkles } from 'lucide-react';
import { EqualizerConfig, EqPresetName } from '../types';
import { EQ_FREQUENCIES, EQ_PRESETS, audioEngine } from '../services/audioEngine';
import { translations } from '../services/i18n';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EqualizerConfig;
  onChangeConfig: (newConfig: EqualizerConfig) => void;
  language: 'ru' | 'en';
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  language,
}) => {
  const t = translations[language];

  if (!isOpen) return null;

  const handleBandChange = (index: number, val: number) => {
    const updatedBands = [...config.bands];
    updatedBands[index] = { ...updatedBands[index], gain: val };
    const newConfig: EqualizerConfig = {
      ...config,
      preset: 'Кастомный',
      bands: updatedBands,
    };
    audioEngine.setBandGain(index, val);
    onChangeConfig(newConfig);
  };

  const handlePresetSelect = (preset: EqPresetName) => {
    const gains = EQ_PRESETS[preset] || EQ_PRESETS.Flat;
    const updatedBands = EQ_FREQUENCIES.map((freq, idx) => ({
      frequency: freq,
      gain: gains[idx] ?? 0,
    }));

    const newConfig: EqualizerConfig = {
      ...config,
      preset,
      bands: updatedBands,
    };

    audioEngine.setAllBands(gains);
    onChangeConfig(newConfig);
  };

  const handleToggleEnable = () => {
    const nextState = !config.enabled;
    audioEngine.setEqEnabled(nextState);
    onChangeConfig({
      ...config,
      enabled: nextState,
    });
  };

  const handleReset = () => {
    handlePresetSelect('Flat');
  };

  const formatFreq = (freq: number) => {
    if (freq >= 1000) return `${freq / 1000}k`;
    return `${freq}`;
  };

  // Generate smooth SVG curve for frequency response
  const points = config.bands.map((b, idx) => {
    const x = (idx / (config.bands.length - 1)) * 480;
    // Map -12dB..+12dB to y: 100..10
    const y = 55 - (b.gain / 12) * 45;
    return `${x},${y}`;
  });
  const pathD = `M 0,${55 - (config.bands[0].gain / 12) * 45} ` + points.map((p) => `L ${p}`).join(' ');

  return (
    <div
      id="equalizer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="equalizer-modal-dialog"
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#16121b] p-6 text-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-fuchsia-600 to-rose-500 shadow-lg shadow-rose-500/20">
              <Sliders className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">{t.equalizer}</h2>
              <p className="text-xs text-neutral-400">10-band IIR Biquad • ±12 dB</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="eq-toggle-btn"
              onClick={handleToggleEnable}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                config.enabled
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/30'
                  : 'bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${config.enabled ? 'bg-rose-400 animate-pulse' : 'bg-neutral-500'}`}
              />
              {config.enabled ? t.eqEnabled : t.eqBypass}
            </button>

            <button
              id="eq-reset-btn"
              onClick={handleReset}
              title="Reset to Flat"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white transition"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              id="eq-close-btn"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live Frequency Curve Visualizer */}
        <div className="mt-4 relative h-24 w-full rounded-xl bg-black/40 border border-white/5 p-2 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none opacity-20">
            <div className="w-full border-b border-dashed border-rose-400" />
          </div>
          <svg className="h-full w-full overflow-visible" viewBox="0 0 480 110" preserveAspectRatio="none">
            <defs>
              <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c026d3" />
                <stop offset="50%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
            <path
              d={pathD}
              fill="none"
              stroke="url(#curveGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              className="transition-all duration-150"
            />
          </svg>
          <div className="absolute right-3 top-2 text-[10px] font-mono text-neutral-400">
            +12dB
          </div>
          <div className="absolute right-3 bottom-2 text-[10px] font-mono text-neutral-400">
            -12dB
          </div>
        </div>

        {/* 10 Vertical Sliders */}
        <div className="mt-6 flex justify-between items-end gap-1 px-1 sm:px-2">
          {config.bands.map((band, idx) => (
            <div key={band.frequency} className="flex flex-col items-center group w-10">
              {/* Value readout */}
              <span className="text-[11px] font-mono font-medium text-neutral-400 group-hover:text-rose-400 transition mb-1">
                {band.gain > 0 ? `+${band.gain.toFixed(1)}` : band.gain.toFixed(1)}
              </span>

              {/* Vertical slider track container */}
              <div className="relative h-40 w-7 flex items-center justify-center bg-white/5 rounded-full py-2 border border-white/5 group-hover:border-white/10 transition">
                {/* 0 dB center line */}
                <div className="absolute top-1/2 left-1 right-1 h-0.5 bg-white/15 pointer-events-none" />

                <input
                  id={`eq-slider-${band.frequency}`}
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={band.gain}
                  disabled={!config.enabled}
                  onChange={(e) => handleBandChange(idx, parseFloat(e.target.value))}
                  className="h-32 w-1.5 accent-rose-500 cursor-pointer disabled:opacity-30 appearance-none bg-neutral-700/60 rounded-lg outline-none"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                  }}
                />
              </div>

              {/* Frequency label */}
              <span className="mt-2 text-xs font-semibold text-neutral-300 group-hover:text-white transition">
                {formatFreq(band.frequency)}
              </span>
              <span className="text-[9px] text-neutral-400 uppercase">Hz</span>
            </div>
          ))}
        </div>

        {/* Presets List */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-fuchsia-400" />
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              {t.eqPreset}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(EQ_PRESETS) as EqPresetName[]).map((presetKey) => {
              const isSelected = config.preset === presetKey;
              return (
                <button
                  key={presetKey}
                  id={`eq-preset-${presetKey}`}
                  onClick={() => handlePresetSelect(presetKey)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-md shadow-rose-500/20'
                      : 'bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                  {presetKey}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
