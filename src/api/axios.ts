import axios from "axios";

const api = axios.create({
  baseURL: "https://be-focused.onrender.com/focused-connect",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
