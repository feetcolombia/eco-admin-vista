import axios from "axios";

export const api = axios.create({
  baseURL: "https://stg.feetcolombia.com/rest/V1",
  headers: {
    "Content-Type": "application/json",
  },
}); 