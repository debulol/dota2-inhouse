// Dota2 英雄数据
// 头像资源来自: https://github.com/bontscho/dota2-minimap-hero-sprites

export const HEROES = [
  // Strength Heroes
  { id: 'abaddon', name: '亚巴顿', nameEn: 'Abaddon' },
  { id: 'alchemist', name: '炼金术士', nameEn: 'Alchemist' },
  { id: 'axe', name: '斧王', nameEn: 'Axe' },
  { id: 'beastmaster', name: '兽王', nameEn: 'Beastmaster' },
  { id: 'brewmaster', name: '酒仙', nameEn: 'Brewmaster' },
  { id: 'bristleback', name: '钢背兽', nameEn: 'Bristleback' },
  { id: 'centaur', name: '半人马战行者', nameEn: 'Centaur Warrunner' },
  { id: 'chaos_knight', name: '混沌骑士', nameEn: 'Chaos Knight' },
  { id: 'clockwerk', name: '发条技师', nameEn: 'Clockwerk' },
  { id: 'dawnbreaker', name: '破晓辰星', nameEn: 'Dawnbreaker' },
  { id: 'doom_bringer', name: '末日使者', nameEn: 'Doom' },
  { id: 'dragon_knight', name: '龙骑士', nameEn: 'Dragon Knight' },
  { id: 'earth_spirit', name: '大地之灵', nameEn: 'Earth Spirit' },
  { id: 'earthshaker', name: '撼地者', nameEn: 'Earthshaker' },
  { id: 'elder_titan', name: '上古巨神', nameEn: 'Elder Titan' },
  { id: 'huskar', name: '哈斯卡', nameEn: 'Huskar' },
  { id: 'kunkka', name: '昆卡', nameEn: 'Kunkka' },
  { id: 'legion_commander', name: '军团指挥官', nameEn: 'Legion Commander' },
  { id: 'lifestealer', name: '噬魂鬼', nameEn: 'Lifestealer' },
  { id: 'mars', name: '玛尔斯', nameEn: 'Mars' },
  { id: 'night_stalker', name: '暗夜魔王', nameEn: 'Night Stalker' },
  { id: 'omniknight', name: '全能骑士', nameEn: 'Omniknight' },
  { id: 'phoenix', name: '凤凰', nameEn: 'Phoenix' },
  { id: 'pudge', name: '帕吉', nameEn: 'Pudge' },
  { id: 'sand_king', name: '沙王', nameEn: 'Sand King' },
  { id: 'slardar', name: '斯拉达', nameEn: 'Slardar' },
  { id: 'snapfire', name: '电炎绝手', nameEn: 'Snapfire' },
  { id: 'spirit_breaker', name: '裂魂人', nameEn: 'Spirit Breaker' },
  { id: 'sven', name: '斯温', nameEn: 'Sven' },
  { id: 'tidehunter', name: '潮汐猎人', nameEn: 'Tidehunter' },
  { id: 'timbersaw', name: '伐木机', nameEn: 'Timbersaw' },
  { id: 'tiny', name: '小小', nameEn: 'Tiny' },
  { id: 'treant', name: '树精卫士', nameEn: 'Treant Protector' },
  { id: 'tusk', name: '巨牙海民', nameEn: 'Tusk' },
  { id: 'underlord', name: '孽主', nameEn: 'Underlord' },
  { id: 'undying', name: '不朽尸王', nameEn: 'Undying' },
  { id: 'wraith_king', name: '冥魂大帝', nameEn: 'Wraith King' },

  // Agility Heroes
  { id: 'antimage', name: '敌法师', nameEn: 'Anti-Mage' },
  { id: 'arc_warden', name: '天穹守望者', nameEn: 'Arc Warden' },
  { id: 'bloodseeker', name: '血魔', nameEn: 'Bloodseeker' },
  { id: 'bounty_hunter', name: '赏金猎人', nameEn: 'Bounty Hunter' },
  { id: 'broodmother', name: '育母蜘蛛', nameEn: 'Broodmother' },
  { id: 'clinkz', name: '克林克兹', nameEn: 'Clinkz' },
  { id: 'drow_ranger', name: '卓尔游侠', nameEn: 'Drow Ranger' },
  { id: 'ember_spirit', name: '灰烬之灵', nameEn: 'Ember Spirit' },
  { id: 'faceless_void', name: '虚空假面', nameEn: 'Faceless Void' },
  { id: 'gyrocopter', name: '矮人直升机', nameEn: 'Gyrocopter' },
  { id: 'hoodwink', name: '森海飞霞', nameEn: 'Hoodwink' },
  { id: 'juggernaut', name: '主宰', nameEn: 'Juggernaut' },
  { id: 'lone_druid', name: '德鲁伊', nameEn: 'Lone Druid' },
  { id: 'luna', name: '露娜', nameEn: 'Luna' },
  { id: 'medusa', name: '美杜莎', nameEn: 'Medusa' },
  { id: 'meepo', name: '米波', nameEn: 'Meepo' },
  { id: 'monkey_king', name: '齐天大圣', nameEn: 'Monkey King' },
  { id: 'morphling', name: '变体精灵', nameEn: 'Morphling' },
  { id: 'naga_siren', name: '娜迦海妖', nameEn: 'Naga Siren' },
  { id: 'nyx_assassin', name: '司夜刺客', nameEn: "Nyx Assassin" },
  { id: 'pangolier', name: '石鳞剑士', nameEn: 'Pangolier' },
  { id: 'phantom_assassin', name: '幻影刺客', nameEn: 'Phantom Assassin' },
  { id: 'phantom_lancer', name: '幻影长矛手', nameEn: 'Phantom Lancer' },
  { id: 'razor', name: '剃刀', nameEn: 'Razor' },
  { id: 'riki', name: '力丸', nameEn: 'Riki' },
  { id: 'shadow_fiend', name: '影魔', nameEn: 'Shadow Fiend' },
  { id: 'slark', name: '斯拉克', nameEn: 'Slark' },
  { id: 'sniper', name: '狙击手', nameEn: 'Sniper' },
  { id: 'spectre', name: '幽鬼', nameEn: 'Spectre' },
  { id: 'templar_assassin', name: '圣堂刺客', nameEn: 'Templar Assassin' },
  { id: 'terrorblade', name: '恐怖利刃', nameEn: 'Terrorblade' },
  { id: 'troll_warlord', name: '巨魔战将', nameEn: 'Troll Warlord' },
  { id: 'ursa', name: '熊战士', nameEn: 'Ursa' },
  { id: 'vengeful_spirit', name: '复仇之魂', nameEn: 'Vengeful Spirit' },
  { id: 'venomancer', name: '剧毒术士', nameEn: 'Venomancer' },
  { id: 'viper', name: '冥界亚龙', nameEn: 'Viper' },
  { id: 'weaver', name: '编织者', nameEn: 'Weaver' },

  // Intelligence Heroes
  { id: 'ancient_apparition', name: '远古冰魄', nameEn: 'Ancient Apparition' },
  { id: 'bane', name: '祸乱之源', nameEn: 'Bane' },
  { id: 'batrider', name: '蝙蝠骑士', nameEn: 'Batrider' },
  { id: 'chen', name: '陈', nameEn: 'Chen' },
  { id: 'crystal_maiden', name: '水晶室女', nameEn: 'Crystal Maiden' },
  { id: 'dark_seer', name: '黑暗贤者', nameEn: 'Dark Seer' },
  { id: 'dark_willow', name: '邪影芳灵', nameEn: 'Dark Willow' },
  { id: 'dazzle', name: '戴泽', nameEn: 'Dazzle' },
  { id: 'death_prophet', name: '死亡先知', nameEn: 'Death Prophet' },
  { id: 'disruptor', name: '干扰者', nameEn: 'Disruptor' },
  { id: 'enchantress', name: '魅惑魔女', nameEn: 'Enchantress' },
  { id: 'enigma', name: '谜团', nameEn: 'Enigma' },
  { id: 'grimstroke', name: '天涯墨客', nameEn: 'Grimstroke' },
  { id: 'invoker', name: '祈求者', nameEn: 'Invoker' },
  { id: 'jakiro', name: '杰奇洛', nameEn: 'Jakiro' },
  { id: 'keeper_of_the_light', name: '光之守卫', nameEn: 'Keeper of the Light' },
  { id: 'leshrac', name: '拉席克', nameEn: 'Leshrac' },
  { id: 'lich', name: '巫妖', nameEn: 'Lich' },
  { id: 'lina', name: '莉娜', nameEn: 'Lina' },
  { id: 'lion', name: '莱恩', nameEn: 'Lion' },
  { id: 'muerta', name: '幽冥亡魂', nameEn: 'Muerta' },
  { id: 'nature_prophet', name: '先知', nameEn: "Nature's Prophet" },
  { id: 'necrophos', name: '瘟疫法师', nameEn: 'Necrophos' },
  { id: 'oracle', name: '神谕者', nameEn: 'Oracle' },
  { id: 'outworld_destroyer', name: '殁境神蚀者', nameEn: 'Outworld Destroyer' },
  { id: 'puck', name: '帕克', nameEn: 'Puck' },
  { id: 'pugna', name: '帕格纳', nameEn: 'Pugna' },
  { id: 'queen_of_pain', name: '痛苦女王', nameEn: 'Queen of Pain' },
  { id: 'rubick', name: '拉比克', nameEn: 'Rubick' },
  { id: 'shadow_demon', name: '暗影恶魔', nameEn: 'Shadow Demon' },
  { id: 'shadow_shaman', name: '暗影萨满', nameEn: 'Shadow Shaman' },
  { id: 'silencer', name: '沉默术士', nameEn: 'Silencer' },
  { id: 'skywrath_mage', name: '天怒法师', nameEn: 'Skywrath Mage' },
  { id: 'storm_spirit', name: '风暴之灵', nameEn: 'Storm Spirit' },
  { id: 'tinker', name: '修补匠', nameEn: 'Tinker' },
  { id: 'visage', name: '维萨吉', nameEn: 'Visage' },
  { id: 'void_spirit', name: '虚无之灵', nameEn: 'Void Spirit' },
  { id: 'warlock', name: '术士', nameEn: 'Warlock' },
  { id: 'witch_doctor', name: '巫医', nameEn: 'Witch Doctor' },
  { id: 'zeus', name: '宙斯', nameEn: 'Zeus' },
]

/**
 * 根据英雄ID获取英雄头像URL
 */
export function getHeroIcon(heroId) {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroId}.png`
}

/**
 * 根据英雄ID获取英雄信息
 */
export function getHeroById(heroId) {
  return HEROES.find(h => h.id === heroId)
}

/**
 * 根据英雄名称搜索英雄
 */
export function searchHeroes(query) {
  const lowerQuery = query.toLowerCase()
  return HEROES.filter(h => 
    h.name.includes(query) || 
    h.nameEn.toLowerCase().includes(lowerQuery)
  )
}

/**
 * 按属性分组英雄
 */
export const HEROES_BY_ATTRIBUTE = {
  strength: HEROES.slice(0, 37),
  agility: HEROES.slice(37, 81),
  intelligence: HEROES.slice(81)
}
