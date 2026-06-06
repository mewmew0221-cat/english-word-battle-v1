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
  onContinue: () => void;
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
  onContinue
}) => {
  return (
    <div className="glass-panel battle-action-panel w-full flex flex-col gap-4 animate-pop justify-between">
      {/* 1. Player Start Phase: Select skill or start attack */}
      {phase === 'player-start' && (
        <div className="flex flex-col gap-5 items-center justify-center py-4">
          <p className="text-white/70 text-center text-base md:text-lg max-w-xl font-bold leading-relaxed">
            你可以先施放強力的屬性技能（每場限用一次），或是直接開始挑戰英文單字題進行攻擊！
          </p>

          <div className="flex flex-col md:flex-row gap-5 w-full max-w-2xl justify-center mt-1">
            {/* Skill Button (Enlarged) */}
            <button
              onClick={onUseSkill}
              disabled={isSkillUsed}
              className={`flex-1 flex flex-col items-center p-5 border-2 rounded-2xl transition-all ${
                isSkillUsed
                  ? 'skill-phantom'
                  : 'bg-indigo-950/20 border-indigo-500/40 hover:border-indigo-400 hover:bg-indigo-950/40 active:scale-98 cursor-pointer shadow-lg'
              }`}
            >
              <span className="font-black text-2xl md:text-3xl text-indigo-300 flex items-center gap-2">
                ⚡ 技能：{skill.name}
              </span>
              <span className="text-md md:text-lg text-white/60 mt-2 text-center font-bold">
                {skill.description}
              </span>
              <span className="text-xs mt-3 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-black">
                {isSkillUsed ? '已施放' : '點擊使用 (限一次)'}
              </span>
            </button>

            {/* Attack Button (Enlarged) */}
            <button
              onClick={onStartAttack}
              className="flex-1 btn-primary text-3xl md:text-4xl font-black flex flex-col items-center justify-center p-5 shadow-2xl"
            >
              <span>⚔️ 開始攻擊</span>
              <span className="text-md md:text-lg text-indigo-200 font-bold mt-2">進入單字填充挑戰</span>
            </button>
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

          {/* Continue Action (Enlarged) */}
          {isAnswered && (
            <div className="w-full flex justify-end mt-2 animate-pop">
              <button onClick={onContinue} className="btn-primary flex items-center gap-2 px-10 py-4 text-xl font-black shadow-2xl">
                <span>繼續</span>
                <span>➔</span>
              </button>
            </div>
          )}
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
