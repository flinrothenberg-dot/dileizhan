import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  Bomb,
  BookOpen,
  CheckCircle2,
  Hammer,
  Heart,
  Lock,
  Package,
  Play,
  Shield,
  Sparkles,
} from 'lucide-react';
import { ALL_MATERIAL_IDS, ALL_MINE_TYPES, MATERIALS, MINES } from '../data/mines';
import { ALL_PROMO_BOOK_IDS, getNextPromotion, PROMO_BOOKS } from '../data/promotions';
import { getTotalMines } from '../engine/tactics';
import { MaterialId, MineType, PromoBookId, Unit } from '../types/game';
import { sound } from '../utils/sound';
import { CharacterPortrait } from './CharacterPortrait';
import { UNIT_SPRITE_MAP } from './TacticalTile';
import campBg from '../assets/camp-bg.jpg';

interface CampWorkshopProps {
  materials: Record<MaterialId, number>;
  mineStock: Record<MineType, number>;
  unlockedMines: MineType[];
  promoBooks: Record<PromoBookId, number>;
  roster: Unit[];
  nextStageTitle: string;
  onCraftMine: (mineType: MineType) => void;
  onAssignMine: (unitId: string, mineType: MineType, delta: 1 | -1) => void;
  onPromoteUnit: (unitId: string) => void;
  onStartNextStage: () => void;
}

export const CampWorkshop: React.FC<CampWorkshopProps> = ({
  materials,
  mineStock,
  unlockedMines,
  promoBooks,
  roster,
  nextStageTitle,
  onCraftMine,
  onAssignMine,
  onPromoteUnit,
  onStartNextStage,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<string>(roster[0]?.id ?? 'commander');
  const [promoNotice, setPromoNotice] = useState<string | null>(null);
  const selectedHero = roster.find((u) => u.id === selectedHeroId) ?? roster[0];
  const unlockedSet = new Set<MineType>(unlockedMines);

  const canCraft = (mineType: MineType) => {
    if (!unlockedSet.has(mineType)) return false;
    const recipe = MINES[mineType].recipe;
    return Object.entries(recipe).every(
      ([mat, cost]) => (materials[mat as MaterialId] ?? 0) >= (cost ?? 0)
    );
  };

  const nextPromo = selectedHero ? getNextPromotion(selectedHero) : null;
  const reqBookMeta = nextPromo ? PROMO_BOOKS[nextPromo.reqBook] : null;
  const hasBookCount = nextPromo ? promoBooks[nextPromo.reqBook] ?? 0 : 0;
  const levelMet = !!selectedHero && !!nextPromo && selectedHero.level >= nextPromo.reqLevel;
  const bookMet = !!nextPromo && hasBookCount > 0;
  const canPromoteSelected = !!selectedHero && !!nextPromo && levelMet && bookMet;

  const curSpriteSrc = selectedHero
    ? UNIT_SPRITE_MAP[selectedHero.spriteId ?? selectedHero.portraitId] ?? UNIT_SPRITE_MAP.commander
    : UNIT_SPRITE_MAP.commander;

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
            <div className="camp-eyebrow">平阳抗日根据地 · 战前整备与兵种转职</div>
            <h1 className="camp-title">地雷工坊与部队晋升</h1>
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
            {ALL_MATERIAL_IDS.map((matId) => {
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

        {/* 1998 Original Promotion Books Loot Strip */}
        <section className="camp-materials-bar promo-books-bar">
          <div className="section-label">
            <BookOpen size={16} /> 转职兵书库（击毙敌将战利缴获 · 须兼备等级与兵书方可晋升）
          </div>
          <div className="materials-grid">
            {ALL_PROMO_BOOK_IDS.map((bId) => {
              const book = PROMO_BOOKS[bId];
              const cnt = promoBooks[bId] ?? 0;
              return (
                <div
                  key={bId}
                  className={`material-chip promo-book-chip ${cnt > 0 ? 'owned' : 'empty'}`}
                  title={book.dropSource}
                >
                  <span className="mat-dot" style={{ backgroundColor: book.color }} />
                  <span className="mat-name">{book.name}</span>
                  <span className="mat-count">×{cnt}</span>
                </div>
              );
            })}
          </div>
        </section>

        {promoNotice && (
          <div className="promo-success-banner">
            <Sparkles size={16} /> {promoNotice}
          </div>
        )}

        <div className="camp-main-grid">
          {/* Left: Mine Crafting Workshop */}
          <section className="camp-card">
            <div className="card-header">
              <Hammer size={18} />
              <h2>土法造雷工坊</h2>
              <span className="card-hint">消耗材料研制六大名雷，存入仓库</span>
            </div>

            <div className="mine-craft-list">
              {ALL_MINE_TYPES.map((mType) => {
                const def = MINES[mType];
                const isUnlocked = unlockedSet.has(mType);
                const craftable = canCraft(mType);
                return (
                  <div
                    key={mType}
                    className={`craft-row ${!isUnlocked ? 'craft-locked' : ''}`}
                  >
                    <div className="craft-badge" style={{ borderColor: def.color }}>
                      <span>{def.shortName}</span>
                    </div>
                    <div className="craft-info">
                      <div className="craft-title-line">
                        <strong>{def.name}</strong>
                        {isUnlocked ? (
                          <span className="craft-stock">
                            仓库库存：{mineStock[mType] ?? 0} 颗
                          </span>
                        ) : (
                          <span className="craft-lock-tag">
                            <Lock size={11} /> 第{def.unlockStage}关剧情解锁
                          </span>
                        )}
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
                      {isUnlocked ? '制造 +1' : '未解锁'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right: Squad Loadout, Promotion & Mine Assignment */}
          <section className="camp-card">
            <div className="card-header">
              <Bomb size={18} />
              <h2>部队晋升与配雷</h2>
              <span className="card-hint">已达等级并持对应兵书，即可转职高阶兵种</span>
            </div>

            <div className="squad-tabs">
              {roster.map((u) => {
                const rule = getNextPromotion(u);
                const ready =
                  !!rule && u.level >= rule.reqLevel && (promoBooks[rule.reqBook] ?? 0) > 0;
                return (
                  <button
                    key={u.id}
                    className={`squad-tab ${u.id === selectedHero?.id ? 'active' : ''} ${
                      ready ? 'promo-ready-tab' : ''
                    }`}
                    onClick={() => {
                      sound.playClick();
                      setSelectedHeroId(u.id);
                    }}
                  >
                    <div className="squad-tab-avatar">
                      <CharacterPortrait portraitId={u.portraitId} alt={u.name} />
                    </div>
                    <div className="squad-tab-meta">
                      <div className="squad-tab-name">
                        {u.name} <small className="tab-lv">Lv.{u.level}</small>
                      </div>
                      <div className="squad-tab-class">
                        {u.unitClass}
                        {ready ? ' · 可转职!' : u.canLayMines ? ` · ${getTotalMines(u)}雷` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
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
                      <span className="lv-pill">
                        Lv.{selectedHero.level} · {selectedHero.unitClass}
                      </span>
                    </h3>
                    <div className="sub-title">
                      {selectedHero.title} · {selectedHero.weaponName}
                    </div>
                    <div className="stat-pills">
                      <span>
                        <Heart size={13} /> 生命 {selectedHero.maxHp}/{selectedHero.maxHp}
                      </span>
                      <span>
                        <Shield size={13} /> 攻 {selectedHero.atk} / 防 {selectedHero.def}
                      </span>
                      <span>
                        移动 {selectedHero.move} 格 · 射程 {selectedHero.rangeMin}-
                        {selectedHero.rangeMax}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1998 Class Promotion Panel */}
                {nextPromo && reqBookMeta ? (
                  <div className="promo-box">
                    <div className="promo-box-head">
                      <Award size={15} />
                      <strong>原版兵种转职路线</strong>
                      <span className="promo-route-tag">
                        {nextPromo.fromClass} → {nextPromo.toClass}
                      </span>
                    </div>

                    <div className="promo-preview-row">
                      <div className="promo-sprite-pair">
                        <div className="promo-sprite-card">
                          <img src={curSpriteSrc} alt={nextPromo.fromClass} />
                          <span>{nextPromo.fromClass}</span>
                        </div>
                        <ArrowRight size={18} className="promo-arrow" />
                        <div className="promo-sprite-card target">
                          <img
                            src={UNIT_SPRITE_MAP[nextPromo.toSpriteId] ?? curSpriteSrc}
                            alt={nextPromo.toClass}
                          />
                          <span>{nextPromo.toClass}</span>
                        </div>
                      </div>

                      <div className="promo-details">
                        <div className="promo-bonuses">
                          <span>生命 +{nextPromo.bonus.maxHp}</span>
                          <span>攻击 +{nextPromo.bonus.atk}</span>
                          <span>防御 +{nextPromo.bonus.def}</span>
                          {nextPromo.bonus.move && <span>移动 +{nextPromo.bonus.move}</span>}
                          {nextPromo.bonus.rangeMax && (
                            <span>射程 +{nextPromo.bonus.rangeMax}</span>
                          )}
                          {nextPromo.bonus.critRate && (
                            <span>暴击 +{nextPromo.bonus.critRate}%</span>
                          )}
                        </div>
                        <p className="promo-perk">{nextPromo.perkNote}</p>
                      </div>
                    </div>

                    <div className="promo-conditions">
                      <span className={`promo-cond-pill ${levelMet ? 'met' : 'unmet'}`}>
                        {levelMet ? <CheckCircle2 size={13} /> : <Lock size={13} />}
                        等级要求：Lv.{nextPromo.reqLevel}（当前 Lv.{selectedHero.level}）
                      </span>
                      <span className={`promo-cond-pill ${bookMet ? 'met' : 'unmet'}`}>
                        {bookMet ? <CheckCircle2 size={13} /> : <Lock size={13} />}
                        转职典籍：{reqBookMeta.name} ×1（{hasBookCount > 0 ? `已有 ×${hasBookCount}` : reqBookMeta.dropSource}）
                      </span>
                    </div>

                    <button
                      className="btn-promote"
                      disabled={!canPromoteSelected}
                      onClick={() => {
                        sound.playPromote();
                        onPromoteUnit(selectedHero.id);
                        setPromoNotice(
                          `★ ${selectedHero.name} 达成晋升条件，耗费${reqBookMeta.name}正式转职为【${nextPromo.toClass}】！战力大增且战场小人已换装！`
                        );
                      }}
                    >
                      <Sparkles size={15} />
                      {canPromoteSelected
                        ? `消耗 ${reqBookMeta.name} · 晋升为【${nextPromo.toClass}】`
                        : !levelMet && !bookMet
                        ? `需先战至 Lv.${nextPromo.reqLevel} 并缴获 ${reqBookMeta.name}`
                        : !levelMet
                        ? `等级未满（需在战斗中升至 Lv.${nextPromo.reqLevel}）`
                        : `缺少转职兵书（${reqBookMeta.dropSource}）`}
                    </button>
                  </div>
                ) : (
                  <div className="promo-box promo-maxed">
                    <Award size={15} />
                    <span>
                      【{selectedHero.name} · {selectedHero.unitClass}】已为该系高阶精锐兵种，战阵无需再转职。
                    </span>
                  </div>
                )}

                {selectedHero.canLayMines ? (
                  <div className="assign-mines-grid">
                    {ALL_MINE_TYPES.filter(
                      (m) => unlockedSet.has(m) || (selectedHero.mines[m] ?? 0) > 0
                    ).map((mType) => {
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
                    {selectedHero.name}为正面突击主力，不负责埋雷，擅长斩杀被地雷炸残的日伪军！
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
