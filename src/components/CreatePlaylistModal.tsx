import React, { useState } from 'react';
import { X, ListPlus, Sparkles } from 'lucide-react';
import { translations } from '../services/i18n';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
  language: 'ru' | 'en';
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  language,
}) => {
  const t = translations[language];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#16121c] p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-fuchsia-600 shadow-md">
              <ListPlus className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold">{t.createPlaylist}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/5 p-1.5 text-neutral-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Название плейлиста
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мой супер микс"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-rose-500 focus:bg-white/10 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Описание (необязательно)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Любимые треки для вечерней работы..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-rose-500 focus:bg-white/10 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/5 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition"
            >
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
