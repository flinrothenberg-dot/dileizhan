import React, { useEffect } from 'react';
import { ChevronRight, FastForward } from 'lucide-react';
import { DialogueLine } from '../types/game';
import { CharacterPortrait } from './CharacterPortrait';

interface DialogueBoxProps {
  lines: DialogueLine[];
  index: number;
  onNext: () => void;
  onSkip: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  lines,
  index,
  onNext,
  onSkip,
}) => {
  const line = lines[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext]);

  if (!line) return null;

  const isNarrator = line.faction === 'narrator' || !line.portraitId;

  return (
    <div className="dialogue-backdrop" onClick={onNext}>
      <div
        className={`dialogue-panel ${
          line.faction === 'enemy'
            ? 'dialogue-enemy'
            : line.faction === 'player'
            ? 'dialogue-player'
            : 'dialogue-narrator'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
      >
        {!isNarrator && line.portraitId && (
          <div className="dialogue-portrait-frame">
            <CharacterPortrait
              portraitId={line.portraitId}
              alt={line.speaker}
              className="dialogue-portrait-img"
            />
          </div>
        )}

        <div className="dialogue-content">
          <div className="dialogue-header">
            <span className="dialogue-speaker">{line.speaker}</span>
            <span className="dialogue-progress">
              {index + 1} / {lines.length}
            </span>
          </div>
          <p className="dialogue-text">{line.text}</p>
          <div className="dialogue-footer">
            <button
              className="btn-skip"
              onClick={(e) => {
                e.stopPropagation();
                onSkip();
              }}
            >
              <FastForward size={14} /> 跳过剧情
            </button>
            <span className="dialogue-continue">
              点击或按空格继续 <ChevronRight size={15} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
