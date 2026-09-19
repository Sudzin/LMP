import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Sparkles,
  Volume2,
  Keyboard,
  RotateCcw,
  Languages,
  Check,
  Download,
  Terminal,
  FileCode,
  FolderArchive,
} from 'lucide-react';
import { AppSettings, AppTheme, VisualizerMode } from '../types';
import { translations } from '../services/i18n';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetLibrary: () => void;
  language: 'ru' | 'en';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetLibrary,
  language,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'general' | 'hotkeys' | 'desktop'>('general');

  const themes: { id: AppTheme; label: string; colors: string[] }[] = [
    {
      id: 'classic-dark',
      label: t.themeClassicDark,
      colors: ['#0c0a0f', '#3b0764', '#831843'],
    },
    {
      id: 'sunset-aurora',
      label: t.themeSunsetAurora,
      colors: ['#0c0a0f', '#431407', '#9a3412'],
    },
    {
      id: 'lavender-mist',
      label: t.themeLavenderMist,
      colors: ['#0c0a0f', '#2e1065', '#581c87'],
    },
    {
      id: 'custom',
      label: t.themeCustom,
      colors: [settings.customGradient.from, settings.customGradient.via, settings.customGradient.to],
    },
  ];

  const visualizerModes: { id: VisualizerMode; label: string }[] = [
    { id: 'bars', label: t.modeBars },
    { id: 'wave', label: t.modeWave },
    { id: 'glow', label: t.modeGlow },
  ];

  return (
    <div id="settings-view-container" className="relative z-10 w-full space-y-6 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          {t.settings}
        </h2>
        <p className="mt-1 text-xs text-neutral-400">
          Конфигурация Aurora Player, темы оформления и параметры визуализатора
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'general'
              ? 'bg-rose-500 text-white'
              : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Palette className="h-4 w-4" />
          {t.appearance}
        </button>

        <button
          onClick={() => setActiveTab('hotkeys')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'hotkeys'
              ? 'bg-rose-500 text-white'
              : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Keyboard className="h-4 w-4" />
          {t.hotkeysTitle}
        </button>

        <button
          onClick={() => setActiveTab('desktop')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'desktop'
              ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-500/25'
              : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Terminal className="h-4 w-4 text-rose-300" />
          {t.desktopCode}
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6 max-w-3xl">
          {/* Language Switch */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Languages className="h-5 w-5 text-rose-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">{t.language}</h4>
                  <p className="text-xs text-neutral-400">Переключение языка интерфейса (RU / EN)</p>
                </div>
              </div>

              <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                <button
                  onClick={() => onUpdateSettings({ ...settings, language: 'ru' })}
                  className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                    settings.language === 'ru' ? 'bg-rose-500 text-white' : 'text-neutral-400'
                  }`}
                >
                  Русский
                </button>
                <button
                  onClick={() => onUpdateSettings({ ...settings, language: 'en' })}
                  className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                    settings.language === 'en' ? 'bg-rose-500 text-white' : 'text-neutral-400'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-fuchsia-400" />
              <div>
                <h4 className="text-sm font-bold text-white">{t.appearance}</h4>
                <p className="text-xs text-neutral-400">
                  Spotify-стиль тёмных тем с переливающимся размытием обложек
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themes.map((th) => {
                const isSelected = settings.theme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => onUpdateSettings({ ...settings, theme: th.id })}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {th.colors.map((c, i) => (
                          <div
                            key={i}
                            className="h-5 w-5 rounded-full border border-black/40 shadow-sm"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold">{th.label}</span>
                    </div>

                    {isSelected && <Check className="h-4 w-4 text-rose-400" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Gradient Controls if selected */}
            {settings.theme === 'custom' && (
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-neutral-300">
                  <span>От:</span>
                  <input
                    type="color"
                    value={settings.customGradient.from}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        customGradient: { ...settings.customGradient, from: e.target.value },
                      })
                    }
                    className="h-7 w-10 cursor-pointer rounded bg-transparent border-0"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-neutral-300">
                  <span>Середина:</span>
                  <input
                    type="color"
                    value={settings.customGradient.via}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        customGradient: { ...settings.customGradient, via: e.target.value },
                      })
                    }
                    className="h-7 w-10 cursor-pointer rounded bg-transparent border-0"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-neutral-300">
                  <span>До:</span>
                  <input
                    type="color"
                    value={settings.customGradient.to}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        customGradient: { ...settings.customGradient, to: e.target.value },
                      })
                    }
                    className="h-7 w-10 cursor-pointer rounded bg-transparent border-0"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Particles toggle */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">{t.particles}</h4>
                  <p className="text-xs text-neutral-400">{t.particlesDesc}</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.particlesEnabled}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, particlesEnabled: e.target.checked })
                }
                className="h-5 w-5 rounded accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Visualizer Mode */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-rose-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">{t.visualizer}</h4>
                  <p className="text-xs text-neutral-400">{t.visualizerMode}</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.visualizerEnabled}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, visualizerEnabled: e.target.checked })
                }
                className="h-5 w-5 rounded accent-rose-500 cursor-pointer"
              />
            </div>

            {settings.visualizerEnabled && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                {visualizerModes.map((vm) => (
                  <button
                    key={vm.id}
                    onClick={() => onUpdateSettings({ ...settings, visualizerMode: vm.id })}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      settings.visualizerMode === vm.id
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {vm.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Library */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-5 backdrop-blur-md flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-rose-300">{t.resetLibrary}</h4>
              <p className="text-xs text-neutral-400">
                Удаляет кэшированные локальные файлы и восстанавливает демо-треки
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm(t.resetLibraryConfirm)) {
                  onResetLibrary();
                }
              }}
              className="flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/40 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t.resetLibrary}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'hotkeys' && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md max-w-3xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-rose-400" />
            {t.hotkeysTitle}
          </h3>
          <p className="text-xs text-neutral-400">
            Горячие клавиши работают в окне медиаплеера без задержки:
          </p>

          <div className="divide-y divide-white/5 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-neutral-300">{t.hotkeysSpace}</span>
              <kbd className="rounded bg-white/10 px-2.5 py-1 font-mono text-white">Space</kbd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-neutral-300">{t.hotkeysArrowsLR}</span>
              <kbd className="rounded bg-white/10 px-2.5 py-1 font-mono text-white">← / →</kbd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-neutral-300">{t.hotkeysArrowsUD}</span>
              <kbd className="rounded bg-white/10 px-2.5 py-1 font-mono text-white">↑ / ↓</kbd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-neutral-300">{t.hotkeysM}</span>
              <kbd className="rounded bg-white/10 px-2.5 py-1 font-mono text-white">M</kbd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-neutral-300">{t.hotkeysF}</span>
              <kbd className="rounded bg-white/10 px-2.5 py-1 font-mono text-white">F</kbd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-neutral-300">{t.hotkeysEsc}</span>
              <kbd className="rounded bg-white/10 px-2.5 py-1 font-mono text-white">Esc</kbd>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'desktop' && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="h-6 w-6 text-rose-400" />
              <div>
                <h3 className="text-lg font-bold text-white">
                  Python 3.12 · PySide6 · QML Desktop Player
                </h3>
                <p className="text-xs text-neutral-400">
                  Полная структура проекта по SPEC.md и AGENTS.md для компиляции в единый AuroraPlayer.exe
                </p>
              </div>
            </div>
          </div>

          {/* Build command snippet */}
          <div className="rounded-xl bg-black/60 p-4 font-mono text-xs text-rose-300 border border-white/10 space-y-2">
            <div className="text-neutral-400"># Сборка одного переносимого EXE для Windows 10/11:</div>
            <div className="text-white font-bold select-all bg-white/5 p-2 rounded">
              pyinstaller --onefile --windowed --name AuroraPlayer --icon assets/app.ico main.py
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-neutral-300">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-fuchsia-400" />
                player/backend/
              </div>
              <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                <li>player_controller.py (QMediaPlayer + 10-band IIR)</li>
                <li>library_db.py (SQLite база данных)</li>
                <li>tag_reader.py (Mutagen метаданные)</li>
                <li>subtitles.py (Парсер .srt, .ass, .vtt)</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                <FolderArchive className="h-4 w-4 text-rose-400" />
                player/ui/qml/
              </div>
              <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                <li>Main.qml (Главное окно, стек экранов)</li>
                <li>PlayerBar.qml (Спектр, эквалайзер)</li>
                <li>EqualizerDialog.qml (10 полос)</li>
                <li>VideoScreen.qml (Media Foundation)</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Все исходные файлы для Python бэкенда и QML интерфейса сгенерированы в каталоге{' '}
            <code className="bg-white/10 px-1 py-0.5 rounded text-rose-300">/desktop/</code>{' '}
            проекта вместе с файлами <code className="bg-white/10 px-1 py-0.5 rounded text-rose-300">SPEC.md</code> и{' '}
            <code className="bg-white/10 px-1 py-0.5 rounded text-rose-300">AGENTS.md</code>.
          </p>
        </div>
      )}
    </div>
  );
};
