import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bomb,
  Crosshair,
  Flag,
  Footprints,
  Heart,
  RotateCcw,
  Shield,
  SkipForward,
  Sparkles,
  Sword,
  Undo2,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ALL_MINE_TYPES, MINES, TERRAIN_META } from '../data/mines';
import {
  computeAttackDamage,
  findChainMines,
  getAttackableTargets,
  getAttackKind,
  getAttackRangeTiles,
  getHealableAllies,
  getMineableTiles,
  getReachableTiles,
  getTotalMines,
  GridPoint,
  keyOf,
  manhattan,
  reconstructPath,
} from '../engine/tactics';
import {
  ActionMode,
  AttackFx,
  BattlePhase,
  DialogueLine,
  ExplosionFx,
  FloatingEffect,
  MineType,
  PlacedMine,
  StageConfig,
  Unit,
} from '../types/game';
import { sound } from '../utils/sound';
import { BattlefieldMapCanvas } from './BattlefieldMapCanvas';
import { CharacterDetailModal } from './CharacterDetailModal';
import { CharacterPortrait } from './CharacterPortrait';
import { DialogueBox } from './DialogueBox';
import { TacticalTile } from './TacticalTile';

interface BattleScreenProps {
  stage: StageConfig;
  carryOverRoster?: Unit[];
  hasNextStage: boolean;
  onVictory: (survivingHeroes: Unit[]) => void;
  onRestart: () => void;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

let fxSeq = 1;
const nextId = (prefix: string) => `${prefix}_${fxSeq++}`;

function hydrateHeroUnit(u: Unit, carryOverRoster?: Unit[]): Unit {
  if (u.faction === 'player' && carryOverRoster) {
    const saved = carryOverRoster.find((s) => s.id === u.id);
    if (saved) {
      return {
        ...u,
        unitClass: saved.unitClass,
        title: saved.title,
        spriteId: saved.spriteId,
        weaponName: saved.weaponName,
        attackShape: saved.attackShape ?? u.attackShape,
        splashRatio: saved.splashRatio ?? u.splashRatio,
        move: saved.move,
        rangeMax: saved.rangeMax,
        critRate: saved.critRate,
        level: saved.level,
        exp: saved.exp,
        maxHp: saved.maxHp,
        hp: saved.maxHp,
        atk: saved.atk,
        def: saved.def,
        mines: { ...u.mines, ...saved.mines },
        healItems: Math.max(u.healItems, saved.healItems),
      };
    }
  }
  return { ...u, mines: { ...u.mines } };
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  stage,
  carryOverRoster,
  hasNextStage,
  onVictory,
  onRestart,
}) => {
  // Initialize units (merging carry-over stats/mines for Stage 2+)
  const [units, setUnits] = useState<Unit[]>(() =>
    stage.initialUnits.map((u) => hydrateHeroUnit(u, carryOverRoster))
  );

  const [mines, setMines] = useState<PlacedMine[]>([]);
  const [turn, setTurn] = useState(1);
  const [phase, setPhase] = useState<BattlePhase>('dialogue');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>('select');
  const [selectedMineType, setSelectedMineType] = useState<MineType>('tu_lei');
  const [hoveredTile, setHoveredTile] = useState<GridPoint>({ x: 0, y: 0 });
  const [dialogueQueue, setDialogueQueue] = useState<DialogueLine[]>(stage.introDialogues);
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [afterDialoguePhase, setAfterDialoguePhase] = useState<BattlePhase>('player');
  const [battleLog, setBattleLog] = useState<string[]>([
    `【${stage.code}】${stage.name} 打响！`,
  ]);
  const [floats, setFloats] = useState<FloatingEffect[]>([]);
  const [explosions, setExplosions] = useState<ExplosionFx[]>([]);
  const [attackFxs, setAttackFxs] = useState<AttackFx[]>([]);
  const [shaking, setShaking] = useState(false);
  const [chainBanner, setChainBanner] = useState<string | null>(null);
  const [muted, setMuted] = useState(sound.muted);
  const [rescued, setRescued] = useState(false);
  const [reinforcementsSpawned, setReinforcementsSpawned] = useState(false);
  const reinforcementsSpawnedRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [preMovePos, setPreMovePos] = useState<{ unitId: string; x: number; y: number } | null>(null);
  const [detailUnitId, setDetailUnitId] = useState<string | null>(null);

  const unitsRef = useRef(units);
  unitsRef.current = units;
  const minesRef = useRef(mines);
  minesRef.current = mines;

  const addLog = useCallback((msg: string) => {
    setBattleLog((prev) => [msg, ...prev].slice(0, 30));
  }, []);

  const spawnFloat = useCallback(
    (x: number, y: number, text: string, kind: FloatingEffect['kind']) => {
      const id = nextId('fl');
      setFloats((prev) => [...prev, { id, x, y, text, kind }]);
      setTimeout(() => {
        setFloats((prev) => prev.filter((f) => f.id !== id));
      }, 1150);
    },
    []
  );

  const spawnExplosion = useCallback((x: number, y: number, size: ExplosionFx['size']) => {
    const id = nextId('ex');
    setExplosions((prev) => [...prev, { id, x, y, size }]);
    if (size !== 'decoy') {
      setShaking(true);
      setTimeout(() => setShaking(false), 320);
    }
    setTimeout(() => {
      setExplosions((prev) => prev.filter((e) => e.id !== id));
    }, 620);
  }, []);

  const triggerWeaponAttackFX = useCallback(
    (attacker: Unit, target: Unit, isCrit: boolean) => {
      const dist = manhattan(attacker, target);
      const kind = getAttackKind(attacker, dist);
      if (kind === 'dual_pistol') sound.playDualPistol();
      else if (kind === 'blade') sound.playBladeSlash();
      else if (kind === 'mg') sound.playMachineGun();
      else if (kind === 'slingshot') sound.playSlingshot();
      else if (kind === 'heavy_cannon') sound.playCannonShot();
      else sound.playRifleShot();

      if (isCrit) {
        sound.playMaxCritImpact();
        setShaking(true);
        setTimeout(() => setShaking(false), 260);
      }

      const id = nextId('afx');
      setAttackFxs((prev) => [...prev, { id, x: target.x, y: target.y, kind, isCrit }]);
      setTimeout(() => {
        setAttackFxs((prev) => prev.filter((a) => a.id !== id));
      }, 560);
    },
    []
  );

  const openDialogue = useCallback((lines: DialogueLine[], nextPhase: BattlePhase) => {
    setDialogueQueue(lines);
    setDialogueIdx(0);
    setAfterDialoguePhase(nextPhase);
    setPhase('dialogue');
  }, []);

  const selectedUnit = useMemo(
    () => units.find((u) => u.id === selectedUnitId && u.alive) ?? null,
    [units, selectedUnitId]
  );

  const reachData = useMemo(() => {
    if (
      phase !== 'player' ||
      busy ||
      !selectedUnit ||
      selectedUnit.isCaptive ||
      actionMode === 'mine' ||
      actionMode === 'attack'
    ) {
      return { tiles: new Set<string>(), parents: new Map<string, GridPoint | null>() };
    }
    if (selectedUnit.faction === 'player' && (selectedUnit.acted || selectedUnit.moved)) {
      return { tiles: new Set<string>(), parents: new Map<string, GridPoint | null>() };
    }
    return getReachableTiles(selectedUnit, stage.tiles, units);
  }, [phase, busy, selectedUnit, stage.tiles, units, actionMode]);

  const attackRangeSet = useMemo(() => {
    if (
      phase !== 'player' ||
      busy ||
      !selectedUnit ||
      selectedUnit.isCaptive ||
      actionMode === 'mine' ||
      actionMode === 'heal_ally'
    ) {
      return new Set<string>();
    }
    // Always show attack range when inspecting an enemy, or in attack mode, or after moving, or for any active player unit
    if (selectedUnit.faction === 'enemy') {
      return getAttackRangeTiles(selectedUnit, stage.tiles);
    }
    if (!selectedUnit.acted) {
      return getAttackRangeTiles(selectedUnit, stage.tiles);
    }
    return new Set<string>();
  }, [phase, busy, selectedUnit, stage.tiles, actionMode]);

  const healableAllies = useMemo(() => {
    if (
      phase !== 'player' ||
      busy ||
      !selectedUnit ||
      selectedUnit.faction !== 'player' ||
      selectedUnit.acted ||
      !selectedUnit.canHealAlly
    ) {
      return [];
    }
    return getHealableAllies(selectedUnit, units);
  }, [phase, busy, selectedUnit, units]);

  const healableTargetSet = useMemo(
    () => new Set(healableAllies.map((t) => keyOf(t.x, t.y))),
    [healableAllies]
  );

  const attackTargets = useMemo(() => {
    if (
      phase !== 'player' ||
      busy ||
      !selectedUnit ||
      selectedUnit.faction !== 'player' ||
      selectedUnit.acted ||
      selectedUnit.isCaptive ||
      actionMode === 'mine' ||
      actionMode === 'heal_ally'
    ) {
      return [];
    }
    return getAttackableTargets(selectedUnit, units);
  }, [phase, busy, selectedUnit, units, actionMode]);

  const attackTargetSet = useMemo(
    () => new Set(attackTargets.map((t) => keyOf(t.x, t.y))),
    [attackTargets]
  );

  const mineableSet = useMemo(() => {
    if (
      phase !== 'player' ||
      busy ||
      !selectedUnit ||
      selectedUnit.faction !== 'player' ||
      selectedUnit.acted ||
      !selectedUnit.canLayMines ||
      actionMode !== 'mine'
    ) {
      return new Set<string>();
    }
    return getMineableTiles(selectedUnit, stage.tiles, units, mines);
  }, [phase, busy, selectedUnit, stage.tiles, units, mines, actionMode]);

  // Check victory / defeat conditions (safely ignores heroes scheduled as future reinforcements)
  const checkBattleEnd = useCallback(
    (curUnits: Unit[]): 'victory' | 'defeat' | null => {
      const reqIds = stage.requiredHeroIds ?? ['commander'];
      for (const reqId of reqIds) {
        const scheduledLater =
          !reinforcementsSpawnedRef.current &&
          stage.reinforcementUnits?.some((ru) => ru.id === reqId);
        if (scheduledLater) continue;
        const alive = curUnits.some((u) => u.id === reqId && u.alive);
        if (!alive) return 'defeat';
      }

      const enemiesLeft = curUnits.filter((u) => u.faction === 'enemy' && u.alive).length;
      if (enemiesLeft === 0) return 'victory';
      return null;
    },
    [stage.reinforcementUnits, stage.requiredHeroIds]
  );

  const awardExp = useCallback(
    (unitId: string, gained: number) => {
      if (gained <= 0) return;
      setUnits((prev) => {
        const next = prev.map((u) => {
          if (u.id !== unitId || !u.alive) return u;
          let exp = u.exp + gained;
          let level = u.level;
          let maxHp = u.maxHp;
          let hp = u.hp;
          let atk = u.atk;
          let def = u.def;
          let leveled = false;
          while (exp >= 100) {
            exp -= 100;
            level += 1;
            maxHp += 12;
            hp = Math.min(maxHp, hp + 18);
            atk += 4;
            def += 2;
            leveled = true;
          }
          if (leveled) {
            spawnFloat(u.x, u.y, `升级 Lv.${level}!`, 'crit');
            addLog(`★ ${u.name} 升至 Lv.${level}！攻防与生命全面提升！`);
          }
          return { ...u, exp, level, maxHp, hp, atk, def };
        });
        unitsRef.current = next;
        return next;
      });
    },
    [addLog, spawnFloat]
  );

  // Trigger a mine & chain detonation sequence
  const detonateMineAt = useCallback(
    async (originMine: PlacedMine, victimId: string) => {
      const def = MINES[originMine.type];

      if (def.isDecoy) {
        // Decoy mine: stun enemy & remove mine
        sound.playDetectorBeep();
        spawnExplosion(originMine.x, originMine.y, 'decoy');
        spawnFloat(originMine.x, originMine.y, '木头假雷！惊慌!', 'info');
        setMines((prev) =>
          prev.map((m) => (m.id === originMine.id ? { ...m, triggered: true } : m))
        );
        setUnits((prev) =>
          prev.map((u) =>
            u.id === victimId ? { ...u, stunnedTurns: 1, acted: true, moved: true } : u
          )
        );
        const vName = unitsRef.current.find((u) => u.id === victimId)?.name ?? '敌军';
        addLog(`🎭 ${vName} 踩中了小嘎子的【伪装雷】，吓得魂飞魄散停步不前！`);
        await delay(420);
        return;
      }

      const chain = findChainMines(originMine, minesRef.current);
      if (chain.length >= 2) {
        setChainBanner(`连环爆破 ×${chain.length}！`);
        setTimeout(() => setChainBanner(null), 1500);
        addLog(`🔥 触发【连环雷阵 ×${chain.length}】！地动山摇！`);
      }

      for (let i = 0; i < chain.length; i++) {
        const m = chain[i];
        const mDef = MINES[m.type];
        const isLarge =
          m.type === 'shi_lei' ||
          m.type === 'chongtian_pao' ||
          m.type === 'yaokong_lei' ||
          m.type === 'zhangqi_lei' ||
          chain.length >= 2;
        sound.playExplosion(isLarge);
        spawnExplosion(m.x, m.y, isLarge ? 'large' : 'normal');

        setMines((prev) =>
          prev.map((item) => (item.id === m.id ? { ...item, triggered: true } : item))
        );

        // Apply direct + splash + status effects (poison / EMP stun / remote area burst)
        const directDmg = mDef.damage;
        const splashDmg = mDef.splashDamage > 0 ? mDef.splashDamage : chain.length >= 2 ? 22 : 0;
        const splashRadius = mDef.splashRadius ?? 1;
        const poisonTurns = mDef.poisonTurns ?? 0;
        const stunTurns = mDef.stunTurns ?? 0;
        const isRemoteTrigger = victimId === '__remote__';
        let mineExpEarned = 0;

        const nextUnits = unitsRef.current.map((u) => {
          if (!u.alive || u.faction !== 'enemy') return u;
          const dist = manhattan(u, m);
          if (dist === 0) {
            const dmg = directDmg;
            const newHp = Math.max(0, u.hp - dmg);
            mineExpEarned += newHp === 0 ? 65 : 30;
            const nextPoison =
              poisonTurns > 0 && newHp > 0
                ? Math.max(u.poisonedTurns ?? 0, poisonTurns)
                : u.poisonedTurns ?? 0;
            const nextStun =
              stunTurns > 0 && newHp > 0
                ? Math.max(u.stunnedTurns, stunTurns)
                : u.stunnedTurns;
            spawnFloat(
              u.x,
              u.y,
              stunTurns > 0
                ? `⚡ 麻痹 -${dmg}`
                : poisonTurns > 0
                ? `☠ 中毒 -${dmg}`
                : `踩雷 -${dmg}`,
              poisonTurns > 0 ? 'poison' : i > 0 ? 'chain' : 'mine'
            );
            addLog(
              `💥 ${u.name} 遭【${mDef.name}】正面命中受到 ${dmg} 点伤害${
                newHp === 0
                  ? '，当场被炸飞！'
                  : stunTurns > 0
                  ? '，高压麻痹停顿 1 回合！'
                  : poisonTurns > 0
                  ? '，并身中剧毒持续掉血！'
                  : '！'
              }`
            );
            return {
              ...u,
              hp: newHp,
              alive: newHp > 0,
              poisonedTurns: nextPoison,
              stunnedTurns: nextStun,
            };
          } else if (dist > 0 && dist <= splashRadius && (splashDmg > 0 || isRemoteTrigger)) {
            const hitDmg = isRemoteTrigger && dist === 1 ? Math.max(splashDmg, Math.round(directDmg * 0.78)) : splashDmg;
            const newHp = Math.max(0, u.hp - hitDmg);
            mineExpEarned += newHp === 0 ? 45 : 22;
            const nextPoison =
              poisonTurns > 0 && newHp > 0
                ? Math.max(u.poisonedTurns ?? 0, Math.max(1, poisonTurns - 1))
                : u.poisonedTurns ?? 0;
            const nextStun =
              stunTurns > 0 && dist === 1 && newHp > 0
                ? Math.max(u.stunnedTurns, stunTurns)
                : u.stunnedTurns;
            spawnFloat(
              u.x,
              u.y,
              isRemoteTrigger ? `遥控爆破 -${hitDmg}` : poisonTurns > 0 ? `毒雾 -${hitDmg}` : `溅射 -${hitDmg}`,
              poisonTurns > 0 ? 'poison' : 'mine'
            );
            addLog(
              `💥 ${u.name} 遭【${mDef.name}】气浪波及 -${hitDmg}${
                newHp === 0 ? '，阵亡！' : '！'
              }`
            );
            return {
              ...u,
              hp: newHp,
              alive: newHp > 0,
              poisonedTurns: nextPoison,
              stunnedTurns: nextStun,
            };
          }
          return u;
        });

        unitsRef.current = nextUnits;
        setUnits(nextUnits);
        if (m.placerId && mineExpEarned > 0) {
          awardExp(m.placerId, mineExpEarned);
        }
        await delay(260);
      }
    },
    [addLog, awardExp, spawnExplosion, spawnFloat]
  );

  // Check if Stage 1 captive Zhu Laozhong is rescued
  const checkRescue = useCallback(
    (curUnits: Unit[]) => {
      if (rescued || !stage.rescueUnitId) return false;
      const captive = curUnits.find((u) => u.id === stage.rescueUnitId && u.isCaptive);
      if (!captive) return false;

      const nearHero = curUnits.some(
        (u) =>
          u.alive &&
          u.faction === 'player' &&
          !u.isCaptive &&
          manhattan(u, captive) <= 2
      );
      if (nearHero) {
        setRescued(true);
        const updated = curUnits.map((u) =>
          u.id === captive.id
            ? { ...u, isCaptive: false, acted: false, moved: false }
            : u
        );
        unitsRef.current = updated;
        setUnits(updated);
        addLog('★ 成功营救朱老忠！大刀队正式参战！');
        if (stage.rescueDialogues) {
          openDialogue(stage.rescueDialogues, 'player');
          return true;
        }
      }
      return false;
    },
    [addLog, openDialogue, rescued, stage.rescueDialogues, stage.rescueUnitId]
  );

  // Player moves selected unit
  const handleMoveUnit = async (unit: Unit, tx: number, ty: number) => {
    setBusy(true);
    const originX = unit.x;
    const originY = unit.y;
    const path = reconstructPath({ x: tx, y: ty }, reachData.parents);
    sound.playStep();

    for (let i = 1; i < path.length; i++) {
      const step = path[i];
      setUnits((prev) =>
        prev.map((u) =>
          u.id === unit.id
            ? {
                ...u,
                x: step.x,
                y: step.y,
                facing: step.x < u.x ? 'left' : step.x > u.x ? 'right' : u.facing,
              }
            : u
        )
      );
      await delay(95);
    }

    const updated = unitsRef.current.map((u) =>
      u.id === unit.id ? { ...u, x: tx, y: ty, moved: true } : u
    );
    unitsRef.current = updated;
    setUnits(updated);
    setActionMode('attack');
    setBusy(false);

    const triggeredRescue = checkRescue(updated);
    if (!triggeredRescue) {
      setPreMovePos({ unitId: unit.id, x: originX, y: originY });
    } else {
      setPreMovePos(null);
    }
  };

  // Undo uncommitted move (返回原位)
  const handleUndoMove = useCallback(() => {
    if (!preMovePos || busy || phase !== 'player') return;
    sound.playClick();
    const restored = unitsRef.current.map((u) =>
      u.id === preMovePos.unitId
        ? { ...u, x: preMovePos.x, y: preMovePos.y, moved: false }
        : u
    );
    unitsRef.current = restored;
    setUnits(restored);
    setPreMovePos(null);
    setActionMode('select');
  }, [preMovePos, busy, phase]);

  // ESC key to cancel mode or undo move
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (detailUnitId) {
        setDetailUnitId(null);
        return;
      }
      if (phase !== 'player' || busy) return;
      if (actionMode === 'mine' || actionMode === 'heal_ally') {
        sound.playClick();
        setActionMode(preMovePos ? 'attack' : 'select');
      } else if (preMovePos) {
        handleUndoMove();
      } else if (selectedUnitId) {
        setSelectedUnitId(null);
        setActionMode('select');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actionMode, busy, detailUnitId, handleUndoMove, phase, preMovePos, selectedUnitId]);

  // Player attacks an enemy (supports splashRatio cleave/blast for promoted & heavy classes!)
  const handleAttack = async (attacker: Unit, target: Unit) => {
    setBusy(true);
    const terrain = stage.tiles[target.y][target.x];
    const { damage, isCrit } = computeAttackDamage(attacker, target, terrain);
    const newHp = Math.max(0, target.hp - damage);

    triggerWeaponAttackFX(attacker, target, isCrit);

    spawnFloat(
      target.x,
      target.y,
      isCrit ? `★ 暴击重伤 -${damage}! ★` : `-${damage}`,
      isCrit ? 'crit' : 'damage'
    );
    addLog(
      `⚔ ${attacker.name} 使用【${attacker.weaponName}】攻击 ${target.name}，造成 ${damage} 点伤害${
        isCrit ? '（最高暴击特效！）' : ''
      }${newHp === 0 ? '，将其击毙！' : ''}`
    );

    const splashMap = new Map<string, number>();
    let splashKills = 0;
    if (attacker.splashRatio && attacker.splashRatio > 0) {
      for (const other of unitsRef.current) {
        if (
          other.alive &&
          other.faction === 'enemy' &&
          other.id !== target.id &&
          manhattan(other, target) === 1
        ) {
          const sDmg = Math.max(8, Math.round(damage * attacker.splashRatio));
          splashMap.set(other.id, sDmg);
          const sHp = Math.max(0, other.hp - sDmg);
          if (sHp === 0) splashKills += 1;
          spawnFloat(other.x, other.y, `波及 -${sDmg}`, 'mine');
          addLog(
            `💥 ${attacker.name} 攻击余威波及 ${other.name} -${sDmg}${sHp === 0 ? '，顺势击毙！' : '！'}`
          );
        }
      }
    }

    const updated = unitsRef.current.map((u) => {
      if (u.id === target.id) return { ...u, hp: newHp, alive: newHp > 0 };
      const sDmg = splashMap.get(u.id);
      if (sDmg !== undefined) {
        const sHp = Math.max(0, u.hp - sDmg);
        return { ...u, hp: sHp, alive: sHp > 0 };
      }
      if (u.id === attacker.id) {
        return {
          ...u,
          acted: true,
          moved: true,
          facing: target.x < u.x ? 'left' : target.x > u.x ? 'right' : u.facing,
        };
      }
      return u;
    });
    unitsRef.current = updated;
    setUnits(updated);

    await delay(280);
    awardExp(attacker.id, (newHp === 0 ? 75 : 35) + splashKills * 35);

    const end = checkBattleEnd(updated);
    setBusy(false);
    setPreMovePos(null);
    setActionMode('select');
    setSelectedUnitId(null);

    if (end === 'victory') {
      sound.playVictory();
      openDialogue(stage.victoryDialogues, 'victory');
    } else if (end === 'defeat') {
      setPhase('defeat');
    }
  };

  // Player lays a mine
  const handleLayMine = (unit: Unit, tx: number, ty: number) => {
    const count = unit.mines[selectedMineType] ?? 0;
    if (count <= 0) return;

    sound.playLayMine();
    const newMine: PlacedMine = {
      id: nextId('mine'),
      type: selectedMineType,
      x: tx,
      y: ty,
      owner: 'player',
      placerId: unit.id,
      detected: false,
    };
    const nextMines = [...minesRef.current, newMine];
    minesRef.current = nextMines;
    setMines(nextMines);

    const updatedUnits = unitsRef.current.map((u) =>
      u.id === unit.id
        ? {
            ...u,
            acted: true,
            moved: true,
            mines: { ...u.mines, [selectedMineType]: count - 1 },
          }
        : u
    );
    unitsRef.current = updatedUnits;
    setUnits(updatedUnits);

    const hasAdjacentMine = nextMines.some(
      (m) =>
        !m.triggered &&
        m.id !== newMine.id &&
        m.type !== 'weizhuang_lei' &&
        selectedMineType !== 'weizhuang_lei' &&
        manhattan(m, newMine) === 1
    );

    spawnFloat(
      tx,
      ty,
      hasAdjacentMine ? '连环雷已就位!' : `埋设${MINES[selectedMineType].name}`,
      'info'
    );
    addLog(
      `💣 ${unit.name} 在 (${tx + 1},${ty + 1}) 埋下了一颗【${MINES[selectedMineType].name}】${
        hasAdjacentMine ? '（已与邻雷构成连环雷阵！）' : ''
      }`
    );
    awardExp(unit.id, 20);
    setPreMovePos(null);
    setActionMode('select');
    setSelectedUnitId(null);
  };

  // Player uses 小米 heal item
  const handleHealSelf = (unit: Unit) => {
    if (unit.healItems <= 0 || unit.hp >= unit.maxHp) return;
    sound.playHeal();
    const heal = Math.min(42, unit.maxHp - unit.hp);
    spawnFloat(unit.x, unit.y, `小米 +${heal}`, 'heal');
    addLog(`🌾 ${unit.name} 食用小米恢复了 ${heal} 点生命值。`);
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unit.id
          ? { ...u, hp: u.hp + heal, healItems: u.healItems - 1, acted: true, moved: true }
          : u
      )
    );
    setPreMovePos(null);
    setActionMode('select');
    setSelectedUnitId(null);
  };

  // Langu field-medic healing an injured teammate (upgraded for 娘子军)
  const handleHealAlly = (medic: Unit, ally: Unit) => {
    sound.playHeal();
    const maxHeal = medic.unitClass === '娘子军' ? 66 : 48;
    const healAmt = Math.min(maxHeal, ally.maxHp - ally.hp);
    spawnFloat(ally.x, ally.y, `战地救护 +${healAmt}`, 'heal');
    addLog(`✚ ${medic.name} 为 ${ally.name} 施展战地救护，恢复 ${healAmt} 点生命！`);
    const updated = unitsRef.current.map((u) => {
      if (u.id === ally.id) return { ...u, hp: u.hp + healAmt };
      if (u.id === medic.id) return { ...u, acted: true, moved: true };
      return u;
    });
    unitsRef.current = updated;
    setUnits(updated);
    awardExp(medic.id, 35);
    setPreMovePos(null);
    setActionMode('select');
    setSelectedUnitId(null);
  };

  const handleWaitUnit = (unit: Unit) => {
    sound.playClick();
    setUnits((prev) =>
      prev.map((u) => (u.id === unit.id ? { ...u, acted: true, moved: true } : u))
    );
    setPreMovePos(null);
    setActionMode('select');
    setSelectedUnitId(null);
  };

  // Run Enemy AI Turn
  const runEnemyTurn = useCallback(async () => {
    setPhase('enemy');
    setSelectedUnitId(null);
    setActionMode('select');
    setBusy(true);
    addLog(`--- 第 ${turn} 回合 · 日伪军行动 ---`);
    await delay(360);

    const enemyIds = unitsRef.current
      .filter((u) => u.faction === 'enemy' && u.alive)
      .map((u) => u.id);

    for (const eid of enemyIds) {
      let enemy = unitsRef.current.find((u) => u.id === eid && u.alive);
      if (!enemy) continue;

      // Poison tick before action (蝎子雷 / 瘴气雷)
      if ((enemy.poisonedTurns ?? 0) > 0) {
        const pDmg = 20;
        const afterHp = Math.max(0, enemy.hp - pDmg);
        spawnFloat(enemy.x, enemy.y, `雷毒 -${pDmg}`, 'poison');
        addLog(
          `☠ ${enemy.name} 雷毒发作失去 ${pDmg} 点生命${
            afterHp === 0 ? '，毒发身亡！' : '！'
          }`
        );
        const poisonedUnits = unitsRef.current.map((u) =>
          u.id === eid
            ? {
                ...u,
                hp: afterHp,
                alive: afterHp > 0,
                poisonedTurns: Math.max(0, (u.poisonedTurns ?? 1) - 1),
              }
            : u
        );
        unitsRef.current = poisonedUnits;
        setUnits(poisonedUnits);
        await delay(300);
        if (afterHp === 0) {
          if (checkBattleEnd(unitsRef.current) === 'victory') {
            setBusy(false);
            sound.playVictory();
            openDialogue(stage.victoryDialogues, 'victory');
            return;
          }
          continue;
        }
        enemy = unitsRef.current.find((u) => u.id === eid && u.alive);
        if (!enemy) continue;
      }

      // Check stun from decoy / magnetic EMP mine
      if (enemy.stunnedTurns > 0) {
        spawnFloat(enemy.x, enemy.y, '麻痹停顿...', 'info');
        addLog(`😵 ${enemy.name} 被雷威震慑/麻痹，本回合无法行动！`);
        const decStun = unitsRef.current.map((u) =>
          u.id === eid ? { ...u, stunnedTurns: u.stunnedTurns - 1 } : u
        );
        unitsRef.current = decStun;
        setUnits(decStun);
        await delay(320);
        continue;
      }

      // Sapper Mine Detection Scan (radius 2; ignores stealth yaokong_lei!)
      if (enemy.isSapper) {
        const spotted = minesRef.current.filter(
          (m) =>
            !m.triggered &&
            !m.detected &&
            !MINES[m.type].stealthToSapper &&
            manhattan(enemy, m) <= 2
        );
        if (spotted.length > 0) {
          sound.playDetectorBeep();
          const spottedIds = new Set(spotted.map((s) => s.id));
          const nextMines = minesRef.current.map((m) =>
            spottedIds.has(m.id) ? { ...m, detected: true } : m
          );
          minesRef.current = nextMines;
          setMines(nextMines);
          spawnFloat(enemy.x, enemy.y, '发现地雷!', 'info');
          addLog(`📡 ${enemy.name} 启动探雷器，发现了 ${spotted.length} 处埋雷点！`);
          await delay(360);
        }

        // If adjacent to a detected mine, try to defuse — triggers anti-sapper 【引发雷】!
        const adjMine = minesRef.current.find(
          (m) => !m.triggered && m.detected && manhattan(enemy, m) === 1
        );
        if (adjMine) {
          if (MINES[adjMine.type].antiSapper) {
            addLog(`💥 ${enemy.name} 试图拆除九爷的【引发雷】，不料当场触发防排机关引爆！`);
            await detonateMineAt(adjMine, enemy.id);
            if (checkBattleEnd(unitsRef.current) === 'victory') {
              setBusy(false);
              sound.playVictory();
              openDialogue(stage.victoryDialogues, 'victory');
              return;
            }
            await delay(240);
            continue;
          }
          sound.playClick();
          const nextMines = minesRef.current.map((m) =>
            m.id === adjMine.id ? { ...m, triggered: true } : m
          );
          minesRef.current = nextMines;
          setMines(nextMines);
          const isDecoy = adjMine.type === 'weizhuang_lei';
          spawnFloat(
            adjMine.x,
            adjMine.y,
            isDecoy ? '竟然是木头!' : '排雷成功!',
            'info'
          );
          addLog(
            isDecoy
              ? `😂 ${enemy.name} 费劲扒开地雷，发现竟然是小嘎子的木头【伪装雷】，白忙活一回合！`
              : `⚠ ${enemy.name} 成功排除了我军的【${MINES[adjMine.type].name}】！`
          );
          await delay(420);
          continue;
        }
      }

      // Find nearest active player hero
      const players = unitsRef.current.filter(
        (u) => u.faction === 'player' && u.alive && !u.isCaptive
      );
      if (players.length === 0) break;

      const targetHero = players.reduce((best, cur) =>
        manhattan(enemy, cur) < manhattan(enemy, best) ? cur : best
      );

      // Compute reachable tiles and pick best destination
      const reach = getReachableTiles(enemy, stage.tiles, unitsRef.current);

      // If sapper sees a detected mine, move adjacent to it
      let desiredTarget: GridPoint = targetHero;
      if (enemy.isSapper) {
        const detMine = minesRef.current.find((m) => !m.triggered && m.detected);
        if (detMine) desiredTarget = detMine;
      }

      let bestTile: GridPoint = { x: enemy.x, y: enemy.y };
      let bestScore = -9999;

      const candidates: GridPoint[] = [{ x: enemy.x, y: enemy.y }];
      reach.tiles.forEach((k) => {
        const [rx, ry] = k.split(',').map(Number);
        candidates.push({ x: rx, y: ry });
      });

      for (const c of candidates) {
        // Sappers avoid stepping directly onto detected mines
        if (
          enemy.isSapper &&
          minesRef.current.some((m) => !m.triggered && m.detected && m.x === c.x && m.y === c.y)
        ) {
          continue;
        }
        const distToGoal = manhattan(c, desiredTarget);
        const canAttackFromHere =
          manhattan(c, targetHero) >= enemy.rangeMin &&
          manhattan(c, targetHero) <= enemy.rangeMax;
        const score = -distToGoal * 10 + (canAttackFromHere ? 25 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestTile = c;
        }
      }

      // Walk step-by-step along path, checking for mines at EVERY step!
      if (bestTile.x !== enemy.x || bestTile.y !== enemy.y) {
        const path = reconstructPath(bestTile, reach.parents);
        sound.playStep();
        let interruptedByMine = false;

        for (let i = 1; i < path.length; i++) {
          const step = path[i];
          const movedUnits = unitsRef.current.map((u) =>
            u.id === eid ? { ...u, x: step.x, y: step.y } : u
          );
          unitsRef.current = movedUnits;
          setUnits(movedUnits);
          await delay(110);

          const steppedMine = minesRef.current.find(
            (m) => !m.triggered && m.x === step.x && m.y === step.y
          );
          if (steppedMine) {
            await detonateMineAt(steppedMine, eid);
            interruptedByMine = true;
            break;
          }
        }

        const endAfterMine = checkBattleEnd(unitsRef.current);
        if (endAfterMine === 'victory') {
          setBusy(false);
          sound.playVictory();
          openDialogue(stage.victoryDialogues, 'victory');
          return;
        }

        const stillAlive = unitsRef.current.find((u) => u.id === eid && u.alive);
        if (!stillAlive || interruptedByMine) {
          await delay(180);
          continue;
        }
      }

      // Attack if a player hero is in range
      const updatedEnemy = unitsRef.current.find((u) => u.id === eid && u.alive);
      if (!updatedEnemy) continue;

      const inRangeHeroes = getAttackableTargets(updatedEnemy, unitsRef.current);
      if (inRangeHeroes.length > 0) {
        const victim = inRangeHeroes.reduce((a, b) => (a.hp < b.hp ? a : b));
        const terrain = stage.tiles[victim.y][victim.x];
        const { damage, isCrit } = computeAttackDamage(updatedEnemy, victim, terrain);
        const newHp = Math.max(0, victim.hp - damage);

        triggerWeaponAttackFX(updatedEnemy, victim, isCrit);

        spawnFloat(
          victim.x,
          victim.y,
          isCrit ? `★ 重击 -${damage}! ★` : `-${damage}`,
          isCrit ? 'crit' : 'damage'
        );
        addLog(
          `🔥 ${updatedEnemy.name} 使用${updatedEnemy.weaponName}攻击 ${victim.name}，造成 ${damage} 点伤害${
            newHp === 0 ? '，我军人员阵亡！' : '！'
          }`
        );

        const afterAtk = unitsRef.current.map((u) => {
          if (u.id === victim.id) return { ...u, hp: newHp, alive: newHp > 0 };
          if (u.id === updatedEnemy.id) {
            return {
              ...u,
              facing: victim.x < u.x ? 'left' : victim.x > u.x ? 'right' : u.facing,
            };
          }
          return u;
        });
        unitsRef.current = afterAtk;
        setUnits(afterAtk);
        await delay(340);

        const endState = checkBattleEnd(afterAtk);
        if (endState === 'defeat') {
          setBusy(false);
          setPhase('defeat');
          return;
        }
      }
    }

    // Start next Player Turn
    const nextTurn = turn + 1;
    setTurn(nextTurn);

    let refreshed = unitsRef.current.map((u) => ({
      ...u,
      acted: u.isCaptive ? true : false,
      moved: u.isCaptive ? true : false,
    }));

    // Check Stage Reinforcements
    if (
      stage.reinforcementTurn === nextTurn &&
      !reinforcementsSpawned &&
      stage.reinforcementUnits
    ) {
      setReinforcementsSpawned(true);
      reinforcementsSpawnedRef.current = true;
      const extras = stage.reinforcementUnits.map((ru) =>
        hydrateHeroUnit(ru, carryOverRoster)
      );
      refreshed = [...refreshed, ...extras];
      unitsRef.current = refreshed;
      setUnits(refreshed);
      setBusy(false);
      if (stage.reinforcementDialogues) {
        openDialogue(stage.reinforcementDialogues, 'player');
        return;
      }
    } else {
      unitsRef.current = refreshed;
      setUnits(refreshed);
    }

    setBusy(false);
    setPhase('player');
    addLog(`=== 第 ${nextTurn} 回合 · 我军行动 ===`);
  }, [
    addLog,
    carryOverRoster,
    checkBattleEnd,
    detonateMineAt,
    openDialogue,
    reinforcementsSpawned,
    spawnFloat,
    stage.reinforcementDialogues,
    stage.reinforcementTurn,
    stage.reinforcementUnits,
    stage.tiles,
    stage.victoryDialogues,
    turn,
  ]);

  const handleEndPlayerTurn = () => {
    if (phase !== 'player' || busy) return;
    sound.playClick();
    setPreMovePos(null);
    runEnemyTurn();
  };

  // Auto-prompt end turn? No, keep manual control so player can inspect mines, but show a glowing button when all heroes have acted
  const allPlayersActed = useMemo(() => {
    const activeHeroes = units.filter(
      (u) => u.faction === 'player' && u.alive && !u.isCaptive
    );
    return activeHeroes.length > 0 && activeHeroes.every((u) => u.acted);
  }, [units]);

  const handleTriggerRemoteMines = async (targetMine?: PlacedMine) => {
    if (phase !== 'player' || busy) return;
    const remotes = targetMine
      ? [targetMine]
      : minesRef.current.filter((m) => !m.triggered && MINES[m.type].remoteDetonate);
    if (remotes.length === 0) return;

    setBusy(true);
    sound.playDetectorBeep();
    addLog(`📡 启动美式无线电引信，主动引爆 ${remotes.length} 枚【遥控雷】！`);
    for (const rm of remotes) {
      if (minesRef.current.some((m) => m.id === rm.id && !m.triggered)) {
        await detonateMineAt(rm, '__remote__');
      }
    }
    const end = checkBattleEnd(unitsRef.current);
    setBusy(false);
    if (end === 'victory') {
      sound.playVictory();
      openDialogue(stage.victoryDialogues, 'victory');
    } else if (end === 'defeat') {
      setPhase('defeat');
    }
  };

  // Tile click handler
  const handleTileClick = (x: number, y: number) => {
    setHoveredTile({ x, y });
    if (phase !== 'player' || busy) return;
    const k = keyOf(x, y);
    const clickedUnit = units.find((u) => u.alive && u.x === x && u.y === y);
    const clickedMine = activeMineMap.get(k);

    // 1. Mine placement mode
    if (actionMode === 'mine' && selectedUnit && mineableSet.has(k)) {
      handleLayMine(selectedUnit, x, y);
      return;
    }

    // 1b. Remote mine click-to-detonate when clicking placed yaokong_lei (non-move collision)
    if (
      clickedMine &&
      MINES[clickedMine.type].remoteDetonate &&
      actionMode !== 'mine' &&
      !clickedUnit &&
      !reachData.tiles.has(k)
    ) {
      handleTriggerRemoteMines(clickedMine);
      return;
    }

    // 1b. Medic ally heal mode
    if (
      actionMode === 'heal_ally' &&
      selectedUnit &&
      healableTargetSet.has(k) &&
      clickedUnit &&
      clickedUnit.faction === 'player'
    ) {
      handleHealAlly(selectedUnit, clickedUnit);
      return;
    }

    // 2. Attack an enemy in range
    if (selectedUnit && attackTargetSet.has(k) && clickedUnit && clickedUnit.faction === 'enemy') {
      handleAttack(selectedUnit, clickedUnit);
      return;
    }

    // 3. Move to reachable tile (only for player units!)
    if (
      selectedUnit &&
      selectedUnit.faction === 'player' &&
      reachData.tiles.has(k) &&
      !clickedUnit
    ) {
      handleMoveUnit(selectedUnit, x, y);
      return;
    }

    // 4. Select another unit (if previous unit had an uncommitted move, restore it first)
    if (clickedUnit) {
      sound.playClick();
      if (preMovePos && preMovePos.unitId !== clickedUnit.id) {
        const restored = unitsRef.current.map((u) =>
          u.id === preMovePos.unitId
            ? { ...u, x: preMovePos.x, y: preMovePos.y, moved: false }
            : u
        );
        unitsRef.current = restored;
        setUnits(restored);
        setPreMovePos(null);
      }
      setSelectedUnitId(clickedUnit.id);
      setActionMode('select');
      // Auto-pick first available mine type for this unit
      if (clickedUnit.canLayMines) {
        const firstAvail = ALL_MINE_TYPES.find((m) => (clickedUnit.mines[m] ?? 0) > 0);
        if (firstAvail) setSelectedMineType(firstAvail);
      }
      return;
    }

    if (preMovePos) {
      handleUndoMove();
      return;
    }
    setSelectedUnitId(null);
    setActionMode('select');
  };

  const handleTileContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (phase !== 'player' || busy) return;
    if (actionMode === 'mine' || actionMode === 'heal_ally') {
      sound.playClick();
      setActionMode(preMovePos ? 'attack' : 'select');
    } else if (preMovePos) {
      handleUndoMove();
    } else if (selectedUnitId) {
      sound.playClick();
      setSelectedUnitId(null);
      setActionMode('select');
    }
  };

  const handleDialogueNext = () => {
    sound.playClick();
    if (dialogueIdx + 1 < dialogueQueue.length) {
      setDialogueIdx(dialogueIdx + 1);
    } else {
      setPhase(afterDialoguePhase);
    }
  };

  const handleDialogueSkip = () => {
    sound.playClick();
    setPhase(afterDialoguePhase);
  };

  // Precompute chain links between adjacent non-decoy mines
  const activeMineMap = useMemo(() => {
    const map = new Map<string, PlacedMine>();
    for (const m of mines) {
      if (!m.triggered) map.set(keyOf(m.x, m.y), m);
    }
    return map;
  }, [mines]);

  const activeRemoteMines = useMemo(
    () => mines.filter((m) => !m.triggered && MINES[m.type].remoteDetonate),
    [mines]
  );

  const enemyCount = units.filter((u) => u.faction === 'enemy' && u.alive).length;
  const hoveredTerrain = TERRAIN_META[stage.tiles[hoveredTile.y]?.[hoveredTile.x] ?? 'grass'];

  useEffect(() => {
    // Select first active player hero automatically once intro finishes
    if (phase === 'player' && !selectedUnitId && turn === 1) {
      const firstHero = units.find((u) => u.faction === 'player' && u.alive && !u.isCaptive);
      if (firstHero) {
        setSelectedUnitId(firstHero.id);
        const firstMine = ALL_MINE_TYPES.find((m) => (firstHero.mines[m] ?? 0) > 0);
        if (firstMine) setSelectedMineType(firstMine);
      }
    }
  }, [phase, selectedUnitId, turn, units]);

  return (
    <div className="battle-screen">
      {/* Top HUD Bar */}
      <header className="battle-topbar">
        <div className="topbar-left">
          <span className="stage-pill">{stage.code}</span>
          <div className="stage-titles">
            <h1>{stage.name}</h1>
            <span>{stage.location} · {stage.objective}</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="hud-chip">
            <span>第 {turn} 回合</span>
          </div>
          <div className={`hud-chip phase-chip phase-${phase}`}>
            {phase === 'player'
              ? '我军回合'
              : phase === 'enemy'
              ? '敌军行动中...'
              : phase === 'dialogue'
              ? '剧情演进'
              : phase === 'victory'
              ? '战役胜利'
              : '任务失败'}
          </div>
          <div className="hud-chip enemy-chip">
            剩余敌军：{enemyCount}
          </div>
          {activeRemoteMines.length > 0 && (
            <button
              className="btn-end-turn pulse-gold"
              disabled={phase !== 'player' || busy}
              title="引爆所有已埋设的遥控雷（也可直接点击雷格）"
              onClick={() => handleTriggerRemoteMines()}
            >
              <Sparkles size={15} /> 遥控引爆 ({activeRemoteMines.length})
            </button>
          )}
          <button
            className="icon-btn"
            title={muted ? '开启音效' : '静音'}
            onClick={() => {
              sound.muted = !muted;
              setMuted(!muted);
            }}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button className="icon-btn" title="重开本关" onClick={onRestart}>
            <RotateCcw size={16} />
          </button>
          <button
            className={`btn-end-turn ${allPlayersActed ? 'pulse-gold' : ''}`}
            disabled={phase !== 'player' || busy}
            onClick={handleEndPlayerTurn}
          >
            <SkipForward size={16} /> 结束回合
          </button>
        </div>
      </header>

      {/* Main Battlefield + Tactical Sidebar */}
      <div className="battle-body">
        <div className={`board-stage ${shaking ? 'board-shake' : ''}`}>
          {chainBanner && <div className="chain-banner">{chainBanner}</div>}

          <div className="tactical-board-wrapper">
            <BattlefieldMapCanvas
              tiles={stage.tiles}
              width={stage.width}
              height={stage.height}
            />
            <div
              className="tactical-grid"
              style={{
                gridTemplateColumns: `repeat(${stage.width}, minmax(0, 1fr))`,
              }}
            >
            {stage.tiles.map((row, y) =>
              row.map((terrain, x) => {
                const k = keyOf(x, y);
                const unit = units.find((u) => u.alive && u.x === x && u.y === y);
                const mine = activeMineMap.get(k);
                const rightMine = activeMineMap.get(keyOf(x + 1, y));
                const downMine = activeMineMap.get(keyOf(x, y + 1));

                const hasChainLinkRight =
                  !!mine &&
                  !!rightMine &&
                  mine.type !== 'weizhuang_lei' &&
                  rightMine.type !== 'weizhuang_lei';
                const hasChainLinkDown =
                  !!mine &&
                  !!downMine &&
                  mine.type !== 'weizhuang_lei' &&
                  downMine.type !== 'weizhuang_lei';

                return (
                  <TacticalTile
                    key={k}
                    x={x}
                    y={y}
                    terrain={terrain}
                    unit={unit}
                    mine={mine}
                    isSelected={!!selectedUnit && selectedUnit.x === x && selectedUnit.y === y}
                    isReachable={reachData.tiles.has(k)}
                    isAttackRange={attackRangeSet.has(k)}
                    isAttackable={attackTargetSet.has(k)}
                    isHealable={actionMode === 'heal_ally' && healableTargetSet.has(k)}
                    isMineable={mineableSet.has(k)}
                    isHovered={hoveredTile.x === x && hoveredTile.y === y}
                    hasChainLinkRight={hasChainLinkRight}
                    hasChainLinkDown={hasChainLinkDown}
                    explosions={explosions.filter((e) => e.x === x && e.y === y)}
                    attackFxs={attackFxs.filter((a) => a.x === x && a.y === y)}
                    floats={floats.filter((f) => f.x === x && f.y === y)}
                    onClick={() => handleTileClick(x, y)}
                    onDoubleClick={() => {
                      if (unit) {
                        sound.playClick();
                        setDetailUnitId(unit.id);
                      }
                    }}
                    onContextMenu={handleTileContextMenu}
                    onHover={() => setHoveredTile({ x, y })}
                  />
                );
              })
            )}
            </div>
          </div>
        </div>

        {/* Right Tactical Command Panel */}
        <aside className="tactical-sidebar">
          {/* Selected Unit Inspector */}
          {selectedUnit ? (
            <div className={`unit-card card-${selectedUnit.faction}`}>
              <div className="unit-card-top">
                <div
                  className="unit-card-portrait clickable-portrait"
                  title="点击查看完整个人属性面板"
                  onClick={() => {
                    sound.playClick();
                    setDetailUnitId(selectedUnit.id);
                  }}
                >
                  <CharacterPortrait
                    portraitId={selectedUnit.portraitId}
                    alt={selectedUnit.name}
                  />
                </div>
                <div className="unit-card-meta">
                  <div className="unit-card-title-row">
                    <h2>{selectedUnit.name}</h2>
                    <span className="class-badge">{selectedUnit.unitClass}</span>
                  </div>
                  <div className="unit-card-sub">
                    Lv.{selectedUnit.level} · {selectedUnit.weaponName}
                  </div>
                  <div className="hp-bar-lg">
                    <div
                      className="hp-bar-lg-fill"
                      style={{
                        width: `${(selectedUnit.hp / selectedUnit.maxHp) * 100}%`,
                      }}
                    />
                    <span>
                      HP {selectedUnit.hp} / {selectedUnit.maxHp}
                    </span>
                  </div>
                  <div className="mini-stats">
                    <span>攻击 {selectedUnit.atk}</span>
                    <span>防御 {selectedUnit.def}</span>
                    <span>移动 {selectedUnit.move}</span>
                    <span>射程 {selectedUnit.rangeMin}-{selectedUnit.rangeMax}</span>
                  </div>
                </div>
              </div>

              <button
                className="btn-profile-open"
                onClick={() => {
                  sound.playClick();
                  setDetailUnitId(selectedUnit.id);
                }}
              >
                <UserRound size={14} /> 查看个人属性面板（双击角色亦可打开）
              </button>

              {selectedUnit.isSapper && (
                <div className="unit-special-note enemy-note">
                  📡 敌军探雷工兵：每回合自动侦测 2 格内地雷并尝试拆除！
                </div>
              )}
              {selectedUnit.isCaptive && (
                <div className="unit-special-note ally-note">
                  ⛓ 被伪军看押中！我军单位靠近至 2 格内即可将其救出！
                </div>
              )}

              {/* Player Unit Command Actions */}
              {selectedUnit.faction === 'player' &&
                !selectedUnit.isCaptive &&
                phase === 'player' &&
                !selectedUnit.acted && (
                  <div className="action-panel">
                    {/* Prominent Undo Move Button right after moving */}
                    {preMovePos && preMovePos.unitId === selectedUnit.id && (
                      <button
                        className="act-btn undo-btn"
                        onClick={handleUndoMove}
                      >
                        <Undo2 size={15} /> 返回原位（右键 / ESC 撤销移动）
                      </button>
                    )}

                    <div className="action-btn-row">
                      {!selectedUnit.moved ? (
                        <button
                          className={`act-btn ${actionMode === 'select' ? 'active' : ''}`}
                          onClick={() => {
                            sound.playClick();
                            setActionMode('select');
                          }}
                        >
                          <Footprints size={15} /> 移动
                        </button>
                      ) : (
                        <button
                          className={`act-btn ${actionMode === 'attack' ? 'active' : ''}`}
                          onClick={() => {
                            sound.playClick();
                            setActionMode('attack');
                          }}
                        >
                          <Sword size={15} /> 攻击 ({attackTargets.length})
                        </button>
                      )}

                      {!selectedUnit.moved && (
                        <button
                          className={`act-btn ${actionMode === 'attack' ? 'active' : ''}`}
                          onClick={() => {
                            sound.playClick();
                            setActionMode(actionMode === 'attack' ? 'select' : 'attack');
                          }}
                        >
                          <Sword size={15} /> 攻击 ({attackTargets.length})
                        </button>
                      )}

                      {selectedUnit.moved && selectedUnit.canLayMines && (
                        <button
                          className={`act-btn mine-btn ${actionMode === 'mine' ? 'active' : ''}`}
                          disabled={getTotalMines(selectedUnit) <= 0}
                          onClick={() => {
                            sound.playClick();
                            const nextMode = actionMode === 'mine' ? 'attack' : 'mine';
                            if (nextMode === 'mine') {
                              const firstAvail = ALL_MINE_TYPES.find(
                                (m) => (selectedUnit.mines[m] ?? 0) > 0
                              );
                              if (firstAvail) setSelectedMineType(firstAvail);
                            }
                            setActionMode(nextMode);
                          }}
                        >
                          <Bomb size={15} /> 埋设地雷 ({getTotalMines(selectedUnit)})
                        </button>
                      )}
                    </div>

                    {!selectedUnit.moved && selectedUnit.canLayMines && (
                      <button
                        className={`act-btn mine-btn ${actionMode === 'mine' ? 'active' : ''}`}
                        disabled={getTotalMines(selectedUnit) <= 0}
                        onClick={() => {
                          sound.playClick();
                          const nextMode = actionMode === 'mine' ? 'select' : 'mine';
                          if (nextMode === 'mine') {
                            const firstAvail = ALL_MINE_TYPES.find(
                              (m) => (selectedUnit.mines[m] ?? 0) > 0
                            );
                            if (firstAvail) setSelectedMineType(firstAvail);
                          }
                          setActionMode(nextMode);
                        }}
                      >
                        <Bomb size={15} /> 埋设地雷（剩余 {getTotalMines(selectedUnit)} 颗）
                      </button>
                    )}

                    {/* Langu Field Medic Ally Healing */}
                    {selectedUnit.canHealAlly && (
                      <button
                        className={`act-btn heal-ally-btn ${actionMode === 'heal_ally' ? 'active' : ''}`}
                        disabled={healableAllies.length === 0}
                        onClick={() => {
                          sound.playClick();
                          setActionMode(
                            actionMode === 'heal_ally'
                              ? preMovePos
                                ? 'attack'
                                : 'select'
                              : 'heal_ally'
                          );
                        }}
                      >
                        <Heart size={15} /> 战地救护队友 ({healableAllies.length})
                      </button>
                    )}

                    {/* Mine Type Picker when Laying Mines */}
                    {actionMode === 'mine' && selectedUnit.canLayMines && (
                      <div className="mine-picker">
                        <div className="mine-picker-label">选择地雷种类（点击高亮格埋设）：</div>
                        <div className="mine-picker-btns">
                          {ALL_MINE_TYPES.filter(
                            (mt) =>
                              (selectedUnit.mines[mt] ?? 0) > 0 ||
                              mt === 'tu_lei' ||
                              mt === 'weizhuang_lei' ||
                              mt === 'shi_lei'
                          ).map((mt) => {
                            const cnt = selectedUnit.mines[mt] ?? 0;
                            return (
                              <button
                                key={mt}
                                disabled={cnt <= 0}
                                className={`mine-type-btn ${
                                  selectedMineType === mt ? 'selected' : ''
                                }`}
                                onClick={() => {
                                  sound.playClick();
                                  setSelectedMineType(mt);
                                }}
                              >
                                <strong>{MINES[mt].name}</strong>
                                <span>×{cnt}</span>
                              </button>
                            );
                          })}
                        </div>
                        <p className="mine-picker-desc">{MINES[selectedMineType].description}</p>
                      </div>
                    )}

                    <div className="action-btn-row">
                      <button
                        className="act-btn heal-btn"
                        disabled={
                          selectedUnit.healItems <= 0 ||
                          selectedUnit.hp >= selectedUnit.maxHp
                        }
                        onClick={() => handleHealSelf(selectedUnit)}
                      >
                        <Heart size={15} /> 小米回血 ({selectedUnit.healItems})
                      </button>
                      <button
                        className="act-btn wait-btn"
                        onClick={() => handleWaitUnit(selectedUnit)}
                      >
                        <Flag size={15} /> 待机
                      </button>
                    </div>
                  </div>
                )}

              {selectedUnit.faction === 'player' && selectedUnit.acted && !selectedUnit.isCaptive && (
                <div className="acted-banner">本回合已行动完毕</div>
              )}
            </div>
          ) : (
            <div className="unit-card empty-unit-card">
              <Crosshair size={22} />
              <p>点击地图上的我军单位开始指挥，或点击敌军查看兵种属性。</p>
            </div>
          )}

          {/* Hovered Terrain Info */}
          <div className="terrain-card">
            <div className="terrain-card-header">
              <Shield size={14} />
              <strong>{hoveredTerrain.name}</strong>
              <span className="coord-tag">
                ({hoveredTile.x + 1}, {hoveredTile.y + 1})
              </span>
            </div>
            <div className="terrain-stats">
              <span>防御 +{hoveredTerrain.defBonus}</span>
              <span>移动消耗 {hoveredTerrain.moveCost >= 99 ? '不可通行' : hoveredTerrain.moveCost}</span>
              <span>{hoveredTerrain.canMine ? '可埋雷' : '不可埋雷'}</span>
            </div>
            <p className="terrain-desc">{hoveredTerrain.desc}</p>
          </div>

          {/* Live Battle Log */}
          <div className="log-card">
            <div className="log-header">
              <Sparkles size={14} /> 战场实况
            </div>
            <div className="log-list">
              {battleLog.map((entry, idx) => (
                <div key={idx} className="log-item">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Character Detail Modal (个人属性面板) */}
      {detailUnitId &&
        (() => {
          const detailUnit = units.find((u) => u.id === detailUnitId && u.alive);
          if (!detailUnit) return null;
          const tileTerrain = stage.tiles[detailUnit.y]?.[detailUnit.x] ?? 'grass';
          return (
            <CharacterDetailModal
              unit={detailUnit}
              terrain={tileTerrain}
              onClose={() => setDetailUnitId(null)}
            />
          );
        })()}

      {/* Story Dialogue Overlay */}
      {phase === 'dialogue' && (
        <DialogueBox
          lines={dialogueQueue}
          index={dialogueIdx}
          onNext={handleDialogueNext}
          onSkip={handleDialogueSkip}
        />
      )}

      {/* Victory Modal */}
      {phase === 'victory' && (
        <div className="result-backdrop">
          <div className="result-modal victory-modal">
            <div className="result-stamp">捷报</div>
            <h2>{stage.name} · 大获全胜！</h2>
            <p>
              成功歼灭所有进犯日伪军！缴获一批造雷材料，游击队威名远扬平阳县！
            </p>
            <button
              className="btn-primary-gold"
              onClick={() => {
                sound.playClick();
                const heroes = units.filter((u) => u.faction === 'player' && u.alive);
                onVictory(heroes);
              }}
            >
              {hasNextStage ? '凯旋整备 · 进入地雷工坊' : '前五关全捷 · 查看最终战报'}
            </button>
          </div>
        </div>
      )}

      {/* Defeat Modal */}
      {phase === 'defeat' && (
        <div className="result-backdrop">
          <div className="result-modal defeat-modal">
            <div className="result-stamp defeat-stamp">败北</div>
            <h2>任务失败</h2>
            <p>{stage.defeatCondition}</p>
            <button
              className="btn-primary-gold"
              onClick={() => {
                sound.playClick();
                onRestart();
              }}
            >
              <RotateCcw size={16} /> 重整旗鼓 · 重新挑战
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
