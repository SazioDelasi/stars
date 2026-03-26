"use client";

import { useState } from "react";
import { LayoutDashboard, BookOpen, Calendar, Map, FileText, CreditCard, Bell, LogOut, Menu, X, User, FileBadge } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { RoleGuard } from "@/components/auth/role-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		// <AuthGuard>
			// <RoleGuard allowed={["student"]}>
				<ProtectedLayout>
					{children}
				</ProtectedLayout>
			// </RoleGuard>
		// </AuthGuard>
	);
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	function toggleSidebar() {
		setIsSidebarOpen(!isSidebarOpen);
	}

	return (
		<div className="h-screen w-full bg-[#F8FAFC] flex overflow-hidden font-roboto">
			{/* Mobile Sidebar Overlay */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
					onClick={toggleSidebar}
				/>
			)}

			{/* Sidebar: Fixed height, internal scroll if menu grows too long */}
			<aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:h-full
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
				<div className="p-8 flex flex-col h-full">
					<div className="flex items-center justify-between mb-10 shrink-0">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 bg-uenr-brown rounded-xl flex items-center justify-center text-white font-black font-lato text-xl shadow-lg shadow-maroon-900/10">S.</div>
							<span className="font-bold text-uenr-brown font-lato text-xl tracking-tight uppercase">Stars</span>
						</div>
						<button onClick={toggleSidebar} className="lg:hidden text-slate-400 p-1">
							<X size={24} />
						</button>
					</div>

					{/* Nav grows and scrolls if items exceed height */}
					<nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
						<NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" href="/" active />
						<NavItem icon={<Calendar size={20} />} label="Schedules" href="/schedules" />
						<NavItem icon={<BookOpen size={20} />} label="Courses" href="/courses" />
						<NavItem icon={<FileBadge size={20} />} label="Results" href="/results" />
						<NavItem icon={<Map size={20} />} label="Study Plan" href="/study-plan" />
						<NavItem icon={<FileText size={20} />} label="Resources" href="/resources" />
						<NavItem icon={<CreditCard size={20} />} label="Fees & History" href="/finance" />
						<NavItem icon={<Bell size={20} />} label="Announcements" href="/announcements" />
						<NavItem icon={<User size={20} />} label="Profile" href="/profile" />
					</nav>

					<div className="pt-6 mt-6 border-t border-slate-100 shrink-0">
						<button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-uenr-brown transition-colors font-bold font-lato text-sm uppercase tracking-wider">
							<LogOut size={20} /> Sign Out
						</button>
					</div>
				</div>
			</aside>

			{/* Main Container: Flex-1 takes remaining width */}
			<div className="flex-1 flex flex-col min-w-0 h-full">

				{/* Fixed Header */}
				<header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 md:px-10 shrink-0 z-30">
					<div className="flex items-center gap-4">
						<button onClick={toggleSidebar} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
							<Menu size={24} />
						</button>
						<h2 className="hidden md:block font-bold text-slate-800 font-lato text-lg">Dashboard</h2>
					</div>

					<div className="flex items-center gap-4">
						<div className="hidden sm:flex flex-col items-end mr-2">
							<span className="text-xs font-bold text-slate-900 font-lato uppercase">Kwame Osei</span>
							<span className="text-[10px] text-slate-400 font-roboto">Index: 220045</span>
						</div>
						<div className="w-10 h-10 rounded-xl bg-uenr-brown/5 border border-uenr-brown/10 flex items-center justify-center text-uenr-brown font-bold text-xs">
							KO
						</div>
					</div>
				</header>

				<main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#F8FAFC]">
					<div className="max-w-7xl mx-auto">
						{children}
					</div>
				</main>
			</div>
		</div>
	)
}

function NavItem({ icon, label, href, active = false }: { icon: React.ReactNode; label: string; href: string; active?: boolean }) {
	return (
		<Link href={href} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold font-lato text-sm transition-all group ${active ? "bg-uenr-brown text-white shadow-lg shadow-maroon-900/20" : "text-slate-500 hover:bg-slate-50 hover:text-uenr-brown"}`}>
			<span className={`${active ? "text-white" : "text-slate-400 group-hover:text-uenr-brown"}`}>{icon}</span>
			<span className="tracking-tight">{label}</span>
		</Link>
	);
}