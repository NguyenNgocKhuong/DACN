import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getStocks = () => api.get('/stocks');
export const getStockDetail = (symbol) => api.get(`/stocks/${symbol}`);
export const predictTrend = (symbol) => api.post(`/stocks/predict`, { symbol });

// Auth & Users
export const loginUser = (credentials) => api.post('/users/login', credentials);
export const registerUser = (credentials) => api.post('/users/signup', credentials);
export const getAllUsers = () => api.get('/users');
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const getUserWallet = (username) => api.get(`/users/${username}/wallet`);
export const updateUserBalance = (userId, balance) => api.put(`/users/${intToId(userId)}/balance`, { balance });
export const transferMoney = (payload) => api.post('/users/transfer', payload);

const intToId = (id) => id; // Helper for readability
export const getMessages = (u1, u2) => api.get(`/messages/${u1}/${u2}`);
export const sendMessage = (payload) => api.post('/messages', payload);
export const getUnreadCount = (username) => api.get(`/messages/unread/${username}`);
export const markMessagesAsRead = (sender, receiver) => api.post(`/messages/mark_read/${sender}/${receiver}`);

export default api;
