import React from 'react';
import { AppTheme, Track } from '../types';

interface DynamicBackgroundProps {
  currentTrack: Track | null;
  theme: AppTheme;
  customGradient: { from: string; via: string; to: string };
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  currentTrack,
  theme,
  customGradient,
}) => {
  // Derive colors based on current track palette or theme
  let c1 = '#3b0764'; // deep purple/amethyst
  let c2 = '#831843'; // rose/crimson
  let c3 = '#431407'; // ember

  if (theme === 'sunset-aurora') {
    c1 = '#431407';
    c2 = '#9a3412';
    c3 = '#831843';
  } else if (theme === 'lavender-mist') {
    c1 = '#2e1065';
    c2 = '#581c87';
    c3 = '#831843';
  } else if (theme === 'custom') {
    c1 = customGradient.from;
    c2 = customGradient.via;
    c3 = customGradient.to;
  } else if (currentTrack?.palette && currentTrack.palette.length >= 3) {
    c1 = currentTrack.palette[0];
    c2 = currentTrack.palette[1];
    c3 = currentTrack.palette[2];
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0c0a0f] transition-colors duration-1000">
      {/* Dynamic atmospheric mesh blobs with Spotify-style blur */}
      <div
        className="absolute -top-[20%] -left-[10%] h-[60vw] w-[60vw] rounded-full opacity-35 blur-[120px] transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${c2} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute top-[10%] -right-[15%] h-[55vw] w-[55vw] rounded-full opacity-30 blur-[130px] transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${c1} 0%, transparent 75%)`,
        }}
      />
      <div
        className="absolute -bottom-[20%] left-[25%] h-[50vw] w-[50vw] rounded-full opacity-25 blur-[110px] transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${c3} 0%, transparent 70%)`,
        }}
      />
      {/* Subtle dark vignette overlay to preserve high contrast and legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0c0a0f]/60 to-[#0c0a0f]" />
    </div>
  );
};
