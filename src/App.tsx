import { useState, useEffect } from 'react';
import { MONSTERS, type Monster, getRelationship, getOptionCount, type ElementType } from './data/monsters';
import { DEFAULT_QUESTIONS, type Question, getOptionsForQuestion } from './data/questions';
import { type PlayerSave, saveSystem } from './utils/saveSystem';
import { BattleArena } from './components/BattleArena';
import { ActionPanel } from './components/ActionPanel';
import { ParentDashboard } from './components/ParentDashboard';

type GameState = 'profile-select' | 'monster-select' | 'library-select' | 'battle' | 'game-over';

interface StatusEffect {
  name: string;
  type: 'petrify' | 'inspiration' | 'burn' | 'shock';
  duration: number;
}

export default function App() {
  // Global States
  const [profiles, setProfiles] = useState<string[]>([]);
  const [currentProfile, setCurrentProfile] = useState<PlayerSave | null>(null);
  const [gameState, setGameState] = useState<GameState>('profile-select');
  const [showDashboard, setShowDashboard] = useState(false);

  // New Profile Input State
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'1-2' | '3-4'>('1-2');

  // Battle Selection States
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('default'); // 'default', 'wrong', or custom library id
  const [playerMonster, setPlayerMonster] = useState<Monster | null>(null);
  const [enemyMonster, setEnemyMonster] = useState<Monster | null>(null);

  // Battle Combat Loop States
  const [round, setRound] = useState(1);
  const [playerHp, setPlayerHp] = useState(10);
  const [enemyHp, setEnemyHp] = useState(10);
  const [battlePhase, setBattlePhase] = useState<'player-start' | 'question-attack' | 'question-defense' | 'round-end'>('player-start');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSkillUsed, setIsSkillUsed] = useState(false);

  // Buffs / Effects
  const [playerEffects, setPlayerEffects] = useState<StatusEffect[]>([]);
  const [enemyEffects, setEnemyEffects] = useState<StatusEffect[]>([]);

  // Animation States
  const [isPlayerHit, setIsPlayerHit] = useState(false);
  const [isEnemyHit, setIsEnemyHit] = useState(false);
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [battleLog, setBattleLog] = useState('');
  const [activeEffect, setActiveEffect] = useState<{ type: ElementType; target: 'player' | 'enemy'; style: 'attack' | 'defense' } | null>(null);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);

  // Battle History (for wrong questions accumulation)
  const [wrongAnswersInBattle, setWrongAnswersInBattle] = useState<Question[]>([]);

  // Load profiles on start
  useEffect(() => {
    setProfiles(saveSystem.getProfiles());
  }, []);

  // Update profile and sync LocalStorage
  const handleProfileSave = (updated: PlayerSave) => {
    setCurrentProfile(updated);
    saveSystem.saveProfile(updated);
    setProfiles(saveSystem.getProfiles());
  };

  // Create profile handler
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return alert('請輸入姓名！');
    if (profiles.includes(newProfileName.trim())) return alert('角色名字已存在！');

    const newSave = saveSystem.loadProfile(newProfileName.trim());
    newSave.grade = selectedGrade;
    handleProfileSave(newSave);
    setNewProfileName('');
  };

  // Start battle setup
  const handleSelectMonster = (monster: Monster) => {
    setPlayerMonster(monster);
    // Auto save selection
    if (currentProfile) {
      handleProfileSave({ ...currentProfile, selectedMonsterId: monster.id });
    }
    setGameState('library-select');
  };

  const handleStartBattle = () => {
    if (!playerMonster) return;

    // Pick a random enemy monster
    const monsterKeys = Object.keys(MONSTERS);
    const randomKey = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
    const enemy = MONSTERS[randomKey];

    setEnemyMonster(enemy);
    setRound(1);
    setPlayerHp(playerMonster.maxHp);
    setEnemyHp(enemy.maxHp);
    setIsSkillUsed(false);
    setPlayerEffects([]);
    setEnemyEffects([]);
    setWrongAnswersInBattle([]);
    setBattleLog(`戰鬥開始！我方「${playerMonster.name}」對抗敵方「${enemy.name}」！`);
    setBattlePhase('player-start');
    setGameState('battle');
  };

  // Get active question pool from the selected library
  const getQuestionPool = (type: 'attack' | 'defense'): Question[] => {
    if (!currentProfile) return [];

    const grade = currentProfile.grade;

    if (selectedLibraryId === 'default') {
      return DEFAULT_QUESTIONS.filter((q) => q.grade === grade && q.type === type);
    }

    if (selectedLibraryId === 'wrong') {
      return Object.values(currentProfile.wrongQuestions)
        .filter((q) => q.type === type)
        .map((q) => ({
          id: q.id,
          type: q.type,
          grade: q.grade,
          question: q.question,
          answer: q.answer,
          distractors: q.distractors
        }));
    }

    // Custom Library
    const customLib = currentProfile.customLibraries[selectedLibraryId];
    if (customLib) {
      return customLib.questions
        .filter((q) => q.type === type)
        .map((q, index) => ({
          id: `custom_${customLib.id}_${index}`,
          type: q.type,
          grade: grade, // fallback
          question: q.question,
          answer: q.answer,
          distractors: q.distractors
        }));
    }

    return [];
  };

  // 1. Skill Activation
  const handleUseSkill = () => {
    if (!playerMonster || isSkillUsed || !enemyMonster) return;

    setIsSkillUsed(true);
    const skill = playerMonster.skill;

    // Apply immediate or turn-based effects
    switch (skill.effectType) {
      case 'heal':
        setPlayerHp((prev) => Math.min(playerMonster.maxHp, prev + skill.value));
        setBattleLog(`✨ 施放【${skill.name}】！回復了我方 2 點血量。`);
        break;
      case 'curse':
        setEnemyHp((prev) => Math.max(0, prev - skill.value));
        setIsEnemyHit(true);
        setTimeout(() => setIsEnemyHit(false), 500);
        setBattleLog(`💀 施放【${skill.name}】！對手扣除 2 點血量。`);
        break;
      case 'petrify':
        setEnemyEffects((prev) => [...prev, { name: skill.name, type: 'petrify', duration: skill.duration }]);
        setBattleLog(`❄️ 施放【${skill.name}】！對手進入石化狀態（三回合無法攻擊）。`);
        break;
      case 'inspiration':
        setPlayerEffects((prev) => [...prev, { name: skill.name, type: 'inspiration', duration: skill.duration }]);
        setBattleLog(`💡 施放【${skill.name}】！心無旁鶩，答題選項降為二選一！`);
        break;
      case 'burn':
        setPlayerEffects((prev) => [...prev, { name: skill.name, type: 'burn', duration: skill.duration }]);
        setBattleLog(`🔥 施放【${skill.name}】！火元素爆發，三回合內攻擊力加 1！`);
        break;
      case 'shock':
        setPlayerEffects((prev) => [...prev, { name: skill.name, type: 'shock', duration: skill.duration }]);
        setBattleLog(`⚡ 施放【${skill.name}】！雷電護盾就緒，防守成功將引發反擊！`);
        break;
    }

    // After skill is used, immediately start the attack phase
    setTimeout(() => {
      handleStartAttack();
    }, 1200);
  };

  // 2. Start Attack (Loads Attack Question)
  const handleStartAttack = () => {
    if (!playerMonster || !enemyMonster) return;

    const pool = getQuestionPool('attack');
    if (pool.length === 0) {
      alert('該題庫無可用的單字(攻擊)題目，已自動切換回預設題庫。');
      setSelectedLibraryId('default');
      return;
    }

    const randomQuestion = pool[Math.floor(Math.random() * pool.length)];
    setCurrentQuestion(randomQuestion);

    // Calculate options count based on relationship
    const relationship = getRelationship(playerMonster.element, enemyMonster.element);
    const isInspirationActive = playerEffects.some((eff) => eff.type === 'inspiration');
    const optionCount = getOptionCount(relationship, isInspirationActive);

    const compiledOptions = getOptionsForQuestion(randomQuestion, optionCount);
    setOptions(compiledOptions);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setBattlePhase('question-attack');
  };

  // 3. Selection Answer Handler
  const handleSelectAnswer = (answer: string) => {
    if (!currentQuestion || isAnswered || !enemyMonster || !playerMonster) return;

    setIsAnswered(true);
    setSelectedAnswer(answer);

    const isCorrect = answer === currentQuestion.answer;

    if (battlePhase === 'question-attack') {
      // ===== ATTACK PHASE RESULTS =====
      if (isCorrect) {
        // Calculate Attack Damage
        const isBurnActive = playerEffects.some((eff) => eff.type === 'burn');
        const damage = isBurnActive ? 2 : 1;

        // Trigger player attack tackle motion (0ms)
        setIsPlayerAttacking(true);
        setTimeout(() => setIsPlayerAttacking(false), 800);

        setEnemyHp((prev) => Math.max(0, prev - damage));
        // Opponent takes damage and shakes on impact (300ms)
        setTimeout(() => {
          setIsEnemyHit(true);
          setTimeout(() => setIsEnemyHit(false), 500);
        }, 300);

        // Attack success: show player element attack burst on enemy
        setActiveEffect({ type: playerMonster.element, target: 'enemy', style: 'attack' });
        setTimeout(() => setActiveEffect(null), 800);

        setBattleLog(`答對了！我方成功發動攻擊，對敵方造成 ${damage} 點傷害！`);
      } else {
        setWrongAnswersInBattle((prev) => [...prev, currentQuestion]);
        setBattleLog(`回答錯誤！單字填充失敗，我方攻擊失誤...`);
      }
    } else if (battlePhase === 'question-defense') {
      // ===== DEFENSE PHASE RESULTS =====
      // Opponent initiates attack tackle motion regardless (0ms)
      setIsEnemyAttacking(true);
      setTimeout(() => setIsEnemyAttacking(false), 800);

      if (isCorrect) {
        setIsShieldActive(true);
        setTimeout(() => setIsShieldActive(false), 1000);

        // Shake opponent because of block recoil on impact (300ms)
        setTimeout(() => {
          setIsEnemyHit(true);
          setTimeout(() => setIsEnemyHit(false), 500);
        }, 300);

        // Defense success: show player element shield on player
        setActiveEffect({ type: playerMonster.element, target: 'player', style: 'defense' });
        setTimeout(() => setActiveEffect(null), 800);

        // Check for Shock counter attack
        const isShockActive = playerEffects.some((eff) => eff.type === 'shock');
        if (isShockActive) {
          setEnemyHp((prev) => Math.max(0, prev - 1));
          // We can also trigger a hit effect on enemy from counter
          setTimeout(() => {
            setIsEnemyHit(true);
            setTimeout(() => setIsEnemyHit(false), 500);
          }, 450);
          setBattleLog(`答對了！完美防禦對手攻擊，雷電護盾反擊造成 1 點傷害！`);
        } else {
          setBattleLog(`答對了！完美防禦對手攻擊，毫髮無傷！`);
        }
      } else {
        setPlayerHp((prev) => Math.max(0, prev - 1));
        // Player gets hit and shakes on impact (300ms)
        setTimeout(() => {
          setIsPlayerHit(true);
          setTimeout(() => setIsPlayerHit(false), 500);
        }, 300);

        // Defense failed: show enemy element attack burst on player
        setActiveEffect({ type: enemyMonster.element, target: 'player', style: 'attack' });
        setTimeout(() => setActiveEffect(null), 800);

        setWrongAnswersInBattle((prev) => [...prev, currentQuestion]);
        setBattleLog(`回答錯誤！防禦破綻，受到 1 點傷害！`);
      }
    }
  };

  // 4. Round Flow Controller (Continues to defense, petrify skip, or round update)
  const handleContinue = () => {
    if (!enemyMonster || !playerMonster) return;

    // Check if enemy died
    if (enemyHp <= 0) {
      handleEndBattle(true);
      return;
    }
    // Check if player died
    if (playerHp <= 0) {
      handleEndBattle(false);
      return;
    }

    if (battlePhase === 'question-attack') {
      // Transition from Player Attack -> Enemy Attack (Player Defense)
      const isPetrified = enemyEffects.some((eff) => eff.type === 'petrify');

      if (isPetrified) {
        // Petrified skip
        setBattleLog(`❄️ 對手處於石化狀態，無法發動攻擊！跳過防禦階段。`);
        setBattlePhase('round-end');
        
        setTimeout(() => {
          // Decrement effects
          handleDecrementEffects();
        }, 1200);
      } else {
        // Load Defense/Grammar Question
        const pool = getQuestionPool('defense');
        if (pool.length === 0) {
          setBattleLog(`沒有適用的文法防守題，跳過本回合防守！`);
          setBattlePhase('round-end');
          setTimeout(() => handleDecrementEffects(), 1000);
          return;
        }

        const randomQuestion = pool[Math.floor(Math.random() * pool.length)];
        setCurrentQuestion(randomQuestion);

        // Calculate defense choices: enemy attacks player (but options calculated based on player vs enemy relationship)
        const relationship = getRelationship(playerMonster.element, enemyMonster.element);
        const isInspirationActive = playerEffects.some((eff) => eff.type === 'inspiration');
        const optionCount = getOptionCount(relationship, isInspirationActive);

        const compiledOptions = getOptionsForQuestion(randomQuestion, optionCount);
        setOptions(compiledOptions);
        setIsAnswered(false);
        setSelectedAnswer(null);
        setBattlePhase('question-defense');
      }
    } else if (battlePhase === 'question-defense') {
      // Transition from Defense -> Next Round Start
      setBattlePhase('round-end');
      handleDecrementEffects();
    }
  };

  // Helper to handle countdown of buffs at the end of each round
  const handleDecrementEffects = () => {
    setPlayerEffects((prev) =>
      prev
        .map((eff) => ({ ...eff, duration: eff.duration - 1 }))
        .filter((eff) => eff.duration > 0)
    );
    setEnemyEffects((prev) =>
      prev
        .map((eff) => ({ ...eff, duration: eff.duration - 1 }))
        .filter((eff) => eff.duration > 0)
    );

    // Increment Round
    setRound((prev) => prev + 1);
    setBattlePhase('player-start');
    setBattleLog(`第 ${round + 1} 回合開始！請選擇你的行動。`);
  };

  // 5. Battle End & Rewards Calculation
  const handleEndBattle = (isVictory: boolean) => {
    if (!currentProfile) return;

    setGameState('game-over');

    // Calculate Gold & EXP
    const expGained = isVictory ? 50 : 10;
    const goldGained = isVictory ? 25 : 5;

    let newExp = currentProfile.exp + expGained;
    let newLevel = currentProfile.level;

    if (newExp >= 100) {
      newExp -= 100;
      newLevel += 1;
    }

    // Merge wrong questions
    const updatedWrong = { ...currentProfile.wrongQuestions };
    wrongAnswersInBattle.forEach((q) => {
      if (updatedWrong[q.id]) {
        updatedWrong[q.id].errorCount += 1;
      } else {
        updatedWrong[q.id] = {
          id: q.id,
          question: q.question,
          answer: q.answer,
          distractors: q.distractors,
          grade: q.grade,
          type: q.type,
          errorCount: 1
        };
      }
    });

    const updatedProfile: PlayerSave = {
      ...currentProfile,
      level: newLevel,
      exp: newExp,
      gold: currentProfile.gold + goldGained,
      wrongQuestions: updatedWrong
    };

    handleProfileSave(updatedProfile);

    // Trigger silent GAS Sync if connected
    if (updatedProfile.gasUrl) {
      saveSystem.syncToGAS(updatedProfile).then((res) => {
        console.log('GAS Auto-Sync Result:', res.message);
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Global Header */}
      <header className="bg-[#111424] border-b border-white/5 py-4 px-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div
            onClick={() => setGameState('profile-select')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="text-3xl filter drop-shadow-md group-hover:scale-105 transition-transform">🎓</span>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-wide">
              英文屬性對戰 <span className="text-indigo-400 font-normal text-sm md:inline hidden">| 平板學習冒險</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {currentProfile && (
              <div className="flex items-center gap-2 md:gap-4 bg-white/3 border border-white/5 px-4 py-2 rounded-xl text-sm font-semibold">
                <span className="text-white/80 font-bold">👦 {currentProfile.playerName}</span>
                <span className="text-indigo-400 font-extrabold">Lv.{currentProfile.level}</span>
                <span className="text-amber-400 font-extrabold">🪙 {currentProfile.gold}</span>
              </div>
            )}
            
            {currentProfile && (
              <button
                onClick={() => setShowDashboard(true)}
                className="btn-secondary px-3 py-2 text-sm flex items-center gap-1.5"
              >
                ⚙️ <span className="hidden md:inline">家長後台</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col justify-center">
        
        {/* VIEW 1: PROFILE SELECT SCREEN */}
        {gameState === 'profile-select' && (
          <div className="glass-panel w-full max-w-lg mx-auto flex flex-col gap-6 animate-pop">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-white mb-2">誰要開始英文冒險？</h2>
              <p className="text-sm text-white/50">選擇你的存檔進度，或建立新冒險者</p>
            </div>

            {profiles.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-white/40">選擇存檔：</span>
                <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
                  {profiles.map((name) => {
                    const profile = saveSystem.loadProfile(name);
                    return (
                      <div
                        key={name}
                        onClick={() => {
                          setCurrentProfile(profile);
                          setGameState('monster-select');
                        }}
                        className="flex justify-between items-center bg-white/2 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-950/10 p-4 rounded-xl cursor-pointer transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="font-extrabold text-white text-lg">{name}</span>
                          <span className="text-xs text-white/40">適合 {profile.grade} 年級 | Lv.{profile.level}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-amber-400 text-sm font-bold">🪙 {profile.gold}</span>
                          <span className="text-indigo-400 font-bold">➔</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Create New Profile Form */}
            <form onSubmit={handleCreateProfile} className="flex flex-col gap-4 border-t border-white/5 pt-4">
              <span className="text-xs font-bold text-white/40">建立新冒險者：</span>
              
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  placeholder="輸入英文名字或小名"
                  maxLength={12}
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="bg-[#0f111a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none w-full"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex-1 flex items-center justify-between bg-white/2 border border-white/5 p-3 rounded-lg cursor-pointer">
                  <span className="text-sm font-bold">1-2 年級 (基礎)</span>
                  <input
                    type="radio"
                    name="grade"
                    checked={selectedGrade === '1-2'}
                    onChange={() => setSelectedGrade('1-2')}
                    className="accent-indigo-500"
                  />
                </label>
                <label className="flex-1 flex items-center justify-between bg-white/2 border border-white/5 p-3 rounded-lg cursor-pointer">
                  <span className="text-sm font-bold">3-4 年級 (進階)</span>
                  <input
                    type="radio"
                    name="grade"
                    checked={selectedGrade === '3-4'}
                    onChange={() => setSelectedGrade('3-4')}
                    className="accent-indigo-500"
                  />
                </label>
              </div>

              <button type="submit" className="btn-primary w-full py-3">
                ＋ 建立新進度
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: MONSTER SELECT SCREEN */}
        {gameState === 'monster-select' && currentProfile && (
          <div className="w-full flex flex-col gap-6 animate-pop">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">請選擇出戰的小怪獸</h2>
              <p className="text-sm text-indigo-200">每隻怪獸都有獨特技能與剋屬性！對抗剋星在戰鬥中會得到大優勢！</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.values(MONSTERS).map((monster) => (
                <div
                  key={monster.id}
                  onClick={() => handleSelectMonster(monster)}
                  className="glass-panel flex flex-col items-center gap-4 hover:border-indigo-500 hover:bg-indigo-950/20 cursor-pointer transition-all active:scale-98 relative group"
                >
                  <span className={`element-badge ${monster.element} absolute top-3 right-3 text-[10px]`}>
                    {monster.element}
                  </span>
                  
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                    <img src={monster.imageUrl} alt={monster.name} className="w-16 h-16 object-contain" />
                  </div>

                  <div className="text-center">
                    <h4 className="font-extrabold text-white text-md">{monster.name.split(' ')[0]}</h4>
                    <p className="text-[10px] text-white/50 mt-1 line-clamp-2 leading-relaxed">
                      技能：{monster.skill.name} ({monster.skill.description})
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-2">
              <button onClick={() => setGameState('profile-select')} className="btn-secondary text-sm">
                返回重選存檔
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: LIBRARY SELECT SCREEN */}
        {gameState === 'library-select' && currentProfile && playerMonster && (
          <div className="glass-panel w-full max-w-lg mx-auto flex flex-col gap-6 animate-pop">
            <div className="text-center">
              <span className="text-sm text-indigo-400 font-extrabold">準備與 {playerMonster.name} 出擊！</span>
              <h2 className="text-2xl font-extrabold text-white mt-1 mb-2">選擇本局對戰的英文庫</h2>
            </div>

            <div className="flex flex-col gap-3">
              {/* Library Option 1: Default Library */}
              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                selectedLibraryId === 'default' ? 'bg-indigo-950/20 border-indigo-500 text-indigo-300' : 'bg-white/2 border-white/5 text-white'
              }`}>
                <div className="flex flex-col gap-0.5">
                  <span className="font-extrabold text-md">📚 系統內建字庫 ({currentProfile.grade} 年級)</span>
                  <span className="text-xs text-white/40">包含該年級應背誦之教育部基礎單字及文法。</span>
                </div>
                <input
                  type="radio"
                  name="library"
                  checked={selectedLibraryId === 'default'}
                  onChange={() => setSelectedLibraryId('default')}
                  className="accent-indigo-500"
                />
              </label>

              {/* Library Option 2: Wrong Questions (Review Notebook) */}
              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                Object.keys(currentProfile.wrongQuestions).length < 3 ? 'opacity-40 cursor-not-allowed' : ''
              } ${
                selectedLibraryId === 'wrong' ? 'bg-indigo-950/20 border-indigo-500 text-indigo-300' : 'bg-white/2 border-white/5 text-white'
              }`}>
                <div className="flex flex-col gap-0.5">
                  <span className="font-extrabold text-md">📕 錯題本挑戰 ({Object.keys(currentProfile.wrongQuestions).length} 題)</span>
                  <span className="text-xs text-white/40">需要至少累積 3 題錯題方可啟用，重點強化弱點！</span>
                </div>
                <input
                  type="radio"
                  name="library"
                  disabled={Object.keys(currentProfile.wrongQuestions).length < 3}
                  checked={selectedLibraryId === 'wrong'}
                  onChange={() => setSelectedLibraryId('wrong')}
                  className="accent-indigo-500"
                />
              </label>

              {/* Library Option 3: Custom Libraries */}
              {Object.values(currentProfile.customLibraries).map((lib) => (
                <label
                  key={lib.id}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    lib.questions.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
                  } ${
                    selectedLibraryId === lib.id ? 'bg-indigo-950/20 border-indigo-500 text-indigo-300' : 'bg-white/2 border-white/5 text-white'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-md">💼 自訂字庫：{lib.name} ({lib.questions.length} 題)</span>
                    <span className="text-xs text-white/40">家長自訂建立的匯入字庫題庫。</span>
                  </div>
                  <input
                    type="radio"
                    name="library"
                    disabled={lib.questions.length === 0}
                    checked={selectedLibraryId === lib.id}
                    onChange={() => setSelectedLibraryId(lib.id)}
                    className="accent-indigo-500"
                  />
                </label>
              ))}
            </div>

            <div className="flex gap-4 w-full mt-2">
              <button onClick={() => setGameState('monster-select')} className="btn-secondary flex-1 py-3 text-sm">
                返回選角
              </button>
              <button onClick={handleStartBattle} className="btn-primary flex-1 py-3 text-sm font-extrabold">
                ⚔️ 開始對戰！
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: BATTLE STAGE SCREEN */}
        {gameState === 'battle' && playerMonster && enemyMonster && (
          <div className="w-full flex flex-col gap-3 animate-pop">
            <BattleArena
              playerMonster={playerMonster}
              playerHp={playerHp}
              enemyMonster={enemyMonster}
              enemyHp={enemyHp}
              isPlayerHit={isPlayerHit}
              isEnemyHit={isEnemyHit}
              isShieldActive={isShieldActive}
              isPlayerAttacking={isPlayerAttacking}
              isEnemyAttacking={isEnemyAttacking}
              playerEffects={playerEffects.map((e) => ({ name: e.name, duration: e.duration }))}
              enemyEffects={enemyEffects.map((e) => ({ name: e.name, duration: e.duration }))}
              battleLog={battleLog}
              round={round}
              activeEffect={activeEffect}
              phase={battlePhase}
            />

            <ActionPanel
              currentQuestion={currentQuestion}
              options={options}
              isAnswered={isAnswered}
              selectedAnswer={selectedAnswer}
              isSkillUsed={isSkillUsed}
              skill={playerMonster.skill}
              phase={battlePhase}
              onUseSkill={handleUseSkill}
              onStartAttack={handleStartAttack}
              onSelectAnswer={handleSelectAnswer}
              onContinue={handleContinue}
            />
          </div>
        )}

        {/* VIEW 5: GAME OVER / SETTLEMENT SCREEN */}
        {gameState === 'game-over' && currentProfile && playerMonster && enemyMonster && (
          <div className="glass-panel w-full max-w-lg mx-auto flex flex-col gap-6 items-center text-center animate-pop">
            
            {/* Victory / Defeat Header */}
            {enemyHp <= 0 ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-6xl animate-bounce">🏆</span>
                <h2 className="text-3xl font-extrabold text-emerald-400">勝利！戰鬥獲勝！</h2>
                <p className="text-sm text-white/50">你與 {playerMonster.name.split(' ')[0]} 擊敗了對手！</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-6xl">💀</span>
                <h2 className="text-3xl font-extrabold text-rose-400">戰敗！繼續努力！</h2>
                <p className="text-sm text-white/50">{playerMonster.name.split(' ')[0]} 倒下了...</p>
              </div>
            )}

            {/* Battle Rewards */}
            <div className="bg-[#121528] rounded-2xl p-5 border border-white/5 w-full grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-3 bg-white/2 rounded-xl">
                <span className="text-xs text-white/40 font-bold mb-1">獲得金幣</span>
                <span className="text-2xl font-black text-amber-400">🪙 +{enemyHp <= 0 ? 25 : 5}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-white/2 rounded-xl">
                <span className="text-xs text-white/40 font-bold mb-1">獲得經驗值</span>
                <span className="text-2xl font-black text-indigo-400">⚡ +{enemyHp <= 0 ? 50 : 10}</span>
              </div>
            </div>

            {/* Wrong Questions Notebook updates */}
            {wrongAnswersInBattle.length > 0 && (
              <div className="w-full text-left bg-rose-950/10 border border-rose-500/20 rounded-2xl p-4 flex flex-col gap-2">
                <span className="text-xs text-rose-300 font-extrabold flex items-center gap-1.5">
                  📕 錯題已收錄於錯題本（共 {wrongAnswersInBattle.length} 題）：
                </span>
                <div className="max-h-[120px] overflow-y-auto pr-1 flex flex-col gap-1.5">
                  {wrongAnswersInBattle.map((q, idx) => (
                    <div key={idx} className="text-xs text-white/70 border-b border-white/5 pb-1">
                      <strong>[{q.type === 'attack' ? '單字' : '文法'}] {q.answer}</strong> ➔ {q.question}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="flex gap-4 w-full mt-2">
              <button
                onClick={() => setGameState('monster-select')}
                className="btn-secondary flex-1 py-4 text-md font-bold"
              >
                回到選角
              </button>
              <button
                onClick={handleStartBattle}
                className="btn-primary flex-1 py-4 text-md font-extrabold"
              >
                ⚔️ 再戰一場！
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Global Parent Dashboard Modal */}
      {showDashboard && currentProfile && (
        <ParentDashboard
          save={currentProfile}
          onSaveUpdate={handleProfileSave}
          onClose={() => setShowDashboard(false)}
        />
      )}

      {/* Global Footer */}
      <footer className="py-4 text-center text-xs text-white/30 border-t border-white/5">
        &copy; 2026 英文屬性對戰遊戲 | 專為平板觸控與國小兒童英文背誦設計
      </footer>
    </div>
  );
}
