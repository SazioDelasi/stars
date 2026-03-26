import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserProfile {
	id: string;
	index_number?: string;
	session?: string;
	fee_payment?: string;
	status?: string;
	level?: number;
	enrollment_year?: string;
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
