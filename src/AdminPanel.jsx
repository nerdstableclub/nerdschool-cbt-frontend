import React, { useState, useEffect } from 'react';
import SmartEnginePanel from './SmartEnginePanel';
import TeachingDashboard from './TeachingDashboard';
// 🔥 NEW: Dynamic API URL injected safely
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminPanel({ onStartExam }) {
  // --- MASTER ADMIN STATE ---
  const [activeTab, setActiveTab] = useState('blueprint'); // 'blueprint', 'editor', or 'manager'

  // --- BLUEPRINT STATE ---
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [blueprint, setBlueprint] = useState(() => {
    const saved = sessionStorage.getItem('adminBlueprint');
    return saved ? JSON.parse(saved) : { paper1: {}, paper2: {} };
  });
  const [result, setResult] = useState(() => {
    const saved = sessionStorage.getItem('adminResult');
    return saved ? JSON.parse(saved) : null;
  });
  const [testCount, setTestCount] = useState(() => {
    const saved = sessionStorage.getItem('adminTestCount');
    return saved ? parseInt(saved) : 1;
  });

  // --- EDITOR STATE ---
  const [searchPaper, setSearchPaper] = useState('Paper II');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // --- MANAGER STATE ---
  const [managerTests, setManagerTests] = useState([]);
  const [selectedManagerTest, setSelectedManagerTest] = useState(null);
  const [isManagerLoading, setIsManagerLoading] = useState(false);
  const [isSavingManager, setIsSavingManager] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  // Auto-Save Blueprint Memory
  useEffect(() => { sessionStorage.setItem('adminBlueprint', JSON.stringify(blueprint)); }, [blueprint]);
  useEffect(() => { sessionStorage.setItem('adminTestCount', testCount.toString()); }, [testCount]);
  useEffect(() => {
    if (result) sessionStorage.setItem('adminResult', JSON.stringify(result));
    else sessionStorage.removeItem('adminResult');
  }, [result]);

  // Load Blueprint Meta on Mount
  useEffect(() => {
    fetch(`${API_URL}/api/blueprint-meta`)
      .then(res => res.json())
      .then(data => {
        setMeta(data);
        setBlueprint(prev => {
          if (Object.keys(prev.paper1).length > 0) return prev;
          const initBP = { paper1: {}, paper2: {} };
          data.paper1.forEach(sec => {
            initBP.paper1[sec.subject] = {};
            sec.chapters.forEach(ch => initBP.paper1[sec.subject][ch.name] = 0);
          });
          data.paper2.forEach(sec => {
            initBP.paper2[sec.subject] = {};
            sec.chapters.forEach(ch => initBP.paper2[sec.subject][ch.name] = 0);
          });
          return initBP;
        });
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  // Fetch Published Tests when Manager Tab opens
  useEffect(() => {
    if (activeTab === 'manager') {
      setIsManagerLoading(true);
      fetch(`${API_URL}/api/published-tests`)
        .then(res => res.json())
        .then(data => {
          setManagerTests(data);
          setIsManagerLoading(false);
        })
        .catch(err => console.error(err));
    }
  }, [activeTab]);

  // --- BLUEPRINT LOGIC ---
  const handleInputChange = (paper, subject, chapter, value) => {
    const num = parseInt(value) || 0;
    setBlueprint(prev => ({
      ...prev, [paper]: { ...prev[paper], [subject]: { ...prev[paper][subject], [chapter]: num } }
    }));
  };

  const getTotals = () => {
    let p1Total = 0;
    Object.values(blueprint.paper1).forEach(subj => p1Total += Object.values(subj).reduce((a, b) => a + b, 0));
    let p2Total = 0;
    Object.values(blueprint.paper2).forEach(subj => p2Total += Object.values(subj).reduce((a, b) => a + b, 0));
    return { p1Total, p2Total, grand: p1Total + p2Total };
  };

  const handleGenerate = () => {
    setGenerating(true);
    fetch(`${API_URL}/api/generate-blueprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint, testCount })
    })
      .then(res => res.json())
      .then(data => { setResult(data); setGenerating(false); })
      .catch(err => console.error(err));
  };

  // --- NEW: Instantly clear all numbers back to 0 ---
  const handleClearBlueprint = () => {
    setBlueprint(prev => {
      const cleared = { paper1: {}, paper2: {} };
      Object.keys(prev.paper1).forEach(subj => {
        cleared.paper1[subj] = {};
        Object.keys(prev.paper1[subj]).forEach(ch => cleared.paper1[subj][ch] = 0);
      });
      Object.keys(prev.paper2).forEach(subj => {
        cleared.paper2[subj] = {};
        Object.keys(prev.paper2[subj]).forEach(ch => cleared.paper2[subj][ch] = 0);
      });
      return cleared;
    });
    setTestCount(1);
  };

  // --- UPDATED: Handle multiple tests and auto-clear ---
  const handlePublish = async () => {
    const totalTests = result.mockTests.length;
    const baseTitle = prompt(`Enter a base title for these ${totalTests} test(s) (e.g., 'Weekly Mock'):`);
    if (!baseTitle) return;
    const isPremium = confirm("Make these PREMIUM ONLY? (Click OK for Yes, Cancel for Free)");
    
    try {
      // Loop through all generated tests and publish them one by one!
      for (let i = 0; i < totalTests; i++) {
        const testTitle = totalTests > 1 ? `${baseTitle} - Part ${i + 1}` : baseTitle;
        await fetch(`${API_URL}/api/publish-test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: testTitle, isPremium, testData: result.mockTests[i] })
        });
      }
      
      alert(`✅ Successfully published ${totalTests} test(s) to Student Dashboards!`);
      
      // Reset the screen and clear the blueprint automatically!
      setResult(null); 
      sessionStorage.removeItem('adminResult');
      handleClearBlueprint(); 
      
    } catch (err) { alert("Error publishing tests!"); }
  };

  // --- EDITOR LOGIC ---
  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/search-questions?paperType=${searchPaper}&query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
      setEditingQuestion(null);
    } catch (err) { console.error(err); }
    setIsSearching(false);
  };

  const handleSaveEdit = async () => {
    if (isCreatingNew && (!editingQuestion.subject || !editingQuestion.chapter || !editingQuestion.questionText)) {
      alert("Subject, Chapter, and Question Text are required to create a new question!");
      return;
    }
    setIsSavingEdit(true);
    try {
      const endpoint = isCreatingNew ? '/api/add-question' : '/api/update-question';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQuestion)
      });
      if (res.ok) {
        alert(isCreatingNew ? "✅ New question added successfully!" : "✅ Question updated successfully!");
        setEditingQuestion(null); setIsCreatingNew(false);
        if (!isCreatingNew) handleSearch(); 
      } else alert("Failed to save question.");
    } catch (err) { alert("Error saving question!"); }
    setIsSavingEdit(false);
  };

  const handleEditChange = (e) => setEditingQuestion({ ...editingQuestion, [e.target.name]: e.target.value });

  // --- MANAGER LOGIC ---
  const moveQuestion = (paperType, index, direction) => {
    const updatedTest = { ...selectedManagerTest };
    const arr = paperType === 1 ? updatedTest.testData.paper1Questions : updatedTest.testData.paper2Questions;
    
    if (direction === 'up' && index > 0) {
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    } else if (direction === 'down' && index < arr.length - 1) {
      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
    }
    setSelectedManagerTest(updatedTest);
  };

  const removeQuestion = (paperType, index) => {
    if (!confirm("Are you sure you want to remove this question from the mock test?")) return;
    const updatedTest = { ...selectedManagerTest };
    const arr = paperType === 1 ? updatedTest.testData.paper1Questions : updatedTest.testData.paper2Questions;
    arr.splice(index, 1);
    setSelectedManagerTest(updatedTest);
  };

  const saveManagedTest = async () => {
    setIsSavingManager(true);
    try {
      const res = await fetch(`${API_URL}/api/update-mock-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: selectedManagerTest.testId,
          testData: selectedManagerTest.testData
        })
      });
      if (res.ok) {
        alert("✅ Mock Test updated and reordered successfully!");
        // Update local list
        setManagerTests(managerTests.map(t => t.testId === selectedManagerTest.testId ? selectedManagerTest : t));
      } else alert("Failed to update test.");
    } catch (err) { alert("Error updating test!"); }
    setIsSavingManager(false);
  };

  const editQuestionFromManager = (q) => {
    // Convert the Test's format back into the Database format so the Editor can read it!
    setEditingQuestion({
      globalId: q.id,
      paperType: q.id.startsWith('P1') ? 'Paper I' : 'Paper II',
      subject: q.subject,
      chapter: q.chapter,
      questionText: q.question,
      option1: q.options[0],
      option2: q.options[1],
      option3: q.options[2],
      option4: q.options[3],
      rightAnswer: q.answer,
      explanation: q.explanation
    });
    setIsCreatingNew(false);
    setActiveTab('editor'); // Instantly switch to the Database Editor tab!
  };

  const handleDragStart = (index, paperType) => setDraggedItem({ index, paperType });
  const handleDragOver = (e) => e.preventDefault(); // Required to allow dropping
  const handleDrop = (dropIndex, paperType) => {
    if (!draggedItem || draggedItem.paperType !== paperType || draggedItem.index === dropIndex) return;
    
    const updatedTest = { ...selectedManagerTest };
    const arr = paperType === 1 ? updatedTest.testData.paper1Questions : updatedTest.testData.paper2Questions;
    
    // Pull the question out and insert it at the new dropped index
    const [movedItem] = arr.splice(draggedItem.index, 1);
    arr.splice(dropIndex, 0, movedItem);
    
    setSelectedManagerTest(updatedTest);
    setDraggedItem(null);
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-xl text-blue-600">Syncing Database...</div>;
  const totals = getTotals();

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      
      {/* ADMIN TOP NAVIGATION */}
      <div className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-black text-xl tracking-widest uppercase">NerdSchool Admin</div>
          <div className="flex flex-wrap justify-center gap-2 bg-blue-800 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('blueprint')}
              className={`px-4 py-2 rounded font-bold text-sm transition-all ${activeTab === 'blueprint' ? 'bg-white text-blue-900 shadow' : 'text-blue-200 hover:text-white'}`}
            >
              🛠️ Blueprint Generator
            </button>
            <button 
              onClick={() => setActiveTab('manager')}
              className={`px-4 py-2 rounded font-bold text-sm transition-all ${activeTab === 'manager' ? 'bg-white text-blue-900 shadow' : 'text-blue-200 hover:text-white'}`}
            >
              📋 Mock Test Manager
            </button>
            <button 
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded font-bold text-sm transition-all ${activeTab === 'editor' ? 'bg-white text-blue-900 shadow' : 'text-blue-200 hover:text-white'}`}
            >
              ✏️ Database Editor
            </button>

            {/* 👇 DROP OUR 4TH ISOLATED TAB BUTTON HERE */}
            <button 
              onClick={() => setActiveTab('smart-engine')}
              className={`px-4 py-2 rounded font-bold text-sm transition-all ${activeTab === 'smart-engine' ? 'bg-white text-purple-900 shadow font-black' : 'text-purple-200 hover:text-white'}`}
            >
              🧠 Smart Prediction Bank
            </button>
            <button 
             onClick={() => setActiveTab('teaching-studio')}
             className={`px-4 py-2 rounded font-bold text-sm transition-all ${activeTab === 'teaching-studio' ? 'bg-white text-emerald-900 shadow font-black' : 'text-emerald-200 hover:text-white'}`}
            >
            🎙️ Live Teaching Studio
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 mt-4">
        
        {/* ========================================================= */}
        {/* TAB 1: BLUEPRINT GENERATOR                                */}
        {/* ========================================================= */}
        {activeTab === 'blueprint' && (
           <div className="animate-in fade-in duration-300">
             
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
               <div>
                 <h1 className="text-3xl font-bold mb-2">Syllabus Blueprint Builder</h1>
                 <p className="text-gray-600">Define exactly how many questions to pull from each subject and chapter.</p>
               </div>
               <button 
                 onClick={handleClearBlueprint} 
                 className="px-5 py-2.5 bg-red-50 text-red-600 font-bold rounded-lg border border-red-200 hover:bg-red-100 hover:text-red-700 transition-colors shadow-sm flex items-center gap-2"
               >
                 <span>🗑️</span> Clear Blueprint
               </button>
             </div>
 
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
               {/* PAPER 1 BUILDER */}
               <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                 <div className="flex justify-between items-center mb-4 pb-2 border-b">
                   <h2 className="text-xl font-bold text-blue-800">Paper 1 Blueprint</h2>
                   <span className={`font-bold ${totals.p1Total === 50 ? 'text-green-600' : 'text-orange-500'}`}>Total: {totals.p1Total} / 50</span>
                 </div>
                 <div className="max-h-[500px] overflow-y-auto pr-3 space-y-5">
                   {meta.paper1.map((section, sIdx) => (
                     <div key={sIdx} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                       <h3 className="text-sm font-black text-gray-800 bg-gray-200 px-3 py-2 uppercase tracking-wide">{section.subject}</h3>
                       <div className="bg-gray-50 p-2 space-y-2">
                         {section.chapters.map((ch, cIdx) => (
                           <div key={cIdx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm hover:border-blue-300 transition-colors gap-3">
                             <div className="flex flex-col justify-center min-w-0 flex-1">
                                <span className="text-sm font-medium truncate text-gray-800 leading-tight" title={ch.name}>{ch.name}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5 whitespace-nowrap">
                                  <span className="text-gray-400">Tot: {ch.total}</span> <span className="text-gray-300 mx-1">|</span> 
                                  <span className="text-red-400">Used: {ch.used}</span> <span className="text-gray-300 mx-1">|</span> 
                                  <span className="text-green-600">Avail: {ch.available}</span>
                                </span>
                              </div>
                             <input 
                               type="number" min="0" max={ch.available}
                               value={blueprint.paper1[section.subject]?.[ch.name] || ''}
                               onChange={(e) => handleInputChange('paper1', section.subject, ch.name, e.target.value)}
                               className="w-16 flex-shrink-0 p-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500" placeholder="0"
                             />
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
 
               {/* PAPER 2 BUILDER */}
               <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                 <div className="flex justify-between items-center mb-4 pb-2 border-b">
                   <h2 className="text-xl font-bold text-purple-800">Paper 2 Blueprint</h2>
                   <span className={`font-bold ${totals.p2Total === 100 ? 'text-green-600' : 'text-orange-500'}`}>Total: {totals.p2Total} / 100</span>
                 </div>
                 <div className="max-h-[500px] overflow-y-auto pr-3 space-y-5">
                   {meta.paper2.map((section, sIdx) => (
                     <div key={sIdx} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                       <h3 className="text-sm font-black text-white bg-purple-800 px-3 py-2 uppercase tracking-wide">{section.subject}</h3>
                       <div className="bg-gray-50 p-2 space-y-2">
                         {section.chapters.map((ch, cIdx) => (
                           <div key={cIdx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm hover:border-purple-300 transition-colors gap-3">
                             <div className="flex flex-col justify-center min-w-0 flex-1">
                                <span className="text-sm font-medium truncate text-gray-800 leading-tight" title={ch.name}>{ch.name}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5 whitespace-nowrap">
                                  <span className="text-gray-400">Tot: {ch.total}</span> <span className="text-gray-300 mx-1">|</span> 
                                  <span className="text-red-400">Used: {ch.used}</span> <span className="text-gray-300 mx-1">|</span> 
                                  <span className="text-green-600">Avail: {ch.available}</span>
                                </span>
                              </div>
                             <input 
                               type="number" min="0" max={ch.available}
                               value={blueprint.paper2[section.subject]?.[ch.name] || ''}
                               onChange={(e) => handleInputChange('paper2', section.subject, ch.name, e.target.value)}
                               className="w-16 flex-shrink-0 p-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-purple-500" placeholder="0"
                             />
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
 
             {/* GENERATOR BUTTONS */}
             <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 flex flex-col items-center">
               {!result ? (
                 <>
                   <div className="flex items-center space-x-4 mb-6">
                     <span className="font-semibold text-lg text-gray-700">Number of Tests to Generate:</span>
                     <input 
                       type="number" min="1" max="50" value={testCount} 
                       onChange={(e) => setTestCount(parseInt(e.target.value) || 1)}
                       className="w-24 p-2 border-2 border-gray-300 rounded-lg text-center font-bold text-2xl focus:border-blue-500"
                     />
                   </div>
                   <button onClick={handleGenerate} disabled={generating || totals.grand === 0} className={`px-12 py-5 text-xl font-bold text-white rounded-xl shadow-lg transition-all ${generating ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:scale-105'}`}>
                     {generating ? '⚙️ Extracting...' : `🚀 Generate Mock Test`}
                   </button>
                 </>
               ) : (
                 <div className="text-center animate-in fade-in zoom-in duration-300">
                   <h2 className="text-3xl font-black text-green-600 mb-4">
                     🎉 {result.mockTests.length > 1 ? `${result.mockTests.length} Tests` : 'Test'} Successfully Compiled!
                   </h2>
                   <div className="flex gap-4 justify-center">
                     <button onClick={() => onStartExam(result.mockTests[0])} className="px-8 py-4 text-lg font-black text-blue-800 bg-white rounded-xl shadow-md hover:bg-gray-50 border-2 border-blue-800">
                       Preview {result.mockTests.length > 1 ? 'Test 1' : 'Test'} ⏱️
                     </button>
                     <button onClick={handlePublish} className="px-8 py-4 text-lg font-black text-white bg-blue-800 rounded-xl shadow-xl hover:bg-blue-900 border-2 border-blue-300">
                       Publish {result.mockTests.length > 1 ? 'All Tests' : ''} to Students 🚀
                     </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MOCK TEST MANAGER (NEW)                            */}
        {/* ========================================================= */}
        {activeTab === 'manager' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Mock Test Manager</h1>
            <p className="text-gray-600 mb-8">Select a published test to manually reorder or remove questions.</p>

            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* LEFT: LIST OF PUBLISHED TESTS */}
              <div className="w-full lg:w-1/3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[700px]">
                <div className="bg-gray-100 p-4 font-bold text-gray-700 border-b border-gray-200">Published Tests</div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2 bg-gray-50">
                  {isManagerLoading && <div className="p-4 text-center text-gray-500">Loading tests...</div>}
                  {!isManagerLoading && managerTests.length === 0 && <div className="p-4 text-center text-gray-500">No published tests yet.</div>}
                  {managerTests.map(test => (
                    <button 
                      key={test.testId}
                      onClick={() => setSelectedManagerTest(JSON.parse(JSON.stringify(test)))} // deep copy so we can edit safely
                      className={`w-full text-left p-4 rounded-lg border transition-all ${selectedManagerTest?.testId === test.testId ? 'bg-blue-100 border-blue-400 shadow-md' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                    >
                      <div className="text-xs font-black text-gray-500 mb-1">{test.testId}</div>
                      <div className="text-lg font-bold text-blue-900">{test.title}</div>
                      <div className="mt-2 text-xs font-semibold text-gray-600">
                        {test.isPremium ? '💎 Premium' : '🆓 Free'} • P1: {test.testData.paper1Questions.length} Qs • P2: {test.testData.paper2Questions.length} Qs
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* RIGHT: TEST EDITOR */}
              <div className="w-full lg:w-2/3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[700px]">
                {!selectedManagerTest ? (
                  <div className="h-full flex items-center justify-center text-gray-400 font-bold">Select a test from the left to manage it.</div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="bg-blue-50 p-4 border-b border-blue-200 flex justify-between items-center z-10 shadow-sm">
                      <div>
                        <h2 className="text-xl font-black text-blue-900">{selectedManagerTest.title}</h2>
                        <p className="text-sm font-bold text-gray-600">Total Questions: {selectedManagerTest.testData.paper1Questions.length + selectedManagerTest.testData.paper2Questions.length}</p>
                      </div>
                      <button 
                        onClick={saveManagedTest} disabled={isSavingManager}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors"
                      >
                        {isSavingManager ? 'Saving...' : 'Save Arrangement 💾'}
                      </button>
                    </div>

                    {/* Question List */}
                    <div className="overflow-y-auto flex-1 p-6 space-y-8">
                      
                      {/* PAPER 1 LIST */}
                      <div>
                        <h3 className="text-lg font-black text-gray-800 bg-gray-200 p-2 rounded mb-4">Paper I Questions ({selectedManagerTest.testData.paper1Questions.length})</h3>
                        <div className="space-y-3">
                          {selectedManagerTest.testData.paper1Questions.map((q, idx) => (
                            <div 
                              key={`${q.id}-${idx}`} 
                              draggable
                              onDragStart={() => handleDragStart(idx, 1)}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDrop(idx, 1)}
                              className={`flex gap-4 p-3 bg-white border rounded shadow-sm transition-all cursor-move ${draggedItem?.paperType === 1 && draggedItem?.index === idx ? 'opacity-50 border-dashed border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-400'}`}
                            >
                              <div className="flex flex-col items-center justify-center gap-1 bg-gray-50 px-2 rounded border">
                                <button onClick={() => moveQuestion(1, idx, 'up')} className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-blue-600" title="Move Up">▲</button>
                                <span className="font-black text-gray-400 text-xs">{idx + 1}</span>
                                <button onClick={() => moveQuestion(1, idx, 'down')} className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-blue-600" title="Move Down">▼</button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{q.id}</span>
                                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded truncate max-w-[200px]">{q.chapter}</span>
                                </div>
                                <p className="text-sm text-gray-800 line-clamp-2">{q.question}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => editQuestionFromManager(q)} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Fix Typo in Master Database">✏️</button>
                                <button onClick={() => removeQuestion(1, idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Remove Question">🗑️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PAPER 2 LIST */}
                      <div>
                        <h3 className="text-lg font-black text-white bg-purple-800 p-2 rounded mb-4 mt-8">Paper II Questions ({selectedManagerTest.testData.paper2Questions.length})</h3>
                        <div className="space-y-3">
                          {selectedManagerTest.testData.paper2Questions.map((q, idx) => (
                            <div 
                              key={`${q.id}-${idx}`} 
                              draggable
                              onDragStart={() => handleDragStart(idx, 2)}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDrop(idx, 2)}
                              className={`flex gap-4 p-3 bg-white border rounded shadow-sm transition-all cursor-move ${draggedItem?.paperType === 2 && draggedItem?.index === idx ? 'opacity-50 border-dashed border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-400'}`}
                            >
                              <div className="flex flex-col items-center justify-center gap-1 bg-gray-50 px-2 rounded border">
                                <button onClick={() => moveQuestion(2, idx, 'up')} className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-purple-600" title="Move Up">▲</button>
                                <span className="font-black text-gray-400 text-xs">{idx + 1 + selectedManagerTest.testData.paper1Questions.length}</span>
                                <button onClick={() => moveQuestion(2, idx, 'down')} className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-purple-600" title="Move Down">▼</button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{q.id}</span>
                                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded truncate max-w-[200px]">{q.chapter}</span>
                                </div>
                                <p className="text-sm text-gray-800 line-clamp-2">{q.question}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => editQuestionFromManager(q)} className="p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded" title="Fix Typo in Master Database">✏️</button>
                                <button onClick={() => removeQuestion(2, idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Remove Question">🗑️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: DATABASE QUESTION EDITOR                           */}
        {/* ========================================================= */}
        {activeTab === 'editor' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Database Editor</h1>
            <p className="text-gray-600 mb-8">Search for any question in your Google Sheet to fix typos, change options, or update explanations.</p>

            {/* SEARCH BAR */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-8 flex flex-col md:flex-row gap-4">
              <select 
                value={searchPaper} onChange={(e) => setSearchPaper(e.target.value)}
                className="p-4 border-2 border-gray-300 rounded-lg font-bold text-gray-700 bg-gray-50 focus:border-blue-600 outline-none"
              >
                <option value="Paper I">Paper I</option>
                <option value="Paper II">English Paper II</option>
              </select>
              
              <input 
                type="text" placeholder="Search by Global ID (e.g., P2-U1-001) or type a few words from the question..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 p-4 border-2 border-gray-300 rounded-lg text-gray-800 focus:border-blue-600 outline-none"
              />
              
              <button 
                onClick={handleSearch} disabled={isSearching}
                className="px-8 bg-blue-800 text-white font-black rounded-lg hover:bg-blue-900 shadow transition-colors"
              >
                {isSearching ? 'Searching...' : 'Search 🔍'}
              </button>
            </div>

            {/* SPLIT VIEW: Results List + Edit Form */}
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* LEFT: RESULTS LIST */}
              <div className="w-full lg:w-1/3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="bg-gray-100 p-3 font-bold text-gray-700 border-b border-gray-200 flex justify-between items-center">
                  <span>Search Results ({searchResults.length})</span>
                  <button 
                    onClick={() => {
                      setIsCreatingNew(true);
                      setEditingQuestion({
                        paperType: searchPaper, subject: '', chapter: '', questionText: '',
                        option1: '', option2: '', option3: '', option4: '', rightAnswer: '1', explanation: ''
                      });
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-xs font-black rounded hover:bg-green-700 shadow-sm"
                  >
                    + Add New
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2 bg-gray-50">
                  {searchResults.length === 0 && !isSearching && <div className="text-gray-400 p-4 text-center text-sm">No results. Try searching above!</div>}
                  {searchResults.map(q => (
                    <button 
                      key={q.globalId}
                      onClick={() => { setIsCreatingNew(false); setEditingQuestion(q); }}
                      className={`w-full text-left p-3 rounded border transition-all ${editingQuestion?.globalId === q.globalId ? 'bg-blue-100 border-blue-400 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                    >
                      <div className="text-xs font-black text-blue-800 mb-1">{q.globalId}</div>
                      <div className="text-sm text-gray-600 line-clamp-2 leading-snug">{q.questionText}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* RIGHT: THE EDIT FORM */}
              <div className="w-full lg:w-2/3 bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-[600px] overflow-y-auto">
                {!editingQuestion ? (
                  <div className="h-full flex items-center justify-center text-gray-400 font-bold">Select a question from the left to edit it here.</div>
                ) : (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center border-b pb-4">
                      <div>
                        <h3 className="text-xl font-black text-gray-800">
                          {isCreatingNew ? 'Adding New Question' : `Editing ${editingQuestion.globalId}`}
                        </h3>
                        {!isCreatingNew && <p className="text-xs font-bold text-gray-500 uppercase">{editingQuestion.subject} &rsaquo; {editingQuestion.chapter}</p>}
                      </div>
                      <button onClick={handleSaveEdit} disabled={isSavingEdit} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors">
                        {isSavingEdit ? 'Saving...' : 'Save to Database 💾'}
                      </button>
                    </div>

                    {isCreatingNew && (
                      <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div>
                          <label className="block text-sm font-black text-blue-900 mb-2 uppercase tracking-wide">Subject / Title</label>
                          <select 
                            name="subject" value={editingQuestion.subject} 
                            onChange={(e) => setEditingQuestion({...editingQuestion, subject: e.target.value, chapter: ''})}
                            className="w-full p-2 border-2 border-blue-300 rounded focus:border-blue-600 outline-none font-bold text-sm text-gray-700"
                          >
                            <option value="">-- Select Subject --</option>
                            {meta && meta[editingQuestion.paperType === 'Paper I' ? 'paper1' : 'paper2'].map(sec => (
                              <option key={sec.subject} value={sec.subject}>{sec.subject}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-black text-blue-900 mb-2 uppercase tracking-wide">Chapter Name</label>
                          <select 
                            name="chapter" value={editingQuestion.chapter} onChange={handleEditChange}
                            disabled={!editingQuestion.subject}
                            className="w-full p-2 border-2 border-blue-300 rounded focus:border-blue-600 outline-none font-bold text-sm text-gray-700 disabled:bg-gray-200"
                          >
                            <option value="">-- Select Chapter --</option>
                            {editingQuestion.subject && meta && meta[editingQuestion.paperType === 'Paper I' ? 'paper1' : 'paper2']
                              .find(sec => sec.subject === editingQuestion.subject)?.chapters.map(ch => (
                                <option key={ch.name} value={ch.name}>{ch.name}</option>
                              ))
                            }
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Question Text</label>
                      <textarea name="questionText" value={editingQuestion.questionText} onChange={handleEditChange} rows={5} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none font-mono text-sm leading-relaxed" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-gray-600 mb-1">Option 1</label><input type="text" name="option1" value={editingQuestion.option1} onChange={handleEditChange} className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" /></div>
                      <div><label className="block text-xs font-bold text-gray-600 mb-1">Option 2</label><input type="text" name="option2" value={editingQuestion.option2} onChange={handleEditChange} className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" /></div>
                      <div><label className="block text-xs font-bold text-gray-600 mb-1">Option 3</label><input type="text" name="option3" value={editingQuestion.option3} onChange={handleEditChange} className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" /></div>
                      <div><label className="block text-xs font-bold text-gray-600 mb-1">Option 4</label><input type="text" name="option4" value={editingQuestion.option4} onChange={handleEditChange} className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" /></div>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Correct Answer (1-4)</label>
                      <select name="rightAnswer" value={editingQuestion.rightAnswer} onChange={handleEditChange} className="p-2 border-2 border-gray-300 rounded focus:border-blue-500 outline-none font-bold">
                        <option value="1">Option 1</option><option value="2">Option 2</option><option value="3">Option 3</option><option value="4">Option 4</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wide">Explanation / Solution</label>
                      <textarea name="explanation" value={editingQuestion.explanation} onChange={handleEditChange} rows={4} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm leading-relaxed" />
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
           {activeTab === 'smart-engine' && (
           <SmartEnginePanel API_URL={API_URL} />
        )} 
      </div>
      {/* ========================================================= */}
{/* TAB 5: LIVE TEACHING COCKPIT (OBS STREAMER MODE)          */}
{/* ========================================================= */}
{activeTab === 'teaching-studio' && (
  <div className="fixed inset-0 z-[100] bg-slate-950 overflow-hidden">
    <TeachingDashboard />
  </div>
)}
    </div>
  );
}