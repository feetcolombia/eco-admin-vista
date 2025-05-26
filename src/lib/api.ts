import axios from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/rest/V1`,
  headers: {
    "Content-Type": "application/json",
  },
}); 