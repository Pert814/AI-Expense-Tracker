import axios from 'axios';
import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(
    async (config) => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            // 每次打 API 前，跟 Firebase SDK 要「目前有效」的 Token
            // SDK 會自動判斷快過期就在背景換發新的，這裡拿到的永遠是可用的
            const token = await currentUser.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
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
