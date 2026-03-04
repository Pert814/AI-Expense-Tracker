import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create an axios instance with base URL
const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to include the JWT token in every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // If the error status is 401 (Unauthorized), the token might be expired or invalid
        if (error.response && error.response.status === 401) {
            // Dispatch a custom event to notify the App component
            window.dispatchEvent(new CustomEvent('auth-error'));
        }
        return Promise.reject(error);
    }
);

// API methods
export const expenseService = {
    getAll: () => api.get('/expense'),
    create: (data) => api.post('/expense/create', data),
    update: (id, data) => api.put(`/expense/${id}`, data),
    delete: (id) => api.delete(`/expense/${id}`),
    parse: (text) => api.post('/parse_expense', { text }),
};

export const authService = {
    login: (idToken) => api.post('/auth/google', { id_token: idToken }),
};

export const userService = {
    getInfo: () => api.get('/user_data'),
    update: (data) => api.put('/user_data', data),
};

export default api;
