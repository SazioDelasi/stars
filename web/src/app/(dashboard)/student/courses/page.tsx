"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Info, Save, X, Search, Lock, CheckCircle, AlertTriangle, ArrowRight, CheckCircle2, BookOpen } from "lucide-react";
import { getStatusConfig } from "@/config/misc";

export default function CourseRegistration() {
	const [isRegistered, setIsRegistered] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCourse, setSelectedCourse] = useState<any>(null);

	// Initial Core Courses (Locked)
	const [draftList, setDraftList] = useState<any[]>([
		{ id: "c1", code: "CSC 301", title: "Data Structures", credits: 3, type: "Core", lecturer: "Dr. S. Appiah", prereqMet: true },
		{ id: "c2", code: "CSC 303", title: "Operating Systems", credits: 3, type: "Core", lecturer: "Prof. J. Mensah", prereqMet: true },
	]);

	const ELECTIVES_BANK = [
		{ id: "e1", code: "CSC 307", title: "Artificial Intelligence", credits: 3, lecturer: "Dr. A. Osei", prereqCode: "CSC 201", prereqMet: true },
		{ id: "e2", code: "ELC 311", title: "Embedded Systems", credits: 3, lecturer: "Ing. O. Mensah", prereqCode: "ELC 202", prereqMet: false },
		{ id: "e3", code: "GNS 302", title: "French for Professionals", credits: 2, lecturer: "Mme. Dubois", prereqCode: "None", prereqMet: true },
	];

	const filteredElectives = useMemo(() => {
		return ELECTIVES_BANK.filter(c => c.code.includes(searchQuery.toUpperCase()) || c.title.toLowerCase().includes(searchQuery.toLowerCase()));
	}, [searchQuery]);

	const addToDraft = (course: any) => {
		if (!draftList.find(c => c.id === course.id) && (course.prereqMet || course.prereqCode === "None")) {
			setDraftList(prev => [...prev, { ...course, type: "Elective" }]);
		}
	};

	const removeFromDraft = (id: string) => {
		if (isRegistered) return; // Prevent removal after finalizing
		setDraftList(prev => prev.filter(c => c.id !== id));
	};

	const handleFinalize = () => {
		if (draftList.length > 0) {
			setIsRegistered(true);
		}
	};

	const totalCredits = draftList.reduce((acc, curr) => acc + curr.credits, 0);
	const config = getStatusConfig("NOT_STARTED");
  	const StatusIcon = config.icon;

	return (
		<div className="h-full flex flex-col space-y-6 relative font-roboto">

			{/* 1. HEADER WITH DYNAMIC BUTTON */}
			<header className="bg-white border border-slate-200 rounded-[2.5rem] p-4 md:p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0 transition-all">

				{/* LEFT: Title & Status Badge */}
				<div className="flex items-center gap-5">
					<div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-uenr-brown shadow-inner">
						<BookOpen size={28} strokeWidth={2.5} />
					</div>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-black text-slate-900 font-lato tracking-tight leading-none">
								Registration
							</h1>
							<div className={`flex items-center gap-2 ${config.bg} ${config.text} px-3 py-1 rounded-full border border-current/10`}>
								<div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
								<span className="text-[9px] font-black uppercase tracking-widest font-roboto">
									{config.label}
								</span>
							</div>
						</div>
						<p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter mt-1.5 flex items-center gap-1">
							<span className="text-uenr-brown">1st Semester</span> • 2025/2026 Academic Year
						</p>
					</div>
				</div>

				{/* RIGHT: Stats & Action */}
				<div className="flex items-center gap-3 w-full md:w-auto">

					{/* Credits Pill */}
					<div className="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 flex-1 md:flex-none justify-center">
						<div className="text-right">
							<p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Load</p>
							<p className="text-lg font-black font-lato text-uenr-brown leading-none">{totalCredits}.0</p>
						</div>
						<div className="h-8 w-px bg-slate-200" />
						<div className="text-left">
							<p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
							<p className="text-[11px] font-black text-slate-700 uppercase">{totalCredits >= 15 ? 'Valid' : 'Low'}</p>
						</div>
					</div>

					{/* Action Button */}
					{!isRegistered ? (
						<button
							onClick={handleFinalize}
							className="group bg-uenr-brown text-white h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-uenr-brown-hover shadow-xl shadow-maroon-900/20 transition-all flex items-center gap-3 active:scale-95"
						>
							Finalize Selection
							<ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
						</button>
					) : (
						<div className="bg-emerald-500 text-white h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center gap-3 shadow-lg shadow-emerald-900/20">
							<CheckCircle2 size={18} />
							Submitted
						</div>
					)}
				</div>
			</header>

			<div className={`flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 transition-opacity duration-500 ${isRegistered ? 'pointer-events-none opacity-90' : ''}`}>

				{/* 2. DISCOVERY (LEFT) */}
				<section className="lg:col-span-2 flex flex-col min-h-0 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
					<div className="p-6 border-b border-slate-50 shrink-0">
						<div className="relative">
							<Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
							<input
								disabled={isRegistered}
								type="text"
								placeholder="Search courses..."
								className="w-full bg-slate-50 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none"
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>

					<div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
						{filteredElectives.map((course) => (
							<AvailableCourseCard
								key={course.id}
								course={course}
								onAdd={addToDraft}
								onView={setSelectedCourse}
								isAlreadyAdded={!!draftList.find(c => c.id === course.id)}
							/>
						))}
					</div>
				</section>

				{/* 3. DRAFT (RIGHT) */}
				<section className="flex flex-col min-h-0">
					<h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-4">Your Slate</h2>
					<div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
						{draftList.map((course) => (
							<DraftItem
								key={course.id}
								course={course}
								onRemove={removeFromDraft}
								isRegistered={isRegistered}
							/>
						))}
					</div>
				</section>
			</div>

			{selectedCourse && (
				<CourseDetailDrawer
					course={selectedCourse}
					onClose={() => setSelectedCourse(null)}
					onAdd={addToDraft}
					isAlreadyInDraft={!!draftList.find(c => c.id === selectedCourse.id)}
				/>
			)}
		</div>
	);
}

/* --- REUSABLE COMPONENTS --- */

function AvailableCourseCard({ course, onAdd, onView, isAlreadyAdded }: any) {
	const canRegister = course.prereqMet || course.prereqCode === "None";

	return (
		<div className={`bg-white border rounded-3xl p-5 transition-all flex items-center justify-between shadow-sm 
      ${!canRegister ? 'border-red-100 bg-red-50/20' : 'border-slate-100 hover:border-uenr-brown/30'}`}>

			<div className="flex-1 cursor-pointer" onClick={() => onView(course)}>
				<div className="flex items-center gap-2 mb-1">
					<p className="text-[9px] font-black text-uenr-brown uppercase tracking-widest">{course.code}</p>
					{!canRegister && (
						<span className="flex items-center gap-1 text-[8px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded uppercase">
							<AlertTriangle size={10} /> Missing: {course.prereqCode}
						</span>
					)}
				</div>
				<h4 className={`text-sm font-bold font-lato ${!canRegister ? 'text-slate-400' : 'text-slate-800'}`}>{course.title}</h4>
			</div>

			<button
				disabled={isAlreadyAdded || !canRegister}
				onClick={() => onAdd(course)}
				className={`p-3 rounded-2xl transition-all shadow-sm
          ${isAlreadyAdded ? 'bg-uenr-green text-white' :
						!canRegister ? 'bg-slate-100 text-slate-300 cursor-not-allowed' :
							'bg-slate-50 text-uenr-brown hover:bg-uenr-brown hover:text-white'}`}
			>
				{isAlreadyAdded ? <CheckCircle size={20} /> : !canRegister ? <Lock size={20} /> : <Plus size={20} />}
			</button>
		</div>
	);
}

function DraftItem({ course, onRemove, isRegistered }: any) {
	const isCore = course.type === "Core";
	return (
		<div className={`p-4 rounded-2xl border flex items-center justify-between ${isCore ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 shadow-sm'}`}>
			<div className="flex-1">
				<h4 className="text-xs font-bold text-slate-800 font-lato">{course.title}</h4>
				<p className="text-[9px] font-black text-uenr-brown uppercase tracking-tighter mt-1">{course.code} • {course.credits}C</p>
			</div>
			{(!isCore && !isRegistered) ? (
				<button onClick={() => onRemove(course.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
					<Trash2 size={16} />
				</button>
			) : (
				<CheckCircle size={16} className={isRegistered ? "text-uenr-green" : "text-slate-200"} />
			)}
		</div>
	);
}

function CourseDetailDrawer({ course, onClose, onAdd, isAlreadyInDraft }: any) {
	// Logic: Check if prerequisites are satisfied
	const canRegister = course.prereqMet || course.prereqCode === "None";

	return (
		<div className="fixed inset-0 z-100 flex justify-end">
			<div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

			<div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 animate-in slide-in-from-right-full duration-300 flex flex-col">
				{/* Close Button */}
				<button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
					<X size={24} />
				</button>

				<div className="mt-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
					{/* Header */}
					<div className="space-y-1">
						<span className="text-[10px] font-black uppercase tracking-widest text-uenr-brown font-roboto">
							{course.type || 'Elective'} COURSE
						</span>
						<h2 className="text-2xl font-black text-slate-900 font-lato leading-tight">{course.title}</h2>
						<p className="text-lg font-bold text-uenr-brown font-roboto uppercase tracking-tighter">{course.code}</p>
					</div>

					{/* Lecturer Card */}
					<div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl flex items-center gap-4">
						<div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-uenr-brown font-black font-lato text-xl shadow-sm">
							{course.lecturer?.split(' ').pop()?.[0]}
						</div>
						<div>
							<p className="text-[10px] font-bold text-slate-400 uppercase font-roboto">Instructor</p>
							<p className="text-sm font-bold text-slate-800 font-lato">{course.lecturer}</p>
						</div>
					</div>

					{/* PREREQUISITE LOGIC VISUAL */}
					<div className="space-y-3">
						<h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-roboto px-1">Registration Requirement</h4>
						<div className={`p-4 rounded-2xl border flex items-center justify-between ${canRegister ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
							<div className="flex items-center gap-3">
								<div className={`h-10 w-10 rounded-xl flex items-center justify-center ${canRegister ? 'bg-uenr-green text-white' : 'bg-red-500 text-white'}`}>
									{canRegister ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
								</div>
								<div>
									<p className="text-xs font-bold text-slate-800 font-lato">
										Prerequisite: {course.prereqCode}
									</p>
									<p className={`text-[10px] font-bold font-roboto uppercase ${canRegister ? 'text-uenr-green' : 'text-red-500'}`}>
										{canRegister ? 'Requirement Satisfied' : 'Requirement Not Met'}
									</p>
								</div>
							</div>
						</div>
						{!canRegister && (
							<p className="text-[11px] text-red-400 italic font-roboto px-1">
								* You must pass {course.prereqCode} before enrolling in this course.
							</p>
						)}
					</div>

					{/* Description */}
					<div className="space-y-2 pt-4 border-t border-slate-100">
						<h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-roboto">Course Overview</h4>
						<p className="text-sm text-slate-600 leading-relaxed font-roboto">
							{course.description}
						</p>
					</div>
				</div>

				{/* DYNAMIC ACTION BUTTON */}
				<div className="pt-6 mt-auto border-t border-slate-100">
					{isAlreadyInDraft ? (
						<div className="w-full py-4 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest bg-slate-50 rounded-2xl">
							Already in your selection
						</div>
					) : !canRegister ? (
						<button
							disabled
							className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-bold font-lato uppercase tracking-widest cursor-not-allowed border border-slate-200"
						>
							Locked: Prerequisite Missing
						</button>
					) : (
						<button
							onClick={() => onAdd(course)}
							className="w-full bg-uenr-brown text-white py-4 rounded-2xl font-bold font-lato uppercase tracking-widest shadow-xl shadow-maroon-900/20 hover:bg-uenr-brown-hover hover:scale-[1.02] transition-all"
						>
							Add to Selection
						</button>
					)}
				</div>
			</div>
		</div>
	);
}