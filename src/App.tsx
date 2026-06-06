import { useState, useEffect } from 'react';
import { MONSTERS, type Monster, getRelationship, getOptionCount, type ElementType } from './data/monsters';
import { DEFAULT_QUESTIONS, type Question, getOptionsForQuestion } from './data/questions';
import { type PlayerSave, saveSystem } from './utils/saveSystem';
import { BattleArena } from './components/BattleArena';
import { ActionPanel } from './components/ActionPanel';
import { ParentDashboard } from './components/ParentDashboard';
import { soundManager } from './utils/soundManager';

type GameState = 'profile-select' | 'monster-select' | 'library-select' | 'battle' | 'game-over';

interface StatusEffect {
  name: string;
  type: 'petrify' | 'inspiration' | 'burn' | 'shock';
  duration: number;
}

const SHOP_ITEMS = [
  { id: 'potion', name: '治療劑', icon: '🧪', cost: 15, description: '立即回復自身 2 點血量。' },
  { id: 'super_potion', name: '強力治療劑', icon: '🧪✨', cost: 35, description: '立即回復自身 5 點血量。' },
  { id: 'shield', name: '防護盾', icon: '🛡️', cost: 20, description: '在 3 回合內增加我方 1 點防禦力。' },
  { id: 'power', name: '強力藥水', icon: '🍷', cost: 20, description: '在 3 回合內增加我方 1 點攻擊力。' }
] as const;

const ELEMENT_BACKGROUNDS: Record<ElementType, string> = {
  earth: '背景_草原.png',
  water: '背景_河岸.png',
  fire: '背景_火山.png',
  wind: '背景_荒原.png',
  light: '背景_神殿.png',
  dark: '背景_洞穴.png'
};


// Stats growth formulas
function getMonsterStats(level: number) {
  return {
    atk: 1 + Math.floor((level - 1) / 3),
    def: 1 + Math.floor((level - 1) / 4),
    maxHp: level === 10 ? 20 : 10 + (level - 1)
  };
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

  // New Game Feature States (Antigravity additions)
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [enemyLevelSelection, setEnemyLevelSelection] = useState<'match' | number>('match');
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [atkBuffTurns, setAtkBuffTurns] = useState(0);
  const [defBuffTurns, setDefBuffTurns] = useState(0);
  const [isEnemyDefending, setIsEnemyDefending] = useState(false);
  const [isEnemyDefeated, setIsEnemyDefeated] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [battleBackground, setBattleBackground] = useState<string>('背景_競技場.png');


  // Battle History (for wrong questions accumulation)
  const [wrongAnswersInBattle, setWrongAnswersInBattle] = useState<Question[]>([]);

  // Monster Selection Navigation
  const monsterList = Object.values(MONSTERS);
  const handleNextMonster = () => {
    soundManager.playClick();
    setCarouselIndex((prev) => (prev + 1) % monsterList.length);
  };
  const handlePrevMonster = () => {
    soundManager.playClick();
    setCarouselIndex((prev) => (prev - 1 + monsterList.length) % monsterList.length);
  };

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

    soundManager.playClick();
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

  // State to store current battle enemy level
  const [battleEnemyLevel, setBattleEnemyLevel] = useState(1);

  const handleStartBattle = () => {
    if (!playerMonster || !currentProfile) return;

    soundManager.playClick();

    // Pick a random enemy monster
    const monsterKeys = Object.keys(MONSTERS);
    const randomKey = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
    const enemy = MONSTERS[randomKey];

    // Determine levels
    const pLvl = currentProfile.monsterLevels[playerMonster.id] || 1;
    const eLvl = enemyLevelSelection === 'match' ? pLvl : enemyLevelSelection;
    setBattleEnemyLevel(eLvl);

    // Calculate max HPs
    const pStats = getMonsterStats(pLvl);
    const eStats = getMonsterStats(eLvl);

    setEnemyMonster(enemy);
    setRound(1);
    setPlayerHp(pStats.maxHp);
    setEnemyHp(eStats.maxHp);
    setIsSkillUsed(false);
    setPlayerEffects([]);
    setEnemyEffects([]);
    setWrongAnswersInBattle([]);
    
    // Pick 1 of 3 backgrounds randomly: player element field, enemy element field, or arena
    const candidates = [
      ELEMENT_BACKGROUNDS[playerMonster.element] || '背景_競技場.png',
      ELEMENT_BACKGROUNDS[enemy.element] || '背景_競技場.png',
      '背景_競技場.png'
    ];
    const chosenBg = candidates[Math.floor(Math.random() * candidates.length)];
    setBattleBackground(chosenBg);

    // Reset item buff turns and state flags
    setAtkBuffTurns(0);
    setDefBuffTurns(0);
    setIsEnemyDefending(false);
    setIsEnemyDefeated(false);

    setBattleLog(`戰鬥開始！我方「${playerMonster.name.split(' ')[0]} (Lv.${pLvl})」對抗敵方「${enemy.name.split(' ')[0]} (Lv.${eLvl})」！`);
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

  // Item activation handler in battle
  const handleUseItem = (itemId: string) => {
    if (!currentProfile || !playerMonster) return;
    const qty = currentProfile.inventory[itemId] || 0;
    if (qty <= 0) return;

    const pLvl = currentProfile.monsterLevels[playerMonster.id] || 1;
    const maxHp = getMonsterStats(pLvl).maxHp;

    const newInventory = {
      ...currentProfile.inventory,
      [itemId]: qty - 1
    };

    switch (itemId) {
      case 'potion':
        soundManager.playHeal();
        setPlayerHp((prev) => Math.min(maxHp, prev + 2));
        setBattleLog("🧪 使用了治療劑！回復了我方 2 點血量。");
        break;
      case 'super_potion':
        soundManager.playHeal();
        setPlayerHp((prev) => Math.min(maxHp, prev + 5));
        setBattleLog("🧪✨ 使用了強力治療劑！回復了我方 5 點血量。");
        break;
      case 'shield':
        soundManager.playDefend();
        setDefBuffTurns(3);
        setBattleLog("🛡️ 使用了防護盾！3 回合內我方防禦力 +1。");
        break;
      case 'power':
        soundManager.playAttack();
        setAtkBuffTurns(3);
        setBattleLog("🍷 使用了強力藥水！3 回合內我方攻擊力 +1。");
        break;
    }

    handleProfileSave({
      ...currentProfile,
      inventory: newInventory
    });

    setIsInventoryOpen(false);

    // After item is used, immediately start the attack phase after delay
    setTimeout(() => {
      handleStartAttack();
    }, 1200);
  };

  const handleBuyItem = (itemId: string) => {
    if (!currentProfile) return;
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    if (currentProfile.gold < item.cost) {
      soundManager.playClick();
      alert('金幣不足！快去對戰賺取金幣吧。');
      return;
    }

    soundManager.playLevelUp(); // Play level up / purchase chime
    const newGold = currentProfile.gold - item.cost;
    const newInventory = {
      ...currentProfile.inventory,
      [itemId]: (currentProfile.inventory[itemId] || 0) + 1
    };

    handleProfileSave({
      ...currentProfile,
      gold: newGold,
      inventory: newInventory
    });
  };

  // 1. Skill Activation
  const handleUseSkill = () => {
    if (!playerMonster || isSkillUsed || !enemyMonster || !currentProfile) return;

    setIsSkillUsed(true);
    const skill = playerMonster.skill;
    const pLvl = currentProfile.monsterLevels[playerMonster.id] || 1;
    const maxHp = getMonsterStats(pLvl).maxHp;

    // Apply immediate or turn-based effects
    switch (skill.effectType) {
      case 'heal':
        soundManager.playHeal();
        setPlayerHp((prev) => Math.min(maxHp, prev + skill.value));
        setBattleLog(`✨ 施放【${skill.name}】！回復了我方 2 點血量。`);
        break;
      case 'curse':
        soundManager.playAttack();
        setTimeout(() => soundManager.playHit(), 300);
        setEnemyHp((prev) => Math.max(0, prev - skill.value));
        setIsEnemyHit(true);
        setTimeout(() => setIsEnemyHit(false), 500);
        setBattleLog(`💀 施放【${skill.name}】！對手扣除 2 點血量。`);
        break;
      case 'petrify':
        soundManager.playClick();
        setEnemyEffects((prev) => [...prev, { name: skill.name, type: 'petrify', duration: skill.duration }]);
        setBattleLog(`❄️ 施放【${skill.name}】！對手進入石化狀態（三回合無法攻擊）。`);
        break;
      case 'inspiration':
        soundManager.playClick();
        setPlayerEffects((prev) => [...prev, { name: skill.name, type: 'inspiration', duration: skill.duration }]);
        setBattleLog(`💡 施放【${skill.name}】！心無旁鶩，答題選項降為二選一！`);
        break;
      case 'burn':
        soundManager.playClick();
        setPlayerEffects((prev) => [...prev, { name: skill.name, type: 'burn', duration: skill.duration }]);
        setBattleLog(`🔥 施放【${skill.name}】！火元素爆發，三回合內攻擊力加 1！`);
        break;
      case 'shock':
        soundManager.playClick();
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

    soundManager.playClick();

    const pool = getQuestionPool('attack');
    if (pool.length === 0) {
      alert('該題庫無可用的單字(攻擊)題目，已自動切換回預設題庫。');
      setSelectedLibraryId('default');
      return;
    }

    const randomQuestion = pool[Math.floor(Math.random() * pool.length)];
    setCurrentQuestion(randomQuestion);

    // Reset enemy defense state
    setIsEnemyDefending(false);

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
    if (!currentQuestion || isAnswered || !enemyMonster || !playerMonster || !currentProfile) return;

    setIsAnswered(true);
    setSelectedAnswer(answer);

    const isCorrect = answer === currentQuestion.answer;

    // Fetch levels
    const pLvl = currentProfile.monsterLevels[playerMonster.id] || 1;
    const eLvl = battleEnemyLevel;

    if (battlePhase === 'question-attack') {
      // ===== ATTACK PHASE RESULTS =====
      if (isCorrect) {
        // Calculate Attack Damage
        const basePlayerAtk = getMonsterStats(pLvl).atk;
        const itemAtkBuff = atkBuffTurns > 0 ? 1 : 0;
        const isBurnActive = playerEffects.some((eff) => eff.type === 'burn');
        const skillAtkBuff = isBurnActive ? 1 : 0;

        const finalPlayerAtk = basePlayerAtk + itemAtkBuff + skillAtkBuff;
        
        // 50% chance for enemy to defend
        const computerDefends = Math.random() < 0.5;
        setIsEnemyDefending(computerDefends);

        let damage = finalPlayerAtk;
        if (computerDefends) {
          const enemyDef = getMonsterStats(eLvl).def;
          damage = Math.max(1, finalPlayerAtk - enemyDef);
        }

        // Play sounds
        soundManager.playAttack();
        if (computerDefends) {
          setTimeout(() => soundManager.playDefend(), 250);
          setTimeout(() => soundManager.playHit(), 400);
        } else {
          setTimeout(() => soundManager.playHit(), 300);
        }

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

        if (computerDefends) {
          setBattleLog(`答對了！我方發動攻擊，但對手發動防禦！對敵方造成 ${damage} 點傷害。`);
        } else {
          setBattleLog(`答對了！我方成功發動攻擊，對敵方造成 ${damage} 點傷害！`);
        }
      } else {
        soundManager.playClick();
        setIsEnemyDefending(false);
        setWrongAnswersInBattle((prev) => [...prev, currentQuestion]);
        setBattleLog(`回答錯誤！單字填充失敗，我方攻擊失誤...`);
      }
    } else if (battlePhase === 'question-defense') {
      // ===== DEFENSE PHASE RESULTS =====
      // Opponent initiates attack tackle motion regardless (0ms)
      setIsEnemyAttacking(true);
      setTimeout(() => setIsEnemyAttacking(false), 800);
      
      // Play enemy attack sound
      soundManager.playAttack();

      const enemyAtk = getMonsterStats(eLvl).atk;

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

        // Play defense chime
        soundManager.playDefend();

        // Calculate blocked damage
        const basePlayerDef = getMonsterStats(pLvl).def;
        const itemDefBuff = defBuffTurns > 0 ? 1 : 0;
        const finalPlayerDef = basePlayerDef + itemDefBuff;

        const damageTaken = Math.max(0, enemyAtk - finalPlayerDef);
        setPlayerHp((prev) => Math.max(0, prev - damageTaken));

        // Check for Shock counter attack
        const isShockActive = playerEffects.some((eff) => eff.type === 'shock');
        if (isShockActive) {
          setEnemyHp((prev) => Math.max(0, prev - 1));
          setTimeout(() => {
            setIsEnemyHit(true);
            setTimeout(() => setIsEnemyHit(false), 500);
          }, 450);
          
          if (damageTaken === 0) {
            setBattleLog(`答對了！完美防禦對手攻擊，且雷電護盾反擊造成 1 點傷害！`);
          } else {
            setBattleLog(`答對了！成功阻擋部分傷害（受到 ${damageTaken} 點傷害），且雷電護盾反擊造成 1 點傷害！`);
          }
        } else {
          if (damageTaken === 0) {
            setBattleLog(`答對了！完美防禦對手攻擊，毫髮無傷！`);
          } else {
            setBattleLog(`答對了！防禦成功阻擋了部分傷害，我方僅受到 ${damageTaken} 點傷害。`);
          }
        }
      } else {
        // Player gets hit and shakes on impact (300ms)
        setTimeout(() => {
          setIsPlayerHit(true);
          setTimeout(() => setIsPlayerHit(false), 500);
        }, 300);

        // Play hit sound after delay
        setTimeout(() => soundManager.playHit(), 300);

        // Defense failed: show enemy element attack burst on player
        setActiveEffect({ type: enemyMonster.element, target: 'player', style: 'attack' });
        setTimeout(() => setActiveEffect(null), 800);

        setPlayerHp((prev) => Math.max(0, prev - enemyAtk));
        setWrongAnswersInBattle((prev) => [...prev, currentQuestion]);
        setBattleLog(`回答錯誤！防禦破綻，受到 ${enemyAtk} 點傷害！`);
      }
    }
  };

  // 4. Round Flow Controller (Continues to defense, petrify skip, or round update)
  const handleContinue = () => {
    if (!enemyMonster || !playerMonster) return;

    soundManager.playClick();

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

    // Decrement item buff turn counters
    setAtkBuffTurns((prev) => Math.max(0, prev - 1));
    setDefBuffTurns((prev) => Math.max(0, prev - 1));

    // Increment Round
    setRound((prev) => prev + 1);
    setBattlePhase('player-start');
    setBattleLog(`第 ${round + 1} 回合開始！請選擇你的行動。`);
  };

  // 5. Battle End & Rewards Calculation
  const handleEndBattle = (isVictory: boolean) => {
    if (!currentProfile) return;

    const finalizeBattle = () => {
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
        monsterExpPool: currentProfile.monsterExpPool + expGained, // accumulate monster EXP pool!
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

    if (isVictory) {
      // Play fly-out animation & sound
      soundManager.playFlyOut();
      setIsEnemyDefeated(true);

      setTimeout(() => {
        setIsEnemyDefeated(false); // Reset state
        setGameState('game-over');
        soundManager.playVictory();
        finalizeBattle();
      }, 1200);
    } else {
      setGameState('game-over');
      soundManager.playDefeat();
      finalizeBattle();
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
                onClick={() => {
                  soundManager.playClick();
                  setIsShopOpen(true);
                }}
                className="btn-secondary px-3 py-2 text-sm flex items-center gap-1.5 bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
              >
                🛒 <span className="hidden md:inline">商店</span>
              </button>
            )}

            {currentProfile && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowDashboard(true);
                }}
                className="btn-secondary px-3 py-2 text-sm flex items-center gap-1.5"
              >
                ⚙️ <span className="hidden md:inline">家長後台</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
        
        {/* VIEW 1: PROFILE SELECT SCREEN */}
        {gameState === 'profile-select' && (
          <div className="glass-panel w-full max-w-lg mx-auto flex flex-col gap-6 animate-pop my-auto">
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
                          soundManager.playClick();
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
          <div className="w-full flex flex-col gap-6 animate-pop my-auto">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">請選擇出戰的小怪獸</h2>
              <p className="text-base md:text-lg text-indigo-200">
                左右滑動或點擊箭頭切換角色。可使用累積經驗值幫喜歡的角色升級！
              </p>
              <div className="inline-flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 px-4 py-2 rounded-xl mt-3 text-sm font-bold text-indigo-300">
                <span>🎒 可用怪獸經驗值：</span>
                <span className="text-emerald-400 font-extrabold text-lg">{currentProfile.monsterExpPool} EXP</span>
              </div>
            </div>

            {/* Carousel Container */}
            <div className="carousel-container mt-2">
              {/* Prev Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevMonster();
                }} 
                className="carousel-nav-btn"
              >
                ◀
              </button>

              {/* Monster Card Wrapper */}
              <div 
                className="carousel-card-wrapper"
                onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (touchStartX === null) return;
                  const diff = touchStartX - e.changedTouches[0].clientX;
                  if (diff > 50) {
                    handleNextMonster();
                  } else if (diff < -50) {
                    handlePrevMonster();
                  }
                  setTouchStartX(null);
                }}
              >
                {(() => {
                  const monster = monsterList[carouselIndex];
                  const level = currentProfile.monsterLevels[monster.id] || 1;
                  const stats = getMonsterStats(level);
                  const upgradeCost = level * 100;
                  const canUpgrade = level < 10 && currentProfile.monsterExpPool >= upgradeCost;

                  return (
                    <div className="glass-panel flex flex-col items-center gap-5 relative group p-6 border-indigo-500/30">
                      {/* Element Badge */}
                      <span className={`element-badge ${monster.element} absolute top-4 right-4 text-xs md:text-sm font-black`}>
                        {monster.element.toUpperCase()}
                      </span>

                      {/* Large Circular Sprite Container */}
                      <div className="w-32 h-32 md:w-44 md:h-44 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform shadow-inner">
                        <img src={monster.imageUrl} alt={monster.name} className="w-28 h-28 md:w-36 md:h-36 object-contain filter drop-shadow-md" />
                      </div>

                      {/* Character Info */}
                      <div className="text-center w-full">
                        <h3 className="font-black text-white text-2xl md:text-3xl tracking-wide">
                          {monster.name.split(' ')[0]}
                          <span className="text-indigo-400 ml-2 text-xl font-bold">Lv.{level}</span>
                        </h3>
                        
                        {/* Stats Info Grid */}
                        <div className="grid grid-cols-3 gap-3 bg-[#111424]/60 border border-white/5 p-3 rounded-xl mt-3 text-xs md:text-sm">
                          <div className="flex flex-col items-center">
                            <span className="text-white/40 font-bold mb-0.5">❤️ HP</span>
                            <span className="font-extrabold text-rose-400 text-lg">{stats.maxHp}</span>
                          </div>
                          <div className="flex flex-col items-center border-x border-white/5">
                            <span className="text-white/40 font-bold mb-0.5">⚔️ 攻擊</span>
                            <span className="font-extrabold text-amber-400 text-lg">{stats.atk}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-white/40 font-bold mb-0.5">🛡️ 防禦</span>
                            <span className="font-extrabold text-emerald-400 text-lg">{stats.def}</span>
                          </div>
                        </div>

                        {/* Skill Info */}
                        <div className="bg-white/2 border border-white/5 rounded-xl p-3 mt-3 text-left">
                          <span className="text-xs text-indigo-300 font-extrabold">✨ 獨特技能：{monster.skill.name}</span>
                          <p className="text-xs text-white/70 mt-1 leading-relaxed">{monster.skill.description}</p>
                        </div>
                      </div>

                      {/* Upgrade & Selection Action Buttons */}
                      <div className="flex flex-col gap-2.5 w-full mt-1">
                        {/* Upgrade Button */}
                        {level < 10 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canUpgrade) {
                                soundManager.playLevelUp();
                                const newExpPool = currentProfile.monsterExpPool - upgradeCost;
                                const newLevels = { ...currentProfile.monsterLevels, [monster.id]: level + 1 };
                                handleProfileSave({
                                  ...currentProfile,
                                  monsterExpPool: newExpPool,
                                  monsterLevels: newLevels
                                });
                              } else {
                                soundManager.playClick();
                              }
                            }}
                            disabled={!canUpgrade}
                            className={`py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition-all ${
                              canUpgrade
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:scale-102 hover:brightness-105 cursor-pointer'
                                : 'bg-white/5 border border-white/5 text-white/40 cursor-not-allowed'
                            }`}
                          >
                            ⭐ 升級怪獸 {canUpgrade ? `(消耗 ${upgradeCost} EXP)` : `(需要 ${upgradeCost} EXP)`}
                          </button>
                        ) : (
                          <div className="bg-indigo-950/20 border border-indigo-500/30 text-indigo-300 py-3 rounded-xl font-black text-sm text-center">
                            👑 怪獸已達最大等級 (Lv.10)
                          </div>
                        )}

                        {/* Select to Battle Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            soundManager.playClick();
                            handleSelectMonster(monster);
                          }}
                          className="btn-primary w-full py-4 text-md font-black shadow-lg cursor-pointer"
                        >
                          ⚔️ 選擇此怪獸出戰
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Next Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextMonster();
                }} 
                className="carousel-nav-btn"
              >
                ▶
              </button>
            </div>
            
            <div className="flex justify-center mt-2">
              <button 
                onClick={() => {
                  soundManager.playClick();
                  setGameState('profile-select');
                }} 
                className="btn-secondary text-sm"
              >
                返回重選存檔
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: LIBRARY SELECT SCREEN */}
        {gameState === 'library-select' && currentProfile && playerMonster && (
          <div className="glass-panel w-full max-w-lg mx-auto flex flex-col gap-6 animate-pop my-auto">
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

            {/* Opponent Level Selection */}
            <div className="bg-[#111424]/60 border border-white/5 rounded-xl p-4 flex flex-col gap-2.5 mt-2">
              <span className="text-xs text-indigo-300 font-extrabold flex items-center gap-1">
                👾 選擇對手怪獸等級：
              </span>
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setEnemyLevelSelection('match');
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-black border transition-all ${
                    enemyLevelSelection === 'match'
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-white/2 border-white/5 text-white/60 hover:bg-white/5 cursor-pointer'
                  }`}
                >
                  與我方同級
                </button>
                <div className="flex gap-1 items-center flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        soundManager.playClick();
                        setEnemyLevelSelection(lvl);
                      }}
                      className={`w-8 h-8 rounded-lg text-xs font-black border transition-all flex items-center justify-center cursor-pointer ${
                        enemyLevelSelection === lvl
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-white/2 border-white/5 text-white/60 hover:bg-white/5'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 w-full mt-2">
              <button 
                onClick={() => {
                  soundManager.playClick();
                  setGameState('monster-select');
                }} 
                className="btn-secondary flex-1 py-3 text-sm cursor-pointer"
              >
                返回選角
              </button>
              <button onClick={handleStartBattle} className="btn-primary flex-1 py-3 text-sm font-extrabold cursor-pointer">
                ⚔️ 開始對戰！
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: BATTLE STAGE SCREEN */}
        {gameState === 'battle' && playerMonster && enemyMonster && currentProfile && (
          <div className="w-full flex flex-col gap-3 animate-pop my-auto">
            <BattleArena
              backgroundImage={battleBackground}
              playerMonster={playerMonster}
              playerHp={playerHp}
              playerLevel={currentProfile.monsterLevels[playerMonster.id] || 1}
              enemyMonster={enemyMonster}
              enemyHp={enemyHp}
              enemyLevel={battleEnemyLevel}
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
              isEnemyDefending={isEnemyDefending}
              isEnemyDefeated={isEnemyDefeated}
            />

            {/* Continue button between BattleArena and ActionPanel */}
            {isAnswered && (
              <div className="w-full flex justify-center py-1.5 animate-pop">
                <button
                  onClick={handleContinue}
                  className="btn-primary flex items-center gap-2 px-12 py-4 text-xl md:text-2xl font-black shadow-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 border border-indigo-300/40 hover:scale-105 active:scale-95 cursor-pointer rounded-2xl"
                >
                  <span>繼續冒險</span>
                  <span>➔</span>
                </button>
              </div>
            )}

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
              onOpenInventory={() => setIsInventoryOpen(true)}
            />
          </div>
        )}

        {/* VIEW 5: GAME OVER / SETTLEMENT SCREEN */}
        {gameState === 'game-over' && currentProfile && playerMonster && enemyMonster && (
          <div className="glass-panel w-full max-w-lg mx-auto flex flex-col gap-6 items-center text-center animate-pop my-auto">
            
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

      {/* Global Shop Modal */}
      {isShopOpen && currentProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-pop">
          <div className="glass-panel w-full max-w-xl flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setIsShopOpen(false);
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl font-black cursor-pointer bg-white/5 w-10 h-10 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="text-center mt-2">
              <span className="text-sm text-indigo-400 font-extrabold">冒險者商店</span>
              <h2 className="text-3xl font-extrabold text-white mt-1">購買戰鬥道具</h2>
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-amber-300 text-sm font-bold mt-2">
                🪙 我的金幣：<span className="text-base font-black">{currentProfile.gold}</span>
              </div>
            </div>

            {/* Shop Grid */}
            <div className="shop-grid">
              {SHOP_ITEMS.map((item) => {
                const owned = currentProfile.inventory[item.id] || 0;
                return (
                  <div key={item.id} className="shop-item-card">
                    <div className="flex gap-3 items-start">
                      <span className="text-4xl p-2 bg-white/5 rounded-xl">{item.icon}</span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-extrabold text-white text-lg">{item.name}</span>
                        <p className="text-xs text-white/60 leading-relaxed">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                      <span className="text-xs text-white/40 font-bold">已擁有: <strong className="text-white/80">{owned}</strong></span>
                      <button
                        onClick={() => handleBuyItem(item.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
                          currentProfile.gold >= item.cost
                            ? 'bg-amber-500 hover:bg-amber-600 text-[#0f111a] cursor-pointer shadow-md'
                            : 'bg-white/5 border border-white/5 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        🪙 {item.cost} 購買
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center mt-2">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsShopOpen(false);
                }}
                className="btn-secondary w-full py-3 text-sm font-extrabold"
              >
                離開商店
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Battle Inventory Modal Overlay */}
      {isInventoryOpen && currentProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-pop">
          <div className="glass-panel w-full max-w-lg flex flex-col gap-6 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setIsInventoryOpen(false);
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl font-black cursor-pointer bg-white/5 w-10 h-10 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="text-center mt-2">
              <span className="text-sm text-indigo-400 font-extrabold">🎒 戰鬥背包</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">選擇要使用的道具</h2>
              <p className="text-xs text-white/50 mt-1">使用道具將會消耗 1 回合的準備時間</p>
            </div>

            {/* Inventory List */}
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {SHOP_ITEMS.map((item) => {
                const qty = currentProfile.inventory[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={`flex justify-between items-center p-4 rounded-xl border transition-all ${
                      qty > 0
                        ? 'bg-white/3 border-white/10 hover:border-indigo-500/50 hover:bg-indigo-950/10 cursor-pointer'
                        : 'opacity-40 border-white/5 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (qty > 0) {
                        handleUseItem(item.id);
                      }
                    }}
                  >
                    <div className="flex gap-3 items-center">
                      <span className="text-3xl p-1 bg-white/5 rounded-lg">{item.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-white text-base">{item.name}</span>
                        <span className="text-xs text-white/50">{item.description}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-black text-xs">
                        數量: {qty}
                      </span>
                      {qty > 0 && <span className="text-indigo-400 font-bold">➔</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsInventoryOpen(false);
                }}
                className="btn-secondary flex-1 py-3 text-sm font-extrabold"
              >
                返回戰鬥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <footer className="py-4 text-center text-xs text-white/30 border-t border-white/5">
        &copy; 2026 英文屬性對戰遊戲 | 專為平板觸控與國小兒童英文背誦設計
      </footer>
    </div>
  );
}
