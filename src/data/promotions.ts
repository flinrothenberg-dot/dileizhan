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
];

export const PROMO_BOOKS: Record<PromoBookId, PromoBookMeta> = {
  wugong_xinfa: {
    id: 'wugong_xinfa',
    name: '《武功心法》',
    shortName: '武心',
    dropSource: '第1关击败土肥太君缴获',
    color: '#f59e0b',
  },
  yezhan_xinfa: {
    id: 'yezhan_xinfa',
    name: '《野战心法》',
    shortName: '野心',
    dropSource: '第2关击败渡边中尉缴获',
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
    dropSource: '第3关击毙高敬天缴获',
    color: '#ef4444',
  },
  junqi: {
    id: 'junqi',
    name: '《军旗》',
    shortName: '军旗',
    dropSource: '第3关击毙高敬天缴获',
    color: '#ec4899',
  },
  youji_xinfa: {
    id: 'youji_xinfa',
    name: '《游击心法》',
    shortName: '游心',
    dropSource: '第4关击溃谷寿夫缴获',
    color: '#a855f7',
  },
  qiangxie_jingdian: {
    id: 'qiangxie_jingdian',
    name: '《枪械经典》',
    shortName: '枪经',
    dropSource: '第4关击溃谷寿夫缴获',
    color: '#eab308',
  },
  huoqi_jichu: {
    id: 'huoqi_jichu',
    name: '《火器基础》',
    shortName: '火基',
    dropSource: '第4关战利品缴获',
    color: '#fb923c',
  },
};

export const PROMOTION_RULES: PromotionRule[] = [
  {
    fromClass: '手枪队',
    heroIds: ['commander'],
    toClass: '双枪队',
    toTitle: '平阳游击队 · 神枪大队长',
    toSpriteId: 'promo_shuangqiang',
    toWeaponName: '精钢双驳壳枪',
    reqLevel: 4,
    reqBook: 'qiangxie_jichu',
    bonus: { maxHp: 22, atk: 9, def: 4, critRate: 8 },
    perkNote: '射术更凌厉，双枪暴击率再提 8%！',
  },
  {
    fromClass: '双枪队',
    heroIds: ['commander', 'lixiangyang'],
    toClass: '冲锋队',
    toTitle: '八路军精锐 · 王牌冲锋手',
    toSpriteId: 'promo_chongfeng',
    toWeaponName: '花机关冲锋枪',
    reqLevel: 6,
    reqBook: 'qiangxie_jingdian',
    bonus: { maxHp: 28, atk: 12, def: 5, move: 1, critRate: 8 },
    perkNote: '最高阶枪战王牌，移动 +1 格、火力压制全场！',
  },
  {
    fromClass: '大刀队',
    heroIds: ['zhulaozhong'],
    toClass: '武术队',
    toTitle: '冀中武圣 · 护国棍宗师',
    toSpriteId: 'promo_wushudui',
    toWeaponName: '镔铁长棍 & 鬼头刀',
    reqLevel: 4,
    reqBook: 'wugong_xinfa',
    bonus: { maxHp: 28, atk: 11, def: 6, critRate: 8 },
    perkNote: '身法刚猛绝伦，血厚防高堪比人形坦克！',
  },
  {
    fromClass: '民兵队',
    heroIds: ['zhaohu'],
    toClass: '野战队',
    toTitle: '平阳主力 · 野战爆破手',
    toSpriteId: 'promo_yezhandui',
    toWeaponName: '中正式野战步枪',
    reqLevel: 4,
    reqBook: 'yezhan_xinfa',
    bonus: { maxHp: 20, atk: 9, def: 4, rangeMax: 1, critRate: 6 },
    perkNote: '步枪射程提升至 3 格，远程点杀与埋雷兼备！',
  },
  {
    fromClass: '儿童团',
    heroIds: ['zhangga'],
    toClass: '童子军',
    toTitle: '白洋淀王牌 · 游击小神弓',
    toSpriteId: 'promo_tongzijun',
    toWeaponName: '硬木猎弓 & 铁弹弓',
    reqLevel: 4,
    reqBook: 'hongjin',
    bonus: { maxHp: 22, atk: 9, def: 4, move: 1, critRate: 10 },
    perkNote: '移动力达 6 格全场最快，穿插布雷如鬼魅！',
  },
  {
    fromClass: '妇救会',
    heroIds: ['langu'],
    toClass: '娘子军',
    toTitle: '八路军精锐 · 红十字娘子军',
    toSpriteId: 'promo_niangzijun',
    toWeaponName: '自卫盒子炮 & 急救包',
    reqLevel: 4,
    reqBook: 'junqi',
    bonus: { maxHp: 22, atk: 8, def: 4, move: 1, critRate: 6 },
    perkNote: '转职后【战地救护】回复量大幅增至 +66 HP，机动 +1！',
  },
  {
    fromClass: '侦察队',
    heroIds: ['xiaofei'],
    toClass: '飞虎队',
    toTitle: '铁道奇兵 · 飞虎神枪手',
    toSpriteId: 'promo_feihudui',
    toWeaponName: '飞虎快枪',
    reqLevel: 5,
    reqBook: 'youji_xinfa',
    bonus: { maxHp: 24, atk: 10, def: 5, move: 1, critRate: 8 },
    perkNote: '神枪突击兼顾超强机动，移动增至 6 格！',
  },
  {
    fromClass: '土炮队',
    heroIds: ['jiuye'],
    toClass: '大炮队',
    toTitle: '雁北重炮 · 震天九爷',
    toSpriteId: 'promo_dapaodui',
    toWeaponName: '野战重炮台',
    reqLevel: 6,
    reqBook: 'huoqi_jichu',
    bonus: { maxHp: 28, atk: 13, def: 5, rangeMax: 1, critRate: 8 },
    perkNote: '超远射程扩展至惊人的 5 格，隔河轰杀松井司令！',
  },
];

export function emptyPromoBooks(): Record<PromoBookId, number> {
  return {
    wugong_xinfa: 0,
    yezhan_xinfa: 0,
    qiangxie_jichu: 0,
    hongjin: 0,
    junqi: 0,
    youji_xinfa: 0,
    qiangxie_jingdian: 0,
    huoqi_jichu: 0,
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
    maxHp: newMaxHp,
    hp: newMaxHp,
    atk: unit.atk + rule.bonus.atk,
    def: unit.def + rule.bonus.def,
    move: unit.move + (rule.bonus.move ?? 0),
    rangeMax: unit.rangeMax + (rule.bonus.rangeMax ?? 0),
    critRate: (unit.critRate ?? 20) + (rule.bonus.critRate ?? 0),
  };
}
