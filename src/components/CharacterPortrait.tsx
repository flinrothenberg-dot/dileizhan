import React from 'react';

interface CharacterPortraitProps {
  portraitId: string;
  alt?: string;
  className?: string;
}

const PORTRAIT_FILES: Record<string, string> = {
  commander: './assets/portrait-commander.jpg',
  zhulaozhong: './assets/portrait-zhulaozhong.png',
  zhaohu: './assets/portrait-zhaohu.png',
  zhangga: './assets/portrait-zhangga.jpg',
  lixiangyang: './assets/portrait-lixiangyang.png',
  enemy_officer: './assets/portrait-enemy-officer.jpg',
  enemy_puppet: './assets/portrait-enemy-puppet.png',
  enemy_sapper: './assets/portrait-enemy-sapper.png',
  villager: './assets/portrait-villager.png',
};

export const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  portraitId,
  alt = '',
  className = 'portrait-media',
}) => {
  const src = PORTRAIT_FILES[portraitId] ?? './assets/portrait-villager.png';
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ objectPosition: '50% 8%' }}
      draggable={false}
    />
  );
};
