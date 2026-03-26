import { useAuthStore } from "@/store/authStore";
import axios from "axios";
import { refreshAccessToken } from "./auth";

export const api = axios.create({
	baseURL:
		process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true, // Include cookies in requests
});

api.interceptors.request.use((config) => {
	const token = useAuthStore.getState().accessToken;
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (
			error.response?.status === 401 &&
			!originalRequest._retry &&
			!originalRequest.url.includes("/auth/refresh")
		) {
			originalRequest._retry = true;

			const newToken = await refreshAccessToken();
			if (newToken) {
				useAuthStore.getState().setAuth(
					useAuthStore.getState().user!,
					newToken,
				);
				originalRequest.headers.Authorization = `Bearer ${newToken}`;
				return api(originalRequest);
			}
		}

		return Promise.reject(error);
	}
);