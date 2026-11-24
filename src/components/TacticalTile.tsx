import React from 'react';
import { MINES } from '../data/mines';
import { AttackFx, ExplosionFx, FloatingEffect, PlacedMine, TerrainType, Unit } from '../types/game';
import uCommander from '../assets/unit-commander.png';
import uZhulaozhong from '../assets/unit-zhulaozhong.png';
import uZhaohu from '../assets/unit-zhaohu.png';
import uZhangga from '../assets/unit-zhangga.png';
import uLixiangyang from '../assets/unit-lixiangyang.png';
import uShigengxin from '../assets/unit-shigengxin.png';
import uLangu from '../assets/unit-langu.png';
import uXiaofei from '../assets/unit-xiaofei.png';
import uLiuxin from '../assets/unit-liuxin.png';
import uLishuangsi from '../assets/unit-lishuangsi.png';
import uZhangchanggeng from '../assets/unit-zhangchanggeng.png';
import uJiuye from '../assets/unit-jiuye.png';
import uGaojingtian from '../assets/unit-gaojingtian.png';
import uMatsui from '../assets/unit-matsui.png';
import uEnemyOfficer from '../assets/unit-enemy_officer.png';
import uEnemySapper from '../assets/unit-enemy_sapper.png';
import uEnemyMg from '../assets/unit-enemy_mg.png';
import uEnemyMoto from '../assets/unit-enemy_moto.png';
import uEnemyPuppet from '../assets/unit-enemy_puppet.png';
import uEnemyRifle from '../assets/unit-enemy_rifle.png';
import uPromoWushudui from '../assets/unit-promo-wushudui.png';
import uPromoYezhandui from '../assets/unit-promo-yezhandui.png';
import uPromoTongzijun from '../assets/unit-promo-tongzijun.png';
import uPromoNiangzijun from '../assets/unit-promo-niangzijun.png';
import uPromoFeihudui from '../assets/unit-promo-feihudui.png';
import uPromoDapaodui from '../assets/unit-promo-dapaodui.png';
import uPromoBiaoqidui from '../assets/unit-promo-biaoqidui.png';
import uPromoZhongpaodui from '../assets/unit-promo-zhongpaodui.png';
import uPromoZhongjiqiang from '../assets/unit-promo-zhongjiqiang.png';
import uLeishizhu from '../assets/unit-leishizhu.png';
import uLinsao from '../assets/unit-linsao.png';
import uYulai from '../assets/unit-yulai.png';
import uWeiqiang from '../assets/unit-weiqiang.png';
import uLiuhong from '../assets/unit-liuhong.png';
import uJinhuapo from '../assets/unit-jinhuapo.png';
import uKmtOfficer from '../assets/unit-kmt_officer.png';
import uPeter from '../assets/unit-peter.png';
import uEnemyTank from '../assets/unit-enemy_tank.png';
import uEnemyArmored from '../assets/unit-enemy_armored.png';
import uEnemyBunker from '../assets/unit-enemy_bunker.png';
import uEnemySpy from '../assets/unit-enemy_spy.png';

interface TacticalTileProps {
  x: number;
  y: number;
  terrain: TerrainType;
  unit?: Unit;
  mine?: PlacedMine;
  isSelected: boolean;
  isReachable: boolean;
  isAttackRange: boolean;
  isAttackable: boolean;
  isHealable?: boolean;
  isMineable: boolean;
  isHovered: boolean;
  hasChainLinkRight?: boolean;
  hasChainLinkDown?: boolean;
  explosions: ExplosionFx[];
  attackFxs: AttackFx[];
  floats: FloatingEffect[];
  onClick: () => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onHover: () => void;
}

export const UNIT_SPRITE_MAP: Record<string, string> = {
  commander: uCommander,
  zhulaozhong: uZhulaozhong,
  zhaohu: uZhaohu,
  zhangga: uZhangga,
  lixiangyang: uLixiangyang,
  shigengxin: uShigengxin,
  langu: uLangu,
  xiaofei: uXiaofei,
  liuxin: uLiuxin,
  lishuangsi: uLishuangsi,
  zhangchanggeng: uZhangchanggeng,
  jiuye: uJiuye,
  leishizhu: uLeishizhu,
  linsao: uLinsao,
  yulai: uYulai,
  weiqiang: uWeiqiang,
  liuhong: uLiuhong,
  jinhuapo: uJinhuapo,
  kmt_officer: uKmtOfficer,
  peter: uPeter,
  gaojingtian: uGaojingtian,
  matsui: uMatsui,
  enemy_officer: uEnemyOfficer,
  enemy_sapper: uEnemySapper,
  enemy_mg: uEnemyMg,
  enemy_moto: uEnemyMoto,
  enemy_puppet: uEnemyPuppet,
  enemy_rifle: uEnemyRifle,
  enemy_tank: uEnemyTank,
  enemy_armored: uEnemyArmored,
  enemy_bunker: uEnemyBunker,
  enemy_spy: uEnemySpy,
  promo_shuangqiang: uLixiangyang,
  promo_chongfeng: uShigengxin,
  promo_wushudui: uPromoWushudui,
  promo_yezhandui: uPromoYezhandui,
  promo_tongzijun: uPromoTongzijun,
  promo_niangzijun: uPromoNiangzijun,
  promo_feihudui: uPromoFeihudui,
  promo_dapaodui: uPromoDapaodui,
  promo_biaoqidui: uPromoBiaoqidui,
  promo_zhongpaodui: uPromoZhongpaodui,
  promo_zhongjiqiang: uPromoZhongjiqiang,
};

function getUnitSpriteSrc(unit: Unit): string {
  if (unit.spriteId && UNIT_SPRITE_MAP[unit.spriteId]) {
    return UNIT_SPRITE_MAP[unit.spriteId];
  }
  if (unit.faction === 'player') {
    return UNIT_SPRITE_MAP[unit.portraitId] ?? uCommander;
  }
  if (unit.portraitId === 'gaojingtian') return uGaojingtian;
  if (unit.portraitId === 'matsui') return uMatsui;
  if (unit.portraitId === 'enemy_spy') return uEnemySpy;
  if (unit.unitClass === '坦克队' || unit.unitClass === '战车') return uEnemyTank;
  if (unit.unitClass === '铁甲列车' || unit.unitClass === '装甲车') return uEnemyArmored;
  if (unit.unitClass === '炮楼') return uEnemyBunker;
  if (unit.isBoss) return uEnemyOfficer;
  if (unit.isSapper) return uEnemySapper;
  if (unit.unitClass === '机枪队' || unit.unitClass === '重机枪队') return uEnemyMg;
  if (unit.unitClass === '摩托队') return uEnemyMoto;
  if (unit.portraitId === 'enemy_puppet') return uEnemyPuppet;
  return uEnemyRifle;
}

export const TacticalTile: React.FC<TacticalTileProps> = ({
  unit,
  mine,
  isSelected,
  isReachable,
  isAttackRange,
  isAttackable,
  isHealable,
  isMineable,
  isHovered,
  hasChainLinkRight,
  hasChainLinkDown,
  explosions,
  attackFxs,
  floats,
  onClick,
  onDoubleClick,
  onContextMenu,
  onHover,
}) => {
  return (
    <div
      className={`tac-tile ${isSelected ? 'tile-selected' : ''} ${
        isReachable ? 'tile-reachable' : ''
      } ${isAttackRange ? 'tile-attack-range' : ''} ${
        isAttackable ? 'tile-attackable' : ''
      } ${isHealable ? 'tile-healable' : ''} ${
        isMineable ? 'tile-mineable' : ''
      } ${isHovered ? 'tile-hovered' : ''}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onMouseEnter={onHover}
    >
      {/* Chain Mine Link Indicators */}
      {hasChainLinkRight && <div className="mine-chain-link link-right" />}
      {hasChainLinkDown && <div className="mine-chain-link link-down" />}

      {/* Placed Mine Marker */}
      {mine && !mine.triggered && (
        <div
          className={`mine-marker mine-${mine.type} ${mine.detected ? 'mine-detected' : ''} ${
            mine.type === 'yaokong_lei' ? 'mine-remote' : ''
          }`}
          title={`${MINES[mine.type].name}${mine.detected ? '（已被敌军工兵发现！）' : ''}${
            mine.type === 'yaokong_lei' ? '（我方回合点击此雷可遥控引爆周围敌军）' : ''
          }`}
        >
          <span className="mine-core">{MINES[mine.type].shortName}</span>
          {mine.detected && <span className="mine-alert">!</span>}
        </div>
      )}

      {/* Action Highlights */}
      {isReachable && <div className="highlight-overlay move-overlay" />}
      {isAttackRange && !isAttackable && !isHealable && (
        <div className="highlight-overlay attack-range-overlay" />
      )}
      {isAttackable && (
        <div className="highlight-overlay attack-overlay">
          <span className="attack-target-tag">攻击</span>
        </div>
      )}
      {isHealable && (
        <div className="highlight-overlay heal-overlay">
          <span className="heal-target-tag">救护</span>
        </div>
      )}
      {isMineable && (
        <div className="highlight-overlay mine-overlay">
          <span className="mine-target-dot">+雷</span>
        </div>
      )}

      {/* Whole-Body Standing Tactical Unit */}
      {unit && unit.alive && (
        <div
          className={`unit-token faction-${unit.faction} ${unit.acted ? 'unit-acted' : ''} ${
            unit.isBoss ? 'unit-boss' : ''
          } ${unit.isCaptive ? 'unit-captive' : ''} ${isSelected ? 'unit-selected' : ''}`}
        >
          <div className="unit-ground-ring" />
          <img
            src={getUnitSpriteSrc(unit)}
            alt={unit.name}
            draggable={false}
            className={`unit-body-sprite ${unit.facing === 'left' ? 'face-left' : 'face-right'}`}
          />

          {unit.isBoss && <span className="unit-badge boss-badge">将</span>}
          {unit.isSapper && <span className="unit-badge sapper-badge">探</span>}
          {unit.isCaptive && <span className="unit-badge captive-badge">救</span>}
          {unit.canHealAlly && <span className="unit-badge medic-badge">医</span>}
          {unit.stunnedTurns > 0 && <span className="unit-badge stun-badge">惊</span>}
          {(unit.poisonedTurns ?? 0) > 0 && <span className="unit-badge poison-badge">毒</span>}

          <div className="unit-hud-footer">
            <div className="unit-nameplate">{unit.name}</div>
            <div className="unit-hp-track">
              <div
                className={`unit-hp-fill ${
                  unit.hp / unit.maxHp < 0.35
                    ? 'hp-low'
                    : unit.faction === 'player'
                    ? 'hp-ally'
                    : 'hp-enemy'
                }`}
                style={{ width: `${Math.max(4, (unit.hp / unit.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Weapon & Max-Attack Crit FX */}
      {attackFxs.map((afx) => (
        <div
          key={afx.id}
          className={`attack-fx fx-kind-${afx.kind} ${afx.isCrit ? 'fx-is-crit' : ''}`}
        >
          {afx.kind === 'blade' && (
            <svg viewBox="0 0 100 100" className="blade-slash-svg">
              <path
                d="M14 82 Q 52 46 86 14 Q 60 56 22 88 Z"
                fill="url(#slashGrad)"
              />
              <defs>
                <linearGradient id="slashGrad" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.2" />
                  <stop offset="55%" stopColor="#ffffff" stopOpacity="0.98" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.95" />
                </linearGradient>
              </defs>
            </svg>
          )}
          {afx.kind === 'dual_pistol' && (
            <>
              <span className="pistol-spark s1" />
              <span className="pistol-spark s2" />
            </>
          )}
          {(afx.kind === 'rifle' ||
            afx.kind === 'mg' ||
            afx.kind === 'slingshot' ||
            afx.kind === 'heavy_cannon') && <span className="pistol-spark s1" />}
          {afx.isCrit && (
            <div className="crit-starburst">
              <div className="crit-ring" />
              <div className="crit-core" />
            </div>
          )}
        </div>
      ))}

      {/* Explosion FX */}
      {explosions.map((fx) => (
        <div key={fx.id} className={`explosion-fx fx-${fx.size}`}>
          <div className="fx-ring" />
          <div className="fx-core" />
        </div>
      ))}

      {/* Floating Combat Texts */}
      {floats.map((fl) => (
        <div key={fl.id} className={`floating-text float-${fl.kind}`}>
          {fl.text}
        </div>
      ))}
    </div>
  );
};
