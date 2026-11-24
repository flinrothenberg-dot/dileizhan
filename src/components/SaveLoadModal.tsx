import React, { useEffect, useRef, useState } from 'react';
import {
  Clock,
  Download,
  FolderOpen,
  HardDrive,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { CampaignSaveData, SaveSlotId } from '../types/game';
import {
  deleteSaveSlot,
  exportSaveJson,
  formatSaveTime,
  listAllSaves,
  parseImportedSaveJson,
  SAVE_SLOTS,
  SLOT_DISPLAY_NAMES,
} from '../utils/saveSystem';
import { sound } from '../utils/sound';

interface SaveLoadModalProps {
  canSaveCurrent: boolean;
  currentSummary?: string;
  onSaveToSlot: (slotId: SaveSlotId) => CampaignSaveData | null;
  onLoadSaveData: (save: CampaignSaveData) => void;
  onClose: () => void;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  canSaveCurrent,
  currentSummary,
  onSaveToSlot,
  onLoadSaveData,
  onClose,
}) => {
  const [saves, setSaves] = useState<Record<SaveSlotId, CampaignSaveData | null>>(() =>
    listAllSaves()
  );
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const refresh = () => setSaves(listAllSaves());

  const handleSave = (slotId: SaveSlotId) => {
    sound.playClick();
    const res = onSaveToSlot(slotId);
    if (res) {
      refresh();
      setNotice(`已成功写入【${SLOT_DISPLAY_NAMES[slotId]}】：${res.label}`);
    } else {
      setNotice('保存失败：浏览器本地存储受限，建议点击下方导出为 .json 文件备份！');
    }
  };

  const handleLoad = (save: CampaignSaveData) => {
    sound.playClick();
    onLoadSaveData(save);
    onClose();
  };

  const handleDelete = (slotId: SaveSlotId) => {
    sound.playClick();
    deleteSaveSlot(slotId);
    refresh();
    setNotice(`已清空【${SLOT_DISPLAY_NAMES[slotId]}】`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImportedSaveJson(text);
      if (!parsed) {
        setNotice('导入失败：存档文件格式无效或已损坏。');
        return;
      }
      sound.playClick();
      onLoadSaveData(parsed);
      onClose();
    } catch {
      setNotice('读取本地文件失败，请重试。');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <div className="detail-modal save-modal" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close-btn" onClick={onClose} title="关闭 (ESC)">
          <X size={18} />
        </button>

        <div className="save-modal-header">
          <HardDrive size={22} className="save-head-ico" />
          <div>
            <h2>战役存档与读档</h2>
            <p>
              {canSaveCurrent && currentSummary
                ? `当前进度：${currentSummary}`
                : '支持多槽位浏览器本地持久化（过关、出击及回合更替自动存档）'}
            </p>
          </div>
        </div>

        {notice && <div className="save-notice-banner">{notice}</div>}

        <div className="save-slots-list">
          {SAVE_SLOTS.map((sid) => {
            const item = saves[sid];
            const isAuto = sid === 'auto';
            return (
              <div
                key={sid}
                className={`save-slot-card ${item ? 'filled' : 'empty'} ${
                  isAuto ? 'is-auto' : ''
                }`}
              >
                <div className="save-slot-info">
                  <div className="save-slot-top">
                    <span className={`save-slot-badge ${isAuto ? 'auto' : ''}`}>
                      {SLOT_DISPLAY_NAMES[sid]}
                    </span>
                    {item && (
                      <span className="save-slot-time">
                        <Clock size={12} /> {formatSaveTime(item.savedAt)}
                      </span>
                    )}
                  </div>
                  {item ? (
                    <>
                      <strong className="save-slot-title">{item.label}</strong>
                      <div className="save-slot-meta">
                        出战阵容 {item.roster.length} 名 ·{' '}
                        {item.battle
                          ? `战场第 ${item.battle.turn} 回合（剩余敌军 ${
                              item.battle.units.filter((u) => u.faction === 'enemy' && u.alive).length
                            }）`
                          : '工坊整备营地'}
                      </div>
                    </>
                  ) : (
                    <div className="save-slot-empty-text">暂无记录</div>
                  )}
                </div>

                <div className="save-slot-actions">
                  {canSaveCurrent && !isAuto && (
                    <button className="save-act-btn primary" onClick={() => handleSave(sid)}>
                      <Save size={13} /> 存档
                    </button>
                  )}
                  {item && (
                    <button className="save-act-btn load" onClick={() => handleLoad(item)}>
                      <FolderOpen size={13} /> 读档
                    </button>
                  )}
                  {item && (
                    <button
                      className="save-act-btn"
                      title="下载 .json 文件备份（可用于跨浏览器/离线版导入）"
                      onClick={() => {
                        sound.playClick();
                        exportSaveJson(item);
                      }}
                    >
                      <Download size={13} />
                    </button>
                  )}
                  {item && (
                    <button
                      className="save-act-btn danger"
                      title="删除此存档"
                      onClick={() => handleDelete(sid)}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="save-modal-footer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button
            className="btn-ghost"
            onClick={() => {
              sound.playClick();
              fileInputRef.current?.click();
            }}
          >
            <Upload size={14} /> 从本地文件导入存档 (.json)
          </button>
          <span className="save-tip-note">
            提示：手动槽位可随时在战场中存/读档（S/L），跨设备游玩可导出 .json 备份。
          </span>
        </div>
      </div>
    </div>
  );
};
