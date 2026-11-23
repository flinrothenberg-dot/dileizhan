export type TerrainType =
  | 'dirt_road'
  | 'grass'
  | 'forest'
  | 'house'
  | 'watchtower'
  | 'water'
  | 'bridge'
  | 'rock'
  | 'courtyard';

export type Faction = 'player' | 'enemy' | 'ally';

export type MineType = 'tu_lei' | 'weizhuang_lei' | 'shi_lei';

export type MaterialId = 'clay' | 'stone' | 'wood' | 'nitre' | 'sulfur' | 'charcoal';

export interface MineDefinition {
  id: MineType;
  name: string;
  shortName: string;
  damage: number;
  splashDamage: number;
  isDecoy?: boolean;
  description: string;
  recipe: Partial<Record<MaterialId, number>>;
  color: string;
  badgeColor: string;
}

export interface MaterialDefinition {
  id: MaterialId;
  name: string;
  description: string;
  iconColor: string;
}

export interface PlacedMine {
  id: string;
  type: MineType;
  x: number;
  y: number;
  owner: Faction;
  detected: boolean; // true if spotted by enemy sapper
  triggered?: boolean;
}

export interface Unit {
  id: string;
  name: string;
  title: string; // e.g. 游击大队长 / 民兵造雷手 / 日军工兵队
  unitClass: string; // e.g. 手枪队 / 大刀队 / 双枪队 / 工兵队
  faction: Faction;
  portraitId: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  move: number;
  rangeMin: number;
  rangeMax: number;
  level: number;
  exp: number;
  weaponName: string;
  canLayMines: boolean;
  isSapper?: boolean;
  isBoss?: boolean;
  isCaptive?: boolean; // e.g. Zhu Laozhong before rescue
  acted: boolean;
  moved: boolean;
  stunnedTurns: number; // e.g. startled by decoy mine
  mines: Record<MineType, number>;
  healItems: number; // 小米
  alive: boolean;
  facing: 'left' | 'right';
}

export interface DialogueLine {
  speaker: string;
  portraitId?: string;
  faction?: Faction | 'narrator';
  text: string;
}

export interface StageConfig {
  id: number;
  code: string;
  name: string;
  subtitle: string;
  date: string;
  location: string;
  objective: string;
  defeatCondition: string;
  width: number;
  height: number;
  tiles: TerrainType[][];
  introDialogues: DialogueLine[];
  victoryDialogues: DialogueLine[];
  initialUnits: Unit[];
  reinforcementTurn?: number;
  reinforcementUnits?: Unit[];
  reinforcementDialogues?: DialogueLine[];
  rescueUnitId?: string;
  rescueDialogues?: DialogueLine[];
  rewardMaterials: Partial<Record<MaterialId, number>>;
  unlockedMines?: MineType[];
}

export interface FloatingEffect {
  id: string;
  x: number;
  y: number;
  text: string;
  kind: 'damage' | 'mine' | 'heal' | 'info' | 'chain' | 'crit';
}

export interface ExplosionFx {
  id: string;
  x: number;
  y: number;
  size: 'normal' | 'large' | 'decoy';
}

export interface AttackFx {
  id: string;
  x: number;
  y: number;
  kind: 'dual_pistol' | 'blade' | 'rifle' | 'mg' | 'slingshot';
  isCrit: boolean;
}

export type ScreenMode = 'title' | 'briefing' | 'battle' | 'camp' | 'demo_complete';

export type BattlePhase = 'player' | 'enemy' | 'dialogue' | 'victory' | 'defeat';

export type ActionMode = 'select' | 'move' | 'attack' | 'mine';
