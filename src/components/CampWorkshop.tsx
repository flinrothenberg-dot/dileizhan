import React, { useState } from 'react';
import { Bomb, Hammer, Heart, Package, Play, Shield } from 'lucide-react';
import { MATERIALS, MINES } from '../data/mines';
import { MaterialId, MineType, Unit } from '../types/game';
import { sound } from '../utils/sound';
import { CharacterPortrait } from './CharacterPortrait';
import campBg from '../assets/camp-bg.jpg';

interface CampWorkshopProps {
  materials: Record<MaterialId, number>;
  mineStock: Record<MineType, number>;
  roster: Unit[];
  nextStageTitle: string;
  onCraftMine: (mineType: MineType) => void;
  onAssignMine: (unitId: string, mineType: MineType, delta: 1 | -1) => void;
  onStartNextStage: () => void;
}

const MINE_LIST: MineType[] = ['tu_lei', 'weizhuang_lei', 'shi_lei'];
const MATERIAL_KEYS: MaterialId[] = ['clay', 'stone', 'wood', 'nitre', 'sulfur', 'charcoal'];

export const CampWorkshop: React.FC<CampWorkshopProps> = ({
  materials,
  mineStock,
  roster,
  nextStageTitle,
  onCraftMine,
  onAssignMine,
  onStartNextStage,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<string>(roster[0]?.id ?? 'commander');
  const selectedHero = roster.find((u) => u.id === selectedHeroId) ?? roster[0];

  const canCraft = (mineType: MineType) => {
    const recipe = MINES[mineType].recipe;
    return Object.entries(recipe).every(
      ([mat, cost]) => (materials[mat as MaterialId] ?? 0) >= (cost ?? 0)
    );
  };

  return (
    <div
      className="camp-screen"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(18, 16, 14, 0.82), rgba(14, 12, 10, 0.92)), url(${campBg})`,
      }}
    >
      <div className="camp-bg-overlay" />
      <div className="camp-container">
        <header className="camp-header">
          <div>
            <div className="camp-eyebrow">平阳抗日根据地 · 战前整备</div>
            <h1 className="camp-title">地雷工坊与部队配给</h1>
          </div>
          <button
            className="btn-primary-gold"
            onClick={() => {
              sound.playClick();
              onStartNextStage();
            }}
          >
            <Play size={18} />
            出击：{nextStageTitle}
          </button>
        </header>

        {/* Material Inventory Strip */}
        <section className="camp-materials-bar">
          <div className="section-label">
            <Package size={16} /> 根据地材料库
          </div>
          <div className="materials-grid">
            {MATERIAL_KEYS.map((matId) => {
              const mat = MATERIALS[matId];
              return (
                <div key={matId} className="material-chip" title={mat.description}>
                  <span
                    className="mat-dot"
                    style={{ backgroundColor: mat.iconColor }}
                  />
                  <span className="mat-name">{mat.name}</span>
                  <span className="mat-count">×{materials[matId] ?? 0}</span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="camp-main-grid">
          {/* Left: Mine Crafting Workshop */}
          <section className="camp-card">
            <div className="card-header">
              <Hammer size={18} />
              <h2>土法造雷工坊</h2>
              <span className="card-hint">消耗材料研制地雷，存入仓库</span>
            </div>

            <div className="mine-craft-list">
              {MINE_LIST.map((mType) => {
                const def = MINES[mType];
                const craftable = canCraft(mType);
                return (
                  <div key={mType} className="craft-row">
                    <div className="craft-badge" style={{ borderColor: def.color }}>
                      <span>{def.shortName}</span>
                    </div>
                    <div className="craft-info">
                      <div className="craft-title-line">
                        <strong>{def.name}</strong>
                        <span className="craft-stock">
                          仓库库存：{mineStock[mType] ?? 0} 颗
                        </span>
                      </div>
                      <p className="craft-desc">{def.description}</p>
                      <div className="craft-recipe">
                        配方：
                        {Object.entries(def.recipe).map(([matId, cost]) => {
                          const has = materials[matId as MaterialId] ?? 0;
                          const ok = has >= (cost ?? 0);
                          return (
                            <span
                              key={matId}
                              className={`recipe-tag ${ok ? 'ok' : 'lack'}`}
                            >
                              {MATERIALS[matId as MaterialId].name}×{cost}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      className="btn-craft"
                      disabled={!craftable}
                      onClick={() => {
                        sound.playLayMine();
                        onCraftMine(mType);
                      }}
                    >
                      制造 +1
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right: Squad Loadout & Mine Assignment */}
          <section className="camp-card">
            <div className="card-header">
              <Bomb size={18} />
              <h2>游击队员配雷</h2>
              <span className="card-hint">全体已休整至满血，点击队员分配地雷</span>
            </div>

            <div className="squad-tabs">
              {roster.map((u) => (
                <button
                  key={u.id}
                  className={`squad-tab ${u.id === selectedHero?.id ? 'active' : ''}`}
                  onClick={() => {
                    sound.playClick();
                    setSelectedHeroId(u.id);
                  }}
                >
                  <div className="squad-tab-avatar">
                    <CharacterPortrait portraitId={u.portraitId} alt={u.name} />
                  </div>
                  <div className="squad-tab-meta">
                    <div className="squad-tab-name">{u.name}</div>
                    <div className="squad-tab-class">{u.unitClass}</div>
                  </div>
                </button>
              ))}
            </div>

            {selectedHero && (
              <div className="hero-loadout-box">
                <div className="hero-loadout-top">
                  <div className="hero-loadout-portrait">
                    <CharacterPortrait
                      portraitId={selectedHero.portraitId}
                      alt={selectedHero.name}
                    />
                  </div>
                  <div className="hero-loadout-stats">
                    <h3>
                      {selectedHero.name}{' '}
                      <span className="lv-pill">Lv.{selectedHero.level}</span>
                    </h3>
                    <div className="sub-title">
                      {selectedHero.title} · 武器：{selectedHero.weaponName}
                    </div>
                    <div className="stat-pills">
                      <span>
                        <Heart size={13} /> 生命 {selectedHero.maxHp}/{selectedHero.maxHp}
                      </span>
                      <span>
                        <Shield size={13} /> 攻 {selectedHero.atk} / 防 {selectedHero.def}
                      </span>
                      <span>移动 {selectedHero.move} 格 · 射程 {selectedHero.rangeMin}-{selectedHero.rangeMax}</span>
                    </div>
                  </div>
                </div>

                {selectedHero.canLayMines ? (
                  <div className="assign-mines-grid">
                    {MINE_LIST.map((mType) => {
                      const def = MINES[mType];
                      const carried = selectedHero.mines[mType] ?? 0;
                      const inStock = mineStock[mType] ?? 0;
                      return (
                        <div key={mType} className="assign-row">
                          <span className="assign-name" style={{ color: def.badgeColor }}>
                            ● {def.name}
                          </span>
                          <div className="assign-controls">
                            <button
                              disabled={carried <= 0}
                              onClick={() => {
                                sound.playClick();
                                onAssignMine(selectedHero.id, mType, -1);
                              }}
                            >
                              -
                            </button>
                            <span className="assign-val">{carried}</span>
                            <button
                              disabled={inStock <= 0}
                              onClick={() => {
                                sound.playClick();
                                onAssignMine(selectedHero.id, mType, 1);
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="cannot-mine-note">
                    {selectedHero.name}为近战大刀突击主力，不负责埋雷，擅长正面斩杀被地雷炸残的敌军！
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
