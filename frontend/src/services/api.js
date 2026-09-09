import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    verifyRoom: (data) => api.post('/auth/verify-room', data), // { room_code, invite_code }
    joinRoom: (data) => api.post('/auth/join-room', data), // { room_code, invite_code, name, username, password, phone_number }
    login: (data) => api.post('/auth/login', data), // { room_code, username, password }
    getProfile: () => api.get('/auth/me')
};

export const personalAuthService = {
    register: (data) => api.post('/personal-auth/register', data), // { name, email, password }
    login: (data) => api.post('/personal-auth/login', data) // { email, password }
};

export const roomService = {
    create: (data) => api.post('/rooms', data), // { room_name, name, username, password, phone_number }
    getSettings: (id) => api.get(`/rooms/${id}`),
    update: (id, data) => api.put(`/rooms/${id}`, data)
};

export const memberService = {
    getAll: () => api.get('/members'),
    getById: (id) => api.get(`/members/${id}`),
    create: (data) => api.post('/members', data),
    update: (id, data) => api.put(`/members/${id}`, data),
    delete: (id) => api.delete(`/members/${id}`)
};

export const expenseService = {
    getAll: (params) => api.get('/expenses', { params }),
    getById: (id) => api.get(`/expenses/${id}`),
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`)
};

export const settlementService = {
    getAll: () => api.get('/settlements'),
    getRecommendations: (params) => api.get('/settlements/recommendations', { params }),
    create: (data) => api.post('/settlements', data),
    delete: (id) => api.delete(`/settlements/${id}`)
};

export const dashboardService = {
    getMySummary: (params) => api.get('/dashboard/my-summary', { params }),
    getRoomSummary: (params) => api.get('/dashboard/room-summary', { params })
};

export const reportService = {
    getMonthly: () => api.get('/reports/monthly-trend'),
    getCategory: (params) => api.get('/reports/category-breakdown', { params }),
    getMembers: (params) => api.get('/reports/member-spending', { params })
};

export const personalMoneyService = {
    getSummary: (params) => api.get('/personal-money/summary', { params }),
    getTransactions: (params) => api.get('/personal-money/transactions', { params }),
    addIncome: (data) => api.post('/personal-money/income', data),
    addExpense: (data) => api.post('/personal-money/expense', data),
    getCategories: () => api.get('/personal-money/categories'),
    updateTransaction: (id, data) => api.put(`/personal-money/transactions/${id}`, data),
    deleteTransaction: (id) => api.delete(`/personal-money/transactions/${id}`)
};

export default api;
