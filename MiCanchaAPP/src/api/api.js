
import axios from "axios";

// Dirección del backend según el entorno.
const servidor =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

// Evitar barras finales y duplicar /api.
const url = servidor.replace(/\/+$/, "");

const baseURL = url.endsWith("/api")
  ? url
  : `${url}/api`;

// Configuración central de Axios.
const API = axios.create({
  baseURL,
});

// Agregar el token cuando exista una sesión.
API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default API;
