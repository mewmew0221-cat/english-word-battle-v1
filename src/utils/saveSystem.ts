export interface WrongQuestion {
  id: string;
  question: string;
  answer: string;
  distractors: string[];
  grade: '1-2' | '3-4';
  type: 'attack' | 'defense';
  errorCount: number;
}

export interface CustomLibraryItem {
  question: string;
  answer: string;
  distractors: string[];
  type: 'attack' | 'defense';
}

export interface CustomLibrary {
  id: string;
  name: string;
  questions: CustomLibraryItem[];
}

export interface PlayerSave {
  playerName: string;
  grade: '1-2' | '3-4';
  level: number;
  exp: number;
  gold: number;
  unlockedMonsters: string[];
  wrongQuestions: Record<string, WrongQuestion>;
  customLibraries: Record<string, CustomLibrary>;
  gasUrl: string;
  selectedMonsterId: string;
  // New Fields
  monsterLevels: Record<string, number>;
  inventory: Record<string, number>;
  monsterExpPool: number;
}

const STORAGE_PREFIX = 'eng_battle_save_';

export const DEFAULT_SAVE = (name: string): PlayerSave => ({
  playerName: name,
  grade: '1-2',
  level: 1,
  exp: 0,
  gold: 0,
  unlockedMonsters: ['leafurtle', 'aquacat', 'pyrofox', 'cloudy', 'sunlamb', 'shadowing'], // All unlocked by default for testing
  wrongQuestions: {},
  customLibraries: {},
  gasUrl: '',
  selectedMonsterId: 'leafurtle',
  monsterLevels: {
    leafurtle: 1,
    aquacat: 1,
    pyrofox: 1,
    cloudy: 1,
    sunlamb: 1,
    shadowing: 1
  },
  inventory: {
    potion: 0,
    super_potion: 0,
    shield: 0,
    power: 0
  },
  monsterExpPool: 0
});

export const saveSystem = {
  // Get all profile names
  getProfiles(): string[] {
    const keys = Object.keys(localStorage);
    return keys
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .map((key) => key.replace(STORAGE_PREFIX, ''));
  },

  // Load profile
  loadProfile(name: string): PlayerSave {
    const data = localStorage.getItem(STORAGE_PREFIX + name);
    if (!data) {
      const newSave = DEFAULT_SAVE(name);
      this.saveProfile(newSave);
      return newSave;
    }
    try {
      const parsed = JSON.parse(data) as PlayerSave;
      const defaultSave = DEFAULT_SAVE(name);
      // Merge defaults in case schema updates
      return {
        ...defaultSave,
        ...parsed,
        monsterLevels: {
          ...defaultSave.monsterLevels,
          ...(parsed.monsterLevels || {})
        },
        inventory: {
          ...defaultSave.inventory,
          ...(parsed.inventory || {})
        },
        monsterExpPool: parsed.monsterExpPool !== undefined ? parsed.monsterExpPool : 0
      };
    } catch (e) {
      console.error('Failed to parse save data', e);
      return DEFAULT_SAVE(name);
    }
  },

  // Save profile
  saveProfile(save: PlayerSave): void {
    localStorage.setItem(STORAGE_PREFIX + save.playerName, JSON.stringify(save));
  },

  // Delete profile
  deleteProfile(name: string): void {
    localStorage.removeItem(STORAGE_PREFIX + name);
  },

  // Sync to Google Sheets using Apps Script
  async syncToGAS(save: PlayerSave): Promise<{ success: boolean; message: string }> {
    if (!save.gasUrl || !save.gasUrl.trim().startsWith('http')) {
      return { success: false, message: '請先設定正確的 GAS 網址。' };
    }

    try {
      // We send a JSONP/fetch POST request to the web app
      const response = await fetch(save.gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // GAS Web App often prefers text/plain or handles no-cors
        },
        body: JSON.stringify({
          action: 'sync',
          playerData: {
            playerName: save.playerName,
            grade: save.grade,
            level: save.level,
            exp: save.exp,
            gold: save.gold,
            wrongCount: Object.keys(save.wrongQuestions).length
          },
          wrongQuestions: Object.values(save.wrongQuestions)
        })
      });

      if (response.ok) {
        return { success: true, message: '雲端進度上傳成功！' };
      }
      
      // If CORS blocks reading response, but status is ok or we sent it:
      return { success: true, message: '進度已發送至雲端 (GAS)。' };
    } catch (error) {
      console.error('GAS Sync failed', error);
      return { success: false, message: `連線失敗: ${(error as Error).message}` };
    }
  },

  // Parse bulk text block into custom library questions
  // Format: "word, sentence with ____, type (attack/defense), distractor1, distractor2, distractor3, distractor4"
  // Or simple CSV: "apple, I like to eat ____, attack, orange, banana, grape, cake"
  parseBulkText(text: string): CustomLibraryItem[] {
    const lines = text.split('\n');
    const items: CustomLibraryItem[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Handle simple CSV splitting
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 3) {
        const answer = parts[0];
        const question = parts[1];
        const type = (parts[2].toLowerCase() === 'defense' || parts[2].toLowerCase() === '防守') ? 'defense' : 'attack';
        
        // Extract distractors, default if not enough
        const distractors: string[] = [];
        if (parts.length > 3) {
          distractors.push(...parts.slice(3).filter((p) => p !== ''));
        }
        
        // Pad distractors to ensure at least 4 items
        const defaultPool = ['banana', 'green', 'running', 'happy', 'under', 'went', 'cat', 'book'];
        while (distractors.length < 4) {
          const fallback = defaultPool[distractors.length % defaultPool.length];
          if (!distractors.includes(fallback) && fallback !== answer) {
            distractors.push(fallback);
          } else {
            distractors.push(`${fallback}_${distractors.length}`);
          }
        }

        items.push({
          question,
          answer,
          distractors,
          type
        });
      }
    }
    return items;
  },

  // Parse JSON text into custom library questions
  parseJSONText(text: string): CustomLibraryItem[] {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.filter((item: any) => {
          return typeof item.question === 'string' &&
            typeof item.answer === 'string' &&
            (item.type === 'attack' || item.type === 'defense') &&
            Array.isArray(item.distractors) &&
            item.distractors.length >= 4;
        }).map((item: any) => ({
          question: item.question,
          answer: item.answer,
          distractors: item.distractors.slice(0, 4),
          type: item.type
        })) as CustomLibraryItem[];
      }
    } catch (e) {
      console.error('Failed to parse JSON library text', e);
    }
    return [];
  },

  // Sync / pull custom libraries from Google Apps Script endpoint
  async pullLibrariesFromGAS(gasUrl: string): Promise<{ success: boolean; message: string; libraries?: Record<string, CustomLibrary> }> {
    if (!gasUrl || !gasUrl.trim().startsWith('http')) {
      return { success: false, message: '請先設定正確的 GAS 網址。' };
    }

    try {
      const url = new URL(gasUrl);
      url.searchParams.append('action', 'getLibraries');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return { success: false, message: `伺服器回應錯誤: ${response.status}` };
      }

      const parsed = await response.json();
      if (parsed && typeof parsed === 'object') {
        const validated: Record<string, CustomLibrary> = {};
        for (const [key, lib] of Object.entries(parsed)) {
          if (lib && typeof lib === 'object' && 'id' in lib && 'name' in lib && 'questions' in (lib as any)) {
            const castedLib = lib as any;
            validated[key] = {
              id: castedLib.id,
              name: castedLib.name,
              questions: (castedLib.questions as any[]).map(q => ({
                question: q.question || '',
                answer: q.answer || '',
                distractors: Array.isArray(q.distractors) ? q.distractors : [],
                type: q.type === 'defense' ? 'defense' : 'attack'
              }))
            };
          }
        }
        return { success: true, message: '雲端字庫拉取成功！', libraries: validated };
      }
      return { success: false, message: '雲端回傳格式不正確。' };
    } catch (error) {
      console.error('Failed to pull libraries from GAS', error);
      return { success: false, message: `連線失敗: ${(error as Error).message}` };
    }
  }
};
