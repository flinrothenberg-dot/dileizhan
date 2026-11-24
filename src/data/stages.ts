import { STAGES_EARLY } from './stagesEarly';
import { STAGES_MID } from './stagesMid';
import { STAGES_LATE } from './stagesLate';
import { StageConfig } from '../types/game';

export { INITIAL_HERO_ROSTER, HERO_UNLOCK_ORDER, makeHero, makeEnemy, makeVipNpc, parseMap } from './heroes';

export const STAGES: StageConfig[] = [...STAGES_EARLY, ...STAGES_MID, ...STAGES_LATE];
