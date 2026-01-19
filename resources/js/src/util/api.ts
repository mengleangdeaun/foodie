import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403) {
            // Automatically redirect to the unauthorized page
            window.location.href = '/admin/unauthorized';
        }
        
        if (error.response?.status === 401) {
            // Handle expired sessions
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;