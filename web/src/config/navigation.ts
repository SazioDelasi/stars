import {
	LayoutDashboard,
	BookOpen,
	Calendar,
	Map,
	FileText,
	CreditCard,
	Bell,
	User,
	FileBadge,
	LucideIcon,
} from "lucide-react";

export type NavItem = {
	label: string;
	href: string;
	icon: LucideIcon;
};

export type UserRole = "student" | "lecturer" | "hod";

export const navigation: Record<UserRole, NavItem[]> = {
	student: [
		{ label: "Dashboard", href: "/student", icon: LayoutDashboard },
		{ label: "Schedules", href: "/student/schedules", icon: Calendar },
		{ label: "Courses", href: "/student/courses", icon: BookOpen },
		{ label: "Results", href: "/student/results", icon: FileBadge },
		{ label: "Study Plan", href: "/student/study-plan", icon: Map },
		{ label: "Resources", href: "/student/resources", icon: FileText },
		{ label: "Fees & History", href: "/student/finance", icon: CreditCard },
		{ label: "Announcements", href: "/student/announcements", icon: Bell },
		{ label: "Profile", href: "/student/profile", icon: User },
	],

	lecturer: [
		{ label: "Dashboard", href: "/lecturer", icon: LayoutDashboard },
		{ label: "My Courses", href: "/lecturer/courses", icon: BookOpen },
		{ label: "Schedules", href: "/lecturer/schedules", icon: Calendar },
		{ label: "Grade Students", href: "/lecturer/grading", icon: FileBadge },
		{ label: "Resources", href: "/lecturer/resources", icon: FileText },
		{ label: "Profile", href: "/lecturer/profile", icon: User },
	],

	hod: [
		{ label: "Dashboard", href: "/hod", icon: LayoutDashboard },
		{ label: "Department", href: "/hod/department", icon: Map },
		{ label: "Course Assignments", href: "/hod/courses", icon: BookOpen },
		{ label: "Approve Results", href: "/hod/results", icon: FileBadge },
		{ label: "Announcements", href: "/hod/announcements", icon: Bell },
		{ label: "Profile", href: "/hod/profile", icon: User },
	],
};
