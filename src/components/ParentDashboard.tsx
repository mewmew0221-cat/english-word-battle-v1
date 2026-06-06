import React, { useState } from 'react';
import { saveSystem, type PlayerSave, type CustomLibrary, type CustomLibraryItem } from '../utils/saveSystem';

interface ParentDashboardProps {
  save: PlayerSave;
  onSaveUpdate: (updatedSave: PlayerSave) => void;
  onClose: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  save,
  onSaveUpdate,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'gas' | 'wrong' | 'custom'>('gas');

  // GAS URL state
  const [gasUrlInput, setGasUrlInput] = useState(save.gasUrl);
  const [syncStatus, setSyncStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  // Custom Library States
  const [libName, setLibName] = useState('');
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [parsePreview, setParsePreview] = useState<CustomLibraryItem[]>([]);
  const [activeLibId, setActiveLibId] = useState<string | null>(
    Object.keys(save.customLibraries)[0] || null
  );

  // Save GAS URL
  const handleSaveGasUrl = () => {
    const updated = { ...save, gasUrl: gasUrlInput };
    onSaveUpdate(updated);
    alert('雲端串接網址已儲存！');
  };

  // Test GAS Sync
  const handleTestSync = async () => {
    setSyncStatus({ type: 'loading', message: '正在同步資料到雲端...' });
    const result = await saveSystem.syncToGAS({ ...save, gasUrl: gasUrlInput });
    if (result.success) {
      setSyncStatus({ type: 'success', message: result.message });
    } else {
      setSyncStatus({ type: 'error', message: result.message });
    }
  };

  // Clear Wrong Questions
  const handleClearWrongQuestion = (id: string) => {
    const updatedWrong = { ...save.wrongQuestions };
    delete updatedWrong[id];
    onSaveUpdate({
      ...save,
      wrongQuestions: updatedWrong
    });
  };

  const handleClearAllWrong = () => {
    if (window.confirm('確定要清空所有的錯題本記錄嗎？')) {
      onSaveUpdate({
        ...save,
        wrongQuestions: {}
      });
    }
  };

  // Custom Library Functions
  const handleCreateLibrary = () => {
    if (!libName.trim()) return alert('請輸入字庫名稱！');
    const id = 'lib_' + Date.now();
    const newLib: CustomLibrary = {
      id,
      name: libName.trim(),
      questions: []
    };

    const updated = {
      ...save,
      customLibraries: {
        ...save.customLibraries,
        [id]: newLib
      }
    };
    onSaveUpdate(updated);
    setActiveLibId(id);
    setLibName('');
    alert(`字庫「${newLib.name}」已建立！`);
  };

  const handleDeleteLibrary = (id: string) => {
    if (window.confirm('確定要刪除這個字庫嗎？此動作無法復原。')) {
      const updatedLibs = { ...save.customLibraries };
      delete updatedLibs[id];
      const nextActiveId = Object.keys(updatedLibs)[0] || null;
      onSaveUpdate({
        ...save,
        customLibraries: updatedLibs
      });
      setActiveLibId(nextActiveId);
    }
  };

  // Parse bulk import text
  const handlePreviewParse = () => {
    if (!bulkTextInput.trim()) return alert('請先輸入單字資料！');
    const parsed = saveSystem.parseBulkText(bulkTextInput);
    if (parsed.length === 0) {
      alert('無法解析任何題目，請檢查格式是否正確。');
    } else {
      setParsePreview(parsed);
    }
  };

  // Import previewed questions into the selected library
  const handleImportToLibrary = () => {
    if (!activeLibId) return alert('請先選擇或建立一個字庫！');
    if (parsePreview.length === 0) return alert('預覽列表為空，請先點擊「預覽解析」！');

    const targetLib = save.customLibraries[activeLibId];
    const updatedLib = {
      ...targetLib,
      questions: [...targetLib.questions, ...parsePreview]
    };

    const updated = {
      ...save,
      customLibraries: {
        ...save.customLibraries,
        [activeLibId]: updatedLib
      }
    };

    onSaveUpdate(updated);
    alert(`成功匯入 ${parsePreview.length} 題到「${targetLib.name}」中！`);
    setBulkTextInput('');
    setParsePreview([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070913]/90 flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-4xl flex flex-col gap-6 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <h2 className="text-2xl font-extrabold text-white">家長與設定後台</h2>
            <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold">
              玩家: {save.playerName}
            </span>
          </div>
          <button onClick={onClose} className="btn-secondary px-3 py-1.5 text-sm">
            關閉後台 ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 gap-2">
          <button
            onClick={() => setActiveTab('gas')}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'gas' ? 'border-indigo-500 text-indigo-300' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            ☁️ 雲端備份 (GAS)
          </button>
          <button
            onClick={() => setActiveTab('wrong')}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'wrong' ? 'border-indigo-500 text-indigo-300' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            📕 錯題本統計 ({Object.keys(save.wrongQuestions).length} 題)
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'custom' ? 'border-indigo-500 text-indigo-300' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            📚 自訂字庫管理 ({Object.keys(save.customLibraries).length})
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto pr-2 min-h-[350px]">
          
          {/* TAB 1: GAS CONFIGURATION */}
          {activeTab === 'gas' && (
            <div className="flex flex-col gap-6 animate-pop">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Google Sheets 雲端同步設定</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  本遊戲支援將存檔與答錯字庫備份至您的 Google 試算表。請先在 Google 雲端硬碟建立一個 Apps Script 網路應用程式，並將產生的 Web App 網址貼在下方。
                </p>
              </div>

              <div className="flex flex-col gap-2 bg-white/3 p-4 rounded-xl border border-white/5">
                <label className="text-xs text-white/50 font-bold">Google Apps Script Web App URL</label>
                <input
                  type="text"
                  value={gasUrlInput}
                  onChange={(e) => setGasUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="bg-[#0f111a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none w-full"
                />
                <div className="flex gap-2 justify-end mt-2">
                  <button onClick={handleSaveGasUrl} className="btn-secondary text-sm px-4 py-2">
                    儲存網址
                  </button>
                  <button onClick={handleTestSync} className="btn-primary text-sm px-4 py-2">
                    測試雲端上傳
                  </button>
                </div>
              </div>

              {/* Sync Status Banner */}
              {syncStatus.message && (
                <div className={`p-4 rounded-xl text-sm border font-semibold flex items-center gap-2 ${
                  syncStatus.type === 'loading' ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-300' :
                  syncStatus.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' :
                  'bg-rose-950/20 border-rose-500/30 text-rose-300'
                }`}>
                  <span>{syncStatus.type === 'loading' ? '⏳' : syncStatus.type === 'success' ? '✓' : '✗'}</span>
                  <span>{syncStatus.message}</span>
                </div>
              )}

              {/* GAS Script Guide */}
              <div className="bg-[#121528] rounded-xl p-5 border border-white/5 flex flex-col gap-3">
                <h4 className="text-sm font-bold text-indigo-300">GAS 試算表後端建置教學</h4>
                <ol className="text-xs text-white/60 list-decimal list-inside flex flex-col gap-2">
                  <li>建立一張新的 Google 試算表，命名為「英文對戰存檔」。</li>
                  <li>點選上方選單的「擴充功能」 ➔ 「Apps Script」。</li>
                  <li>將下方 Apps Script 範例程式碼複製貼入編輯器中，並存檔。</li>
                  <li>點選右上角的「部署」 ➔ 「新增部署」，類型選擇「網頁應用程式」。</li>
                  <li>設定「誰可以存取」為「任何人（Anyone）」，並點擊部署。</li>
                  <li>複製取得的「網頁應用程式網址」，貼回上方的輸入框即可！</li>
                </ol>
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-indigo-400 font-bold">查看 GAS 範例程式碼 (Code.gs)</summary>
                  <pre className="bg-[#070913] text-emerald-400 p-3 rounded-lg overflow-x-auto mt-2 font-mono max-h-[150px]">
{`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (data.action === 'sync') {
    // 寫入/更新存檔
    var rowData = [
      new Date(),
      data.playerData.playerName,
      data.playerData.grade,
      data.playerData.level,
      data.playerData.exp,
      data.playerData.gold,
      data.playerData.wrongCount
    ];
    sheet.appendRow(rowData);
    return ContentService.createTextOutput("Sync success").setMimeType(ContentService.MimeType.TEXT);
  }
}`}
                  </pre>
                </details>
              </div>
            </div>
          )}

          {/* TAB 2: WRONG QUESTIONS REVIEW */}
          {activeTab === 'wrong' && (
            <div className="flex flex-col gap-4 animate-pop">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">答錯題目記錄（錯題本）</h3>
                  <p className="text-sm text-white/60">小朋友在遊戲中答錯的題目會自動搜集在此處。你可以單獨刪除已精通的字詞，或清除所有記錄。</p>
                </div>
                {Object.keys(save.wrongQuestions).length > 0 && (
                  <button onClick={handleClearAllWrong} className="btn-secondary bg-rose-950/20 hover:bg-rose-950/50 border-rose-500/20 text-rose-300 text-xs px-3 py-1.5">
                    🗑 完整清空
                  </button>
                )}
              </div>

              {Object.keys(save.wrongQuestions).length === 0 ? (
                <div className="flex items-center justify-center h-48 border border-dashed border-white/10 rounded-2xl text-white/40 font-bold">
                  目前沒有任何答錯的記錄！繼續保持完美防守與攻擊吧！✨
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                  {Object.values(save.wrongQuestions).map((q) => (
                    <div key={q.id} className="flex justify-between items-center bg-white/3 border border-white/5 p-4 rounded-xl">
                      <div className="flex flex-col gap-1.5 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${q.type === 'attack' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {q.type === 'attack' ? '單字(攻)' : '文法(防)'}
                          </span>
                          <span className="text-xs text-white/40">答錯 {q.errorCount} 次</span>
                        </div>
                        <p className="text-sm font-bold text-white">{q.question}</p>
                        <p className="text-xs text-emerald-400 font-extrabold">正確答案: {q.answer}</p>
                      </div>
                      <button onClick={() => handleClearWrongQuestion(q.id)} className="text-white/40 hover:text-rose-400 transition-colors px-2 py-1 text-sm">
                        已掌握 ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM LIBRARIES & BULK IMPORT */}
          {activeTab === 'custom' && (
            <div className="flex flex-col gap-6 animate-pop">
              <div>
                <h3 className="text-lg font-bold text-white">自訂單字庫管理</h3>
                <p className="text-sm text-white/60">在此處建立自定義的學習庫。你可以批量貼上單字，讓小朋友在對戰前選用特定的單字庫。</p>
              </div>

              {/* Step 1: Create a Library */}
              <div className="bg-white/3 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs text-white/50 font-bold">1. 建立新字庫</label>
                  <input
                    type="text"
                    value={libName}
                    onChange={(e) => setLibName(e.target.value)}
                    placeholder="例如：第三課考試字彙、學校單字 A"
                    className="bg-[#0f111a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none w-full"
                  />
                </div>
                <button onClick={handleCreateLibrary} className="btn-primary text-sm px-5 py-2 flex-shrink-0">
                  ＋ 建立字庫
                </button>
              </div>

              {/* Step 2: Library Selection & Question Display */}
              {Object.keys(save.customLibraries).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                  
                  {/* Left Column: List of Libraries */}
                  <div className="flex flex-col gap-2 border-r border-white/5 pr-4">
                    <label className="text-xs text-white/50 font-bold mb-1">2. 選擇編輯的字庫</label>
                    {Object.values(save.customLibraries).map((lib) => (
                      <button
                        key={lib.id}
                        onClick={() => {
                          setActiveLibId(lib.id);
                          setParsePreview([]);
                        }}
                        className={`text-left p-3 rounded-lg border text-sm font-semibold flex justify-between items-center transition-all ${
                          activeLibId === lib.id
                            ? 'bg-indigo-950/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-white/2 border-transparent text-white/70 hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{lib.name} ({lib.questions.length} 題)</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLibrary(lib.id);
                          }}
                          className="text-white/30 hover:text-rose-500 text-xs px-1"
                        >
                          ✕
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Right 2 Columns: Bulk Import or List Questions */}
                  {activeLibId && (
                    <div className="md:col-span-2 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-indigo-400 font-extrabold">
                          正在編輯「{save.customLibraries[activeLibId].name}」
                        </label>
                      </div>

                      {/* Bulk Text Import UI */}
                      <div className="flex flex-col gap-2 bg-[#121528]/80 border border-white/5 p-4 rounded-xl">
                        <span className="text-xs text-white/70 font-extrabold">批量匯入題目 (CSV / 貼上文字)</span>
                        <p className="text-[10px] text-white/40 leading-relaxed">
                          格式：<span className="text-indigo-300">正確答案, 句子(以____代填空), 類型(attack為單字/defense為文法), 干擾項1, 干擾項2, 干擾項3, 干擾項4</span>
                          <br />
                          範例：<br />
                          <span className="text-emerald-400 font-mono">banana, Monkeys love to eat ____., attack, apple, grape, milk, toy</span>
                          <br />
                          <span className="text-emerald-400 font-mono">went, I ____ to the zoo yesterday., defense, go, going, goes, gone</span>
                        </p>
                        <textarea
                          rows={4}
                          value={bulkTextInput}
                          onChange={(e) => setBulkTextInput(e.target.value)}
                          placeholder="每一列貼入一筆題目..."
                          className="bg-[#0f111a] border border-white/10 rounded-lg p-3 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none w-full"
                        />
                        <div className="flex gap-2 justify-end mt-1">
                          <button onClick={handlePreviewParse} className="btn-secondary text-xs px-4 py-2">
                            預覽解析
                          </button>
                          <button
                            onClick={handleImportToLibrary}
                            disabled={parsePreview.length === 0}
                            className="btn-primary text-xs px-4 py-2"
                          >
                            🚀 確認匯入 ({parsePreview.length} 題)
                          </button>
                        </div>
                      </div>

                      {/* Preview Table or List Table */}
                      {parsePreview.length > 0 ? (
                        <div className="border border-indigo-500/20 bg-indigo-950/10 rounded-xl p-3 max-h-[150px] overflow-y-auto">
                          <div className="text-xs font-bold text-indigo-300 mb-1">📝 解析預覽 (尚未存入字庫)</div>
                          {parsePreview.map((item, idx) => (
                            <div key={idx} className="text-[10px] text-white/70 border-b border-white/5 py-1">
                              <strong>[{item.type === 'attack' ? '單字' : '文法'}] {item.answer}</strong>: {item.question}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="max-h-[180px] overflow-y-auto pr-1">
                          <div className="text-xs font-bold text-white/50 mb-1.5">目前字庫內題目：</div>
                          {save.customLibraries[activeLibId].questions.length === 0 ? (
                            <p className="text-xs text-white/30 italic">字庫目前是空的。請使用上方面板大量匯入單字！</p>
                          ) : (
                            save.customLibraries[activeLibId].questions.map((q, idx) => (
                              <div key={idx} className="text-xs py-2 border-b border-white/5 flex justify-between items-center">
                                <div>
                                  <span className="font-extrabold text-indigo-400 mr-2">[{q.type === 'attack' ? '攻' : '防'}] {q.answer}</span>
                                  <span className="text-white/70">{q.question}</span>
                                </div>
                                <span className="text-[10px] text-white/40">選項: {q.distractors.slice(0,3).join('/')}...</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
