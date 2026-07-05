import React, { useState, useEffect } from 'react';
import AdminPanel from './AdminPanel'; 
import Auth from './Auth'; 
import ExamInstructions from './ExamInstructions';
import StudentHub from './StudentHub'; 
import StudentDashboard from './StudentDashboard';
import SynthesisLab from './SynthesisLab';
import PyqEngine from './PyqEngine'; // <-- 🔥 NEW IMPORT
import PodcastEngine from './PodcastEngine'; // <-- 🔥 NEW IMPORT
import PDFEngine from './PDFEngine';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ExamTimer = ({ initialMinutes = 180, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return <span className="font-mono text-lg font-bold text-red-600">{formatTime(timeLeft)}</span>;
};

function App() {
  const [appMode, setAppMode] = useState('auth'); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [isExamPreview, setIsExamPreview] = useState(false); 
  const [currentTestId, setCurrentTestId] = useState(null); 
  const [isSavingScore, setIsSavingScore] = useState(false); 
  
  // DASHBOARD STATE
  const [publishedTests, setPublishedTests] = useState([]);
  const [myScores, setMyScores] = useState([]); 
  const [loadingTests, setLoadingTests] = useState(false);
  
  // PRACTICE ENGINE STATE
  const [blueprintMeta, setBlueprintMeta] = useState(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false); 
  const [practiceScores, setPracticeScores] = useState([]); 
  const [showPremiumModal, setShowPremiumModal] = useState(false); 

  // 🔥 THE NEW BOUNCER LOGIC
  const hasPlan = (planName) => {
    if (!currentUser || !currentUser.plans) return false;
    return currentUser.plans.some(p => p.toLowerCase() === planName.toLowerCase() || p.toLowerCase() === 'premium'); 
  };

  useEffect(() => {
    if (appMode === 'dashboard' && currentUser) {
      setLoadingTests(true);

      fetch(`${API_URL}/api/published-tests`)
        .then(res => res.json())
        .then(data => setPublishedTests(data))
        .catch(err => console.error(err));

      fetch(`${API_URL}/api/my-scores?rollNumber=${currentUser.rollNumber}`)
        .then(res => res.json())
        .then(data => setMyScores(data))
        .catch(err => console.error(err));

      fetch(`${API_URL}/api/blueprint-meta`)
        .then(res => res.json())
        .then(data => setBlueprintMeta(data))
        .catch(err => console.error(err))
        .finally(() => setLoadingTests(false));

      setPracticeScores(JSON.parse(localStorage.getItem('ns_practice_scores') || '[]'));
    }
  }, [appMode, currentUser]);
  
  // EXAM STATE
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSection, setActiveSection] = useState('Paper I');
  const [showModal, setShowModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);

  // ANTI-CHEATING SYSTEM
  const [cheatAlert, setCheatAlert] = useState('');
  const cheatJokes = [
    "Nice try! But copying is a tragedy Shakespeare wouldn't even write.",
    "Ctrl+C? You're acting more indecisive than Hamlet. Just answer the question!",
    "T.S. Eliot said 'Immature poets imitate; mature poets steal.' But this is an exam. Denied!",
    "F12 won't help you find the 'Lost Generation' in the console.",
    "Right-click disabled. Big Brother is watching you. (1984)",
    "Printing? Are you trying to self-publish? Get back to the test!",
    "You shall not pass... if you keep trying to cheat! (Gandalf)",
    "Frankenstein created a monster, and you're creating a headache. No Developer Tools allowed!",
    "Hold it right there, Holden Caulfield. We don't tolerate phonies here.",
    "A tale told by an idiot, full of sound and fury, signifying... a blocked screenshot.",
    "No screenshots! Even Dorian Gray kept his picture hidden.",
    "Quoth the Raven: 'Ctrl+V no more.'",
    "Curiosity killed the cat, and inspecting the code will kill your score.",
    "Jane Austen would be highly prejudiced against your lack of test-taking pride.",
    "To cheat, or not to cheat? That is not even a question here.",
    "Leave the hacking to cyberpunk novels. You have literature to remember.",
    "Copying text? That's Plagiarism, a sin Dante reserved for a special circle of hell.",
    "Two roads diverged in a wood, and you took the one that got blocked by our anti-cheat.",
    "The only print you should be leaving is a lasting impression on your scorecard.",
    "Screenshots? If we wanted this documented, we'd have hired Samuel Pepys."
  ];

  useEffect(() => {
    if (appMode !== 'exam') return;

    const triggerJoke = (e) => {
      if (e) e.preventDefault();
      const randomJoke = cheatJokes[Math.floor(Math.random() * cheatJokes.length)];
      setCheatAlert(randomJoke);
      setTimeout(() => setCheatAlert(''), 4000); 
    };

    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.key === 'p') || 
        (e.ctrlKey && e.key === 's') || 
        (e.ctrlKey && e.key === 'c') || 
        e.key === 'PrintScreen' 
      ) {
        triggerJoke(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', triggerJoke); 
    window.addEventListener('copy', triggerJoke); 

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', triggerJoke);
      window.removeEventListener('copy', triggerJoke);
    };
  }, [appMode]);

  const handleStartPractice = async (paperType, subject, chapter) => {
    try {
      const res = await fetch(`${API_URL}/api/quick-practice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperType, subject, chapter, isPremium: hasPlan('Mocktest') || hasPlan('Premium') })
      });
      const data = await res.json();
      
      if (data.questions && data.questions.length > 0) {
        const dummyTest = {
          paper1Questions: paperType === 'Paper I' ? data.questions : [],
          paper2Questions: paperType !== 'Paper I' ? data.questions : []
        };
        handleStartExam(dummyTest, `Practice: ${chapter}`, false, null, true); 
      } else {
        alert("No questions found for this chapter!");
      }
    } catch (err) {
      alert("Error loading practice test.");
    }
  };

  const handleStartExam = (generatedTest, testId = null, isPreview = false, pastResponses = null, isPractice = false) => {
    setCurrentTestId(testId);
    setIsExamPreview(isPreview);
    setIsPracticeMode(isPractice); 
    
    if (pastResponses) {
      setIsReviewMode(true);
      setShowResult(false);
    } else {
      setIsReviewMode(false);
    }

    const p1Formatted = generatedTest.paper1Questions.map((row, index) => ({
      id: index + 1,
      section: 'Paper I',
      globalId: row.id,
      text: row.question,
      options: row.options,
      correctAnswer: parseInt(row.answer),
      marks: 2,
      negative: 0,
      explanation: row.explanation || 'No explanation provided.',
      status: index === 0 ? 'notAnswered' : 'notVisited',
      selectedOption: null
    }));

    const p2Formatted = generatedTest.paper2Questions.map((row, index) => ({
      id: p1Formatted.length + index + 1, 
      section: 'Paper II',
      globalId: row.id,
      text: row.question,
      options: row.options,
      correctAnswer: parseInt(row.answer),
      marks: 2,
      negative: 0,
      explanation: row.explanation || 'No explanation provided.',
      status: 'notVisited',
      selectedOption: null
    }));

    let combined = [...p1Formatted, ...p2Formatted];
    
    if (pastResponses) {
      combined = combined.map(q => {
        const saved = pastResponses.find(r => r.id === q.id);
        return saved ? { ...q, selectedOption: saved.selectedOption, status: saved.status } : q;
      });
    }

    setQuestions(combined);
    setAppMode(pastResponses ? 'exam' : 'instructions');
  };

  const handleOptionSelect = (optionIndex) => {
    if (isReviewMode) return;
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex].selectedOption = optionIndex;
    setQuestions(updatedQuestions);
  };

  const moveToNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      const updatedQuestions = [...questions];
      
      if (updatedQuestions[nextIndex].section !== activeSection) {
        setActiveSection(updatedQuestions[nextIndex].section);
      }
      if (updatedQuestions[nextIndex].status === 'notVisited') {
        updatedQuestions[nextIndex].status = 'notAnswered';
      }
      
      setQuestions(updatedQuestions);
      setCurrentIndex(nextIndex);
    }
  };

  const handleSaveAndNext = () => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[currentIndex].selectedOption !== null) {
      updatedQuestions[currentIndex].status = 'answered'; 
    } else {
      updatedQuestions[currentIndex].status = 'notAnswered'; 
    }
    setQuestions(updatedQuestions);
    moveToNextQuestion();
  };

  const handleMarkForReview = () => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[currentIndex].selectedOption !== null) {
      updatedQuestions[currentIndex].status = 'answeredAndMarked'; 
    } else {
      updatedQuestions[currentIndex].status = 'marked'; 
    }
    setQuestions(updatedQuestions);
    moveToNextQuestion();
  };

  const handleClearResponse = () => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex].selectedOption = null;
    updatedQuestions[currentIndex].status = 'notAnswered';
    setQuestions(updatedQuestions);
  };

  const getStatusColor = (status, index) => {
    const isActive = index === currentIndex ? 'ring-2 ring-blue-500 ' : '';
    switch (status) {
      case 'answered': return isActive + 'bg-[#27ae60] text-white border-transparent';
      case 'notAnswered': return isActive + 'bg-[#e74c3c] text-white border-transparent';
      case 'marked': return isActive + 'bg-[#8e44ad] text-white border-transparent';
      case 'answeredAndMarked': return isActive + 'bg-[#8e44ad] text-white border-transparent relative';
      default: return isActive + 'bg-white text-gray-700 border-gray-300';
    }
  };

  const calculateResult = () => {
    let correct = 0, incorrect = 0, score = 0;
    let p1Score = 0, p1Total = 0;
    let p2Score = 0, p2Total = 0;

    questions.forEach(q => {
      const isP1 = q.section === 'Paper I';
      if (isP1) p1Total += q.marks;
      else p2Total += q.marks;

      if (q.selectedOption !== null) {
        if (q.selectedOption + 1 === q.correctAnswer) {
          correct++;
          score += q.marks;
          if (isP1) p1Score += q.marks;
          else p2Score += q.marks;
        } else {
          incorrect++;
          score -= q.negative;
          if (isP1) p1Score -= q.negative;
          else p2Score -= q.negative;
        }
      }
    });
    return { correct, incorrect, score, p1Score, p1Total, p2Score, p2Total };
  };

  const getZoneDetails = (score, total) => {
    if (total === 0) return null;
    const percentage = (score / total) * 100;
    
    if (percentage >= 70) 
      return { name: "🟢 SAFE ZONE", style: "bg-green-50 text-green-900 border-green-300", text: "Strong mastery. Minimal review needed." };
    if (percentage >= 40) 
      return { name: "🟡 REVIEW ZONE", style: "bg-yellow-50 text-yellow-900 border-yellow-400", text: "Use 'blurting' & active recall to fix gaps." };
    
    return { name: "🔴 DANGER ZONE", style: "bg-red-50 text-red-900 border-red-300", text: "Deep conceptual gaps. Re-read material." };
  };

  const handleFinalSubmit = async () => {
    setIsSavingScore(true);
    const result = calculateResult();

    if (!isExamPreview && currentUser && currentTestId) {
      if (isPracticeMode) {
        const newScore = {
          date: new Date().toLocaleDateString('en-IN'),
          testId: currentTestId,
          score: result.score,
          correct: result.correct,
          incorrect: result.incorrect
        };
        const updatedScores = [newScore, ...practiceScores].slice(0, 10); 
        setPracticeScores(updatedScores);
        localStorage.setItem('ns_practice_scores', JSON.stringify(updatedScores));
      } else {
        try {
          await fetch(`${API_URL}/api/save-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rollNumber: currentUser.rollNumber,
              name: currentUser.name,
              testId: currentTestId,
              score: result.score,
              correct: result.correct,
              incorrect: result.incorrect,
              responses: questions.map(q => ({ id: q.id, selectedOption: q.selectedOption, status: q.status }))
            })
          });
        } catch (err) {
          console.error("Failed to save score:", err);
        }
      }
    }

    setIsSavingScore(false);
    setShowModal(false);
    setShowResult(true);
  };

  // ==========================================
  // RENDER ROUTING
  // ==========================================
  
  if (appMode === 'auth') {
    return (
      <Auth 
        onLogin={(user) => { 
          setCurrentUser(user); 
          setAppMode('hub'); 
        }} 
        onGoToAdmin={() => setAppMode('admin')} 
      />
    );
  }

  if (appMode === 'hub') {
    return (
      <StudentHub 
        user={currentUser} 
        onSelectPath={(path) => {
          if (path === 'cbt') setAppMode('dashboard');
          if (path === 'lms') setAppMode('lms');
          if (path === 'pyq_engine') setAppMode('pyq_engine');
          if (path === 'synthesis_lab') setAppMode('synthesis_lab');
          if (path === 'podcasts') setAppMode('podcasts');
          if (path === 'pdfs' || path === 'pdf_vault') setAppMode('pdfs');
        }} 
        onLogout={() => { setCurrentUser(null); setAppMode('auth'); }} 
      />
    );
  }

  // 🔥 PYQ ENGINE ROUTE (with BackToCourse injected)
  if (appMode === 'pyq_engine') {
    return <PyqEngine user={currentUser} onBack={() => setAppMode('hub')} onBackToCourse={() => setAppMode('lms')} />;
  }
  
  // 🔥 AUDIOBOOK / PODCAST ROUTE
  if (appMode === 'podcasts') {
    return <PodcastEngine user={currentUser} onBack={() => setAppMode('hub')} onBackToCourse={() => setAppMode('lms')} />;
  }

  if (appMode === 'pdfs') {
  return (
    <PDFEngine 
      user={currentUser} 
      onBack={() => setAppMode('hub')} 
      onBackToCourse={() => setAppMode('hub')} 
    />
  );
}

  // 🔥 SYNTHESIS LAB ROUTE (with BackToCourse injected)
  if (appMode === 'synthesis_lab') {
    return <SynthesisLab user={currentUser} onBack={() => setAppMode('hub')} onBackToCourse={() => setAppMode('lms')} />;
  }

  // 🔥 LMS ROUTE (with OpenPyq injected)
  if (appMode === 'lms') {
    return (
      <StudentDashboard 
        user={currentUser} 
        onBack={() => setAppMode('hub')} 
        onOpenLab={() => setAppMode('synthesis_lab')} 
        onOpenPyq={() => setAppMode('pyq_engine')} 
      />
    );
  }

  if (appMode === 'admin') {
    return <AdminPanel onStartExam={(test) => handleStartExam(test, 'PREVIEW', true)} />;
  }

  if (appMode === 'instructions') {
    return <ExamInstructions onProceed={() => setAppMode('exam')} />;
  }

  if (appMode === 'profile') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-900 to-purple-900"></div>
          
          <button 
            onClick={() => setAppMode('hub')} 
            className="absolute top-4 left-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors z-10"
          >
            ← Hub
          </button>

          <div className="relative z-10 flex flex-col items-center mt-12">
            <div className="w-28 h-28 bg-white rounded-full p-1.5 shadow-lg mb-4">
              <div className="w-full h-full bg-gradient-to-br from-blue-700 to-purple-700 rounded-full flex items-center justify-center text-white text-5xl font-black">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <h2 className="text-3xl font-black text-gray-900">{currentUser.name}</h2>
            <p className="text-gray-500 font-mono font-medium mt-1 mb-3">Roll No: {currentUser.rollNumber}</p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-2">
              {currentUser.plans && currentUser.plans.map((plan, idx) => (
                <span key={idx} className="bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {plan}
                </span>
              ))}
            </div>

            <div className="w-full mt-10 space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Account Management</h3>
              
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure? This will wipe your 30-question micro-quiz history from this device.")) {
                    localStorage.removeItem('ns_practice_scores');
                    setPracticeScores([]);
                    alert("Practice memory cleared successfully!");
                  }
                }}
                className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 transition-colors flex justify-between items-center"
              >
                <span>🗑️ Clear Local Practice Data</span>
                <span className="text-red-400">→</span>
              </button>

              <button 
                onClick={() => {
                  const message = `Hi NerdSchool Support! I need some help.\n\nMy Name: ${currentUser.name}\nMy Roll Number: ${currentUser.rollNumber}`;
                  const waLink = `https://wa.me/919645160045?text=${encodeURIComponent(message)}`;
                  window.open(waLink, '_blank');
                }}
                className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-xl border border-green-200 transition-colors flex justify-between items-center"
              >
                <span>💬 Priority WhatsApp Support</span>
                <span className="text-green-400">→</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // THE EXISTING CBT DASHBOARD
  if (appMode === 'dashboard') {
    let totalQuestions = 0;
    if (blueprintMeta) {
      blueprintMeta.paper1.forEach(sub => sub.chapters.forEach(ch => totalQuestions += ch.total));
      blueprintMeta.paper2.forEach(sub => sub.chapters.forEach(ch => totalQuestions += ch.total));
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-10 font-sans relative">
        <div className="max-w-6xl mx-auto">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button 
              onClick={() => setAppMode('profile')}
              className="flex items-center gap-4 text-left group transition-transform hover:scale-[1.02]"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-purple-700 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-md border-2 border-white group-hover:shadow-lg transition-all">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-black text-blue-900 mb-1 group-hover:text-purple-700 transition-colors">Welcome, {currentUser.name}!</h1>
                <p className="text-gray-500 font-medium text-sm flex gap-2 items-center">
                  Roll No: <span className="font-bold text-gray-800">{currentUser.rollNumber}</span> 
                  • <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-black uppercase tracking-wider">{hasPlan('Mocktest') || hasPlan('Premium') ? 'Unlocked' : 'Free Tier'}</span>
                </p>
                <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Manage Profile ⚙️</p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setAppMode('hub')}
                className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 hover:bg-slate-200 transition-colors shadow-sm"
              >
                ← Back to Hub
              </button>
              <button 
                onClick={() => { setCurrentUser(null); setAppMode('auth'); }}
                className="px-6 py-2 bg-red-50 text-red-600 font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-colors shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Available Mock Tests</h2>
          
          {loadingTests ? (
             <div className="text-center p-10 font-bold text-xl text-blue-600 animate-pulse">Loading your tests...</div>
          ) : publishedTests.length === 0 ? (
            <div className="text-center p-20 border-2 border-dashed border-gray-300 rounded-xl bg-white">
              <h2 className="text-2xl font-bold text-gray-400 mb-2">No Mock Tests Assigned Yet</h2>
              <p className="text-gray-500">Once NerdSchool publishes a test, it will appear here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedTests.map(test => {
                const isLocked = test.isPremium && !hasPlan('Mocktest') && !hasPlan('Premium');

                return (
                  <div key={test.testId} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col transform hover:-translate-y-1">
                    
                    <div className={`p-4 text-white font-black tracking-widest uppercase text-xs ${test.isPremium ? 'bg-purple-800' : 'bg-green-600'}`}>
                      {test.isPremium ? '🌟 Premium Mock' : '🎁 Free Mock'}
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 leading-tight">{test.title}</h3>
                        <p className="text-xs text-gray-400 font-mono">ID: {test.testId}</p>
                      </div>
                      
                      {isLocked ? (
                        <button 
                          onClick={() => {
                            const message = `Hi NerdSchool! I want to upgrade to Premium CBT for Rs 999/-.\n\nMy Roll Number is: ${currentUser.rollNumber}`;
                            const waLink = `https://wa.me/919645160045?text=${encodeURIComponent(message)}`;
                            window.open(waLink, '_blank');
                          }}
                          className="w-full py-4 bg-purple-50 text-purple-800 font-black rounded-lg border-2 border-purple-200 hover:bg-purple-100 transition-colors shadow-sm flex flex-col items-center justify-center gap-1"
                        >
                          <span className="text-sm">🔒 Unlock for Rs 999/-</span>
                          <span className="text-[10px] text-purple-600 uppercase tracking-widest">Via WhatsApp</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleStartExam(test.testData, test.testId, false)}
                          className="w-full py-4 bg-blue-800 text-white font-black rounded-lg hover:bg-blue-900 shadow-md transition-colors"
                        >
                          Start Exam Now 🚀
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-16">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b pb-4 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Chapter-Wise Practice Engine</h2>
                <p className="text-gray-500 font-medium mt-1">30-Question Rapid Fire • Active Recall Methodology</p>
              </div>
              
              {totalQuestions > 0 && (
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-800 to-blue-700 text-white px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(126,34,206,0.4)] animate-pulse border border-purple-400">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <span className="text-sm font-black tracking-widest uppercase">
                    {totalQuestions.toLocaleString()}+ Premium Questions
                  </span>
                </div>
              )}
            </div>

            {practiceScores.length > 0 && (
              <div className="mb-8 flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {practiceScores.map((ps, idx) => (
                  <div key={idx} className="flex-shrink-0 bg-blue-900 text-white p-3 rounded-lg shadow-sm border border-blue-700 min-w-[160px]">
                    <p className="text-[10px] font-bold opacity-60 uppercase">{ps.date}</p>
                    <p className="text-xs font-black truncate mb-1">{ps.testId.replace('Practice: ', '')}</p>
                    <div className="flex justify-between items-end">
                      <span className="text-xl font-black">{ps.score}</span>
                      <span className="text-[10px] text-green-400 font-bold">+{ps.correct} / -{ps.incorrect}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {blueprintMeta && blueprintMeta.paper1.map((subjectGroup, sIdx) => (
              <div key={`p1-${sIdx}`} className="mb-10">
                <h3 className="text-lg font-black text-green-900 mb-4 uppercase tracking-widest bg-green-50 p-3 rounded-lg border border-green-100 shadow-sm flex justify-between items-center">
                  Paper I: {subjectGroup.subject}
                  <span className="text-[10px] bg-green-800 text-white px-2 py-0.5 rounded-full">{subjectGroup.chapters.length} Chapters</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subjectGroup.chapters.map((ch, cIdx) => {
                    const isFree = cIdx === 0; 
                    const isLocked = !isFree && !hasPlan('Mocktest') && !hasPlan('Premium');

                    return (
                      <button
                        key={`p1-ch-${cIdx}`}
                        onClick={() => {
                          if (isLocked) {
                            setShowPremiumModal(true); 
                          } else {
                            handleStartPractice('Paper I', subjectGroup.subject, ch.name);
                          }
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between group h-full ${
                          isLocked
                            ? 'bg-gray-50 border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer'
                            : 'bg-white border-green-100 hover:border-green-500 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <p className={`text-sm font-bold truncate ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                            {ch.name}
                          </p>
                          <p className={`text-[9px] font-mono mt-1 font-bold uppercase tracking-wider flex items-center gap-1 ${isLocked ? 'text-gray-400' : 'text-green-600'}`}>
                             <span>🔄</span> Shuffles 30 Qs • Pool: {ch.total}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {isFree ? (
                            <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider border border-green-200">Free Try</span>
                          ) : isLocked ? (
                            <span className="text-lg opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">🔒</span>
                          ) : (
                            <span className="text-green-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {blueprintMeta && blueprintMeta.paper2.map((subjectGroup, sIdx) => (
              <div key={`p2-${sIdx}`} className="mb-10">
                <h3 className="text-lg font-black text-blue-900 mb-4 uppercase tracking-widest bg-blue-50 p-3 rounded-lg border border-blue-100 shadow-sm flex justify-between items-center">
                  Paper II: {subjectGroup.subject}
                  <span className="text-[10px] bg-blue-800 text-white px-2 py-0.5 rounded-full">{subjectGroup.chapters.length} Chapters</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subjectGroup.chapters.map((ch, cIdx) => {
                    const isFree = cIdx === 0;
                    const isLocked = !isFree && !hasPlan('Mocktest') && !hasPlan('Premium');

                    return (
                      <button
                        key={`p2-ch-${cIdx}`}
                        onClick={() => {
                          if (isLocked) {
                            const message = `Hi NerdSchool! I want to upgrade to Premium CBT for Rs 999/- to unlock the Chapter-Wise Practice Engine.\n\nMy Roll Number is: ${currentUser.rollNumber}`;
                            const waLink = `https://wa.me/919645160045?text=${encodeURIComponent(message)}`;
                            window.open(waLink, '_blank');
                          } else {
                            handleStartPractice('Paper II', subjectGroup.subject, ch.name);
                          }
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between group h-full ${
                          isLocked
                            ? 'bg-gray-50 border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer'
                            : 'bg-white border-blue-100 hover:border-blue-500 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <p className={`text-sm font-bold truncate ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                            {ch.name}
                          </p>
                          <p className={`text-[9px] font-mono mt-1 font-bold uppercase tracking-wider flex items-center gap-1 ${isLocked ? 'text-gray-400' : 'text-blue-600'}`}>
                             <span>🔄</span> Shuffles 30 Qs • Pool: {ch.total}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {isFree ? (
                            <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider border border-green-200">Free Try</span>
                          ) : isLocked ? (
                            <span className="text-lg opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">🔒</span>
                          ) : (
                            <span className="text-blue-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">My Performance History</h2>
            
            {myScores.length === 0 ? (
              <div className="text-center p-10 bg-white border border-gray-200 rounded-xl">
                <p className="text-gray-500 font-medium">You haven't completed any mock tests yet. Your scores will appear here!</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-bold text-gray-700">Date</th>
                      <th className="p-4 font-bold text-gray-700">Test ID</th>
                      <th className="p-4 font-bold text-gray-700">Correct</th>
                      <th className="p-4 font-bold text-gray-700">Incorrect</th>
                      <th className="p-4 font-black text-blue-800 text-right">Final Score</th>
                      <th className="p-4 font-bold text-gray-700 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myScores.map((score, idx) => {
                      const originalTest = publishedTests.find(t => t.testId === score.testId);
                      return (
                        <tr key={idx} className="hover:bg-blue-50 transition-colors">
                          <td className="p-4 text-sm font-semibold text-gray-700">{score.date}</td>
                          <td className="p-4 text-sm font-mono text-gray-500">{score.testId}</td>
                          <td className="p-4 text-sm font-black text-green-600">+{score.correct}</td>
                          <td className="p-4 text-sm font-black text-red-500">-{score.incorrect}</td>
                          <td className="p-4 text-xl font-black text-blue-900 text-right">{score.score}</td>
                          <td className="p-4 text-right">
                            {originalTest ? (
                              <button 
                                onClick={() => handleStartExam(originalTest.testData, score.testId, false, score.responses)}
                                className="px-4 py-2 bg-blue-100 text-blue-800 font-bold text-sm rounded hover:bg-blue-200 transition-colors"
                              >
                                Review Exam
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">Test Unavailable</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showPremiumModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 relative transform transition-all scale-100 animate-in zoom-in-95">
                
                <button 
                  onClick={() => setShowPremiumModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10"
                >
                  ✕
                </button>

                <div className="bg-gradient-to-br from-purple-900 to-blue-900 p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20 shadow-lg">
                    <span className="text-4xl">👑</span>
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2 relative z-10 tracking-tight">Unlock NerdSchool Premium</h2>
                  <p className="text-purple-200 font-medium relative z-10">You've hit a paywall! Upgrade to access the complete library.</p>
                </div>

                <div className="p-8 bg-white">
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="bg-green-100 text-green-600 p-2 rounded-lg">✅</div>
                      <div>
                        <h4 className="font-bold text-gray-800">Unlimited Chapter-Wise Practice</h4>
                        <p className="text-sm text-gray-500">Access to all {totalQuestions.toLocaleString()}+ questions across Paper 1 & 2.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">✅</div>
                      <div>
                        <h4 className="font-bold text-gray-800">Full-Length NTA Mocks</h4>
                        <p className="text-sm text-gray-500">Unlock all Premium 150-question mock exams.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">✅</div>
                      <div>
                        <h4 className="font-bold text-gray-800">Detailed Explanations</h4>
                        <p className="text-sm text-gray-500">In-depth solutions for every single question.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-center">
                    <span className="text-gray-400 font-bold line-through text-sm mr-2">₹4,999</span>
                    <span className="text-3xl font-black text-gray-900">₹999</span>
                    <span className="text-gray-500 text-sm font-semibold ml-1">/ lifetime</span>
                  </div>

                  <button 
                    onClick={() => {
                      const message = `Hi NerdSchool! I want to upgrade to Premium CBT for Rs 999/-.\n\nMy Roll Number is: ${currentUser.rollNumber}`;
                      const waLink = `https://wa.me/919645160045?text=${encodeURIComponent(message)}`;
                      window.open(waLink, '_blank');
                    }}
                    className="w-full py-4 bg-gradient-to-r from-purple-700 to-blue-700 text-white font-black rounded-xl hover:shadow-[0_0_20px_rgba(126,34,206,0.4)] transition-all flex items-center justify-center gap-3 text-lg hover:scale-[1.02]"
                  >
                    <span>Upgrade via WhatsApp</span>
                    <span className="text-2xl">🚀</span>
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-4 font-semibold uppercase tracking-wider">Instant Activation upon Payment</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // EXAM UI 
  const activeQuestions = questions.filter(q => q.section === activeSection);
  const currentQ = questions[currentIndex];

  const answeredCount = activeQuestions.filter(q => q.status === 'answered').length;
  const notAnsweredCount = activeQuestions.filter(q => q.status === 'notAnswered').length;
  const markedCount = activeQuestions.filter(q => q.status === 'marked').length;
  const answeredAndMarkedCount = activeQuestions.filter(q => q.status === 'answeredAndMarked').length;
  const notVisitedCount = activeQuestions.filter(q => q.status === 'notVisited').length;

  return (
    <>
      {showResult ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-blue-900 p-4 font-sans text-white overflow-y-auto">
          <div className="bg-white text-gray-800 rounded-xl shadow-2xl p-8 max-w-lg w-full text-center my-8">
            <h2 className="text-3xl font-black text-blue-800 mb-2">Exam Result</h2>
            <p className="text-gray-500 mb-6 font-semibold uppercase tracking-widest">{isPracticeMode ? 'Practice Diagnostic' : 'Full Mock Test'}</p>
            
            {(() => {
              const res = calculateResult();
              const p1Zone = getZoneDetails(res.p1Score, res.p1Total);
              const p2Zone = getZoneDetails(res.p2Score, res.p2Total);
              
              return (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-green-700 font-bold uppercase">Correct</p>
                      <p className="text-2xl font-black text-green-600">{res.correct}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-red-700 font-bold uppercase">Incorrect</p>
                      <p className="text-2xl font-black text-red-600">{res.incorrect}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 mb-8 shadow-inner">
                    <p className="text-sm text-blue-700 font-bold uppercase mb-1">Final Score</p>
                    <p className="text-5xl font-black text-blue-900">{res.score}</p>
                  </div>

                  {(p1Zone || p2Zone) && (
                    <div className="mb-8 border-t-2 border-dashed border-gray-200 pt-6">
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">3-Zone Diagnostic Analysis</h3>
                      <div className="flex flex-col gap-3">
                        
                        {p1Zone && (
                          <div className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between shadow-sm transition-all ${p1Zone.style}`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-sm uppercase">Paper I</span>
                              <span className="font-black text-xl">{res.p1Score} <span className="text-xs opacity-60 font-bold">/ {res.p1Total}</span></span>
                            </div>
                            <div className="text-xs font-black uppercase tracking-wider mb-1">{p1Zone.name}</div>
                            <div className="text-xs opacity-80 font-semibold">{p1Zone.text}</div>
                          </div>
                        )}

                        {p2Zone && (
                          <div className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between shadow-sm transition-all ${p2Zone.style}`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-sm uppercase">Paper II</span>
                              <span className="font-black text-xl">{res.p2Score} <span className="text-xs opacity-60 font-bold">/ {res.p2Total}</span></span>
                            </div>
                            <div className="text-xs font-black uppercase tracking-wider mb-1">{p2Zone.name}</div>
                            <div className="text-xs opacity-80 font-semibold">{p2Zone.text}</div>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="mt-4 flex flex-col gap-3">
              <button 
                onClick={() => {
                  setIsReviewMode(true);
                  setShowResult(false);
                  setCurrentIndex(0); 
                  setActiveSection('Paper I');
                }} 
                className="w-full py-4 mb-3 bg-white text-blue-800 font-black rounded-lg border-2 border-blue-800 hover:bg-gray-100 shadow-lg uppercase tracking-widest"
              >
                Review Questions & Solutions
              </button>

              <button 
                onClick={() => setAppMode('dashboard')} 
                className="w-full py-4 bg-blue-800 text-white font-black rounded-lg hover:bg-blue-900 shadow-lg uppercase tracking-widest"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen bg-gray-50 font-sans select-none">
          {cheatAlert && (
            <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-[9999] bg-red-600 text-white px-8 py-4 rounded-xl shadow-2xl font-black text-center max-w-lg border-4 border-red-900 animate-in slide-in-from-top-5">
              🚨 Anti-Cheat Activated 🚨
              <p className="mt-2 text-sm font-medium italic">{cheatAlert}</p>
            </div>
          )}

          <header className="flex items-center justify-between px-4 py-2 bg-white border-b-2 border-blue-800 shadow-sm z-10">
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-gray-800 leading-tight">UGC NET June 2026</h1>
              <span className="text-xs font-semibold text-blue-700">Mock Exam</span>
            </div>
            <div className="flex items-center gap-4">
              {isExamPreview && (
                <button onClick={() => setAppMode('admin')} className="px-4 py-1 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 shadow">
                  Exit Preview
                </button>
              )}
              <div className="bg-blue-800 text-white px-4 py-1 rounded text-sm font-bold">
                Computer Based Test (CBT)
              </div>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            <div className="flex flex-col flex-1 bg-white relative min-h-0 overflow-hidden">
              {!isPracticeMode && (
                <div className="flex bg-[#eeeeee] border-b border-gray-300 px-1">
                  <button 
                    onClick={() => {
                      setActiveSection('Paper I');
                      const firstP1 = questions.findIndex(q => q.section === 'Paper I');
                      if(firstP1 !== -1) setCurrentIndex(firstP1);
                    }}
                    className={`px-6 py-2 font-bold text-sm border-r border-gray-300 relative transition-colors ${
                      activeSection === 'Paper I' ? 'bg-blue-800 text-white' : 'bg-[#e1e1e1] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Paper I
                    {activeSection === 'Paper I' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-white"></div>}
                  </button>

                  <button 
                    onClick={() => {
                      setActiveSection('Paper II');
                      const firstP2 = questions.findIndex(q => q.section === 'Paper II');
                      if(firstP2 !== -1) setCurrentIndex(firstP2);
                    }}
                    className={`px-6 py-2 font-bold text-sm border-r border-gray-300 relative transition-colors ${
                      activeSection === 'Paper II' ? 'bg-blue-800 text-white' : 'bg-[#e1e1e1] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    English Paper II
                    {activeSection === 'Paper II' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-white"></div>}
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center px-4 sm:px-6 py-2 bg-blue-50 border-b border-gray-300">
                <span className="font-bold text-blue-800">Question No. {currentQ.id}</span>
                <div className="flex gap-4 text-sm font-semibold">
                  <span className="text-green-600">Marks: +{currentQ.marks}</span>
                  <span className="text-red-600">Negative: {currentQ.negative}</span>
                </div>
              </div>

              <div className="flex-1 p-4 sm:p-6 overflow-y-auto pb-40 break-words">
                <div className="mb-8 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-800"></div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 bg-blue-50 text-blue-800 font-black rounded-lg w-11 h-11 flex items-center justify-center text-lg border border-blue-200 mt-0.5 shadow-sm">Q.</div>
                    <div className="w-full pt-1">
                      {(() => {
                        const lines = currentQ.text.split('\n').map(l => l.trim()).filter(l => l !== '');

                        const list1Index = lines.findIndex(l => /^(List I|List - I)/i.test(l));
                        const list2Index = lines.findIndex(l => /^(List II|List - II)/i.test(l));

                        if (list1Index !== -1 && list2Index !== -1 && list1Index < list2Index) {
                          const intro = lines.slice(0, list1Index);
                          const list1Title = lines[list1Index];
                          const list1Items = lines.slice(list1Index + 1, list2Index);
                          const outroIndex = lines.findIndex((l, i) => i > list2Index && /^(Choose|Select|In the light|Given below)/i.test(l));
                          const list2Title = lines[list2Index];
                          const list2Items = lines.slice(list2Index + 1, outroIndex !== -1 ? outroIndex : lines.length);
                          const outro = outroIndex !== -1 ? lines.slice(outroIndex) : [];

                          return (
                            <div className="flex flex-col gap-4">
                              {intro.map((line, i) => <p key={`intro-${i}`} className="text-[1.1rem] text-gray-800 leading-[1.6] tracking-wide">{line}</p>)}
                              <div className="flex bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm mt-2 mb-2">
                                <div className="flex-1 border-r-2 border-gray-200">
                                  <div className="bg-blue-50 font-bold text-blue-900 p-2 text-center border-b-2 border-gray-200">{list1Title}</div>
                                  <div className="p-4 flex flex-col gap-3">
                                    {list1Items.map((item, i) => <p key={`l1-${i}`} className="text-[1.05rem] text-gray-800 leading-relaxed">{item}</p>)}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="bg-blue-50 font-bold text-blue-900 p-2 text-center border-b-2 border-gray-200">{list2Title}</div>
                                  <div className="p-4 flex flex-col gap-3">
                                    {list2Items.map((item, i) => <p key={`l2-${i}`} className="text-[1.05rem] text-gray-800 leading-relaxed">{item}</p>)}
                                  </div>
                                </div>
                              </div>
                              {outro.map((line, i) => <p key={`outro-${i}`} className="text-[1.1rem] text-gray-800 font-semibold mt-2">{line}</p>)}
                            </div>
                          );
                        }

                        return lines.map((line, index) => {
                          const trimmedLine = line.trim();
                          if (trimmedLine.includes('|')) {
                            const cells = trimmedLine.split('|').map(c => c.trim()).filter((c, i, arr) => {
                              if ((i === 0 || i === arr.length - 1) && c === '') return false;
                              return true;
                            });
                            if (cells.length > 0 && cells.every(c => /^[-:]+$/.test(c))) return null;
                            if (cells.length > 1) {
                              return (
                                <div key={index} className="flex border-b border-gray-200 bg-blue-50/30 first:border-t mt-1 hover:bg-blue-50 transition-colors">
                                  {cells.map((cell, i) => (
                                    <div key={i} className={`flex-1 p-3 text-[1.05rem] text-gray-800 ${i !== cells.length - 1 ? 'border-r border-gray-200' : ''}`}>
                                      {cell.split(/(\*\*.*?\*\*)/).map((part, idx) => 
                                        part.startsWith('**') && part.endsWith('**') ? <strong key={idx} className="font-bold text-gray-900">{part.slice(2, -2)}</strong> : part
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                          }
                          const isListStart = /^(A\.|Statement I:|Statement - I)/i.test(trimmedLine);
                          const isOutroStart = /^(Choose|Select|In the light|Given below)/i.test(trimmedLine);
                          return (
                            <p key={index} className={`text-[1.1rem] text-gray-800 leading-[1.6] tracking-wide ${isListStart || isOutroStart ? 'mt-6' : 'mt-0'}`}>
                              {line.split(/(\*\*.*?\*\*)/).map((part, i) => 
                                part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong> : part
                              )}
                            </p>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 pl-1">
                  {currentQ.options.map((opt, i) => {
                    const isCorrect = i + 1 === currentQ.correctAnswer;
                    const isUserSelection = currentQ.selectedOption === i;
                    let bgColor = "white", borderColor = "#e5e7eb"; 
                    
                    if (isReviewMode) {
                      if (isCorrect) { bgColor = "#f0fdf4"; borderColor = "#22c55e"; } 
                      else if (isUserSelection && !isCorrect) { bgColor = "#fef2f2"; borderColor = "#ef4444"; } 
                    }

                    return (
                      <label 
                        key={i} 
                        style={{ backgroundColor: bgColor, borderColor: borderColor }}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all shadow-sm ${isReviewMode ? 'cursor-default' : 'cursor-pointer hover:bg-blue-50 hover:border-blue-300'}`}
                      >
                        <div className="flex items-center justify-center mt-1">
                          <input 
                            type="radio" 
                            disabled={isReviewMode}
                            checked={isUserSelection}
                            onChange={() => handleOptionSelect(i)}
                            className="w-5 h-5 cursor-pointer disabled:cursor-default accent-blue-600"
                          />
                        </div>
                        <div className={`text-[1.05rem] leading-relaxed w-full ${isReviewMode && isCorrect ? 'font-bold text-green-900' : 'text-gray-700'}`}>
                          <span className="font-bold text-gray-400 mr-3 select-none">({i + 1})</span>
                          {opt} 
                          {isReviewMode && isCorrect && <span className="ml-3 inline-block px-2 py-1 rounded-md text-[10px] font-black bg-green-200 text-green-800 uppercase tracking-widest align-middle">Correct Answer</span>}
                          {isReviewMode && isUserSelection && !isCorrect && <span className="ml-3 inline-block px-2 py-1 rounded-md text-[10px] font-black bg-red-200 text-red-800 uppercase tracking-widest align-middle">Your Answer</span>}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {isReviewMode && (
                  <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-600 rounded-r shadow-sm">
                    <h4 className="font-bold text-blue-900 mb-3 uppercase text-xs tracking-wider">Solution & Explanation:</h4>
                    <div className="text-gray-700 leading-[1.7] text-[1.05rem]">
                      {currentQ.explanation.split('\n').map((line, index) => (
                        <p key={index} className="mb-3 last:mb-0">
                          {line.split(/(\*\*.*?\*\*|\*.*?\*)/).map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-blue-900">{part.slice(2, -2)}</strong>;
                            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i} className="italic font-semibold text-gray-800">{part.slice(1, -1)}</em>;
                            return part;
                          })}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 w-full px-2 sm:px-6 py-2 sm:py-3 bg-gray-100 border-t border-gray-300 z-10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {isReviewMode ? (
                    <button 
                      onClick={() => { setIsReviewMode(false); setShowResult(true); }}
                      className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-800 rounded hover:bg-blue-900 shadow-md w-full sm:w-auto"
                    >
                      ← Back to Scorecard
                    </button>
                  ) : (
                    <div className="flex w-full sm:w-auto gap-2">
                      <button onClick={handleClearResponse} className="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-400 rounded hover:bg-gray-50">Clear</button>
                      <button onClick={handleMarkForReview} className="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-orange-500 rounded hover:bg-orange-600">Mark for Review</button>
                    </div>
                  )}
                  
                  <div className="flex w-full sm:w-auto gap-2">
                    {isReviewMode ? (
                      <>
                        <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} className="flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold bg-white border border-gray-400 rounded hover:bg-gray-50">Previous</button>
                        <button onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))} className="flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold bg-white border border-gray-400 rounded hover:bg-gray-50">Next</button>
                      </>
                    ) : (
                      <button onClick={handleSaveAndNext} className="w-full sm:w-auto px-6 py-2 text-xs sm:text-sm font-bold text-white bg-green-600 rounded hover:bg-green-700 shadow-md">Save & Next</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-72 h-[35vh] lg:h-auto bg-blue-50 lg:border-l border-t lg:border-t-0 border-gray-300 flex flex-col z-0 shrink-0">
              
              <div className="hidden lg:flex p-4 bg-white border-b border-gray-300 items-center gap-3">
                <div className="w-16 h-20 bg-gray-200 border border-gray-400 flex items-center justify-center text-[10px] text-gray-400">Photo</div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-bold uppercase">Candidate Name:</span>
                  <span className="text-sm font-bold text-blue-800">{currentUser?.name || "STUDENT"}</span>
                </div>
              </div>

              <div className="p-2 lg:p-4 bg-white border-b border-gray-300 flex justify-between items-center text-sm lg:text-base">
                <span className="font-bold text-gray-700">Time Left:</span>
                <ExamTimer initialMinutes={180} onTimeUp={() => {
                  setShowModal(false);
                  setShowResult(true);
                }} />
              </div>
              
              <div className="p-2 lg:p-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-x-2 gap-y-3 mb-6 text-[11px] font-semibold text-gray-700">
                  <div className="flex items-center gap-2"><div className="w-7 h-7 flex items-center justify-center bg-[#27ae60] text-white rounded-t-lg rounded-b-sm">{answeredCount}</div><span>Answered</span></div>
                  <div className="flex items-center gap-2"><div className="w-7 h-7 flex items-center justify-center bg-[#e74c3c] text-white rounded-t-lg rounded-b-sm">{notAnsweredCount}</div><span>Not Answered</span></div>
                  <div className="flex items-center gap-2"><div className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 text-gray-700 rounded-md">{notVisitedCount}</div><span>Not Visited</span></div>
                  <div className="flex items-center gap-2"><div className="w-7 h-7 flex items-center justify-center bg-[#8e44ad] text-white rounded-full">{markedCount}</div><span>Marked</span></div>
                </div>

                <h3 className="font-bold text-gray-700 mb-4">{activeSection} Palette</h3>
                <div className="grid grid-cols-4 gap-2">
                  {questions.map((q, index) => {
                    if (q.section !== activeSection) return null;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-12 h-12 flex items-center justify-center rounded-md border font-semibold text-sm transition-all hover:opacity-80 ${getStatusColor(q.status, index)}`}
                      >
                        {q.id}
                        {q.status === 'answeredAndMarked' && <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#27ae60] border border-white rounded-full"></span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-gray-300 bg-white">
                <button onClick={() => setShowModal(true)} className="w-full py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 shadow-md">
                  Submit Exam
                </button>
              </div>
            </div>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 font-sans">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-blue-800">
                <div className="bg-gray-100 px-6 py-3 border-b border-gray-300 font-bold text-gray-700">Exam Summary</div>
                <div className="p-6">
                  <table className="w-full text-sm text-left border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-100"><td className="py-2">Total Questions</td><td className="py-2 font-bold text-right text-blue-800">{questions.length}</td></tr>
                      <tr className="border-b border-gray-100"><td className="py-2">Answered</td><td className="py-2 font-bold text-right text-green-600">{questions.filter(q=>q.status==='answered').length}</td></tr>
                    </tbody>
                  </table>
                  <div className="mt-8 flex gap-2">
                    <button onClick={() => setShowModal(false)} disabled={isSavingScore} className="flex-1 py-2 bg-gray-200 text-gray-700 font-bold rounded disabled:opacity-50">No</button>
                    <button onClick={handleFinalSubmit} disabled={isSavingScore} className="flex-1 py-2 bg-blue-800 text-white font-bold rounded shadow-md disabled:opacity-50 transition-all">
                      {isSavingScore ? 'Saving Score...' : 'Yes, Submit'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default App;