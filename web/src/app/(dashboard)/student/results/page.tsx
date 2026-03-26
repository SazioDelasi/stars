"use client";

import { useState, useMemo } from "react";
import {
	BarChart3, TrendingUp, GraduationCap, Download,
	ChevronDown, Calculator, RefreshCcw, Save
} from "lucide-react";
import GpaChart from "@/components/ui/charts/gpa-chart";

export default function AcademicResults() {
	const [isSimulating, setIsSimulating] = useState(false);

	// Real data from DB
	const INITIAL_COURSES = [
		{ code: "CSC 301", title: "Data Structures", credits: 3, grade: "A", gp: 12.0 },
		{ code: "CSC 303", title: "Operating Systems", credits: 3, grade: "B+", gp: 10.5 },
		{ code: "CSC 307", title: "Artificial Intelligence", credits: 3, grade: "A", gp: 12.0 },
		{ code: "GNS 302", title: "French for Professionals", credits: 2, grade: "A", gp: 8.0 },
		{ code: "CSC 305", title: "Software Engineering", credits: 3, grade: "B", gp: 9.0 },
	];

	const [courses, setCourses] = useState(INITIAL_COURSES);

	// Grade to Point Mapping for UENR
	const gradeScale: Record<string, number> = {
		"A": 4.0, "B+": 3.5, "B": 3.0, "C+": 2.5, "C": 2.0, "D+": 1.5, "D": 1.0, "F": 0
	};

	const handleSimulate = (index: number, newGrade: string) => {
		const updated = [...courses];
		updated[index].grade = newGrade;
		updated[index].gp = gradeScale[newGrade] * updated[index].credits;
		setCourses(updated);
	};

	const simGPA = useMemo(() => {
		const totalGP = courses.reduce((acc, curr) => acc + curr.gp, 0);
		const totalCredits = courses.reduce((acc, curr) => acc + curr.credits, 0);
		return (totalGP / totalCredits).toFixed(2);
	}, [courses]);

	return (
		<div className="h-full flex flex-col space-y-6 font-roboto animate-in fade-in duration-700 pb-10">

			{/* 1. TOP OVERVIEW */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				<div className="lg:col-span-3 bg-uenr-brown rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-maroon-900/20">
					<div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
						<div className="space-y-2 text-center md:text-left">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Current Standing</p>
							<div className="flex items-baseline gap-3">
								<h2 className="text-5xl font-black font-lato tracking-tighter">3.82</h2>
								<span className="text-uenr-gold font-bold text-sm uppercase tracking-widest">First Class</span>
							</div>
						</div>

						<div className="flex gap-3">
							<button
								onClick={() => { setIsSimulating(!isSimulating); setCourses(INITIAL_COURSES); }}
								className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isSimulating ? 'bg-uenr-gold text-white' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
							>
								{isSimulating ? <RefreshCcw size={14} /> : <Calculator size={14} />}
								{isSimulating ? "Reset Real Data" : "GPA Simulator"}
							</button>
						</div>
					</div>
					<GraduationCap className="absolute -bottom-6 -right-6 h-32 w-32 opacity-10 -rotate-12" />
				</div>

				<div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-center items-center text-center">
					<p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Simulated GPA</p>
					<h3 className={`text-4xl font-black font-lato ${isSimulating ? 'text-uenr-gold animate-pulse' : 'text-slate-900'}`}>{simGPA}</h3>
					{isSimulating && <p className="text-[8px] font-bold text-uenr-brown uppercase mt-2 italic">Preview Mode</p>}
				</div>
			</div>

			<div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">

				{/* 2. DETAILED GRADE TABLE (WITH NEW DOWNLOAD POS) */}
				<section className="lg:col-span-2 flex flex-col min-h-0 space-y-4">
					<div className="flex items-center justify-between px-2">
						<h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester Performance</h2>
						<button className="flex items-center gap-2 bg-uenr-brown text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-900/10">
							<Download size={14} /> Download Transcript
						</button>
					</div>

					<div className={`bg-white border rounded-[2.5rem] overflow-hidden flex-1 flex flex-col shadow-sm transition-all ${isSimulating ? 'border-uenr-gold border-2' : 'border-slate-200'}`}>
						<div className="overflow-y-auto custom-scrollbar">
							<table className="w-full text-left border-collapse">
								<thead className="sticky top-0 bg-white border-b border-slate-50 z-10">
									<tr className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
										<th className="px-8 py-5">Course</th>
										<th className="px-4 py-5 text-center">Credits</th>
										<th className="px-4 py-5 text-center">Grade</th>
										<th className="px-8 py-5 text-right">Points</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-50">
									{courses.map((row, i) => (
										<tr key={i} className="hover:bg-slate-50/50 transition-colors">
											<td className="px-8 py-5">
												<p className="text-[10px] font-black text-uenr-brown uppercase">{row.code}</p>
												<p className="text-sm font-bold text-slate-800 font-lato">{row.title}</p>
											</td>
											<td className="px-4 py-5 text-center font-bold text-slate-400">{row.credits.toFixed(1)}</td>
											<td className="px-4 py-5 text-center">
												{isSimulating ? (
													<select
														value={row.grade}
														onChange={(e) => handleSimulate(i, e.target.value)}
														className="bg-slate-50 border border-uenr-gold/30 rounded-lg px-2 py-1 text-xs font-black text-uenr-brown outline-none focus:ring-2 focus:ring-uenr-gold/20"
													>
														{Object.keys(gradeScale).map(g => <option key={g} value={g}>{g}</option>)}
													</select>
												) : (
													<span className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-black bg-slate-100 text-slate-600">{row.grade}</span>
												)}
											</td>
											<td className="px-8 py-5 text-right font-black text-slate-900">{row.gp.toFixed(2)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</section>

				{/* 3. TRENDS SIDEBAR */}
				<aside className="space-y-6">
					<div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
						<h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2 flex items-center gap-2">
							<BarChart3 size={14} className="text-uenr-brown" /> Growth Trend
						</h2>
						<GpaChart />
					</div>

					<div className="bg-uenr-gold/10 border border-uenr-gold/20 rounded-[2.5rem] p-6 space-y-4">
						<h4 className="text-[11px] font-black text-uenr-gold uppercase tracking-widest">Simulator Tip</h4>
						<p className="text-[10px] text-slate-600 font-medium leading-relaxed">
							Targeting a <span className="font-bold">4.0 Semester GPA</span>? You'll need <span className="text-uenr-brown font-black">As</span> in all remaining 3-credit courses.
						</p>
					</div>
				</aside>
			</div>
		</div>
	);
}