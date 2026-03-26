export enum UserRole {
	STUDENT = "STUDENT",
	LECTURER = "LECTURER",
	ADMIN = "ADMIN",
	REGISTRAR = "REGISTRAR",
	HOD = "HOD",
	DEAN = "DEAN",
	EXAM_OFFICER = "EXAM_OFFICER",
	FINANCE_OFFICER = "FINANCE_OFFICER",
}

export interface Department {
	id: string;
	name: string;
}

export interface User {
	id: string;
	indexNumber?: string;
	name: string;
	staffId?: string;
	role: UserRole;
	personalInfo: {
		lastName: string;
		otherNames: string;
		email: string;
		phone: string;
		avatarUrl?: string;
		biometricId?: string;
	};
	academicContext: {
		department: Department;
		programmeId?: string;
		level?: 100 | 200 | 300 | 400 | 500 | 600;
		enrolledSemesters: string[];
	};
	status: "ACTIVE" | "DEFERRED" | "GRADUATED" | "ON_LEAVE";
}

export interface Student extends User {
	role: UserRole.STUDENT;
	finance: {
		totalOwed: number;
		totalPaid: number;
		paymentHistory: Transaction[];
	};
	academicRecords: {
		cgpa: number;
		creditsEarned: number;
		transcript: GradeRecord[];
	};
}

export interface Lecturer extends User {
	role: UserRole.LECTURER;
	assignedCourses: string[]; // Course Codes: ["CSC301", "CSC303"]
	researchInterests: string[];
	officeHours: string;
}

export interface Admin extends User {
	role: UserRole.ADMIN;
	permissions: (
		| "MANAGE_USERS"
		| "APPROVE_GRADES"
		| "FINANCE_OVERRIDE"
		| "SYSTEM_CONFIG"
	)[];
}
