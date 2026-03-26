import { useAuthStore } from "@/store/authStore";
import { api } from "./axios";

export async function refreshAccessToken() {
	try {
		const response = await api.post("/auth/refresh");
		const newAccess = response.data.accessToken;

		const payload = JSON.parse(atob(newAccess.split(".")[1]));
		const user = {
			username: payload.username,
			role: payload.role,
		};

		useAuthStore.getState().setAuth(user, newAccess);

		return newAccess;
	} catch (error) {
		console.error("Failed to refresh access token:", error);
		useAuthStore.getState().logout();
		return null;
	}
}

export async function login(credentials: { username: string; password: string }) {
	const response = await api.post("/auth/login", credentials);
	const { accessToken } = response.data;

	const payload = JSON.parse(atob(accessToken.split(".")[1]));
	const user = {
		username: payload.username,
		role: payload.role,
	};

	useAuthStore.getState().setAuth(user, accessToken);

	return accessToken;
}