import React from 'react';
import pCommander from '../assets/portrait-commander.jpg';
import pZhulaozhong from '../assets/portrait-zhulaozhong.jpg';
import pZhaohu from '../assets/portrait-zhaohu.jpg';
import pZhangga from '../assets/portrait-zhangga.jpg';
import pLixiangyang from '../assets/portrait-lixiangyang.jpg';
import pEnemyOfficer from '../assets/portrait-enemy-officer.jpg';
import pEnemyPuppet from '../assets/portrait-enemy-puppet.jpg';
import pEnemySapper from '../assets/portrait-enemy-sapper.jpg';
import pVillager from '../assets/portrait-villager.jpg';

interface CharacterPortraitProps {
  portraitId: string;
  alt?: string;
  className?: string;
}

const PORTRAIT_FILES: Record<string, string> = {
  commander: pCommander,
  zhulaozhong: pZhulaozhong,
  zhaohu: pZhaohu,
  zhangga: pZhangga,
  lixiangyang: pLixiangyang,
  enemy_officer: pEnemyOfficer,
  enemy_puppet: pEnemyPuppet,
  enemy_sapper: pEnemySapper,
  villager: pVillager,
};

export const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  portraitId,
  alt = '',
  className = 'portrait-media',
}) => {
  const src = PORTRAIT_FILES[portraitId] ?? pVillager;
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
