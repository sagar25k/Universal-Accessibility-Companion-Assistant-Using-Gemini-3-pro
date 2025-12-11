import React from 'react';
import { AppMode, ModeConfig } from '../types';

interface ModeCardProps {
  mode: ModeConfig;
  isSelected: boolean;
  onSelect: (id: AppMode) => void;
}

export const ModeCard: React.FC<ModeCardProps> = ({ mode, isSelected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(mode.id)}
      aria-pressed={isSelected}
      aria-label={mode.ariaLabel}
      className={`
        relative flex flex-col items-start p-4 rounded-xl border-2 text-left w-full transition-all duration-200
        ${isSelected 
          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-offset-2' 
          : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'}
      `}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-3xl" role="presentation">{mode.icon}</span>
        {isSelected && (
          <span className="text-blue-700 bg-blue-100 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
            Selected
          </span>
        )}
      </div>
      <span className={`text-lg font-bold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
        {mode.title}
      </span>
      <span className="text-sm text-slate-600 mt-1 leading-relaxed">
        {mode.description}
      </span>
    </button>
  );
};