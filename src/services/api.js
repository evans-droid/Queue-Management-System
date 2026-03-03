/**
 * API Service
 * Handles all HTTP requests to the backend
 */
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

// Use direct backend URL in production to avoid Netlify redirect issues
// Use localhost:3001 in development
const API_URL = import.meta.env.PROD 
  ? 'https://queue-management-system-vp5s.onrender.com/api' 
  : 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Socket.io connection
let socket = null;

// Backend URL - connect directly to Render in production
const SOCKET_URL = import.meta.env.PROD 
  ? 'https://queue-management-system-vp5s.onrender.com'
  : 'http://localhost:3001';

export const initializeSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      path: '/socket.io'
    });

    socket.on('connect', () => {
      console.log('✅ Connected to socket server');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
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
