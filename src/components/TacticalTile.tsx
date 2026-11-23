import React from 'react';
import { MINES } from '../data/mines';
import { AttackFx, ExplosionFx, FloatingEffect, PlacedMine, TerrainType, Unit } from '../types/game';
import uCommander from '../assets/unit-commander.png';
import uZhulaozhong from '../assets/unit-zhulaozhong.png';
import uZhaohu from '../assets/unit-zhaohu.png';
import uZhangga from '../assets/unit-zhangga.png';
import uLixiangyang from '../assets/unit-lixiangyang.png';
import uEnemyOfficer from '../assets/unit-enemy_officer.png';
import uEnemySapper from '../assets/unit-enemy_sapper.png';
import uEnemyMg from '../assets/unit-enemy_mg.png';
import uEnemyPuppet from '../assets/unit-enemy_puppet.png';
import uEnemyRifle from '../assets/unit-enemy_rifle.png';

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

function getUnitSpriteSrc(unit: Unit): string {
  if (unit.faction === 'player') {
    const map: Record<string, string> = {
      commander: uCommander,
      zhulaozhong: uZhulaozhong,
      zhaohu: uZhaohu,
      zhangga: uZhangga,
      lixiangyang: uLixiangyang,
    };
    return map[unit.portraitId] ?? uCommander;
  }
  if (unit.isBoss) return uEnemyOfficer;
  if (unit.isSapper) return uEnemySapper;
  if (unit.unitClass === '机枪队') return uEnemyMg;
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
      } ${isMineable ? 'tile-mineable' : ''} ${
        isHovered ? 'tile-hovered' : ''
      }`}
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
          className={`mine-marker mine-${mine.type} ${mine.detected ? 'mine-detected' : ''}`}
          title={`${MINES[mine.type].name}${mine.detected ? '（已被敌军工兵发现！）' : ''}`}
        >
          <span className="mine-core">{MINES[mine.type].shortName}</span>
          {mine.detected && <span className="mine-alert">!</span>}
        </div>
      )}

      {/* Action Highlights */}
      {isReachable && <div className="highlight-overlay move-overlay" />}
      {isAttackRange && !isAttackable && (
        <div className="highlight-overlay attack-range-overlay" />
      )}
      {isAttackable && (
        <div className="highlight-overlay attack-overlay">
          <span className="attack-target-tag">攻击</span>
        </div>
      )}
      {isMineable && (
        <div className="highlight-overlay mine-overlay">
          <span className="mine-target-dot">+雷</span>
        </div>
      )}

      {/* Whole-Body Standing Tactical Unit (整体图) */}
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
          {unit.stunnedTurns > 0 && <span className="unit-badge stun-badge">惊</span>}

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
          {(afx.kind === 'rifle' || afx.kind === 'mg' || afx.kind === 'slingshot') && (
            <span className="pistol-spark s1" />
          )}
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
