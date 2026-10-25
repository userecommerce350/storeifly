import axios from "axios";
import { authClient } from "../auth";

export const NEON_FUNCTIONS_URL = import.meta.env.VITE_NEON_FUNCTIONS_URL || import.meta.env.VITE_PUBLIC_API_URL;

export const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:3000",
    headers: {
        "Content-Type": "application/json",
    },
});

const isPublicReadRequest = (method?: string, url?: string) =>
    (!method || method.toLowerCase() === "get") &&
    (url?.startsWith("/api/products") ||
        url?.startsWith("/api/stores/slug/") ||
        url?.startsWith("/api/stores/public/featured"));

api.interceptors.request.use(async (config) => {
    // Route public product & store requests to Neon Functions if URL is configured
    if (NEON_FUNCTIONS_URL && isPublicReadRequest(config.method, config.url)) {
        config.baseURL = NEON_FUNCTIONS_URL;
    }

    let token = localStorage.getItem("storeifly_token");
    if (!token && !isPublicReadRequest(config.method, config.url)) {
        const sessionRes = await authClient.getSession();
        token = sessionRes.data?.session?.token || null;
        if (token) {
            localStorage.setItem("storeifly_token", token);
        }
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
