import React, { useEffect } from 'react';
import { Bomb, Crosshair, Footprints, Heart, Shield, Sparkles, Sword, X } from 'lucide-react';
import { ALL_MINE_TYPES, MINES, TERRAIN_META } from '../data/mines';
import { getAttackShapeLabel, getUnitCritRate } from '../engine/tactics';
import { TerrainType, Unit } from '../types/game';
import { CharacterPortrait } from './CharacterPortrait';

interface CharacterDetailModalProps {
  unit: Unit;
  terrain: TerrainType;
  onClose: () => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  unit,
  terrain,
  onClose,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const terrainMeta = TERRAIN_META[terrain];
  const critRate = getUnitCritRate(unit);

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <div
        className={`detail-modal detail-${unit.faction}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="detail-close-btn" onClick={onClose} title="关闭 (ESC)">
          <X size={18} />
        </button>

        <div className="detail-header">
          <div className="detail-portrait-box">
            <CharacterPortrait portraitId={unit.portraitId} alt={unit.name} />
          </div>
          <div className="detail-identity">
            <div className="detail-name-row">
              <h2>{unit.name}</h2>
              <span className="detail-class-tag">{unit.unitClass}</span>
              <span className="detail-lv-tag">Lv.{unit.level}</span>
            </div>
            <div className="detail-subtitle">{unit.title}</div>

            {/* HP Bar */}
            <div className="detail-bar-row">
              <span className="bar-label">生命</span>
              <div className="hp-bar-lg detail-bar">
                <div
                  className={`hp-bar-lg-fill ${unit.faction === 'enemy' ? 'enemy-fill' : ''}`}
                  style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
                />
                <span>
                  {unit.hp} / {unit.maxHp}
                </span>
              </div>
            </div>

            {/* EXP Bar (Player only) */}
            {unit.faction === 'player' && (
              <div className="detail-bar-row">
                <span className="bar-label">经验</span>
                <div className="hp-bar-lg detail-bar exp-bar">
                  <div
                    className="hp-bar-lg-fill exp-fill"
                    style={{ width: `${Math.min(100, unit.exp)}%` }}
                  />
                  <span>{unit.exp} / 100</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Core Attributes Grid */}
        <div className="detail-section-title">基础战斗属性</div>
        <div className="detail-stats-grid">
          <div className="detail-stat-box">
            <Sword size={15} className="stat-ico atk-ico" />
            <span className="stat-name">攻击力</span>
            <strong className="stat-val">{unit.atk}</strong>
          </div>
          <div className="detail-stat-box">
            <Shield size={15} className="stat-ico def-ico" />
            <span className="stat-name">防御力</span>
            <strong className="stat-val">
              {unit.def}
              {terrainMeta.defBonus > 0 && (
                <em className="terrain-plus">+{terrainMeta.defBonus}</em>
              )}
            </strong>
          </div>
          <div className="detail-stat-box">
            <Footprints size={15} className="stat-ico mov-ico" />
            <span className="stat-name">移动力</span>
            <strong className="stat-val">{unit.move} 格</strong>
          </div>
          <div className="detail-stat-box">
            <Crosshair size={15} className="stat-ico rng-ico" />
            <span className="stat-name">攻击范围与射程</span>
            <strong className="stat-val">{getAttackShapeLabel(unit)}</strong>
          </div>
          <div className="detail-stat-box">
            <Sparkles size={15} className="stat-ico crit-ico" />
            <span className="stat-name">暴击 / 溅射</span>
            <strong className="stat-val">
              {critRate}%{unit.splashRatio ? ` / 溅${Math.round(unit.splashRatio * 100)}%` : ''}
            </strong>
          </div>
          <div className="detail-stat-box">
            <Heart size={15} className="stat-ico hp-ico" />
            <span className="stat-name">当前地形</span>
            <strong className="stat-val">{terrainMeta.name}</strong>
          </div>
        </div>

        {/* Weapon & Equipment */}
        <div className="detail-section-title">装备与携带物资</div>
        <div className="detail-equip-box">
          <div className="equip-row">
            <span className="equip-label">主战武器</span>
            <strong className="equip-value">{unit.weaponName}</strong>
          </div>
          {unit.faction === 'player' && (
            <div className="equip-row">
              <span className="equip-label">随身补给</span>
              <strong className="equip-value">小米 × {unit.healItems}（恢复 42 生命）</strong>
            </div>
          )}
          <div className="equip-row">
            <span className="equip-label">战场专长</span>
            <strong className="equip-value">
              {unit.canHealAlly
                ? '战地救护（2格内为队友疗伤）'
                : unit.canLayMines
                ? '可埋设地雷阵'
                : unit.isSapper
                ? '敌军探雷工兵（自动侦测2格）'
                : '正面突击'}
            </strong>
          </div>
        </div>

        {/* Carried Mines */}
        {unit.canLayMines && (
          <div className="detail-mines-row">
            {ALL_MINE_TYPES.filter((mt) => (unit.mines[mt] ?? 0) > 0 || mt === 'tu_lei' || mt === 'weizhuang_lei' || mt === 'shi_lei').map((mt) => (
              <div key={mt} className="detail-mine-pill">
                <Bomb size={13} style={{ color: MINES[mt].badgeColor }} />
                <span>{MINES[mt].name}</span>
                <strong>× {unit.mines[mt] ?? 0}</strong>
              </div>
            ))}
          </div>
        )}

        <div className="detail-footer-tip">
          提示：战斗中双击任意角色或点击头像即可打开属性面板；移动后未行动前可按右键或点击「返回原位」撤销移动。
        </div>
      </div>
    </div>
  );
};
