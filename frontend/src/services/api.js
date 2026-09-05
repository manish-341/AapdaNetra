import axios from "axios";
import { getAuthToken } from "../lib/auth";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// Interceptor to inject JWT token
API.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Auth APIs
export const loginUser = (credentials) => API.post("/users/login", credentials);
export const registerUser = (data) => API.post("/users/register", data);
export const getMe = () => API.get("/users/me");
export const googleDirectLogin = (data) => API.post("/auth/google-direct", data);

// Core Entity APIs
export const getHabitations = () => API.get("/habitations");
export const getHazards = () => API.get("/hazards");
export const getShelters = () => API.get("/shelters");
export const updateShelter = (id, data) => API.put(`/shelters/${id}`, data);
export const getAlerts = () => API.get("/alerts");
export const dispatchEmergencyAlert = (data) => API.post("/alerts/dispatch-emergency", data);
export const broadcastEmergencyAlert = (data) => API.post("/alerts/broadcast-emergency", data);
export const getRisks = () => API.get("/risks");
export const getRelocations = () => API.get("/relocations");
export const getCrowdObservations = () => API.get("/crowd");
export const getUsers = () => API.get("/users");
export const getUserById = (id) => API.get(`/users/${id}`);
export const createUser = (user) => API.post("/users", user);
export const updateUser = (id, user) => API.put(`/users/${id}`, user);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// AI & Intelligence APIs
export const postAIChat = (data) => API.post("/ai/chat", data);
export const postAICopilot = (data) => API.post("/ai/copilot", data);
export const postAIExplain = (data) => API.post("/ai/explain", data);
export const getAIRiskAssessment = (lat, lon) => API.get(`/ai/risk?latitude=${lat}&longitude=${lon}`);
export const getAISummary = (hours = 2) => API.get(`/ai/summary?hours=${hours}`);

// Citizen Reports APIs
export const submitCitizenReport = (data) => API.post("/reports/citizen", data);
export const getCitizenReports = (params = {}) => API.get("/reports/citizen", { params });
export const verifyCitizenReport = (id, data) => API.put(`/reports/citizen/${id}/verify`, data);
export const resolveCitizenReport = (id) => API.put(`/reports/citizen/${id}/resolve`);

// Intelligence APIs
export const getDashboardStats = (params = {}) => API.get("/intelligence/dashboard", { params });
export const getWeather = (lat, lon) => API.get(`/intelligence/weather?latitude=${lat}&longitude=${lon}`);
export const getForecast = (lat, lon, indicator = "FLOOD_RISK") => API.get(`/intelligence/forecast?latitude=${lat}&longitude=${lon}&indicator=${indicator}`);
export const getShelterRecommendation = (lat, lon, district = "") => API.get(`/intelligence/shelters/recommend?latitude=${lat}&longitude=${lon}${district ? `&district=${encodeURIComponent(district)}` : ''}`);
export const getEvacuationPlan = (data) => API.post("/intelligence/evacuation", data);
export const getEvacuationRoutes = () => API.get("/intelligence/evacuation-routes");
export const runSimulation = (data) => API.post("/intelligence/simulation", data);
export const setDistrictLocation = (data) => API.post("/intelligence/set-district", data);

export default API;