/**
 * API Service
 * Handles all HTTP requests to the backend
 */
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Socket.io connection
let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to socket server');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      toast.error('Real-time connection lost. Page will auto-refresh.');
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

// API endpoints
export const registerCustomer = async (customerData) => {
  try {
    const response = await api.post('/register', customerData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getTodayQueue = async () => {
  try {
    const response = await api.get('/queue');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const callNextCustomer = async () => {
  try {
    const response = await api.post('/queue/next');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const markAsServed = async (customerId) => {
  try {
    const response = await api.post(`/queue/${customerId}/served`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export default api;
