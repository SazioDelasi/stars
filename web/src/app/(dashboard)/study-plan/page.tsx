"use client";

import { useState } from "react";
import { 
  Sparkles, Plus, BookOpen, Target, ChevronRight, 
  Clock, CheckCircle2, Lightbulb, Pencil, Trash2 
} from "lucide-react";

export default function StudyGuide() {
  const [activeTab, setActiveTab] = useState("my-plan");
  const [goals, setGoals] = useState([
    { id: 1, title: "Master Pointer Arithmetic", course: "CSC 301", status: "In Progress", priority: "High" },
    { id: 2, title: "Complete French Lab 1", course: "GNS 302", status: "Completed", priority: "Medium" }
  ]);

  // Mock suggestions based on registered courses
  const suggestions = [
    { id: "s1", title: "Practice CPU Scheduling Algorithms", course: "CSC 303", reason: "Commonly tested in Mid-semester exams" },
    { id: "s2", title: "Review Neural Network Basics", course: "CSC 307", reason: "Prerequisite for upcoming Project Alpha" }
  ];

  const addGoal = (suggestion?: any) => {
    const newGoal = {
      id: Date.now(),
      title: suggestion?.title || "New Study Goal",
      course: suggestion?.course || "General",
      status: "Todo",
      priority: "Medium"
    };
    setGoals([newGoal, ...goals]);
  };

  return (
    <div className="h-full flex flex-col space-y-6 font-roboto animate-in fade-in duration-700">
      
      {/* 1. MOTIVATIONAL HEADER */}
      <header className="bg-uenr-brown rounded-[2.5rem] p-8 text-white shadow-xl shadow-maroon-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-black font-lato uppercase tracking-tight">Study Roadmap</h1>
            <p className="text-maroon-200 text-sm font-medium">
              You have <span className="text-white font-bold">{goals.filter(g => g.status !== 'Completed').length} active goals</span> this week. Stay sharp.
            </p>
          </div>
          <button 
            onClick={() => addGoal()}
            className="bg-white text-uenr-brown px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Create Manual Goal
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        
        {/* 2. THE CUSTOM PLAN (LEFT/CENTER) */}
        <section className="lg:col-span-2 flex flex-col min-h-0 space-y-4">
          <div className="flex items-center gap-6 px-2 border-b border-slate-100">
            <button 
              onClick={() => setActiveTab("my-plan")}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'my-plan' ? 'text-uenr-brown border-b-2 border-uenr-brown' : 'text-slate-400'}`}
            >
              My Custom Plan
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'text-uenr-brown border-b-2 border-uenr-brown' : 'text-slate-400'}`}
            >
              Achieved
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {goals.filter(g => activeTab === 'history' ? g.status === 'Completed' : g.status !== 'Completed').map((goal) => (
              <div key={goal.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:border-uenr-brown/20 transition-all group">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${goal.status === 'Completed' ? 'bg-uenr-green border-uenr-green text-white' : 'border-slate-200'}`}>
                      {goal.status === 'Completed' && <CheckCircle2 size={12} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 font-lato">{goal.title}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-black text-uenr-brown bg-uenr-brown/5 px-2 py-0.5 rounded uppercase">{goal.course}</span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={12} /> Added 2h ago
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-300 hover:text-uenr-brown"><Pencil size={16} /></button>
                    <button className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. AI SUGGESTIONS (RIGHT) */}
        <aside className="flex flex-col min-h-0">
          <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] flex-1 flex flex-col overflow-hidden">
            <div className="p-6 bg-white border-b border-slate-100">
              <div className="flex items-center gap-2 text-uenr-brown mb-1">
                <Sparkles size={18} fill="currentColor" />
                <h2 className="text-xs font-black uppercase tracking-widest">Smart Suggestions</h2>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Based on your Semester 1 load</p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {suggestions.map((s) => (
                <div key={s.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-uenr-gold/10 text-uenr-gold rounded-xl">
                      <Lightbulb size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-tight">{s.title}</h4>
                      <p className="text-[9px] text-slate-400 mt-1 italic">{s.reason}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => addGoal(s)}
                    className="w-full py-2 bg-slate-50 hover:bg-uenr-brown hover:text-white text-[10px] font-black uppercase tracking-tighter text-uenr-brown rounded-xl transition-all border border-slate-100"
                  >
                    Add to my Roadmap
                  </button>
                </div>
              ))}

              <div className="mt-4 p-4 rounded-2xl bg-uenr-brown/5 border border-dashed border-uenr-brown/20">
                <p className="text-[10px] text-uenr-brown font-bold text-center leading-relaxed">
                  "The secret of getting ahead is getting started."
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}