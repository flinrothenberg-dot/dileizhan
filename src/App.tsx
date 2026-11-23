import React, { useState } from 'react';
import { Award, Bomb, Compass, Play, RotateCcw, Shield, Sparkles } from 'lucide-react';
import { BattleScreen } from './components/BattleScreen';
import { CampWorkshop } from './components/CampWorkshop';
import { MINES } from './data/mines';
import { INITIAL_HERO_ROSTER, STAGES } from './data/stages';
import { MaterialId, MineType, ScreenMode, Unit } from './types/game';
import { sound } from './utils/sound';

const INITIAL_MATERIALS: Record<MaterialId, number> = {
  clay: 4,
  stone: 4,
  wood: 3,
  nitre: 4,
  sulfur: 2,
  charcoal: 3,
};

const INITIAL_STOCK: Record<MineType, number> = {
  tu_lei: 2,
  weizhuang_lei: 2,
  shi_lei: 1,
};

export const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenMode>('title');
  const [stageIdx, setStageIdx] = useState(0);
  const [battleKey, setBattleKey] = useState(1);

  const [materials, setMaterials] = useState<Record<MaterialId, number>>({
    ...INITIAL_MATERIALS,
  });
  const [mineStock, setMineStock] = useState<Record<MineType, number>>({
    ...INITIAL_STOCK,
  });
  const [roster, setRoster] = useState<Unit[]>(() =>
    (['commander', 'zhulaozhong', 'zhaohu', 'zhangga'] as const).map((k) => ({
      ...INITIAL_HERO_ROSTER[k],
      mines: { ...INITIAL_HERO_ROSTER[k].mines },
      x: 0,
      y: 0,
      acted: false,
      moved: false,
      stunnedTurns: 0,
      alive: true,
      facing: 'right',
    }))
  );

  const currentStage = STAGES[stageIdx];

  const handleStartNewGame = (targetStageIdx = 0) => {
    sound.playClick();
    setStageIdx(targetStageIdx);
    setBattleKey((k) => k + 1);
    setScreen('battle');
  };

  const handleBattleVictory = (survivingHeroes: Unit[]) => {
    // Merge hero progression & add stage material rewards
    setRoster((prev) => {
      const map = new Map(prev.map((u) => [u.id, u]));
      for (const h of survivingHeroes) {
        map.set(h.id, { ...h, hp: h.maxHp, acted: false, moved: false, isCaptive: false });
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

    if (stageIdx + 1 < STAGES.length) {
      setStageIdx(stageIdx + 1);
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
          style={{ backgroundImage: `url('./assets/title-bg.jpg')` }}
        />
        <div className="title-vignette" />

        <div className="title-content">
          <div className="title-badge">
            <Sparkles size={14} /> 1998 金山西山居经典战棋 · 高清 2.5D 重制试玩版
          </div>
          <h1 className="game-logo">
            抗日<span>：</span>地雷战
          </h1>
          <p className="game-tagline">
            1942 冀中敌后 · 造雷工坊 · 连环爆破 · 智斗日军探雷工兵
          </p>

          <div className="title-features">
            <span>
              <Bomb size={15} /> 原版剧情台词还原
            </span>
            <span>
              <Shield size={15} /> 土雷 / 伪装雷 / 石雷 / 连环雷
            </span>
            <span>
              <Compass size={15} /> 2.5D 高清战棋重绘
            </span>
          </div>

          <div className="title-actions">
            <button
              className="btn-primary-gold btn-lg"
              onClick={() => handleStartNewGame(0)}
            >
              <Play size={20} /> 开始战役（第一关：营救朱老忠）
            </button>

            <div className="title-secondary-row">
              <button
                className="btn-ghost"
                onClick={() => {
                  sound.playClick();
                  setStageIdx(1);
                  setScreen('camp');
                }}
              >
                直接体验：地雷工坊整备
              </button>
              <button
                className="btn-ghost"
                onClick={() => handleStartNewGame(1)}
              >
                直接挑战：第二关（赵村工兵战）
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
          style={{ backgroundImage: `url('./assets/title-bg.jpg')` }}
        />
        <div className="title-vignette" />
        <div className="complete-card">
          <Award size={48} className="complete-icon" />
          <div className="camp-eyebrow">高清重制试玩版 · 圆满通关</div>
          <h1>平阳游击队初战告捷！</h1>
          <p>
            你已成功还原通关《抗日：地雷战》前两大战役（营救朱老忠、赵村驰援李向阳），体验了原版土法造雷、连环雷爆破、伪装雷戏耍日军探雷工兵等经典玩法！
          </p>
          <p className="complete-next-note">
            后续还可继续扩充：第三关智取高镇长、蝎子雷/瘴气雷/彻地雷/轰天雷、地道突袭与更多原版战役关卡！
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
              返回主界面
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
      onVictory={handleBattleVictory}
      onRestart={() => setBattleKey((k) => k + 1)}
    />
  );
};

export default App;
