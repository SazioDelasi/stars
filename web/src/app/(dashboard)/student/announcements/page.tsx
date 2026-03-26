"use client";

import { useState } from "react";
import {
	Megaphone, Calendar,
	ChevronRight, Pin, Clock,
	Search, Ship
} from "lucide-react";
import { Announcement } from "@/lib/types/announcements";

export default function Announcements() {
	const [filter, setFilter] = useState("All");

	const NEWS: Announcement[] = [
		{
			id: 1,
			tag: "Urgent",
			title: "Rescheduling of CSC 301 Mid-Semester Quiz",
			excerpt: "The quiz originally scheduled for Friday has been moved to Monday, March 23rd, at the LT 100.",
			createdAt: new Date(),
			updatedAt: new Date(),
			pinned: true,
			author: {
				id: "1",
				name: "Dept. of Computer Science"
			},
			targetAudience: "STUDENTS",
		},
		{
			id: 2,
			tag: "Finance",
			title: "Final Deadline for Fee Payment & Registration",
			excerpt: "All students must finalize their course registration by April 30. Late registration will attract a penalty.",
			createdAt: new Date(),
			pinned: true,
			author: {
				id: "2",
				name: "Academic Affairs"
			}
		},
		// {
		// 	id: 3,
		// 	tag: "Event",
		// 	title: "UENR Tech Expo 2026: Call for Projects",
		// 	excerpt: "Showcase your innovations at this year's expo. Registration for exhibitors is now open via the SRC portal.",
		// 	date: "5 hours ago",
		// 	pinned: false,
		// 	author: "SRC Secretariat"
		// },
		// {
		// 	id: 4,
		// 	tag: "Academic",
		// 	title: "Supplementary Examination Timetable Out",
		// 	excerpt: "Students who applied for supplementary exams can now check the venue and time details in the resource hub.",
		// 	date: "Yesterday",
		// 	pinned: false,
		// 	author: "Exams Unit"
		// }
	];

	return (
		<div className="h-full flex flex-col space-y-6 font-roboto animate-in fade-in duration-700">

			{/* 1. TOP STATS / EMERGENCY BAR */}
			<div className="flex flex-col md:flex-row gap-4">
				<div className="flex-1 bg-uenr-brown rounded-4xl p-6 text-white flex items-center justify-between shadow-lg shadow-maroon-900/10">
					<div className="flex items-center gap-4">
						<div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center animate-pulse">
							<Megaphone size={24} />
						</div>
						<div>
							<p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Latest Bulletin</p>
							<h2 className="text-sm font-bold font-lato uppercase truncate max-w-62.5 md:max-w-md">
								Quiz Rescheduled: CSC 301 Data Structures
							</h2>
						</div>
					</div>
					<button className="bg-white text-uenr-brown px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
						Read Now
					</button>
				</div>
			</div>

			<div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0">

				{/* 2. THE MAIN FEED (LEFT/CENTER) */}
				<section className="lg:col-span-3 flex flex-col min-h-0 space-y-4">
					<div className="flex items-center justify-between px-2">
						<div className="flex items-center gap-6">
							{["All", "Academic", "Urgent", "Events"].map((cat) => (
								<button
									key={cat}
									onClick={() => setFilter(cat)}
									className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all border-b-2 
                  ${filter === cat ? 'text-uenr-brown border-uenr-brown' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
								>
									{cat}
								</button>
							))}
						</div>
						<div className="hidden md:flex items-center gap-2 text-slate-300">
							<Search size={14} />
							<input type="text" placeholder="Search news..." className="bg-transparent border-none text-[10px] font-bold uppercase outline-none w-32 focus:w-48 transition-all" />
						</div>
					</div>

					<div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
						{NEWS.map((item) => (
							<div key={item.id} className={`bg-white border rounded-[2.5rem] p-6 transition-all hover:shadow-md cursor-pointer group relative overflow-hidden ${item.pinned ? 'border-uenr-brown/20' : 'border-slate-100'}`}>
								{item.pinned && <div className="absolute top-0 right-12 w-8 h-4 bg-uenr-brown rounded-b-lg flex items-center justify-center text-white"><Pin size={10} /></div>}

								<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
									<div className="space-y-3 flex-1">
										<div className="flex items-center gap-3">
											<span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${item.tag === 'Urgent' ? 'bg-red-50 text-red-500' :
												item.tag === 'Finance' ? 'bg-uenr-gold/10 text-uenr-gold' :
													'bg-slate-100 text-slate-500'
												}`}>
												{item.tag}
											</span>
											<span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
												<Clock size={12} /> {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
										</div>
										<h3 className="text-lg font-black font-lato text-slate-900 group-hover:text-uenr-brown transition-colors leading-tight">
											{item.title}
										</h3>
										<p className="text-sm text-slate-500 leading-relaxed max-w-2xl line-clamp-2">
											{item.excerpt}
										</p>
									</div>

									<div className="flex items-center gap-4 md:border-l md:border-slate-50 md:pl-8 shrink-0">
										<div className="text-right hidden md:block">
											<p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Issued By</p>
											<p className="text-[11px] font-bold text-slate-800 font-lato">{item.author.name}</p>
										</div>
										<div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-uenr-brown group-hover:text-white transition-all">
											<ChevronRight size={20} />
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</section>

				{/* 3. CAMPUS SYNC (RIGHT) */}
				<aside className="flex flex-col min-h-0 space-y-6">
					<div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
						<h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2 flex items-center gap-2">
							<Calendar size={14} className="text-uenr-brown" /> Academic Calendar
						</h2>
						<div className="space-y-6">
							{[
								{ label: "Mid-Semester Week", date: "Mar 20 - Mar 27", color: "bg-uenr-brown" },
								{ label: "Easter Break", date: "Apr 03 - Apr 06", color: "bg-uenr-gold" },
								{ label: "Revision Week", date: "May 10 - May 15", color: "bg-slate-200" }
							].map((event, i) => (
								<div key={i} className="flex gap-4 items-start group">
									<div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${event.color}`} />
									<div>
										<p className="text-[11px] font-black text-slate-800 font-lato uppercase">{event.label}</p>
										<p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{event.date}</p>
									</div>
								</div>
							))}
						</div>
						<button className="w-full mt-8 py-3 bg-slate-50 text-[10px] font-black uppercase text-slate-400 rounded-xl border border-slate-100 hover:bg-slate-100 hover:text-uenr-brown transition-all">
							View Full Calendar
						</button>
					</div>

					<div className="bg-uenr-gold/5 border border-uenr-gold/20 rounded-[2.5rem] p-6 relative overflow-hidden group">
						<Ship className="absolute -bottom-4 -right-4 h-20 w-20 text-uenr-gold opacity-10 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
						<h3 className="text-[11px] font-black text-uenr-gold uppercase tracking-widest mb-2">Student Portal Tip</h3>
						<p className="text-[10px] text-uenr-gold/80 font-medium leading-relaxed">
							Did you know you can track your <span className="font-bold">GPA trends</span> in the results section? Check your academic progress today.
						</p>
					</div>
				</aside>
			</div>
		</div>
	);
}