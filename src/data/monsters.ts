export type ElementType = 'earth' | 'water' | 'fire' | 'wind' | 'light' | 'dark';

export interface Skill {
  name: string;
  description: string;
  effectType: 'petrify' | 'inspiration' | 'burn' | 'shock' | 'heal' | 'curse' | 'slippery';
  duration: number; // Duration in turns, 0 for instant
  value: number; // Value of heal/damage/etc.
}

export interface Monster {
  id: string;
  name: string;
  element: ElementType;
  maxHp: number;
  imageUrl: string;
  skill: Skill;
}

export const MONSTERS: Record<string, Monster> = {
  leafurtle: {
    id: 'leafurtle',
    name: '葉岩龜 (Leafurtle)',
    element: 'earth',
    maxHp: 10,
    imageUrl: new URL('../assets/monsters/leafurtle.png', import.meta.url).href,
    skill: {
      name: '石化',
      description: '對手三回合內無法攻擊（敵方行動回合跳過）',
      effectType: 'petrify',
      duration: 3,
      value: 0
    }
  },
  aquacat: {
    id: 'aquacat',
    name: '水花貓 (Aquacat)',
    element: 'water',
    maxHp: 10,
    imageUrl: new URL('../assets/monsters/aquacat.png', import.meta.url).href,
    skill: {
      name: '滑溜',
      description: '對手五回合內不會發動防禦（傷害不會減免）',
      effectType: 'slippery',
      duration: 5,
      value: 0
    }
  },
  pyrofox: {
    id: 'pyrofox',
    name: '焰狐狸 (Pyrofox)',
    element: 'fire',
    maxHp: 10,
    imageUrl: new URL('../assets/monsters/pyrofox.png', import.meta.url).href,
    skill: {
      name: '燃燒',
      description: '三回合內，我方攻擊成功造成的傷害加 1（傷害 +1）',
      effectType: 'burn',
      duration: 3,
      value: 1
    }
  },
  cloudy: {
    id: 'cloudy',
    name: '雷雲貂 (Cloudy)',
    element: 'wind',
    maxHp: 10,
    imageUrl: new URL('../assets/monsters/cloudy.png', import.meta.url).href,
    skill: {
      name: '電擊',
      description: '三回合內，我方防守成功（答對）時，可對敵方造成 1 點反擊傷害',
      effectType: 'shock',
      duration: 3,
      value: 1
    }
  },
  sunlamb: {
    id: 'sunlamb',
    name: '晨曦羊 (Sunlamb)',
    element: 'light',
    maxHp: 10,
    imageUrl: new URL('../assets/monsters/sunlamb.png', import.meta.url).href,
    skill: {
      name: '治療',
      description: '立即回復自身 2 點血量',
      effectType: 'heal',
      duration: 0,
      value: 2
    }
  },
  shadowing: {
    id: 'shadowing',
    name: '影夜蝠 (Shadowing)',
    element: 'dark',
    maxHp: 10,
    imageUrl: new URL('../assets/monsters/shadowing.png', import.meta.url).href,
    skill: {
      name: '詛咒',
      description: '立即扣除對手 2 點血量',
      effectType: 'curse',
      duration: 0,
      value: 2
    }
  }
};

// Element relations: earth > water > fire > wind > earth. light <-> dark
const COUNTERS: Record<ElementType, ElementType[]> = {
  earth: ['water'],
  water: ['fire'],
  fire: ['wind'],
  wind: ['earth'],
  light: ['dark'],
  dark: ['light']
};

/**
 * Returns the relation from attacker to defender
 * 'advantage' if attacker counters defender
 * 'disadvantage' if defender counters attacker
 * 'neutral' otherwise
 */
export function getRelationship(attacker: ElementType, defender: ElementType): 'advantage' | 'disadvantage' | 'neutral' {
  const attackerCounters = COUNTERS[attacker] || [];
  const defenderCounters = COUNTERS[defender] || [];

  const isAttackingAdvantage = attackerCounters.includes(defender);
  const isDefendingAdvantage = defenderCounters.includes(attacker);

  if (isAttackingAdvantage && isDefendingAdvantage) {
    // For mutually countering elements (light <-> dark)
    return 'advantage';
  }
  if (isAttackingAdvantage) return 'advantage';
  if (isDefendingAdvantage) return 'disadvantage';
  return 'neutral';
}

/**
/**
 * Get option count based on elements, phase type, and skill/item status.
 * - Inspiration active: override to 2 options.
 * - Light and Dark: mutually counter.
 *   - Player is Light, Enemy is Dark: Attack = 5, Defense = 3.
 *   - Player is Dark, Enemy is Light: Attack = 3, Defense = 5.
 * - Standard elements (Earth, Water, Wind, Fire):
 *   - Player counters enemy: 3 options.
 *   - Enemy counters player: 5 options.
 *   - Neutral: 4 options.
 */
export function getOptionCount(
  playerElement: ElementType,
  enemyElement: ElementType,
  phaseType: 'attack' | 'defense',
  isInspirationActive: boolean
): number {
  if (isInspirationActive) {
    return 2;
  }

  // Light and Dark special mutual counter rules
  if (playerElement === 'light' && enemyElement === 'dark') {
    return phaseType === 'attack' ? 5 : 3;
  }
  if (playerElement === 'dark' && enemyElement === 'light') {
    return phaseType === 'attack' ? 3 : 5;
  }

  // Standard elements rules
  const playerCounters = COUNTERS[playerElement] || [];
  const isPlayerAdvantage = playerCounters.includes(enemyElement);

  const enemyCounters = COUNTERS[enemyElement] || [];
  const isPlayerDisadvantage = enemyCounters.includes(playerElement);

  if (isPlayerAdvantage) {
    return 3;
  }
  if (isPlayerDisadvantage) {
    return 5;
  }

  return 4; // Neutral
}
