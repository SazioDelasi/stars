"use client";

import { useState, useEffect } from "react";
import { MapPin, User, Clock, Download, ChevronRight, Bell } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMES = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

// Mock Data for the Student
const MOCK_SCHEDULE = [
  { day: "Monday", start: 8, duration: 2, code: "CSC 305", title: "Software Engineering", room: "LT 12", prof: "Dr. Appiah", color: "bg-uenr-brown" },
  { day: "Tuesday", start: 10, duration: 2, code: "MAT 301", title: "Numerical Methods", room: "LT 1", prof: "Prof. Boateng", color: "bg-uenr-blue" },
  { day: "Wednesday", start: 9, duration: 3, code: "ELC 301", title: "Power Systems", room: "Lab 4", prof: "Ing. Mensah", color: "bg-uenr-green" },
  { day: "Wednesday", start: 14, duration: 2, code: "GNS 301", title: "Comm. Skills", room: "Main Aud", prof: "Mrs. Dankwa", color: "bg-uenr-gold" },
];

export default function SchedulesPage() {
  const [activeDay, setActiveDay] = useState("Monday");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute for the "Live" indicator
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentDayName = DAYS[currentTime.getDay() - 1] || "Monday";
  const currentHour = currentTime.getHours();

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. HEADER & EXPORTS */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-lato">Academic Timetable</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-uenr-green animate-ping" />
            <p className="text-xs font-bold text-slate-500 font-roboto uppercase tracking-tighter">
              Live: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-uenr-brown text-white rounded-xl text-xs font-bold shadow-lg shadow-maroon-900/20 hover:scale-[1.02] transition-all font-roboto">
          <Download size={16} /> PDF Export
        </button>
      </header>

      {/* 2. MOBILE DAY SWITCHER (Horizontal Scrollable Tabs) */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 custom-scrollbar shrink-0">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-6 py-3 rounded-2xl text-xs font-bold font-lato transition-all whitespace-nowrap border ${
              activeDay === day 
              ? "bg-uenr-brown text-white border-uenr-brown shadow-md" 
              : "bg-white text-slate-400 border-slate-100"
            }`}
          >
            {day} {day === currentDayName && "• Today"}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* 3. THE "RIGHT NOW" VIEW (Vertical Agenda) */}
        <section className="lg:col-span-1 flex flex-col gap-4 min-h-0">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-roboto px-2">Agenda: {activeDay}</h2>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {MOCK_SCHEDULE.filter(item => item.day === activeDay).map((item, idx) => {
              const isHappeningNow = activeDay === currentDayName && currentHour >= item.start && currentHour < (item.start + item.duration);
              const isNext = activeDay === currentDayName && currentHour < item.start;

              return (
                <AgendaItem 
                  key={idx} 
                  item={item} 
                  status={isHappeningNow ? "active" : isNext ? "next" : "past"} 
                />
              );
            })}
          </div>
        </section>

        {/* 4. THE MASTER GRID (Hidden on small mobile, visible on tablet/desktop) */}
        <section className="hidden lg:flex lg:col-span-3 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex-col overflow-hidden">
          {/* Desktop Days Header */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="h-14" />
            {DAYS.map(day => (
              <div key={day} className={`flex items-center justify-center border-r border-slate-100 font-black text-[10px] font-roboto uppercase tracking-widest ${day === currentDayName ? 'text-uenr-brown bg-uenr-brown/5' : 'text-slate-400'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="grid grid-cols-[80px_repeat(5,1fr)] min-h-full">
              {/* Times Column */}
              <div className="bg-slate-50/20 border-r border-slate-100">
                {TIMES.map(t => (
                  <div key={t} className="h-24 border-b border-slate-100/50 flex items-center justify-center text-[10px] font-bold text-slate-300 font-roboto">
                    {t}:00
                  </div>
                ))}
              </div>

              {/* Data Columns */}
              {DAYS.map(day => (
                <div key={day} className="relative border-r border-slate-100 last:border-0">
                  {TIMES.map(t => <div key={t} className="h-24 border-b border-slate-50" />)}
                  
                  {MOCK_SCHEDULE.filter(s => s.day === day).map((s, i) => (
                    <GridEntry key={i} entry={s} isToday={day === currentDayName} currentHour={currentHour} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* --- SUB-COMPONENTS --- */

function AgendaItem({ item, status }: any) {
  return (
    <div className={`
      p-5 rounded-[2rem] border transition-all relative overflow-hidden group
      ${status === 'active' ? 'bg-uenr-brown text-white shadow-xl shadow-maroon-900/20 scale-[1.02]' : 'bg-white border-slate-100'}
    `}>
      {status === 'active' && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-uenr-gold animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Happening Now</span>
        </div>
      )}
      
      <p className={`text-[10px] font-black mb-1 font-roboto uppercase tracking-tighter ${status === 'active' ? 'text-uenr-gold' : 'text-uenr-brown'}`}>
        {item.start}:00 — {item.start + item.duration}:00
      </p>
      <h4 className={`text-sm font-bold font-lato mb-3 ${status === 'active' ? 'text-white' : 'text-slate-800'}`}>
        {item.code}: {item.title}
      </h4>
      
      <div className="flex items-center justify-between mt-auto">
        <div className={`flex items-center gap-2 text-[10px] font-medium font-roboto ${status === 'active' ? 'text-white/80' : 'text-slate-500'}`}>
          <MapPin size={12} /> {item.room}
        </div>
        <div className={`flex items-center gap-2 text-[10px] font-medium font-roboto ${status === 'active' ? 'text-white/80' : 'text-slate-500'}`}>
          <User size={12} /> {item.prof}
        </div>
      </div>
    </div>
  );
}

function GridEntry({ entry, isToday, currentHour }: any) {
  const isNow = isToday && currentHour >= entry.start && currentHour < (entry.start + entry.duration);
  
  const top = (entry.start - 7) * 96;
  const height = entry.duration * 96 - 4;

  return (
    <div 
      style={{ top: `${top}px`, height: `${height}px` }}
      className={`
        absolute left-1 right-1 rounded-2xl p-3 border-l-4 transition-all cursor-pointer group
        ${isNow ? 'bg-uenr-brown text-white z-10 shadow-lg scale-105 border-uenr-gold' : `bg-white border-slate-200 hover:border-uenr-brown shadow-sm`}
      `}
    >
      <p className={`text-[9px] font-black font-roboto truncate mb-1 ${isNow ? 'text-uenr-gold' : 'text-uenr-brown'}`}>{entry.code}</p>
      <h5 className={`text-[11px] font-bold font-lato leading-tight line-clamp-2 ${isNow ? 'text-white' : 'text-slate-800'}`}>{entry.title}</h5>
      {entry.duration > 1 && (
         <div className={`mt-auto flex items-center gap-1 opacity-60 text-[9px] font-medium ${isNow ? 'text-white' : 'text-slate-500'}`}>
            <MapPin size={10} /> {entry.room}
         </div>
      )}
    </div>
  );
}