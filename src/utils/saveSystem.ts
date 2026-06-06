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
  selectedMonsterId: 'leafurtle'
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
      // Merge defaults in case schema updates
      return {
        ...DEFAULT_SAVE(name),
        ...parsed
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
  }
};
