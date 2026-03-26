"use client";

import { useAuthStore } from "@/store/auth.store";
import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { navigation, UserRole } from "@/config/navigation";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <ProtectedLayout>{children}</ProtectedLayout>;
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
	const { user, logout } = useAuthStore();
	const router = useRouter();
	const pathname = usePathname();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (isHydrated && !user) {
			router.replace("/login");
		}
	}, [user, isHydrated, router]);

	if (!isHydrated || !user) return null;

	const role = user.role.toLowerCase() as UserRole;
	const navItems = navigation[role] || [];
	const initials = user.first_name?.charAt(0).toUpperCase() + user.last_name?.charAt(0).toUpperCase() || "U";

	const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

	async function handleLogout() {
		logout();
	}

	const activeItem = navItems.find(item => item.href === pathname);
	const pageTitle = activeItem ? activeItem.label : "Dashboard";

	return (
		<div className="h-screen w-full bg-[#F8FAFC] flex overflow-hidden font-roboto">
			{isSidebarOpen && (
				<div
					className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
					onClick={toggleSidebar}
				/>
			)}

			<aside
				className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:h-full
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
				<div className="p-8 flex flex-col h-full">
					<div className="flex items-center justify-between mb-10 shrink-0">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 bg-uenr-brown rounded-xl flex items-center justify-center text-white font-black font-lato text-xl shadow-lg">
								S.
							</div>
							<span className="font-bold text-uenr-brown font-lato text-xl tracking-tight uppercase">
								Stars
							</span>
						</div>

						<button
							onClick={toggleSidebar}
							className="lg:hidden text-slate-400 p-1">
							<X size={24} />
						</button>
					</div>

					<nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
						{navItems.map((item) => {
							const Icon = item.icon;

							return (
								<NavItem
									key={item.href}
									icon={<Icon size={20} />}
									label={item.label}
									href={item.href}
								/>
							);
						})}
					</nav>

					<div className="pt-6 mt-6 border-t border-slate-100 shrink-0">
						<button
							onClick={handleLogout}
							className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-uenr-brown transition-colors font-bold font-lato text-sm uppercase tracking-wider">
							<LogOut size={20} /> Sign Out
						</button>
					</div>
				</div>
			</aside>

			<div className="flex-1 flex flex-col min-w-0 h-full">
				<header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 md:px-10 shrink-0 z-30">
					<div className="flex items-center gap-4">
						<button
							onClick={toggleSidebar}
							className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
							<Menu size={24} />
						</button>

						<h2 className="hidden md:block font-bold text-slate-800 font-lato text-lg">
							{pageTitle}
						</h2>
					</div>

					<div className="flex items-center gap-4">
						<div className="hidden sm:flex flex-col items-end mr-2">
							<span className="text-xs font-bold text-slate-900 font-lato uppercase">
								{user.first_name} {user.last_name}
							</span>

							<span className="text-[10px] text-slate-400 font-roboto">
								{role.toUpperCase()}
							</span>
						</div>

						<div className="w-10 h-10 rounded-xl bg-uenr-brown/5 border border-uenr-brown/10 flex items-center justify-center text-uenr-brown font-bold text-xs">
							{initials}
						</div>
					</div>
				</header>

				<main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#F8FAFC]">
					<div className="max-w-7xl mx-auto">{children}</div>
				</main>
			</div>
		</div>
	);
}

function NavItem({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
	const pathname = usePathname();
	const isActive = pathname === href || (href !== "/student" && pathname.startsWith(href));

	return (
		<Link
			href={href}
			className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold font-lato text-sm transition-all group 
                ${isActive
					? "bg-uenr-brown/10 text-uenr-brown shadow-sm"
					: "text-slate-500 hover:bg-slate-50 hover:text-uenr-brown"
				}`}
		>
			<span className={isActive ? "text-uenr-brown" : "text-slate-400 group-hover:text-uenr-brown"}>
				{icon}
			</span>
			<span className="tracking-tight">{label}</span>
		</Link>
	);
}
