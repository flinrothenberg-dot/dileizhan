import { TERRAIN_META } from '../data/mines';
import { AttackFx, PlacedMine, TerrainType, Unit } from '../types/game';

export interface GridPoint {
  x: number;
  y: number;
}

export function manhattan(a: GridPoint, b: GridPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function keyOf(x: number, y: number): string {
  return `${x},${y}`;
}

export interface ReachableResult {
  tiles: Set<string>;
  parents: Map<string, GridPoint | null>;
}

export function getReachableTiles(
  unit: Unit,
  tiles: TerrainType[][],
  units: Unit[]
): ReachableResult {
  const height = tiles.length;
  const width = tiles[0].length;
  const dist = new Map<string, number>();
  const parents = new Map<string, GridPoint | null>();
  const reachable = new Set<string>();

  const occupiedByEnemy = new Set<string>();
  const occupiedByAny = new Set<string>();

  for (const u of units) {
    if (!u.alive || u.id === unit.id) continue;
    const k = keyOf(u.x, u.y);
    occupiedByAny.add(k);
    if (u.faction !== unit.faction) {
      occupiedByEnemy.add(k);
    }
  }

  const startKey = keyOf(unit.x, unit.y);
  dist.set(startKey, 0);
  parents.set(startKey, null);

  const queue: { x: number; y: number; cost: number }[] = [
    { x: unit.x, y: unit.y, cost: 0 },
  ];

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const cur = queue.shift()!;
    const curKey = keyOf(cur.x, cur.y);
    if (cur.cost > (dist.get(curKey) ?? Infinity)) continue;

    if (!occupiedByAny.has(curKey) && curKey !== startKey) {
      reachable.add(curKey);
    }

    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nk = keyOf(nx, ny);
      if (occupiedByEnemy.has(nk)) continue;
      const tCost = TERRAIN_META[tiles[ny][nx]].moveCost;
      if (tCost >= 99) continue;
      const nextCost = cur.cost + tCost;
      if (nextCost <= unit.move && nextCost < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nextCost);
        parents.set(nk, { x: cur.x, y: cur.y });
        queue.push({ x: nx, y: ny, cost: nextCost });
      }
    }
  }

  return { tiles: reachable, parents };
}

export function reconstructPath(
  target: GridPoint,
  parents: Map<string, GridPoint | null>
): GridPoint[] {
  const path: GridPoint[] = [];
  let cur: GridPoint | null = target;
  while (cur) {
    path.unshift(cur);
    cur = parents.get(keyOf(cur.x, cur.y)) ?? null;
  }
  return path;
}

export function getAttackableTargets(unit: Unit, units: Unit[]): Unit[] {
  return units.filter(
    (other) =>
      other.alive &&
      !other.isCaptive &&
      other.faction !== unit.faction &&
      manhattan(unit, other) >= unit.rangeMin &&
      manhattan(unit, other) <= unit.rangeMax
  );
}

export function getAttackRangeTiles(unit: Unit, tiles: TerrainType[][]): Set<string> {
  const height = tiles.length;
  const width = tiles[0].length;
  const result = new Set<string>();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const d = manhattan(unit, { x, y });
      if (d >= unit.rangeMin && d <= unit.rangeMax) {
        result.add(keyOf(x, y));
      }
    }
  }
  return result;
}

export function getMineableTiles(
  unit: Unit,
  tiles: TerrainType[][],
  units: Unit[],
  mines: PlacedMine[]
): Set<string> {
  const height = tiles.length;
  const width = tiles[0].length;
  const result = new Set<string>();
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (const [dx, dy] of dirs) {
    const nx = unit.x + dx;
    const ny = unit.y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    if (!TERRAIN_META[tiles[ny][nx]].canMine) continue;
    const hasUnit = units.some((u) => u.alive && u.x === nx && u.y === ny);
    if (hasUnit) continue;
    const hasMine = mines.some((m) => !m.triggered && m.x === nx && m.y === ny);
    if (hasMine) continue;
    result.add(keyOf(nx, ny));
  }

  return result;
}

export function getAttackKind(unit: Unit, distance: number): AttackFx['kind'] {
  if (unit.weaponName.includes('双') || unit.id === 'commander' || unit.id === 'lixiangyang') {
    return 'dual_pistol';
  }
  if (unit.weaponName.includes('大刀') || (unit.weaponName.includes('刀') && distance === 1)) {
    return 'blade';
  }
  if (unit.weaponName.includes('机枪')) {
    return 'mg';
  }
  if (unit.weaponName.includes('弹弓')) {
    return 'slingshot';
  }
  return 'rifle';
}

export function computeAttackDamage(
  attacker: Unit,
  defender: Unit,
  defenderTerrain: TerrainType
): { damage: number; isCrit: boolean } {
  const defBonus = TERRAIN_META[defenderTerrain].defBonus;
  const critChance =
    attacker.id === 'lixiangyang'
      ? 0.38
      : attacker.id === 'commander'
      ? 0.25
      : attacker.id === 'zhulaozhong'
      ? 0.28
      : 0.15;
  const isCrit = Math.random() < critChance;
  const base = Math.max(8, attacker.atk - Math.floor((defender.def + defBonus) * 0.65));
  const variance = Math.floor(Math.random() * 5) - 2;
  const damage = Math.max(6, Math.round((base + variance) * (isCrit ? 1.5 : 1)));
  return { damage, isCrit };
}

export function findChainMines(
  origin: PlacedMine,
  allMines: PlacedMine[]
): PlacedMine[] {
  if (origin.type === 'weizhuang_lei') return [origin];

  const visited = new Set<string>([origin.id]);
  const queue: PlacedMine[] = [origin];
  const chain: PlacedMine[] = [];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    chain.push(cur);
    for (const m of allMines) {
      if (m.triggered || visited.has(m.id) || m.type === 'weizhuang_lei') continue;
      if (manhattan(cur, m) === 1) {
        visited.add(m.id);
        queue.push(m);
      }
    }
  }
  return chain;
}
