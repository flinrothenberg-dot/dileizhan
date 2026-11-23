import React, { useState } from 'react';
import { Award, Bomb, Compass, Play, RotateCcw, Shield, Sparkles, Wrench } from 'lucide-react';
import { BattleScreen } from './components/BattleScreen';
import { CampWorkshop } from './components/CampWorkshop';
import { ALL_MINE_TYPES, makeMineInventory, MINES } from './data/mines';
import { HERO_UNLOCK_ORDER, INITIAL_HERO_ROSTER, STAGES } from './data/stages';
import { MaterialId, MineType, ScreenMode, Unit } from './types/game';
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
    return {
      ...base,
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

export const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenMode>('title');
  const [stageIdx, setStageIdx] = useState(0);
  const [battleKey, setBattleKey] = useState(1);

  const [materials, setMaterials] = useState<Record<MaterialId, number>>({ ...BASE_MATERIALS });
  const [mineStock, setMineStock] = useState<Record<MineType, number>>(
    makeMineInventory({ tu_lei: 2, weizhuang_lei: 2, shi_lei: 1 })
  );
  const [unlockedMines, setUnlockedMines] = useState<MineType[]>(['tu_lei']);
  const [roster, setRoster] = useState<Unit[]>(() => buildRosterForStage(1));

  const currentStage = STAGES[stageIdx];

  const seedCampaignAtStage = (targetStageIdx: number) => {
    const stageNum = STAGES[targetStageIdx]?.id ?? 1;
    setStageIdx(targetStageIdx);
    setUnlockedMines(getUnlockedMinesForStage(stageNum));
    setRoster(buildRosterForStage(stageNum));
    setMaterials({
      clay: 4 + targetStageIdx * 2,
      stone: 4 + targetStageIdx * 2,
      wood: 3 + targetStageIdx,
      iron: 2 + targetStageIdx * 2,
      venom: 1 + targetStageIdx * 2,
      nitre: 4 + targetStageIdx * 2,
      sulfur: 2 + targetStageIdx * 2,
      charcoal: 3 + targetStageIdx * 2,
    });
    setMineStock(
      makeMineInventory({
        tu_lei: 2,
        weizhuang_lei: stageNum >= 2 ? 2 : 0,
        shi_lei: stageNum >= 2 ? 2 : 0,
        tie_lei: stageNum >= 3 ? 2 : 0,
        xiezi_lei: stageNum >= 4 ? 2 : 0,
        yinfa_lei: stageNum >= 5 ? 2 : 0,
      })
    );
  };

  const handleStartNewGame = (targetStageIdx = 0) => {
    sound.playClick();
    seedCampaignAtStage(targetStageIdx);
    setBattleKey((k) => k + 1);
    setScreen('battle');
  };

  const handleBattleVictory = (survivingHeroes: Unit[]) => {
    const nextIdx = stageIdx + 1;
    const nextStageNum = STAGES[nextIdx]?.id ?? currentStage.id;

    // Merge hero progression + newly unlocked heroes for the next stage
    setRoster((prev) => {
      const map = new Map<string, Unit>(prev.map((u) => [u.id, u]));
      for (const h of survivingHeroes) {
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
      return Array.from(map.values());
    });

    const rewards = currentStage.rewardMaterials;
    setMaterials((prev) => {
      const next = { ...prev };
      for (const [mat, amt] of Object.entries(rewards)) {
        next[mat as MaterialId] = (next[mat as MaterialId] ?? 0) + (amt ?? 0);
      }
      return next;
    });

    setUnlockedMines((prev) => {
      const merged = new Set<MineType>(prev);
      for (const um of currentStage.unlockedMines ?? []) {
        merged.add(um);
      }
      return ALL_MINE_TYPES.filter((m) => merged.has(m));
    });

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

    setMaterials((prev) => {
      const next = { ...prev };
      for (const [m, c] of Object.entries(recipe)) {
        next[m as MaterialId] = (next[m as MaterialId] ?? 0) - (c ?? 0);
      }
      return next;
    });
    setMineStock((prev) => ({
      ...prev,
      [mineType]: (prev[mineType] ?? 0) + 1,
    }));
  };

  const handleAssignMine = (unitId: string, mineType: MineType, delta: 1 | -1) => {
    if (delta === 1 && (mineStock[mineType] ?? 0) <= 0) return;

    const target = roster.find((u) => u.id === unitId);
    if (!target) return;
    if (delta === -1 && (target.mines[mineType] ?? 0) <= 0) return;

    setMineStock((prev) => ({
      ...prev,
      [mineType]: (prev[mineType] ?? 0) - delta,
    }));
    setRoster((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? {
              ...u,
              mines: {
                ...u.mines,
                [mineType]: (u.mines[mineType] ?? 0) + delta,
              },
            }
          : u
      )
    );
  };

  if (screen === 'title') {
    return (
      <div className="title-screen">
        <div
          className="title-bg-art"
          style={{ backgroundImage: `url(${titleBg})` }}
        />
        <div className="title-vignette" />

        <div className="title-content">
          <div className="title-badge">
            <Sparkles size={14} /> 1998 金山西山居经典战棋 · 前五关完整高清重制版
          </div>
          <h1 className="game-logo">
            抗日<span>：</span>地雷战
          </h1>
          <p className="game-tagline">
            1942 冀中平阳 · 12位抗日英雄集结 · 六大名雷研制 · 五大战役史诗还原
          </p>

          <div className="title-features">
            <span>
              <Bomb size={15} /> 全五关原版剧情台词
            </span>
            <span>
              <Shield size={15} /> 土/伪/石/铁/蝎/引发雷
            </span>
            <span>
              <Compass size={15} /> 全高清立绘与2.5D战棋
            </span>
          </div>

          <div className="title-actions">
            <button
              className="btn-primary-gold btn-lg"
              onClick={() => handleStartNewGame(0)}
            >
              <Play size={20} /> 从头开始战役（第一关 → 第五关）
            </button>

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
                  seedCampaignAtStage(4);
                  setScreen('camp');
                }}
              >
                <Wrench size={14} /> 直接体验：全配方地雷工坊（备战白洋淀第五关）
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'camp') {
    return (
      <CampWorkshop
        materials={materials}
        mineStock={mineStock}
        unlockedMines={unlockedMines}
        roster={roster}
        nextStageTitle={STAGES[stageIdx]?.name ?? '下一战役'}
        onCraftMine={handleCraftMine}
        onAssignMine={handleAssignMine}
        onStartNextStage={() => {
          setBattleKey((k) => k + 1);
          setScreen('battle');
        }}
      />
    );
  }

  if (screen === 'demo_complete') {
    return (
      <div className="complete-screen">
        <div
          className="title-bg-art"
          style={{ backgroundImage: `url(${titleBg})` }}
        />
        <div className="title-vignette" />
        <div className="complete-card">
          <Award size={48} className="complete-icon" />
          <div className="camp-eyebrow">前五关完整高清版 · 圆满收官</div>
          <h1>白洋淀大捷！平阳游击队威震华北！</h1>
          <p>
            你已率领游击大队长、朱老忠、赵虎、张嘎、李向阳、史更新、兰姑、肖飞、柳忻、李霜泗、张长庚与九爷等 12 位抗日群英，连克平阳首战、赵村工兵战、李村除奸高敬天、施南古道击溃谷寿夫与白洋淀决战松井司令五大经典战役！
          </p>
          <p className="complete-next-note">
            土雷连环、伪装雷诈敌、石雷碎石溅射、铁雷高爆破甲、蝎子雷剧毒持续掉血、引发雷反杀探雷工兵——六大名雷体系已全部就绪！可随时返回主界面任选前五关重复挑战！
          </p>
          <div className="complete-btns">
            <button
              className="btn-primary-gold"
              onClick={() => handleStartNewGame(0)}
            >
              <RotateCcw size={16} /> 重玩第一关
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                sound.playClick();
                setScreen('title');
              }}
            >
              返回主界面（选关重温）
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BattleScreen
      key={`${currentStage.id}-${battleKey}`}
      stage={currentStage}
      carryOverRoster={stageIdx > 0 ? roster : undefined}
      hasNextStage={stageIdx + 1 < STAGES.length}
      onVictory={handleBattleVictory}
      onRestart={() => setBattleKey((k) => k + 1)}
    />
  );
};

export default App;
