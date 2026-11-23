import { MaterialDefinition, MaterialId, MineDefinition, MineType, TerrainType } from '../types/game';

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
  nitre: {
    id: 'nitre',
    name: '火硝',
    description: '土法熬制的硝土结晶，黑火药的核心氧化剂。',
    iconColor: '#e2d7a7',
  },
  sulfur: {
    id: 'sulfur',
    name: '硫磺',
    description: '淡黄色矿石粉，大幅提升石雷爆燃温度与杀伤力。',
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
    description: '赵虎试制成功的基础地雷。造价低廉、隐蔽性强；若相邻格也埋有地雷，引爆时将触发【连环爆破】！',
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
    description: '小嘎子发明的木头假地雷。不造成伤害，但能吓破鬼子伪军胆子（使其惊慌停顿 1 回合），更能诱骗日军工兵浪费回合排雷！',
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
    description: '赵虎钻研出的高威力石壳地雷！引爆时碎石四射，对踩雷者造成重创并对周围 1 格敌军造成溅射伤害，同样支持连环引爆！',
    recipe: { stone: 2, nitre: 2, sulfur: 1 },
    color: '#dc2626',
    badgeColor: '#ef4444',
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
    desc: '开阔土场，便于设伏或近战交锋。',
  },
  grass: {
    name: '冀中田野',
    moveCost: 1,
    defBonus: 1,
    canMine: true,
    desc: '平坦农田，视野开阔，可以埋雷。',
  },
  forest: {
    name: '高粱林/树林',
    moveCost: 2,
    defBonus: 6,
    canMine: true,
    desc: '天然青纱帐，防御 +6，隐蔽伏击绝佳位置。',
  },
  bridge: {
    name: '青石桥',
    moveCost: 1,
    defBonus: 0,
    canMine: true,
    desc: '过河咽喉要道，桥头埋雷可一夫当关！',
  },
  house: {
    name: '北方民居',
    moveCost: 99,
    defBonus: 0,
    canMine: false,
    desc: '青砖灰瓦农家院墙，阻挡通行。',
  },
  watchtower: {
    name: '日军炮楼',
    moveCost: 99,
    defBonus: 0,
    canMine: false,
    desc: '敌军修筑的砖石岗楼，不可通行。',
  },
  water: {
    name: '拒马支流',
    moveCost: 99,
    defBonus: 0,
    canMine: false,
    desc: '湍急河道，仅可经由石桥通行。',
  },
  rock: {
    name: '乱石坡',
    moveCost: 99,
    defBonus: 0,
    canMine: false,
    desc: '陡峭山石，不可通行。',
  },
};
