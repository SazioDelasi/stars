import { Department, User } from "./user";

export interface Announcement {
	id: number;
	title: string;
	excerpt: string;
	tag: "Urgent" | "Finance" | "Event" | "Academic" | "General";
	targetAudience?: "STUDENTS" | "LECTURERS" | "STAFF" | null;
	createdAt: Date;
	updatedAt?: Date;
	pinned: boolean;
	author: User | Department;
	targetActions?: {
		type: "LINK" | "PAGE";
		value: string;
	} | null;
}
