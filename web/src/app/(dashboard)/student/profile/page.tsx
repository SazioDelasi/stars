"use client";

import { useState } from "react";
import { 
  User, Mail, Phone, MapPin, ShieldCheck, 
  Camera, Edit2, Globe, Hash, Calendar, 
  Fingerprint, Award, CheckCircle
} from "lucide-react";

export default function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false);

  const STUDENT_DATA = {
    name: "ADAMS MAXWELL OWUSU",
    indexNumber: "20004055",
    programme: "BSc. Computer Science",
    level: "300",
    email: "m.owusu@uenr.edu.gh",
    phone: "+233 54 000 0000",
    hometown: "Sunyani, Bono Region",
    hall: "GetFund Hostel",
    status: "Regular / Active",
    admissionDate: "Sept 2023"
  };

  return (
    <div className="h-full flex flex-col space-y-8 font-roboto animate-in fade-in duration-700 pb-10">
      
      {/* 1. THE DIGITAL ID CARD (Top Section) */}
      <section className="relative">
        <div className="h-48 bg-gradient-to-r from-uenr-brown to-maroon-900 rounded-[3rem] shadow-xl relative overflow-hidden">
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-uenr-gold/10 rounded-full -mb-20 blur-2xl" />
        </div>

        <div className="px-10 -mt-24 relative z-10 flex flex-col md:flex-row items-end gap-8">
          {/* Profile Photo Wrapper */}
          <div className="relative group">
            <div className="h-40 w-40 rounded-[2.5rem] border-8 border-white bg-slate-100 overflow-hidden shadow-2xl">
              <div className="h-full w-full flex items-center justify-center text-slate-300">
                <User size={80} />
              </div>
            </div>
            <button className="absolute bottom-2 right-2 p-3 bg-uenr-gold text-white rounded-2xl shadow-lg hover:scale-110 transition-all border-4 border-white">
              <Camera size={18} />
            </button>
          </div>

          <div className="pb-4 space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white font-lato uppercase tracking-tight">
                {STUDENT_DATA.name}
              </h1>
              <div className="bg-uenr-green text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-green-900/20">
                <ShieldCheck size={12} /> Verified
              </div>
            </div>
            <p className="text-maroon-100 font-bold text-sm tracking-widest uppercase">
              {STUDENT_DATA.programme} • LEVEL {STUDENT_DATA.level}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. PERSONAL INFORMATION (Left/Center) */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Bio-Data & Contact</h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 text-uenr-brown text-[10px] font-black uppercase tracking-widest hover:underline"
              >
                <Edit2 size={14} /> {isEditing ? "Save Changes" : "Update Profile"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <InfoField icon={<Hash />} label="Index Number" value={STUDENT_DATA.indexNumber} />
              <InfoField icon={<Mail />} label="University Email" value={STUDENT_DATA.email} />
              <InfoField icon={<Phone />} label="Phone Number" value={STUDENT_DATA.phone} isEditable={isEditing} />
              <InfoField icon={<MapPin />} label="Residential Address" value={STUDENT_DATA.hall} isEditable={isEditing} />
              <InfoField icon={<Calendar />} label="Admission Date" value={STUDENT_DATA.admissionDate} />
              <InfoField icon={<Globe />} label="Hometown" value={STUDENT_DATA.hometown} isEditable={isEditing} />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-[2.5rem] p-8 flex items-center gap-6">
             <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-uenr-brown shadow-sm">
                <Fingerprint size={28} />
             </div>
             <div>
               <h4 className="text-sm font-black text-slate-800 font-lato uppercase">Biometric Status</h4>
               <p className="text-xs text-slate-500 font-medium mt-1">
                 Your biometrics are <span className="text-uenr-green font-bold uppercase">Fully Synced</span> for Semester 1 Examinations.
               </p>
             </div>
          </div>
        </section>

        {/* 3. ACADEMIC BADGES (Right) */}
        <aside className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Academic Standing</h2>
            <div className="space-y-6">
               <BadgeItem 
                 icon={<Award className="text-uenr-gold" />} 
                 label="Current CGPA" 
                 value="3.82" 
                 subText="First Class Division"
               />
               <BadgeItem 
                 icon={<CheckCircle className="text-uenr-green" />} 
                 label="Credits Earned" 
                 value="98.0" 
                 subText="Required: 140.0"
               />
               <div className="pt-4 border-t border-slate-50">
                 <p className="text-[9px] text-slate-400 font-bold uppercase text-center mb-4">Official Verification Code</p>
                 <div className="bg-slate-50 py-3 rounded-xl border border-slate-100 flex items-center justify-center gap-2">
                   <span className="text-xs font-black text-slate-900 font-lato tracking-[0.3em]">UENR-ST-2026-X8</span>
                 </div>
               </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* --- REUSABLE COMPONENTS --- */

function InfoField({ icon, label, value, isEditable }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-slate-400">
        <span className="p-1.5 bg-slate-50 rounded-lg text-uenr-brown">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      {isEditable ? (
        <input 
          type="text" 
          defaultValue={value} 
          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-uenr-brown/10 transition-all"
        />
      ) : (
        <p className="text-sm font-black text-slate-900 font-lato pl-1">{value}</p>
      )}
    </div>
  );
}

function BadgeItem({ icon, label, value, subText }: any) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100">
      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
        <p className="text-xl font-black text-slate-900 font-lato leading-none my-1">{value}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase">{subText}</p>
      </div>
    </div>
  );
}