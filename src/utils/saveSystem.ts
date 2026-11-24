import { CampaignSaveData, SaveSlotId } from '../types/game';

export const SAVE_SLOTS: SaveSlotId[] = ['auto', 'slot1', 'slot2', 'slot3'];

const KEY_PREFIX = 'krdlz_hd_save_v1_';

export const SLOT_DISPLAY_NAMES: Record<SaveSlotId, string> = {
  auto: '自动存档（战前/每回合自动记录）',
  slot1: '手动存档一',
  slot2: '手动存档二',
  slot3: '手动存档三',
};

function getStorageKey(slotId: SaveSlotId): string {
  return `${KEY_PREFIX}${slotId}`;
}

export function isValidSaveData(raw: unknown): raw is CampaignSaveData {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Partial<CampaignSaveData>;
  return (
    obj.version === 1 &&
    typeof obj.stageIdx === 'number' &&
    obj.stageIdx >= 0 &&
    (obj.screen === 'camp' || obj.screen === 'battle') &&
    Array.isArray(obj.roster) &&
    !!obj.materials &&
    !!obj.mineStock &&
    Array.isArray(obj.unlockedMines) &&
    !!obj.promoBooks
  );
}

export function loadSaveSlot(slotId: SaveSlotId): CampaignSaveData | null {
  try {
    const raw = window.localStorage.getItem(getStorageKey(slotId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidSaveData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function listAllSaves(): Record<SaveSlotId, CampaignSaveData | null> {
  return {
    auto: loadSaveSlot('auto'),
    slot1: loadSaveSlot('slot1'),
    slot2: loadSaveSlot('slot2'),
    slot3: loadSaveSlot('slot3'),
  };
}

export function writeSaveSlot(
  slotId: SaveSlotId,
  payload: Omit<CampaignSaveData, 'version' | 'slotId' | 'savedAt'>
): CampaignSaveData | null {
  const full: CampaignSaveData = {
    ...payload,
    version: 1,
    slotId,
    savedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(getStorageKey(slotId), JSON.stringify(full));
    return full;
  } catch {
    return null;
  }
}

export function deleteSaveSlot(slotId: SaveSlotId): void {
  try {
    window.localStorage.removeItem(getStorageKey(slotId));
  } catch {
    // Ignore storage restriction errors cleanly
  }
}

export function getMostRecentSave(): CampaignSaveData | null {
  const all = listAllSaves();
  let best: CampaignSaveData | null = null;
  for (const sid of SAVE_SLOTS) {
    const item = all[sid];
    if (!item) continue;
    if (!best || new Date(item.savedAt).getTime() > new Date(best.savedAt).getTime()) {
      best = item;
    }
  }
  return best;
}

export function formatSaveTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '未知时间';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi}`;
}

export function exportSaveJson(save: CampaignSaveData): void {
  const json = JSON.stringify(save, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `抗日地雷战存档_第${save.stageIdx + 1}关_${save.slotId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedSaveJson(text: string): CampaignSaveData | null {
  try {
    const parsed = JSON.parse(text);
    if (!isValidSaveData(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}
