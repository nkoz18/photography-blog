import axios from "axios";
import { auth } from "@strapi/helper-plugin";

/**
 * Axios instance for making API requests from the admin panel
 * Used for various API requests that need authentication
 */
const instance = axios.create({
  baseURL: "",
});

instance.interceptors.request.use(
  async (config) => {
    const token = auth.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      auth.clearAppStorage();
      window.location.reload();
    }

    return Promise.reject(error);
  }
);

export default instance;
