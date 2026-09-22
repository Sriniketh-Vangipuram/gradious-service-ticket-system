import axios from "axios";

export const refreshClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});