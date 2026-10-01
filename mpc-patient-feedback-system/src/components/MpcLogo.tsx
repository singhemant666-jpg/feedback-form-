import React from 'react';
import mpcLogoImg from '../assets/mpc-logo.png';

interface MpcLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showText?: boolean;
  rounded?: boolean;
  alt?: string;
}

export const MpcLogo: React.FC<MpcLogoProps> = ({ 
  size = 'md', 
  className = '',
  showText = false,
  rounded = true,
  alt = 'My Pain Clinic Global (MPC) Logo'
}) => {
  let pixelSize = 48;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'sm':
        pixelSize = 34;
        break;
      case 'md':
        pixelSize = 48;
        break;
      case 'lg':
        pixelSize = 60;
        break;
      case 'xl':
        pixelSize = 80;
        break;
    }
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={mpcLogoImg}
        alt={alt}
        width={pixelSize}
        height={pixelSize}
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
        className={`shrink-0 select-none object-contain ${rounded ? 'rounded-xl' : ''} shadow-xs`}
        loading="eager"
      />

      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 tracking-tight leading-tight text-base sm:text-lg">
            My Pain Clinic Global
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Medical & Physiotherapy Center
          </span>
        </div>
      )}
    </div>
  );
};
