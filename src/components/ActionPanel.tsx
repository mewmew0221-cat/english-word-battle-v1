import React from 'react';
import type { Question } from '../data/questions';
import type { Skill } from '../data/monsters';

interface ActionPanelProps {
  currentQuestion: Question | null;
  options: string[];
  isAnswered: boolean;
  selectedAnswer: string | null;
  isSkillUsed: boolean;
  skill: Skill;
  phase: 'player-start' | 'question-attack' | 'question-defense' | 'round-end';
  onUseSkill: () => void;
  onStartAttack: () => void;
  onSelectAnswer: (answer: string) => void;
  onOpenInventory?: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  currentQuestion,
  options,
  isAnswered,
  selectedAnswer,
  isSkillUsed,
  skill,
  phase,
  onUseSkill,
  onStartAttack,
  onSelectAnswer,
  onOpenInventory
}) => {
  return (
    <div className="glass-panel battle-action-panel w-full flex flex-col gap-4 animate-pop justify-between">
      {/* 1. Player Start Phase: Select skill or start attack */}
      {phase === 'player-start' && (
        <div className="flex flex-col gap-5 items-center justify-center py-4">
          <p className="text-white/70 text-center text-base md:text-lg max-w-xl font-bold leading-relaxed">
            你可以先施放強力的屬性技能，使用道具進行輔助，或是直接開始挑戰英文單字題進行攻擊！
          </p>

          <div className="flex flex-col gap-4 w-full max-w-4xl mt-1">
            {/* Attack Button (Enlarged and full width at top) */}
            <button
              onClick={onStartAttack}
              className="w-full btn-primary text-2xl md:text-3xl font-black py-4 shadow-2xl rounded-2xl cursor-pointer"
            >
              <span>⚔️ 開始答題攻擊</span>
            </button>

            {/* Bottom Row: Skill and Items side-by-side */}
            <div className="flex flex-row gap-4 w-full">
              {/* Skill Button */}
              <button
                onClick={onUseSkill}
                disabled={isSkillUsed}
                className={`flex-1 flex flex-col items-center justify-center p-3 border-2 rounded-2xl transition-all ${
                  isSkillUsed
                    ? 'skill-phantom'
                    : 'bg-indigo-950/20 border-indigo-500/40 hover:border-indigo-400 hover:bg-indigo-950/40 active:scale-98 cursor-pointer shadow-lg'
                }`}
              >
                <span className="font-black text-lg md:text-xl text-indigo-300 flex items-center gap-1.5">
                  ⚡ 技能: {skill.name}
                </span>
                <span className="text-xs text-white/50 mt-1 text-center hidden md:inline">
                  {skill.description}
                </span>
              </button>

              {/* Items Button */}
              {onOpenInventory && (
                <button
                  onClick={onOpenInventory}
                  className="flex-1 btn-secondary text-lg md:text-xl font-black flex flex-col items-center justify-center p-3 shadow-lg bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 cursor-pointer rounded-2xl"
                >
                  <span className="flex items-center gap-1.5">🎒 使用道具</span>
                  <span className="text-xs text-amber-400/60 font-bold mt-1 hidden md:inline">
                    使用藥水與盾牌輔助
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Question Phase (Attack or Defense) */}
      {(phase === 'question-attack' || phase === 'question-defense') && currentQuestion && (
        <div className="flex flex-col gap-4 w-full">
          {/* Header info (Enlarged) */}
          <div className="flex justify-between items-center text-sm md:text-base font-black tracking-wider">
            <span className={phase === 'question-attack' ? 'text-emerald-400' : 'text-amber-400'}>
              {phase === 'question-attack' ? '⚔️ 單字填空挑戰' : '🛡️ 文法防禦挑戰'}
            </span>
            <span className="text-white/50">適合 {currentQuestion.grade} 年級</span>
          </div>

          {/* Question Text (Enlarged to text-3xl/5xl) */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-6 text-center shadow-inner">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-normal text-slate-100 tracking-wide">
              {currentQuestion.question.split('________').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="inline-block border-b-8 border-indigo-400 px-6 min-w-[120px] text-indigo-300 font-black animate-pulse">
                      {isAnswered ? selectedAnswer || questionAnswerPlaceholder(currentQuestion.answer) : ' ? '}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </h2>
          </div>

          {/* Option Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {options.map((option, index) => {
              const letter = String.fromCharCode(65 + index); // A, B, C, D, E
              
              // Styles based on answer status
              let btnClass = '';
              if (isAnswered) {
                if (option === currentQuestion.answer) {
                  btnClass = 'correct';
                } else if (option === selectedAnswer) {
                  btnClass = 'incorrect';
                }
              }

              return (
                <button
                  key={index}
                  disabled={isAnswered}
                  onClick={() => onSelectAnswer(option)}
                  className={`option-button p-5 ${btnClass}`}
                >
                  <div className="flex items-center">
                    {/* Inline styled enlarged option index */}
                    <span className="option-index w-10 h-10 text-xl font-black mr-4">{letter}</span>
                    <span className="truncate text-2xl md:text-3xl font-black">{option}</span>
                  </div>
                  {isAnswered && option === currentQuestion.answer && (
                    <span className="text-emerald-400 text-base font-black">✓ 正確</span>
                  )}
                  {isAnswered && option === selectedAnswer && option !== currentQuestion.answer && (
                    <span className="text-rose-400 text-base font-black">✗ 答錯</span>
                  )}
                </button>
              );
            })}
          </div>

        </div>
      )}

      {/* 3. Empty state in case of results or transition */}
      {phase === 'round-end' && (
        <div className="flex flex-col gap-3 items-center justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          <span className="text-white/60 font-black text-base">結算回合中...</span>
        </div>
      )}
    </div>
  );
};

// Helper for showing correct answer inside blank
function questionAnswerPlaceholder(answer: string): string {
  return ` ${answer} `;
}
