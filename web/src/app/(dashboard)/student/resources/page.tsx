"use client";

import { useState } from "react";
import { 
  FileText, Folder, Search, Download, ExternalLink, 
  Plus, Filter, Book, Video, Share2, MoreVertical, Star,
  ChevronRight
} from "lucide-react";

export default function ResourceHub() {
  const [searchQuery, setSearchQuery] = useState("");

  const CATEGORIES = ["All", "Handouts", "Past Questions", "Video Lectures", "Project Files"];
  
  const RESOURCES = [
    { id: 1, title: "CSC 301: Advanced Tree Structures.pdf", course: "CSC 301", type: "Handouts", size: "2.4MB", date: "2 days ago", starred: true },
    { id: 2, title: "Operating Systems 2024 Past Questions.pdf", course: "CSC 303", type: "Past Questions", size: "1.1MB", date: "1 week ago", starred: false },
    { id: 3, title: "AI Neural Networks - Week 4 Recap.mp4", course: "CSC 307", type: "Video Lectures", size: "45MB", date: "Yesterday", starred: true },
    { id: 4, title: "French Verbs Conjugation Guide.docx", course: "GNS 302", type: "Handouts", size: "800KB", date: "3 days ago", starred: false },
  ];

  return (
    <div className="h-full flex flex-col space-y-6 font-roboto animate-in fade-in duration-700">
      
      {/* 1. SEARCH & CATEGORY HEADER */}
      <header className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="relative w-full lg:max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input 
            type="text" 
            placeholder="Search documents, videos, or course codes..."
            className="w-full bg-slate-50 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-uenr-brown/10 transition-all"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar max-w-full">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat} 
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
              ${cat === 'All' ? 'bg-uenr-brown text-white shadow-lg shadow-maroon-900/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0">
        
        {/* 2. SIDEBAR: COURSE FOLDERS */}
        <aside className="lg:col-span-1 flex flex-col space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Course Vaults</h2>
            <div className="space-y-1">
              {["CSC 301", "CSC 303", "CSC 307", "GNS 302"].map((course) => (
                <button key={course} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-uenr-brown/5 text-uenr-brown rounded-xl group-hover:bg-uenr-brown group-hover:text-white transition-all">
                      <Folder size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 font-lato">{course}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-uenr-gold/10 border border-uenr-gold/20 rounded-[2.5rem] p-6 text-center space-y-3">
             <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-uenr-gold">
               <Share2 size={24} />
             </div>
             <p className="text-[11px] font-black text-uenr-gold uppercase tracking-tighter leading-tight">Got helpful notes?<br/>Share with the class</p>
             <button className="w-full bg-uenr-gold text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all">
               Upload Resource
             </button>
          </div>
        </aside>

        {/* 3. MAIN CONTENT: FILE EXPLORER */}
        <section className="lg:col-span-3 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Files</h2>
            <div className="flex items-center gap-2 text-uenr-brown cursor-pointer">
              <Filter size={14} />
              <span className="text-[10px] font-bold uppercase">Sort By Date</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex-1 flex flex-col shadow-sm">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b border-slate-50">
                  <tr className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    <th className="px-8 py-5">Name</th>
                    <th className="px-4 py-5">Category</th>
                    <th className="px-4 py-5">Size</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {RESOURCES.map((file) => (
                    <tr key={file.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${file.type === 'Video Lectures' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                            {file.type === 'Video Lectures' ? <Video size={18} /> : <FileText size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 font-lato leading-none mb-1">{file.title}</p>
                            <p className="text-[9px] font-black text-uenr-brown uppercase tracking-tighter">{file.course}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md">{file.type}</span>
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{file.size}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className={`p-2 transition-colors ${file.starred ? 'text-uenr-gold' : 'text-slate-200 hover:text-uenr-gold'}`}>
                            <Star size={18} fill={file.starred ? "currentColor" : "none"} />
                          </button>
                          <button className="p-2 text-slate-300 hover:text-uenr-brown transition-colors">
                            <Download size={18} />
                          </button>
                          <button className="p-2 text-slate-300 hover:text-slate-600">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* PAGINATION / FOOTER */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center px-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Showing 4 of 28 resources</p>
              <div className="flex gap-1">
                <button className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-uenr-brown hover:text-white transition-all">1</button>
                <button className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-uenr-brown hover:text-white transition-all">2</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}