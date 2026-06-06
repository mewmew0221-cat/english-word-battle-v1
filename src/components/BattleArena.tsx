import React from 'react';
import type { Monster, ElementType } from '../data/monsters';
import { TransparentImage } from './TransparentImage';

interface StatusEffect {
  name: string;
  duration: number;
}

interface BattleArenaProps {
  playerMonster: Monster;
  playerHp: number;
  enemyMonster: Monster;
  enemyHp: number;
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

export const BattleArena: React.FC<BattleArenaProps> = ({
  playerMonster,
  playerHp,
  enemyMonster,
  enemyHp,
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
  phase
}) => {
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

  // Map opponent element to cartoon background class
  const getBackgroundClass = (element: ElementType) => {
    switch (element) {
      case 'earth': return 'bg-grassland';
      case 'water': return 'bg-waterfall';
      case 'fire': return 'bg-volcano';
      case 'wind': return 'bg-wilderness';
      case 'light': return 'bg-temple';
      case 'dark': return 'bg-cave';
      default: return '';
    }
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
      <div className={`relative w-full h-[380px] md:h-[480px] border border-white/5 rounded-3xl overflow-hidden flex flex-row items-center justify-between p-6 shadow-2xl transition-all duration-500 ${getBackgroundClass(enemyMonster.element)}`}>
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

            {/* HP Bar (Larger Height) */}
            <div className="hp-container-large mt-1">
              <div
                className={`hp-bar ${getHpColorClass(playerHp, playerMonster.maxHp)}`}
                style={{ width: `${(playerHp / playerMonster.maxHp) * 100}%` }}
              ></div>
            </div>
            {/* Massive HP Text Redesigned & Enlarged */}
            <div className="flex justify-between items-end mt-1.5">
              <span className="text-sm md:text-base text-white/50 font-black tracking-widest uppercase">HP</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl md:text-5xl font-black tracking-tight ${getHpGlowClass(playerHp, playerMonster.maxHp)}`}>
                  {playerHp}
                </span>
                <span className="text-white/30 text-xl md:text-2xl font-bold">/ {playerMonster.maxHp}</span>
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

        {/* 2. CENTER: VS Badge & Round Phase (Enlarged VS and Badge) */}
        <div className="flex flex-col justify-center items-center z-10 px-2 gap-4">
          <div className="flex items-center justify-center bg-indigo-950/85 border-2 border-indigo-500/50 text-white font-black rounded-full w-16 h-16 md:w-20 md:h-20 shadow-lg text-3xl md:text-4xl tracking-tighter animate-pulse">
            VS
          </div>
          {phase && (
            <div className={`px-6 py-2.5 rounded-full text-lg md:text-2xl font-black tracking-wider border-2 shadow-2xl animate-bounce select-none ${
              phase === 'player-start' || phase === 'question-attack'
                ? 'bg-emerald-500 border-emerald-300 text-white text-shadow-glow'
                : phase === 'question-defense'
                ? 'bg-amber-500 border-amber-300 text-white text-shadow-glow'
                : 'bg-indigo-600 border-indigo-400 text-white'
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

            {/* HP Bar */}
            <div className="hp-container-large mt-1">
              <div
                className={`hp-bar ${getHpColorClass(enemyHp, enemyMonster.maxHp)}`}
                style={{ width: `${(enemyHp / enemyMonster.maxHp) * 100}%` }}
              ></div>
            </div>
            {/* Massive HP Text Redesigned & Enlarged */}
            <div className="flex justify-between items-end mt-1.5">
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl md:text-5xl font-black tracking-tight ${getHpGlowClass(enemyHp, enemyMonster.maxHp)}`}>
                  {enemyHp}
                </span>
                <span className="text-white/30 text-xl md:text-2xl font-bold">/ {enemyMonster.maxHp}</span>
              </div>
              <span className="text-sm md:text-base text-white/50 font-black tracking-widest uppercase">HP</span>
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
            isEnemyAttacking
              ? 'animate-enemy-attack'
              : (isEnemyHit ? 'animate-shake' : 'animate-float')
          }`}>
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
