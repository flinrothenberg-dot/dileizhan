import React from 'react';
import pCommander from '../assets/portrait-commander.jpg';
import pZhulaozhong from '../assets/portrait-zhulaozhong.jpg';
import pZhaohu from '../assets/portrait-zhaohu.jpg';
import pZhangga from '../assets/portrait-zhangga.jpg';
import pLixiangyang from '../assets/portrait-lixiangyang.jpg';
import pShigengxin from '../assets/portrait-shigengxin.jpg';
import pLangu from '../assets/portrait-langu.jpg';
import pXiaofei from '../assets/portrait-xiaofei.jpg';
import pLiuxin from '../assets/portrait-liuxin.jpg';
import pLishuangsi from '../assets/portrait-lishuangsi.jpg';
import pZhangchanggeng from '../assets/portrait-zhangchanggeng.jpg';
import pJiuye from '../assets/portrait-jiuye.jpg';
import pGaojingtian from '../assets/portrait-gaojingtian.jpg';
import pMatsui from '../assets/portrait-matsui.jpg';
import pEnemyOfficer from '../assets/portrait-enemy-officer.jpg';
import pEnemyPuppet from '../assets/portrait-enemy-puppet.jpg';
import pEnemySapper from '../assets/portrait-enemy-sapper.jpg';
import pVillager from '../assets/portrait-villager.jpg';
import pLeishizhu from '../assets/portrait-leishizhu.jpg';
import pLinsao from '../assets/portrait-linsao.jpg';
import pYulai from '../assets/portrait-yulai.jpg';
import pLiuhong from '../assets/portrait-liuhong.jpg';
import pJinhuapo from '../assets/portrait-jinhuapo.jpg';
import pKmtOfficer from '../assets/portrait-kmt-officer.jpg';
import pPeter from '../assets/portrait-peter.jpg';
import pEnemySpy from '../assets/portrait-enemy-spy.jpg';

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
  shigengxin: pShigengxin,
  langu: pLangu,
  xiaofei: pXiaofei,
  liuxin: pLiuxin,
  lishuangsi: pLishuangsi,
  zhangchanggeng: pZhangchanggeng,
  jiuye: pJiuye,
  leishizhu: pLeishizhu,
  linsao: pLinsao,
  yulai: pYulai,
  weiqiang: pLiuhong,
  liuhong: pLiuhong,
  jinhuapo: pJinhuapo,
  kmt_officer: pKmtOfficer,
  peter: pPeter,
  gaojingtian: pGaojingtian,
  matsui: pMatsui,
  enemy_officer: pEnemyOfficer,
  enemy_puppet: pEnemyPuppet,
  enemy_sapper: pEnemySapper,
  enemy_spy: pEnemySpy,
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
