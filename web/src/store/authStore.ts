import { create } from "zustand";

interface User {
	username: string;
	role: string;
}

interface AuthState {
	user: User | null;
	accessToken: string | null;
	isAuthenticated: boolean;
	logout: () => void;
	login: (username: string, password: string) => Promise<void>;
	setAuth: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	accessToken: null,
	isAuthenticated: false,
	logout: () =>
		set({ user: null, accessToken: null, isAuthenticated: false }),
	login: async (username: string, password: string) => {
		// Simulate an API call for authentication
		const fakeApiCall = new Promise<{ user: User; token: string }>(
			(resolve) => {
				setTimeout(() => {
					resolve({
						user: { username, role: "student" },
						token: "fake-jwt-token",
					});
				}, 1000);
			},
		);

		const { user, token } = await fakeApiCall;
		set({ user, accessToken: token, isAuthenticated: true });
	},
	setAuth: (user: User, token: string) =>
		set({ user, accessToken: token, isAuthenticated: true }),
}));
