import { MaterialDefinition, MaterialId, MineDefinition, MineType, TerrainType } from '../types/game';

export const ALL_MATERIAL_IDS: MaterialId[] = [
  'clay',
  'stone',
  'wood',
  'iron',
  'venom',
  'nitre',
  'sulfur',
  'charcoal',
];

export const ALL_MINE_TYPES: MineType[] = [
  'tu_lei',
  'weizhuang_lei',
  'shi_lei',
  'tie_lei',
  'xiezi_lei',
  'yinfa_lei',
];

export function makeMineInventory(partial: Partial<Record<MineType, number>> = {}): Record<MineType, number> {
  return {
    tu_lei: partial.tu_lei ?? 0,
    weizhuang_lei: partial.weizhuang_lei ?? 0,
    shi_lei: partial.shi_lei ?? 0,
    tie_lei: partial.tie_lei ?? 0,
    xiezi_lei: partial.xiezi_lei ?? 0,
    yinfa_lei: partial.yinfa_lei ?? 0,
  };
}

export const MATERIALS: Record<MaterialId, MaterialDefinition> = {
  clay: {
    id: 'clay',
    name: '粘土',
    description: '冀中随处可见的胶泥土，制作土雷壳体与伪装雷的基础材料。',
    iconColor: '#b98350',
  },
  stone: {
    id: 'stone',
    name: '石头',
    description: '坚硬花岗岩凿空而成，炸裂时碎石四溅，威力惊人。',
    iconColor: '#8d99a6',
  },
  wood: {
    id: 'wood',
    name: '木料',
    description: '榆木疙瘩与木桩，小嘎子用来做伪装雷吓唬鬼子的好料子。',
    iconColor: '#9d6b3b',
  },
  iron: {
    id: 'iron',
    name: '生铁块',
    description: '柳忻教游击队土法炼铁熔铸出的铁壳毛坯，铁雷与引发雷核心材料。',
    iconColor: '#64748b',
  },
  venom: {
    id: 'venom',
    name: '毒蝎囊',
    description: '张嘎在山坡石缝抓来的毒蝎毒囊，炼制蝎子雷可令日军持续中毒掉血。',
    iconColor: '#9333ea',
  },
  nitre: {
    id: 'nitre',
    name: '火硝',
    description: '土法熬制的硝土结晶，黑火药的核心氧化剂。',
    iconColor: '#e2d7a7',
  },
  sulfur: {
    id: 'sulfur',
    name: '硫磺',
    description: '淡黄色矿石粉，大幅提升石雷、引发雷爆燃温度与杀伤力。',
    iconColor: '#e0c038',
  },
  charcoal: {
    id: 'charcoal',
    name: '木炭粉',
    description: '柳木烧制的细炭粉，配比火硝即可制出烈性黑火药。',
    iconColor: '#484c52',
  },
};

export const MINES: Record<MineType, MineDefinition> = {
  tu_lei: {
    id: 'tu_lei',
    name: '土雷',
    shortName: '土',
    damage: 45,
    splashDamage: 0,
    unlockStage: 1,
    description: '赵虎试制成功的基础地雷。造价低廉、隐蔽性强；相邻地雷引爆时可触发【连环爆破】！',
    recipe: { clay: 2, nitre: 1, charcoal: 1 },
    color: '#d97706',
    badgeColor: '#f59e0b',
  },
  weizhuang_lei: {
    id: 'weizhuang_lei',
    name: '伪装雷',
    shortName: '伪',
    damage: 0,
    splashDamage: 0,
    isDecoy: true,
    unlockStage: 2,
    description: '小嘎子发明的木头假地雷。不造成伤害，但能吓破鬼子胆（惊慌停顿1回合），还能诱骗日军工兵白费回合排雷！',
    recipe: { wood: 1, clay: 1 },
    color: '#65a30d',
    badgeColor: '#84cc16',
  },
  shi_lei: {
    id: 'shi_lei',
    name: '石雷',
    shortName: '石',
    damage: 68,
    splashDamage: 28,
    unlockStage: 2,
    description: '赵虎钻研出的高威力石壳地雷！碎石四射，重创踩雷者并对周围1格造成28点溅射，支持连环引爆！',
    recipe: { stone: 2, nitre: 2, sulfur: 1 },
    color: '#dc2626',
    badgeColor: '#ef4444',
  },
  tie_lei: {
    id: 'tie_lei',
    name: '铁雷',
    shortName: '铁',
    damage: 92,
    splashDamage: 34,
    unlockStage: 3,
    description: '柳忻用大学化学与冶铁知识助造的破片铁壳雷！高达92点高爆伤+34点溅射，专轰重甲日军指挥官！',
    recipe: { iron: 2, nitre: 2, charcoal: 1 },
    color: '#2563eb',
    badgeColor: '#60a5fa',
  },
  xiezi_lei: {
    id: 'xiezi_lei',
    name: '蝎子雷',
    shortName: '蝎',
    damage: 58,
    splashDamage: 18,
    poisonTurns: 2,
    unlockStage: 4,
    description: '张嘎用太行毒蝎研制的奇门毒雷！引爆后使敌军陷入【剧毒】2回合，每回合行动前额外痛失 18 点生命！',
    recipe: { clay: 1, venom: 1, nitre: 1, sulfur: 1 },
    color: '#7c3aed',
    badgeColor: '#c084fc',
  },
  yinfa_lei: {
    id: 'yinfa_lei',
    name: '引发雷',
    shortName: '引',
    damage: 108,
    splashDamage: 36,
    antiSapper: true,
    unlockStage: 5,
    description: '九爷传授的绝世机关猛雷！108点毁灭爆伤，更可【反杀工兵】——日军探雷工兵一试图排雷便会直接触发爆炸！',
    recipe: { iron: 2, stone: 1, nitre: 2, sulfur: 2 },
    color: '#b45309',
    badgeColor: '#fde047',
  },
};

export interface TerrainMeta {
  name: string;
  moveCost: number; // 99 = impassable
  defBonus: number;
  canMine: boolean;
  desc: string;
}

export const TERRAIN_META: Record<TerrainType, TerrainMeta> = {
  dirt_road: {
    name: '乡间土路',
    moveCost: 1,
    defBonus: 0,
    canMine: true,
    desc: '日伪军行军必经之路，极易隐蔽埋设地雷。',
  },
  courtyard: {
    name: '村中打谷场',
    moveCost: 1,
    defBonus: 2,
    canMine: true,
    desc: '开阔土场或水寨院落，便于设伏与阵地战。',
  },
  grass: {
    name: '华北平川',
    moveCost: 1,
    defBonus: 1,
    canMine: true,
    desc: '田埂草地，我军游击队员行动自如，亦可埋雷。',
  },
  forest: {
    name: '密林芦荡',
    moveCost: 2,
    defBonus: 5,
    canMine: true,
    desc: '丛林芦苇可大幅掩护身形，获得极高防御加成！',
  },
  house: {
    name: '农家土屋',
    moveCost: 2,
    defBonus: 4,
    canMine: false,
    desc: '坚实民居院落，适合依托掩体坚守还击。',
  },
  watchtower: {
    name: '日伪炮楼',
    moveCost: 2,
    defBonus: 6,
    canMine: false,
    desc: '砖石碉堡据点，拥有最高的地形防御加成。',
  },
  bridge: {
    name: '木石桥梁',
    moveCost: 1,
    defBonus: 0,
    canMine: true,
    desc: '跨河咽喉要道，桥面埋下连环雷往往一夫当关！',
  },
  water: {
    name: '深水淀泊',
    moveCost: 99,
    defBonus: 0,
    canMine: false,
    desc: '深水淀区，常规陆军与日军机械化部队皆无法涉渡。',
  },
  rock: {
    name: '山岩巨石',
    moveCost: 99,
    defBonus: 0,
    canMine: false,
    desc: '崎岖陡峭巨岩，完全阻断行军路径。',
  },
};
