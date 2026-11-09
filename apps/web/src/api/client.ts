import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach Access Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('teamos_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const activeWorkspaceId = localStorage.getItem('teamos_active_workspace_id');
    if (activeWorkspaceId) {
      config.headers['x-workspace-id'] = activeWorkspaceId;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Intercept responses to handle 401 and attempt refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('teamos_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken;

          localStorage.setItem('teamos_access_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('teamos_refresh_token', newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          // Token refresh failed - clear tokens
          localStorage.removeItem('teamos_access_token');
          localStorage.removeItem('teamos_refresh_token');
          localStorage.removeItem('teamos_user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('teamos_access_token');
        localStorage.removeItem('teamos_user');
      }
    }

    return Promise.reject(error);
  },
);

