"use client";

import { useState } from "react";
import { 
  CheckCircle2, Circle, Lock, BookOpen, 
  Award, ChevronRight, AlertCircle, PieChart 
} from "lucide-react";

export default function GraduationAudit() {
  const [activeCategory, setActiveCategory] = useState("All");

  const REQUIREMENTS = [
    { id: 1, type: "Core", title: "Data Structures & Algorithms", code: "CSC 301", status: "Completed", credits: 3 },
    { id: 2, type: "Core", title: "Operating Systems", code: "CSC 303", status: "Completed", credits: 3 },
    { id: 3, type: "Elective", title: "Mobile App Development", code: "CSC 415", status: "Locked", credits: 3 },
    { id: 4, type: "GNS", title: "African Studies", code: "GNS 201", status: "Completed", credits: 2 },
    { id: 5, type: "Core", title: "Final Year Project", code: "CSC 499", status: "Pending", credits: 6 },
  ];

  const stats = { earned: 98, required: 140, percentage: 70 };

  return (
    <div className="h-full flex flex-col space-y-6 font-roboto animate-in fade-in duration-700 pb-10">
      
      {/* 1. PROGRESS DONUT & SUMMARY */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row items-center gap-10">
        <div className="relative h-40 w-40 flex items-center justify-center">
          <svg className="h-full w-full -rotate-90">
            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
              strokeDasharray={440} strokeDashoffset={440 - (440 * stats.percentage) / 100}
              className="text-uenr-brown transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black font-lato text-slate-900">{stats.percentage}%</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Complete</span>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <StatBox label="Credits Earned" value={stats.earned} color="text-uenr-brown" />
            <StatBox label="Credits Remaining" value={stats.required - stats.earned} color="text-slate-400" />
            <StatBox label="Est. Graduation" value="July 2027" color="text-uenr-gold" />
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
            <AlertCircle size={18} className="text-uenr-gold shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              You need <span className="text-uenr-brown font-black">42 more credits</span> to satisfy the requirements for a BSc. Computer Science degree. Ensure all Level 400 Core courses are registered.
            </p>
          </div>
        </div>
      </div>

      {/* 2. REQUIREMENT CHECKLIST */}
      <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Curriculum Audit</h2>
          <div className="flex gap-2">
            {["All", "Core", "Elective", "GNS"].map(t => (
              <button key={t} onClick={() => setActiveCategory(t)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeCategory === t ? 'bg-uenr-brown text-white' : 'bg-slate-50 text-slate-400'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 p-4 space-y-2">
          {REQUIREMENTS.filter(r => activeCategory === "All" || r.type === activeCategory).map((req) => (
            <div key={req.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 rounded-3xl transition-all group">
              <div className="flex items-center gap-5">
                <StatusIcon status={req.status} />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-black text-uenr-brown uppercase tracking-tighter bg-uenr-brown/5 px-2 py-0.5 rounded">{req.code}</span>
                    <span className="text-[9px] font-bold text-slate-300 uppercase">{req.type}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 font-lato">{req.title}</h4>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-slate-900 font-lato">{req.credits}.0 Units</p>
                <p className={`text-[9px] font-bold uppercase mt-1 ${req.status === 'Completed' ? 'text-uenr-green' : 'text-slate-300'}`}>{req.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- COMPONENTS --- */

function StatBox({ label, value, color }: any) {
  return (
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">{label}</p>
      <p className={`text-xl font-black font-lato ${color}`}>{value}</p>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "Completed") return <div className="p-2 bg-uenr-green/10 text-uenr-green rounded-xl"><CheckCircle2 size={20} /></div>;
  if (status === "Locked") return <div className="p-2 bg-slate-100 text-slate-300 rounded-xl"><Lock size={20} /></div>;
  return <div className="p-2 bg-slate-100 text-slate-400 rounded-xl"><Circle size={20} /></div>;
}