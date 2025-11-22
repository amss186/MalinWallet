import React, { useState } from 'react';
import { BookOpen, GraduationCap, Play, ChevronRight, CheckCircle, XCircle, HelpCircle, Sparkles } from 'lucide-react';
import { generateQuiz } from '../services/geminiService.ts';
import { Quiz } from '../types.ts';

const MODULES = [
  { id: 1, title: 'Crypto Basics', level: 'Beginner', desc: 'What is blockchain and how does it work?', color: 'from-blue-500 to-cyan-500' },
  { id: 2, title: 'DeFi Fundamentals', level: 'Intermediate', desc: 'Yield farming, liquidity pools, and impermanent loss.', color: 'from-purple-500 to-pink-500' },
  { id: 3, title: 'Wallet Security', level: 'All Levels', desc: 'Seed phrases, hardware wallets, and avoiding scams.', color: 'from-emerald-500 to-teal-500' },
  { id: 4, title: 'NFT Ecosystem', level: 'Beginner', desc: 'Digital ownership, marketplaces, and creator economy.', color: 'from-orange-500 to-red-500' },
  { id: 5, title: 'Layer 2 Solutions', level: 'Advanced', desc: 'Rollups, sidechains, and scaling Ethereum.', color: 'from-indigo-500 to-violet-500' },
];

const LearningHub: React.FC = () => {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const startQuiz = async (topic: string, level: string) => {
    setLoadingQuiz(true);
    try {
      // Simplify level to type required by API
      const diff = level.toLowerCase().includes('advanced') ? 'advanced' : level.toLowerCase().includes('intermediate') ? 'intermediate' : 'beginner';
      const quiz = await generateQuiz(topic, diff);
      setActiveQuiz(quiz);
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowResult(false);
      setSelectedOption(null);
    } catch (e) {
      console.error(e);
      alert("Could not generate quiz. Try again.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
  };

  const submitAnswer = () => {
    if (selectedOption === null || !activeQuiz) return;
    
    if (selectedOption === activeQuiz.questions[currentQuestionIndex].correctIndex) {
      setScore(s => s + 1);
    }
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(p => p + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      // End of quiz
      setActiveQuiz(null); // Simplified for this demo
      alert(`Quiz Complete! You scored ${score + (selectedOption === activeQuiz.questions[currentQuestionIndex].correctIndex && showResult ? 0 : 0)}/${activeQuiz.questions.length}`);
    }
  };

  if (activeQuiz) {
    const question = activeQuiz.questions[currentQuestionIndex];
    return (
      <div className="max-w-2xl mx-auto animate-in zoom-in duration-300">
         <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{activeQuiz.topic} Quiz</h2>
            <span className="text-slate-400 text-sm">Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
         </div>

         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-6">{question.question}</h3>
            
            <div className="space-y-3 mb-8">
              {question.options.map((opt, idx) => {
                let cardClass = "p-4 rounded-xl border-2 cursor-pointer transition flex justify-between items-center ";
                if (showResult) {
                   if (idx === question.correctIndex) cardClass += "border-green-500 bg-green-500/10 text-green-400";
                   else if (idx === selectedOption) cardClass += "border-red-500 bg-red-500/10 text-red-400";
                   else cardClass += "border-slate-800 bg-slate-950 opacity-50";
                } else {
                   if (idx === selectedOption) cardClass += "border-indigo-500 bg-indigo-500/10 text-white";
                   else cardClass += "border-slate-800 bg-slate-950 hover:border-slate-600 text-slate-300";
                }

                return (
                  <div key={idx} onClick={() => handleOptionSelect(idx)} className={cardClass}>
                     <span>{opt}</span>
                     {showResult && idx === question.correctIndex && <CheckCircle size={20} />}
                     {showResult && idx === selectedOption && idx !== question.correctIndex && <XCircle size={20} />}
                  </div>
                );
              })}
            </div>

            {showResult && (
               <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold mb-1">
                    <HelpCircle size={16} /> Explanation
                  </div>
                  <p className="text-sm text-slate-300">{question.explanation}</p>
               </div>
            )}

            <div className="flex justify-end">
               {!showResult ? (
                 <button 
                   onClick={submitAnswer}
                   disabled={selectedOption === null}
                   className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold transition"
                 >
                   Check Answer
                 </button>
               ) : (
                 <button 
                   onClick={nextQuestion}
                   className="px-6 py-3 bg-slate-100 hover:bg-white text-slate-900 rounded-xl font-bold transition flex items-center gap-2"
                 >
                   {currentQuestionIndex < activeQuiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ChevronRight size={18} />
                 </button>
               )}
            </div>
         </div>
         <button onClick={() => setActiveQuiz(null)} className="mt-6 text-slate-500 hover:text-slate-300 text-sm mx-auto block">Exit Quiz</button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Learning Hub</h2>
        <p className="text-slate-400">Master the decentralized world with bite-sized lessons and AI-powered quizzes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODULES.map(mod => (
          <div key={mod.id} className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-3xl p-6 transition-all hover:-translate-y-1">
             <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-4 shadow-lg`}>
                <BookOpen className="text-white" size={24} />
             </div>
             <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition">{mod.title}</h3>
                <span className="text-xs font-medium px-2 py-1 bg-slate-800 rounded text-slate-300 border border-slate-700">{mod.level}</span>
             </div>
             <p className="text-slate-400 text-sm mb-6 leading-relaxed">{mod.desc}</p>
             
             <div className="flex gap-3">
                <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                   <Play size={16} /> Start Lesson
                </button>
                <button 
                   onClick={() => startQuiz(mod.title, mod.level)}
                   disabled={loadingQuiz}
                   className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/20 text-indigo-400 hover:text-indigo-300 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                   {loadingQuiz ? <span className="animate-pulse">Generating...</span> : <><GraduationCap size={16} /> Take Quiz</>}
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* Daily Fact Section */}
      <div className="mt-8 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 rounded-3xl p-6 flex items-start gap-4">
         <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400 shrink-0">
           <Sparkles size={24} />
         </div>
         <div>
           <h4 className="font-bold text-emerald-400 mb-1">Did you know?</h4>
           <p className="text-slate-300 text-sm">
             The first real-world Bitcoin transaction took place in May 2010 when Laszlo Hanyecz paid 10,000 BTC for two Papa John's pizzas. That amount would be worth millions today!
           </p>
         </div>
      </div>
    </div>
  );
};

export default LearningHub;