import React from 'react';
import type { Monster, ElementType } from '../data/monsters';
import { TransparentImage } from './TransparentImage';

interface StatusEffect {
  name: string;
  duration: number;
}

interface BattleArenaProps {
  backgroundImage: string;
  playerMonster: Monster;
  playerHp: number;
  playerLevel: number;
  enemyMonster: Monster;
  enemyHp: number;
  enemyLevel: number;
  isPlayerHit: boolean;
  isEnemyHit: boolean;
  isShieldActive: boolean;
  isPlayerAttacking: boolean;
  isEnemyAttacking: boolean;
  playerEffects: StatusEffect[];
  enemyEffects: StatusEffect[];
  battleLog: string;
  round: number;
  activeEffect: { type: ElementType; target: 'player' | 'enemy'; style: 'attack' | 'defense' } | null;
  phase: 'player-start' | 'question-attack' | 'question-defense' | 'round-end';
  isEnemyDefending?: boolean;
  isEnemyDefeated?: boolean;
}

const ELEMENT_LABELS: Record<ElementType, string> = {
  earth: '土(草)',
  water: '水',
  fire: '火',
  wind: '風(雷)',
  light: '光',
  dark: '暗'
};

const getElementEffectSymbols = (type: ElementType, style: 'attack' | 'defense' = 'attack') => {
  if (style === 'defense') {
    switch (type) {
      case 'fire':
        return <div className="element-shield-fire">🔥🛡️</div>;
      case 'water':
        return <div className="element-shield-water">💧🛡️</div>;
      case 'earth':
        return <div className="element-shield-earth">🪨🛡️</div>;
      case 'wind':
        return <div className="element-shield-wind">🌪️🛡️</div>;
      case 'light':
        return <div className="element-shield-light">✨🛡️</div>;
      case 'dark':
        return <div className="element-shield-dark">🔮🛡️</div>;
      default:
        return null;
    }
  }

  switch (type) {
    case 'fire':
      return <div className="element-hit-fire">🔥💥</div>;
    case 'water':
      return <div className="element-hit-water">💦🌊</div>;
    case 'earth':
      return <div className="element-hit-earth">🌱🪨</div>;
    case 'wind':
      return <div className="element-hit-wind">🌪️💨</div>;
    case 'light':
      return <div className="element-hit-light">✨☀️</div>;
    case 'dark':
      return <div className="element-hit-dark">💀🔮</div>;
    default:
      return null;
  }
};

const getMonsterStats = (level: number) => {
  return {
    atk: 1 + Math.floor((level - 1) / 3),
    def: 1 + Math.floor((level - 1) / 4),
    maxHp: level === 10 ? 20 : 10 + (level - 1)
  };
};

export const BattleArena: React.FC<BattleArenaProps> = ({
  backgroundImage,
  playerMonster,
  playerHp,
  playerLevel,
  enemyMonster,
  enemyHp,
  enemyLevel,
  isPlayerHit,
  isEnemyHit,
  isShieldActive,
  isPlayerAttacking,
  isEnemyAttacking,
  playerEffects,
  enemyEffects,
  battleLog,
  round,
  activeEffect,
  phase,
  isEnemyDefending = false,
  isEnemyDefeated = false
}) => {
  const playerStats = getMonsterStats(playerLevel);
  const enemyStats = getMonsterStats(enemyLevel);
  // Helper to determine HP bar color class
  const getHpColorClass = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio <= 0.25) return 'low';
    if (ratio <= 0.6) return 'medium';
    return '';
  };

  // Helper to determine HP text glow class
  const getHpGlowClass = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio <= 0.25) return 'hp-glow-low';
    if (ratio <= 0.6) return 'hp-glow-medium';
    return 'hp-glow-high';
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* Top Bar: Stage & Round (Enlarged Text) */}
      <div className="flex justify-between items-center bg-[#1e223b] border border-white/5 px-6 py-4 rounded-2xl shadow-lg">
        <span className="text-white/80 font-black text-xl md:text-2xl">第 {round} 回合</span>
        <span className="text-indigo-400 font-black text-2xl md:text-3xl tracking-widest uppercase">對戰競技場</span>
        <span className="text-white/80 font-black text-xl md:text-2xl">對抗模式</span>
      </div>

      {/* Battle Log Box (Moved to Top & Enlarged Text) */}
      <div className="w-full bg-[#111424]/90 border border-white/5 rounded-2xl p-4 shadow-inner min-h-[70px] flex items-center justify-center text-center">
        <p className="text-indigo-200 font-black text-xl md:text-2xl tracking-wide leading-relaxed animate-pop">
          {battleLog || '準備就緒！請選擇技能或進行答題...'}
        </p>
      </div>

      {/* Main Symmetrical Battle Screen (Expanded height to 380px/480px to hold larger sprites) */}
      <div 
        className="relative w-full h-[380px] md:h-[480px] border border-white/5 rounded-3xl overflow-hidden flex flex-row items-center justify-between p-6 shadow-2xl transition-all duration-500"
        style={{
          backgroundImage: `url('./${backgroundImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Background Overlay for Cartoon Depth */}
        <div className="absolute inset-0 bg-black/15 pointer-events-none"></div>

        {/* 1. LEFT SIDE: Player Monster */}
        <div className={`flex-1 flex flex-col items-center gap-6 z-10 animate-slide-left ${isPlayerHit ? 'animate-shake' : ''}`}>
          {/* Stats Box (Enlarged Text & Spacing) */}
          <div className="battle-stats-box">
            <div className="flex justify-between items-center">
              <span className="font-black text-white text-2xl md:text-3xl">{playerMonster.name.split(' ')[0]}</span>
              <span className={`element-badge ${playerMonster.element} px-4 py-1.5 text-sm md:text-md font-black`}>
                {ELEMENT_LABELS[playerMonster.element]}
              </span>
            </div>

            {/* HP Text above HP Bar (Enlarged HP Title and Numbers) */}
            <div className="flex justify-between items-end mt-2">
              <span className="text-md md:text-lg text-rose-400 font-extrabold tracking-wider">HP</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl md:text-4xl font-black tracking-tight ${getHpGlowClass(playerHp, playerStats.maxHp)}`}>
                  {playerHp}
                </span>
                <span className="text-white/40 text-lg md:text-xl font-bold">/ {playerStats.maxHp}</span>
              </div>
            </div>

            {/* HP Bar (Larger Height) */}
            <div className="hp-container-large mt-1">
              <div
                className={`hp-bar ${getHpColorClass(playerHp, playerStats.maxHp)}`}
                style={{ width: `${(playerHp / playerStats.maxHp) * 100}%` }}
              ></div>
            </div>

            {/* Level, ATK, DEF Display Grid (Rearranged and Enlarged) */}
            <div className="grid grid-cols-3 gap-2 mt-3 w-full text-center">
              <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-1 flex flex-col justify-center items-center">
                <span className="text-white/40 text-[11px] md:text-xs font-bold uppercase tracking-wider">等級</span>
                <span className="text-indigo-300 text-base md:text-lg font-black mt-0.5">Lv.{playerLevel}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-1 flex flex-col justify-center items-center">
                <span className="text-white/40 text-[11px] md:text-xs font-bold uppercase tracking-wider">攻擊</span>
                <span className="text-rose-400 text-base md:text-lg font-black mt-0.5">⚔️ {playerStats.atk}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-1 flex flex-col justify-center items-center">
                <span className="text-white/40 text-[11px] md:text-xs font-bold uppercase tracking-wider">防禦</span>
                <span className="text-emerald-400 text-base md:text-lg font-black mt-0.5">🛡️ {playerStats.def}</span>
              </div>
            </div>

            {/* Buffs & Status effects (Enlarged) */}
            {playerEffects.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-1">
                {playerEffects.map((eff, index) => (
                  <span key={index} className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 rounded-md text-[11px] font-black animate-pulse">
                    {eff.name} ({eff.duration}T)
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sprite Box (Significantly Enlarged, image scale-130 applied to remove PNG whitespace) */}
          <div className={`relative w-44 h-44 md:w-64 md:h-64 flex items-center justify-center bg-white/5 rounded-full border border-white/10 shadow-lg ${
            isPlayerAttacking
              ? 'animate-player-attack'
              : (isPlayerHit ? 'animate-shake' : 'animate-float')
          } ${isShieldActive ? 'animate-shield' : ''}`}>
            <TransparentImage
              src={playerMonster.imageUrl}
              alt={playerMonster.name}
              className="w-40 h-40 md:w-56 md:h-56 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] z-0 transform scale-130"
            />
            {/* Shield Dome overlay */}
            {isShieldActive && (
              <div className="absolute inset-0 bg-[#00bcd4]/15 rounded-full border-4 border-[#00bcd4] animate-ping opacity-75 pointer-events-none"></div>
            )}
            {/* Damage/Hit/Shield effect overlay */}
            {activeEffect && activeEffect.target === 'player' && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                {getElementEffectSymbols(activeEffect.type, activeEffect.style)}
              </div>
            )}
          </div>
        </div>

        {/* 2. CENTER: VS Badge & Round Phase (Enlarged VS and Badge with Premium Styling) */}
        <div className="flex flex-col justify-center items-center z-10 px-2 gap-4">
          <div className="vs-badge-epic">
            VS
          </div>
          {phase && (
            <div className={`phase-banner-epic ${
              phase === 'player-start' || phase === 'question-attack'
                ? 'player-attack'
                : phase === 'question-defense'
                ? 'player-defense'
                : 'settlement'
            }`}>
              {phase === 'player-start' || phase === 'question-attack' ? '我方攻擊' : phase === 'question-defense' ? '我方防守' : '結算中'}
            </div>
          )}
        </div>

        {/* 3. RIGHT SIDE: Opponent Monster */}
        <div className={`flex-1 flex flex-col items-center gap-6 z-10 animate-slide-right ${isEnemyHit ? 'animate-shake' : ''}`}>
          {/* Stats Box (Enlarged Text & Spacing) */}
          <div className="battle-stats-box">
            <div className="flex justify-between items-center">
              <span className={`element-badge ${enemyMonster.element} px-4 py-1.5 text-sm md:text-md font-black`}>
                {ELEMENT_LABELS[enemyMonster.element]}
              </span>
              <span className="font-black text-white text-2xl md:text-3xl">{enemyMonster.name.split(' ')[0]}</span>
            </div>

            {/* HP Text above HP Bar (Enlarged HP Title and Numbers) */}
            <div className="flex justify-between items-end mt-2">
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl md:text-4xl font-black tracking-tight ${getHpGlowClass(enemyHp, enemyStats.maxHp)}`}>
                  {enemyHp}
                </span>
                <span className="text-white/40 text-lg md:text-xl font-bold">/ {enemyStats.maxHp}</span>
              </div>
              <span className="text-md md:text-lg text-rose-400 font-extrabold tracking-wider">HP</span>
            </div>

            {/* HP Bar (Larger Height) */}
            <div className="hp-container-large mt-1">
              <div
                className={`hp-bar ${getHpColorClass(enemyHp, enemyStats.maxHp)}`}
                style={{ width: `${(enemyHp / enemyStats.maxHp) * 100}%` }}
              ></div>
            </div>

            {/* Level, ATK, DEF Display Grid (Rearranged and Enlarged) */}
            <div className="grid grid-cols-3 gap-2 mt-3 w-full text-center">
              <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-1 flex flex-col justify-center items-center">
                <span className="text-white/40 text-[11px] md:text-xs font-bold uppercase tracking-wider">等級</span>
                <span className="text-indigo-300 text-base md:text-lg font-black mt-0.5">Lv.{enemyLevel}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-1 flex flex-col justify-center items-center">
                <span className="text-white/40 text-[11px] md:text-xs font-bold uppercase tracking-wider">攻擊</span>
                <span className="text-rose-400 text-base md:text-lg font-black mt-0.5">⚔️ {enemyStats.atk}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-1 flex flex-col justify-center items-center">
                <span className="text-white/40 text-[11px] md:text-xs font-bold uppercase tracking-wider">防禦</span>
                <span className="text-emerald-400 text-base md:text-lg font-black mt-0.5">🛡️ {enemyStats.def}</span>
              </div>
            </div>

            {/* Buffs & Status effects (Enlarged) */}
            {enemyEffects.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-1 justify-end">
                {enemyEffects.map((eff, index) => (
                  <span key={index} className="px-2.5 py-1 bg-rose-950/80 border border-rose-500/30 text-rose-300 rounded-md text-[11px] font-black animate-pulse">
                    {eff.name} ({eff.duration}T)
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sprite Box (Significantly Enlarged, image scale-130 applied to remove PNG whitespace) */}
          <div className={`relative w-44 h-44 md:w-64 md:h-64 flex items-center justify-center bg-white/5 rounded-full border border-white/10 shadow-lg ${
            isEnemyDefeated
              ? 'animate-fly-out'
              : isEnemyAttacking
              ? 'animate-enemy-attack'
              : (isEnemyHit ? 'animate-shake' : 'animate-float')
          }`}>
            {isEnemyDefending && (
              <div className="absolute top-2 left-2 bg-amber-500 border border-amber-300 text-white font-extrabold px-3 py-1 rounded-lg text-xs md:text-sm shadow-md animate-pulse z-30">
                🛡️ 防守中
              </div>
            )}
            <TransparentImage
              src={enemyMonster.imageUrl}
              alt={enemyMonster.name}
              className="w-40 h-40 md:w-56 md:h-56 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] z-0 transform scale-130"
            />
            {/* Damage/Hit/Shield effect overlay */}
            {activeEffect && activeEffect.target === 'enemy' && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                {getElementEffectSymbols(activeEffect.type, activeEffect.style)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
