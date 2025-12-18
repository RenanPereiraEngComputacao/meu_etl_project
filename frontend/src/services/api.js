import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
  timeout: 20000,
});

// Interceptor global
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const org = localStorage.getItem("selectedOrg");

    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (org) {
      config.headers["x-organization"] = org;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
