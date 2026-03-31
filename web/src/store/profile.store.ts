import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserProfile {
	id?: number;
	index_number?: string;
	programme?: Programme;
	level?: number;
	school?: string;
	department?: Department;
	enrollment_year?: number;
	session?: string;
	fee_payment?: string;
	status?: string;
	registration_status?: string;
	hometown?: string;
}

interface Programme {
	id?: number;
	department?: Department;
	name?: string;
	duration?: number;
	required_credit?: number;
	degree_type?: string;
	degree_level?: string;
}

interface Department {
	id?: number;
	name?: string;
	prefix?: string;
	hod?: Hod;
}

interface Hod {
	id?: number;
	name?: string;
	email?: string;
}

interface ProfileState {
	profile: UserProfile | null;
	setProfile: (profile: UserProfile) => void;
	clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
	persist(
		(set) => ({
			profile: null,
			setProfile: (profile) => set({ profile }),
			clearProfile: () => set({ profile: null }),
		}),
		{
			name: "profile-storage",
		},
	),
);
