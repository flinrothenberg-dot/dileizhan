import { PromoBookId, Unit } from '../types/game';

export interface PromoBookMeta {
  id: PromoBookId;
  name: string;
  shortName: string;
  dropSource: string;
  color: string;
}

export interface PromotionRule {
  fromClass: string;
  heroIds?: string[];
  toClass: string;
  toTitle?: string;
  toSpriteId: string;
  toWeaponName: string;
  toAttackShape?: Unit['attackShape'];
  toSplashRatio?: number;
  reqLevel: number;
  reqBook: PromoBookId;
  bonus: {
    maxHp: number;
    atk: number;
    def: number;
    move?: number;
    rangeMax?: number;
    critRate?: number;
  };
  perkNote: string;
}

export const ALL_PROMO_BOOK_IDS: PromoBookId[] = [
  'wugong_xinfa',
  'yezhan_xinfa',
  'qiangxie_jichu',
  'hongjin',
  'junqi',
  'youji_xinfa',
  'qiangxie_jingdian',
  'huoqi_jichu',
  'huoqi_jingdian',
  'mashu_jingdian',
  'zhanshu_jingdian',
];

export const PROMO_BOOKS: Record<PromoBookId, PromoBookMeta> = {
  wugong_xinfa: {
    id: 'wugong_xinfa',
    name: '《武功心法》',
    shortName: '武心',
    dropSource: '第1关 / 第9关胜出缴获',
    color: '#f59e0b',
  },
  yezhan_xinfa: {
    id: 'yezhan_xinfa',
    name: '《野战心法》',
    shortName: '野心',
    dropSource: '第2关 / 第6关胜出缴获',
    color: '#22c55e',
  },
  qiangxie_jichu: {
    id: 'qiangxie_jichu',
    name: '《枪械基础》',
    shortName: '枪基',
    dropSource: '第2关击败渡边中尉缴获',
    color: '#38bdf8',
  },
  hongjin: {
    id: 'hongjin',
    name: '《红巾》',
    shortName: '红巾',
    dropSource: '第3关 / 第6关胜出缴获',
    color: '#ef4444',
  },
  junqi: {
    id: 'junqi',
    name: '《军旗》',
    shortName: '军旗',
    dropSource: '第3关 / 第7关胜出缴获',
    color: '#ec4899',
  },
  youji_xinfa: {
    id: 'youji_xinfa',
    name: '《游击心法》',
    shortName: '游心',
    dropSource: '第4关 / 第8关 / 第9关缴获',
    color: '#a855f7',
  },
  qiangxie_jingdian: {
    id: 'qiangxie_jingdian',
    name: '《枪械经典》',
    shortName: '枪经',
    dropSource: '第4关 / 第8关胜出缴获',
    color: '#eab308',
  },
  huoqi_jichu: {
    id: 'huoqi_jichu',
    name: '《火器基础》',
    shortName: '火基',
    dropSource: '第4关击败谷寿夫缴获',
    color: '#fb923c',
  },
  huoqi_jingdian: {
    id: 'huoqi_jingdian',
    name: '《火器经典》',
    shortName: '火经',
    dropSource: '第8关打停装甲列车缴获',
    color: '#f97316',
  },
  mashu_jingdian: {
    id: 'mashu_jingdian',
    name: '《马术经典》',
    shortName: '马经',
    dropSource: '第7关击退冉庄敌军缴获',
    color: '#14b8a6',
  },
  zhanshu_jingdian: {
    id: 'zhanshu_jingdian',
    name: '《战术经典》',
    shortName: '战经',
    dropSource: '第11关光复施南镇缴获',
    color: '#60a5fa',
  },
};

export const PROMOTION_RULES: PromotionRule[] = [
  {
    fromClass: '手枪队',
    toClass: '双枪队',
    toTitle: '游击骨干 · 精钢双枪手',
    toSpriteId: 'promo_shuangqiang',
    toWeaponName: '精钢双驳壳枪',
    toAttackShape: 'diamond',
    toSplashRatio: 0.32,
    reqLevel: 4,
    reqBook: 'qiangxie_jichu',
    bonus: { maxHp: 22, atk: 10, def: 4, critRate: 8 },
    perkNote: '双枪连发波及目标邻格（32%溅射），暴击 +8%！',
  },
  {
    fromClass: '双枪队',
    toClass: '冲锋队',
    toTitle: '八路军精锐 · 王牌冲锋手',
    toSpriteId: 'promo_chongfeng',
    toWeaponName: '花机关冲锋枪',
    toAttackShape: 'diamond',
    toSplashRatio: 0.45,
    reqLevel: 6,
    reqBook: 'qiangxie_jingdian',
    bonus: { maxHp: 28, atk: 13, def: 5, move: 1, rangeMax: 1, critRate: 8 },
    perkNote: '三阶终极形态：射程增至 3 格、移动 +1、45% 火力压制溅射！',
  },
  {
    fromClass: '大刀队',
    toClass: '武术队',
    toTitle: '冀中武圣 · 铁棍宗师',
    toSpriteId: 'promo_wushudui',
    toWeaponName: '镔铁齐眉棍 & 大刀',
    toAttackShape: 'box_8',
    toSplashRatio: 0.35,
    reqLevel: 4,
    reqBook: 'wugong_xinfa',
    bonus: { maxHp: 30, atk: 12, def: 6, critRate: 8 },
    perkNote: '原版核心突破：由十字4格扩至【八方九宫格含斜角攻击】+ 35% 横扫！',
  },
  {
    fromClass: '民兵队',
    heroIds: ['zhaohu', 'leishizhu'],
    toClass: '野战队',
    toTitle: '平阳主力 · 野战爆破手',
    toSpriteId: 'promo_yezhandui',
    toWeaponName: '中正式野战步枪',
    toAttackShape: 'diamond',
    reqLevel: 4,
    reqBook: 'yezhan_xinfa',
    bonus: { maxHp: 22, atk: 10, def: 4, rangeMax: 1, critRate: 6 },
    perkNote: '步枪射程提升至 3 格，远程点杀与埋雷兼备！',
  },
  {
    fromClass: '儿童团',
    heroIds: ['zhangga', 'yulai'],
    toClass: '童子军',
    toTitle: '白洋淀王牌 · 游击小神弓',
    toSpriteId: 'promo_tongzijun',
    toWeaponName: '硬木猎弓 & 铁弹弓',
    toAttackShape: 'diamond',
    reqLevel: 4,
    reqBook: 'hongjin',
    bonus: { maxHp: 24, atk: 9, def: 4, move: 1, rangeMax: 1, critRate: 10 },
    perkNote: '射程增至 4 格、移动力飙至 6 格全场最快！',
  },
  {
    fromClass: '妇救会',
    heroIds: ['langu', 'linsao'],
    toClass: '娘子军',
    toTitle: '八路军精锐 · 红十字娘子军',
    toSpriteId: 'promo_niangzijun',
    toWeaponName: '自卫盒子炮 & 急救箱',
    toAttackShape: 'diamond',
    reqLevel: 4,
    reqBook: 'junqi',
    bonus: { maxHp: 24, atk: 9, def: 4, move: 1, rangeMax: 1, critRate: 6 },
    perkNote: '攻击与战地救护范围皆扩至 3 格，单次救护回血升至 +68 HP！',
  },
  {
    fromClass: '侦察队',
    heroIds: ['xiaofei'],
    toClass: '飞虎队',
    toTitle: '敌后尖兵 · 飞虎神枪手',
    toSpriteId: 'promo_feihudui',
    toWeaponName: '飞虎卡宾快枪',
    toAttackShape: 'diamond',
    toSplashRatio: 0.3,
    reqLevel: 5,
    reqBook: 'youji_xinfa',
    bonus: { maxHp: 24, atk: 11, def: 5, move: 1, rangeMax: 1, critRate: 8 },
    perkNote: '超远狙杀增至 4 格、移动 +1 且带 30% 贯通溅射！',
  },
  {
    fromClass: '步枪队',
    toClass: '机枪队',
    toTitle: '反战勇士 · 轻机枪射手',
    toSpriteId: 'promo_feihudui',
    toWeaponName: '捷克式轻机枪',
    toAttackShape: 'diamond',
    toSplashRatio: 0.28,
    reqLevel: 6,
    reqBook: 'qiangxie_jichu',
    bonus: { maxHp: 24, atk: 11, def: 4, rangeMax: 1, critRate: 6 },
    perkNote: '步枪升级机枪队：射程升至 3 格且附 28% 压制溅射！',
  },
  {
    fromClass: '武工队',
    toClass: '飞虎队',
    toTitle: '铁道传奇 · 飞虎突击队',
    toSpriteId: 'promo_feihudui',
    toWeaponName: '飞虎匣子冲锋枪',
    toAttackShape: 'diamond',
    toSplashRatio: 0.35,
    reqLevel: 7,
    reqBook: 'youji_xinfa',
    bonus: { maxHp: 26, atk: 12, def: 5, move: 1, rangeMax: 1, critRate: 8 },
    perkNote: '武工队升格铁道飞虎队：射程 +1、移动 +1、35% 连带突击伤害！',
  },
  {
    fromClass: '骑兵队',
    toClass: '轻骑队',
    toTitle: '义勇轻骑 · 疾风马队',
    toSpriteId: 'promo_biaoqidui',
    toWeaponName: '马刀 & 骑步枪',
    toAttackShape: 'box_8',
    toSplashRatio: 0.25,
    reqLevel: 6,
    reqBook: 'mashu_jingdian',
    bonus: { maxHp: 26, atk: 11, def: 5, move: 1, critRate: 6 },
    perkNote: '骑兵升格轻骑队：移动 +1，近战扩至 8 向九宫斩击！',
  },
  {
    fromClass: '轻骑队',
    toClass: '骠骑队',
    toTitle: '神骥奇兵 · 无双骠骑',
    toSpriteId: 'promo_biaoqidui',
    toWeaponName: '鎏金马刀 & 双短枪',
    toAttackShape: 'knight_12',
    toSplashRatio: 0.4,
    reqLevel: 7,
    reqBook: 'mashu_jingdian',
    bonus: { maxHp: 32, atk: 13, def: 6, move: 1, critRate: 8 },
    perkNote: '原版三阶神骑：【八方+2格12向冲锋范围】与 40% 铁骑践踏溅射！',
  },
  {
    fromClass: '土炮队',
    heroIds: ['jiuye'],
    toClass: '大炮队',
    toTitle: '雁北火器 · 野战大炮手',
    toSpriteId: 'promo_dapaodui',
    toWeaponName: '野战重炮台',
    toAttackShape: 'diamond',
    toSplashRatio: 0.35,
    reqLevel: 6,
    reqBook: 'huoqi_jichu',
    bonus: { maxHp: 26, atk: 12, def: 5, rangeMax: 1, critRate: 6 },
    perkNote: '超远轰击增至 5 格，且炮弹附带 35% 十字爆破群伤！',
  },
  {
    fromClass: '大炮队',
    heroIds: ['jiuye'],
    toClass: '重炮队',
    toTitle: '雁北九雄 · 镇天重炮营',
    toSpriteId: 'promo_zhongpaodui',
    toWeaponName: '重型攻城榴弹炮',
    toAttackShape: 'diamond',
    toSplashRatio: 0.55,
    reqLevel: 8,
    reqBook: 'huoqi_jingdian',
    bonus: { maxHp: 32, atk: 15, def: 6, rangeMax: 1, critRate: 10 },
    perkNote: '最高三阶终极火炮：全图 6 格超远跨屏轰击 + 55% 毁灭重炮群伤！',
  },
  {
    fromClass: '机枪队',
    heroIds: ['chenhuaizhong'],
    toClass: '重机枪队',
    toTitle: '正面友军 · 马克沁重机枪班',
    toSpriteId: 'promo_zhongjiqiang',
    toWeaponName: '重型水冷机枪',
    toAttackShape: 'diamond',
    toSplashRatio: 0.45,
    reqLevel: 9,
    reqBook: 'zhanshu_jingdian',
    bonus: { maxHp: 30, atk: 13, def: 5, rangeMax: 1, critRate: 6 },
    perkNote: '射程增至 4 格，密集弹幕对目标周围造成 45% 压制伤！',
  },
];

export function emptyPromoBooks(): Record<PromoBookId, number> {
  return {
    wugong_xinfa: 0,
    yezhan_xinfa: 0,
    youji_xinfa: 0,
    qiangxie_jichu: 0,
    qiangxie_jingdian: 0,
    huoqi_jichu: 0,
    huoqi_jingdian: 0,
    mashu_jingdian: 0,
    zhanshu_jingdian: 0,
    hongjin: 0,
    junqi: 0,
  };
}

export function getNextPromotion(unit: Unit): PromotionRule | null {
  return (
    PROMOTION_RULES.find(
      (r) => r.fromClass === unit.unitClass && (!r.heroIds || r.heroIds.includes(unit.id))
    ) ?? null
  );
}

export function applyUnitPromotion(unit: Unit, rule: PromotionRule): Unit {
  const newMaxHp = unit.maxHp + rule.bonus.maxHp;
  return {
    ...unit,
    unitClass: rule.toClass,
    title: rule.toTitle ?? unit.title,
    spriteId: rule.toSpriteId,
    weaponName: rule.toWeaponName,
    attackShape: rule.toAttackShape ?? unit.attackShape,
    splashRatio: rule.toSplashRatio ?? unit.splashRatio,
    maxHp: newMaxHp,
    hp: newMaxHp,
    atk: unit.atk + rule.bonus.atk,
    def: unit.def + rule.bonus.def,
    move: unit.move + (rule.bonus.move ?? 0),
    rangeMax: unit.rangeMax + (rule.bonus.rangeMax ?? 0),
    critRate: (unit.critRate ?? 20) + (rule.bonus.critRate ?? 0),
  };
}
