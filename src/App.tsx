import React, { useMemo, useRef, useState } from 'react';
import { Award, Bomb, Compass, FolderOpen, Play, RotateCcw, Shield, Sparkles, Wrench } from 'lucide-react';
import { BattleScreen } from './components/BattleScreen';
import { CampWorkshop } from './components/CampWorkshop';
import { SaveLoadModal } from './components/SaveLoadModal';
import { ALL_MINE_TYPES, makeMineInventory, MINES } from './data/mines';
import { applyUnitPromotion, emptyPromoBooks, getNextPromotion } from './data/promotions';
import { HERO_UNLOCK_ORDER, INITIAL_HERO_ROSTER, STAGES } from './data/stages';
import {
  BattleSnapshot,
  CampaignSaveData,
  MaterialId,
  MineType,
  PromoBookId,
  SaveSlotId,
  ScreenMode,
  Unit,
} from './types/game';
import { getMostRecentSave, writeSaveSlot } from './utils/saveSystem';
import { sound } from './utils/sound';
import titleBg from './assets/title-bg.jpg';

const BASE_MATERIALS: Record<MaterialId, number> = {
  clay: 4,
  stone: 4,
  wood: 3,
  iron: 2,
  venom: 1,
  nitre: 4,
  sulfur: 2,
  charcoal: 3,
};

function buildRosterForStage(stageNumber: number): Unit[] {
  const keys = HERO_UNLOCK_ORDER[stageNumber] ?? HERO_UNLOCK_ORDER[1];
  return keys.map((k) => {
    const base = INITIAL_HERO_ROSTER[k];
    const bonusMines: Partial<Record<MineType, number>> = {};
    if (stageNumber >= 3 && k === 'commander') bonusMines.shi_lei = 1;
    if (stageNumber >= 4 && k === 'zhaohu') {
      bonusMines.tie_lei = 1;
      bonusMines.shi_lei = 2;
    }
    if (stageNumber >= 5 && k === 'zhangga') {
      bonusMines.xiezi_lei = 2;
      bonusMines.weizhuang_lei = 2;
    }
    if (stageNumber >= 6 && k === 'zhaohu') {
      bonusMines.chongtian_pao = 1;
    }
    if (stageNumber >= 7 && k === 'zhaohu') {
      bonusMines.cidian_lei = 1;
    }
    if (stageNumber >= 9 && k === 'zhaohu') {
      bonusMines.zhangqi_lei = 1;
    }
    if (stageNumber >= 18 && k === 'commander') {
      bonusMines.yaokong_lei = 1;
    }

    // Calibrate starting experience/level across 28 canonical stages
    let level = base.level;
    let maxHp = base.maxHp;
    let atk = base.atk;
    let def = base.def;
    const minStageLv =
      stageNumber >= 3 ? Math.min(12, Math.max(base.level, Math.round(2 + stageNumber * 0.36))) : base.level;
    if (minStageLv > level) {
      const diff = minStageLv - level;
      level = minStageLv;
      maxHp += diff * 11;
      atk = Math.round(atk + diff * 3.5);
      def += Math.floor(diff * 1.6);
    }

    return {
      ...base,
      level,
      maxHp,
      hp: maxHp,
      atk,
      def,
      mines: { ...base.mines, ...bonusMines },
      x: 0,
      y: 0,
      acted: false,
      moved: false,
      stunnedTurns: 0,
      poisonedTurns: 0,
      alive: true,
      facing: 'right',
    };
  });
}

function getUnlockedMinesForStage(stageNumber: number): MineType[] {
  return ALL_MINE_TYPES.filter((m) => MINES[m].unlockStage <= stageNumber);
}

function getBooksForStageEntry(stageNumber: number): Record<PromoBookId, number> {
  const books = emptyPromoBooks();
  if (stageNumber >= 2) books.wugong_xinfa += 1;
  if (stageNumber >= 3) {
    books.yezhan_xinfa += 1;
    books.qiangxie_jichu += 1;
  }
  if (stageNumber >= 4) {
    books.hongjin += 1;
    books.junqi += 1;
  }
  if (stageNumber >= 5) {
    books.youji_xinfa += 1;
    books.qiangxie_jingdian += 1;
    books.huoqi_jichu += 1;
  }
  if (stageNumber >= 6) {
    books.huoqi_jichu += 1;
    books.mashu_jingdian += 1;
  }
  if (stageNumber >= 7) books.yezhan_xinfa += 1;
  if (stageNumber >= 8) books.hongjin += 1;
  if (stageNumber >= 9) books.junqi += 1;
  if (stageNumber >= 10) books.mashu_jingdian += 1;
  if (stageNumber >= 11) {
    books.youji_xinfa += 1;
    books.huoqi_jingdian += 1;
  }
  if (stageNumber >= 12) {
    books.youji_xinfa += 1;
    books.wugong_xinfa += 1;
  }
  if (stageNumber >= 13) {
    books.qiangxie_jichu += 1;
    books.qiangxie_jingdian += 1;
  }
  if (stageNumber >= 15) {
    books.wugong_xinfa += 1;
    books.mashu_jingdian += 1;
  }
  if (stageNumber >= 17) books.zhanshu_jingdian += 1;
  if (stageNumber >= 19) books.qiangxie_jingdian += 1;
  if (stageNumber >= 21) books.youji_xinfa += 1;
  if (stageNumber >= 23) {
    books.qiangxie_jingdian += 1;
    books.zhanshu_jingdian += 1;
  }
  if (stageNumber >= 25) {
    books.huoqi_jingdian += 1;
    books.zhanshu_jingdian += 1;
    books.mashu_jingdian += 1;
  }
  if (stageNumber >= 27) {
    books.wugong_xinfa += 1;
    books.qiangxie_jingdian += 2;
    books.zhanshu_jingdian += 1;
  }
  return books;
}

export const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenMode>('title');
  const [stageIdx, setStageIdx] = useState(0);
  const [battleKey, setBattleKey] = useState(1);

  const [materials, setMaterials] = useState<Record<MaterialId, number>>({ ...BASE_MATERIALS });
  const [mineStock, setMineStock] = useState<Record<MineType, number>>(
    makeMineInventory({ tu_lei: 2, weizhuang_lei: 2, shi_lei: 1 })
  );
  const [unlockedMines, setUnlockedMines] = useState<MineType[]>(['tu_lei']);
  const [promoBooks, setPromoBooks] = useState<Record<PromoBookId, number>>(emptyPromoBooks);
  const [roster, setRoster] = useState<Unit[]>(() => buildRosterForStage(1));

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveRev, setSaveRev] = useState(0);
  const [loadedBattleSnapshot, setLoadedBattleSnapshot] = useState<BattleSnapshot | undefined>(
    undefined
  );
  const liveBattleSnapshotRef = useRef<BattleSnapshot | undefined>(undefined);

  const currentStage = STAGES[stageIdx];
  const latestSave = useMemo(() => getMostRecentSave(), [screen, saveRev, saveModalOpen]);

  const buildSaveLabel = (
    targetScreen: 'camp' | 'battle',
    targetStageIdx: number,
    battleSnap?: BattleSnapshot
  ) => {
    const st = STAGES[targetStageIdx];
    const num = st?.id ?? targetStageIdx + 1;
    const shortTitle = st?.name.split('·')[0].trim() ?? '平阳战役';
    if (targetScreen === 'battle' && battleSnap) {
      return `第${num}关 ${shortTitle} · 第${battleSnap.turn}回合`;
    }
    return targetScreen === 'camp'
      ? `第${num}关前整备 · ${shortTitle}`
      : `第${num}关 · ${shortTitle}`;
  };

  const handleSaveToSlot = (slotId: SaveSlotId): CampaignSaveData | null => {
    const saveScreen: 'camp' | 'battle' = screen === 'camp' ? 'camp' : 'battle';
    const bSnap = saveScreen === 'battle' ? liveBattleSnapshotRef.current : undefined;
    const saved = writeSaveSlot(slotId, {
      label: buildSaveLabel(saveScreen, stageIdx, bSnap),
      screen: saveScreen,
      stageIdx,
      stageName: currentStage?.name ?? '',
      materials,
      mineStock,
      unlockedMines,
      promoBooks,
      roster,
      battle: bSnap,
    });
    if (saved) setSaveRev((r) => r + 1);
    return saved;
  };

  const applyLoadedSave = (save: CampaignSaveData) => {
    sound.playClick();
    const clampedIdx = Math.max(0, Math.min(STAGES.length - 1, save.stageIdx));
    setStageIdx(clampedIdx);
    setMaterials({ ...BASE_MATERIALS, ...save.materials });
    setMineStock(makeMineInventory(save.mineStock));
    setUnlockedMines([...save.unlockedMines]);
    setPromoBooks({ ...emptyPromoBooks(), ...save.promoBooks });
    setRoster(save.roster.map((u) => ({ ...u, mines: { ...u.mines } })));
    if (save.screen === 'battle') {
      setLoadedBattleSnapshot(save.battle);
      liveBattleSnapshotRef.current = save.battle;
      setBattleKey((k) => k + 1);
      setScreen('battle');
    } else {
      setLoadedBattleSnapshot(undefined);
      liveBattleSnapshotRef.current = undefined;
      setScreen('camp');
    }
  };

  const seedCampaignAtStage = (targetStageIdx: number) => {
    const stageNum = STAGES[targetStageIdx]?.id ?? 1;
    const nextUnlocked = getUnlockedMinesForStage(stageNum);
    const nextBooks = getBooksForStageEntry(stageNum);
    const nextRoster = buildRosterForStage(stageNum);
    const nextMats = {
      clay: 4 + targetStageIdx * 2,
      stone: 4 + targetStageIdx * 2,
      wood: 3 + targetStageIdx,
      iron: 2 + targetStageIdx * 2,
      venom: 1 + targetStageIdx * 2,
      nitre: 4 + targetStageIdx * 2,
      sulfur: 2 + targetStageIdx * 2,
      charcoal: 3 + targetStageIdx * 2,
    };
    const nextStock = makeMineInventory({
      tu_lei: 2,
      weizhuang_lei: stageNum >= 2 ? 2 : 0,
      shi_lei: stageNum >= 2 ? 2 : 0,
      tie_lei: stageNum >= 3 ? 2 : 0,
      xiezi_lei: stageNum >= 4 ? 2 : 0,
      yinfa_lei: stageNum >= 5 ? 2 : 0,
      chongtian_pao: stageNum >= 6 ? 2 : 0,
      cidian_lei: stageNum >= 7 ? 2 : 0,
      zhangqi_lei: stageNum >= 9 ? 2 : 0,
      yaokong_lei: stageNum >= 18 ? 2 : 0,
    });
    setStageIdx(targetStageIdx);
    setUnlockedMines(nextUnlocked);
    setPromoBooks(nextBooks);
    setRoster(nextRoster);
    setMaterials(nextMats);
    setMineStock(nextStock);
    return { nextUnlocked, nextBooks, nextRoster, nextMats, nextStock };
  };

  const handleStartNewGame = (targetStageIdx = 0) => {
    sound.playClick();
    const seeded = seedCampaignAtStage(targetStageIdx);
    setLoadedBattleSnapshot(undefined);
    liveBattleSnapshotRef.current = undefined;
    writeSaveSlot('auto', {
      label: buildSaveLabel('battle', targetStageIdx),
      screen: 'battle',
      stageIdx: targetStageIdx,
      stageName: STAGES[targetStageIdx]?.name ?? '',
      materials: seeded.nextMats,
      mineStock: seeded.nextStock,
      unlockedMines: seeded.nextUnlocked,
      promoBooks: seeded.nextBooks,
      roster: seeded.nextRoster,
    });
    setSaveRev((r) => r + 1);
    setBattleKey((k) => k + 1);
    setScreen('battle');
  };

  const handleBattleVictory = (survivingHeroes: Unit[]) => {
    const nextIdx = stageIdx + 1;
    const nextStageNum = STAGES[nextIdx]?.id ?? currentStage.id;

    // Merge hero progression synchronously so auto-save stores full victory progress immediately
    const map = new Map<string, Unit>(roster.map((u) => [u.id, u]));
    for (const h of survivingHeroes) {
      if (!INITIAL_HERO_ROSTER[h.id]) continue;
      map.set(h.id, { ...h, hp: h.maxHp, acted: false, moved: false, isCaptive: false });
    }
    const nextKeys = HERO_UNLOCK_ORDER[nextStageNum] ?? [];
    for (const k of nextKeys) {
      if (!map.has(k)) {
        const base = INITIAL_HERO_ROSTER[k];
        map.set(k, {
          ...base,
          mines: { ...base.mines },
          x: 0,
          y: 0,
          acted: false,
          moved: false,
          stunnedTurns: 0,
          poisonedTurns: 0,
          alive: true,
          facing: 'right',
        });
      }
    }
    const nextRoster = Array.from(map.values());
    setRoster(nextRoster);

    const nextMaterials = { ...materials };
    for (const [mat, amt] of Object.entries(currentStage.rewardMaterials)) {
      nextMaterials[mat as MaterialId] = (nextMaterials[mat as MaterialId] ?? 0) + (amt ?? 0);
    }
    setMaterials(nextMaterials);

    const nextPromoBooks = { ...promoBooks };
    if (currentStage.rewardPromoBooks) {
      for (const [bookId, amt] of Object.entries(currentStage.rewardPromoBooks)) {
        nextPromoBooks[bookId as PromoBookId] =
          (nextPromoBooks[bookId as PromoBookId] ?? 0) + (amt ?? 0);
      }
      setPromoBooks(nextPromoBooks);
    }

    const mergedMines = new Set<MineType>(unlockedMines);
    for (const um of currentStage.unlockedMines ?? []) {
      mergedMines.add(um);
    }
    const nextUnlocked = ALL_MINE_TYPES.filter((m) => mergedMines.has(m));
    setUnlockedMines(nextUnlocked);

    const targetCampIdx = nextIdx < STAGES.length ? nextIdx : STAGES.length - 1;
    writeSaveSlot('auto', {
      label: buildSaveLabel('camp', targetCampIdx),
      screen: 'camp',
      stageIdx: targetCampIdx,
      stageName: STAGES[targetCampIdx]?.name ?? currentStage.name,
      materials: nextMaterials,
      mineStock,
      unlockedMines: nextUnlocked,
      promoBooks: nextPromoBooks,
      roster: nextRoster,
    });
    setSaveRev((r) => r + 1);
    setLoadedBattleSnapshot(undefined);
    liveBattleSnapshotRef.current = undefined;

    if (nextIdx < STAGES.length) {
      setStageIdx(nextIdx);
      setScreen('camp');
    } else {
      setScreen('demo_complete');
    }
  };

  const handleCraftMine = (mineType: MineType) => {
    const recipe = MINES[mineType].recipe;
    const can = Object.entries(recipe).every(
      ([m, c]) => (materials[m as MaterialId] ?? 0) >= (c ?? 0)
    );
    if (!can) return;

    const nextMaterials = { ...materials };
    for (const [m, c] of Object.entries(recipe)) {
      nextMaterials[m as MaterialId] = (nextMaterials[m as MaterialId] ?? 0) - (c ?? 0);
    }
    const nextStock = {
      ...mineStock,
      [mineType]: (mineStock[mineType] ?? 0) + 1,
    };
    setMaterials(nextMaterials);
    setMineStock(nextStock);
    writeSaveSlot('auto', {
      label: buildSaveLabel('camp', stageIdx),
      screen: 'camp',
      stageIdx,
      stageName: currentStage?.name ?? '',
      materials: nextMaterials,
      mineStock: nextStock,
      unlockedMines,
      promoBooks,
      roster,
    });
  };

  const handleAssignMine = (unitId: string, mineType: MineType, delta: 1 | -1) => {
    if (delta === 1 && (mineStock[mineType] ?? 0) <= 0) return;

    const target = roster.find((u) => u.id === unitId);
    if (!target) return;
    if (delta === -1 && (target.mines[mineType] ?? 0) <= 0) return;

    const nextStock = {
      ...mineStock,
      [mineType]: (mineStock[mineType] ?? 0) - delta,
    };
    const nextRoster = roster.map((u) =>
      u.id === unitId
        ? {
            ...u,
            mines: {
              ...u.mines,
              [mineType]: (u.mines[mineType] ?? 0) + delta,
            },
          }
        : u
    );
    setMineStock(nextStock);
    setRoster(nextRoster);
    writeSaveSlot('auto', {
      label: buildSaveLabel('camp', stageIdx),
      screen: 'camp',
      stageIdx,
      stageName: currentStage?.name ?? '',
      materials,
      mineStock: nextStock,
      unlockedMines,
      promoBooks,
      roster: nextRoster,
    });
  };

  const handlePromoteUnit = (unitId: string) => {
    const target = roster.find((u) => u.id === unitId);
    if (!target) return;
    const rule = getNextPromotion(target);
    if (!rule) return;
    if (target.level < rule.reqLevel) return;
    if ((promoBooks[rule.reqBook] ?? 0) <= 0) return;

    const nextBooks = {
      ...promoBooks,
      [rule.reqBook]: Math.max(0, (promoBooks[rule.reqBook] ?? 0) - 1),
    };
    const nextRoster = roster.map((u) => (u.id === unitId ? applyUnitPromotion(u, rule) : u));
    setPromoBooks(nextBooks);
    setRoster(nextRoster);
    writeSaveSlot('auto', {
      label: buildSaveLabel('camp', stageIdx),
      screen: 'camp',
      stageIdx,
      stageName: currentStage?.name ?? '',
      materials,
      mineStock,
      unlockedMines,
      promoBooks: nextBooks,
      roster: nextRoster,
    });
  };

  let pageContent: React.ReactNode;

  if (screen === 'title') {
    pageContent = (
      <div className="title-screen">
        <div
          className="title-bg-art"
          style={{ backgroundImage: `url(${titleBg})` }}
        />
        <div className="title-vignette" />

        <div className="title-content">
          <div className="title-badge">
            <Sparkles size={14} /> 1998 金山西山居经典战棋 · 全二十八关完全未删减高清版
          </div>
          <h1 className="game-logo">
            抗日<span>：</span>地雷战
          </h1>
          <p className="game-tagline">
            1942-1943 冀中平阳 · 34位抗日群英集结 · 十大名雷 · 原版全线剧情一关不缩水
          </p>

          <div className="title-features">
            <span>
              <Bomb size={15} /> 全二十八关完整还原
            </span>
            <span>
              <Shield size={15} /> 护送/潜伏/统战/四连攻城
            </span>
            <span>
              <Compass size={15} /> 4向/8向/12向/远射溅射升级
            </span>
          </div>

          <div className="title-actions">
            <div className="title-primary-row">
              {latestSave && (
                <button
                  className="btn-continue-save btn-lg"
                  onClick={() => applyLoadedSave(latestSave)}
                >
                  <Play size={20} /> 继续征战：{latestSave.label}
                </button>
              )}
              <button
                className="btn-primary-gold btn-lg"
                onClick={() => handleStartNewGame(0)}
              >
                <Play size={20} /> 从头开始战役（第1关 → 第28关最终决战）
              </button>
            </div>

            <div className="title-stage-grid">
              {STAGES.map((st, idx) => (
                <button
                  key={st.id}
                  className="stage-jump-btn"
                  onClick={() => handleStartNewGame(idx)}
                >
                  <span className="sj-code">第{st.id}关</span>
                  <strong className="sj-name">{st.name.split('·')[0].trim()}</strong>
                  <small className="sj-sub">{st.name.split('·')[1]?.trim() ?? st.location}</small>
                </button>
              ))}
            </div>

            <div className="title-secondary-row">
              <button
                className="btn-ghost"
                onClick={() => {
                  sound.playClick();
                  setSaveModalOpen(true);
                }}
              >
                <FolderOpen size={14} /> 档案管理（多槽读档 / .json 导入导出）
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  sound.playClick();
                  seedCampaignAtStage(STAGES.length - 1);
                  setScreen('camp');
                }}
              >
                <Wrench size={14} /> 直接体验：全十大名雷工坊与终极转职（第28关最终决战前整备）
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (screen === 'camp') {
    pageContent = (
      <CampWorkshop
        materials={materials}
        mineStock={mineStock}
        unlockedMines={unlockedMines}
        promoBooks={promoBooks}
        roster={roster}
        nextStageTitle={STAGES[stageIdx]?.name ?? '下一战役'}
        onCraftMine={handleCraftMine}
        onAssignMine={handleAssignMine}
        onPromoteUnit={handlePromoteUnit}
        onOpenSaveModal={() => setSaveModalOpen(true)}
        onBackToTitle={() => setScreen('title')}
        onStartNextStage={() => {
          setLoadedBattleSnapshot(undefined);
          liveBattleSnapshotRef.current = undefined;
          writeSaveSlot('auto', {
            label: buildSaveLabel('battle', stageIdx),
            screen: 'battle',
            stageIdx,
            stageName: currentStage?.name ?? '',
            materials,
            mineStock,
            unlockedMines,
            promoBooks,
            roster,
          });
          setSaveRev((r) => r + 1);
          setBattleKey((k) => k + 1);
          setScreen('battle');
        }}
      />
    );
  } else if (screen === 'demo_complete') {
    pageContent = (
      <div className="complete-screen">
        <div
          className="title-bg-art"
          style={{ backgroundImage: `url(${titleBg})` }}
        />
        <div className="title-vignette" />
        <div className="complete-card">
          <Award size={48} className="complete-icon" />
          <div className="camp-eyebrow">全二十八关完全未删减版 · 光复平阳全境</div>
          <h1>平阳大捷！正式改编为冀中军区独立团！</h1>
          <p>
            你已率领游击大队长、朱老忠、赵虎、张嘎、李向阳、九爷、雷石柱、林嫂、雨来、魏强、刘洪、鲁汉、康伯充、吴海、郑之光、金花婆、方仲雄、向氏兄弟、彼得中尉、田大山、黄成杰、杨铁山、周亮、陈怀忠、傅正明与唐联西等 34 位抗日英雄，历尽二十八场完整战役——从护送钱宇森科学家、奇袭火车、黑风寨借路、救护施南百姓、斩杀山田川岛，直到连破军火库、军营、县城巷战并最终击毙桥本群攻克日军总司令部！
          </p>
          <p className="complete-next-note">
            1998 金山西山居《抗日：地雷战》全 28 关支线主线一关不漏 + 十大名雷 + 原版多阶攻击范围转职系统全数通关！
          </p>
          <div className="complete-btns">
            <button
              className="btn-primary-gold"
              onClick={() => handleStartNewGame(0)}
            >
              <RotateCcw size={16} /> 重温第一关
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                sound.playClick();
                setScreen('title');
              }}
            >
              返回主界面（28关任选重温）
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    pageContent = (
      <BattleScreen
        key={`${currentStage.id}-${battleKey}`}
        stage={currentStage}
        carryOverRoster={stageIdx > 0 ? roster : undefined}
        initialSnapshot={loadedBattleSnapshot}
        hasNextStage={stageIdx + 1 < STAGES.length}
        onVictory={handleBattleVictory}
        onRestart={() => {
          setLoadedBattleSnapshot(undefined);
          liveBattleSnapshotRef.current = undefined;
          setBattleKey((k) => k + 1);
        }}
        onOpenSaveModal={(snap) => {
          liveBattleSnapshotRef.current = snap;
          setSaveModalOpen(true);
        }}
        onAutoSaveSnapshot={(snap) => {
          liveBattleSnapshotRef.current = snap;
          writeSaveSlot('auto', {
            label: buildSaveLabel('battle', stageIdx, snap),
            screen: 'battle',
            stageIdx,
            stageName: currentStage?.name ?? '',
            materials,
            mineStock,
            unlockedMines,
            promoBooks,
            roster,
            battle: snap,
          });
        }}
        onBackToTitle={() => {
          setSaveRev((r) => r + 1);
          setScreen('title');
        }}
      />
    );
  }

  return (
    <>
      {pageContent}
      {saveModalOpen && (
        <SaveLoadModal
          canSaveCurrent={screen === 'camp' || screen === 'battle'}
          currentSummary={
            screen === 'camp' || screen === 'battle'
              ? buildSaveLabel(
                  screen === 'camp' ? 'camp' : 'battle',
                  stageIdx,
                  liveBattleSnapshotRef.current
                )
              : undefined
          }
          onSaveToSlot={handleSaveToSlot}
          onLoadSaveData={applyLoadedSave}
          onClose={() => {
            setSaveRev((r) => r + 1);
            setSaveModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default App;
