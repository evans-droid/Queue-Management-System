import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Bell, CheckCircle, 
  Phone, Mail, Clock, AlertCircle, LogOut,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getTodayQueue, callNextCustomer, markAsServed, getSocket } from '../services/api';

const AdminDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [calledCustomer, setCalledCustomer] = useState(null);
  const [stats, setStats] = useState({
    waiting: 0,
    notified: 0,
    served: 0,
    total: 0
  });

  useEffect(() => {
    fetchQueue();
    
    // Set up socket listeners
    const socket = getSocket();
    socket.emit('join-admin');
    
    socket.on('queueUpdated', (updatedQueue) => {
      setQueue(updatedQueue);
      updateStats(updatedQueue);
      toast.success('Queue updated!', { icon: '🔄' });
    });
    
    socket.on('customerCalled', (customer) => {
      setCalledCustomer(customer);
      updateStats(queue);
      // Play notification sound
      new Audio('/notification.mp3').play().catch(() => {});
    });
    
    return () => {
      socket.off('queueUpdated');
      socket.off('customerCalled');
    };
  }, []);

  const updateStats = (queueData) => {
    setStats({
      waiting: queueData.filter(c => c.status === 'waiting').length,
      notified: queueData.filter(c => c.status === 'notified').length,
      served: queueData.filter(c => c.status === 'served').length,
      total: queueData.length
    });
  };

  const fetchQueue = async () => {
    try {
      const data = await getTodayQueue();
      setQueue(data);
      updateStats(data);
    } catch (error) {
      toast.error('Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      const result = await callNextCustomer();
      toast.success(`Called: ${result.customer.full_name}`);
    } catch (error) {
      toast.error(error.error || 'Failed to call next customer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkServed = async (customerId) => {
    setActionLoading(true);
    try {
      await markAsServed(customerId);
      toast.success('Customer marked as served');
    } catch (error) {
      toast.error('Failed to mark as served');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary-600">
          Admin Dashboard
        </h1>
        <button
          onClick={fetchQueue}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Called Customer Alert */}
      <AnimatePresence>
        {calledCustomer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-green-50 border-2 border-green-200 rounded-xl p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-100 rounded-full p-3">
                <Bell className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-700">
                  Customer Called Successfully!
                </h3>
                <p className="text-green-600">
                  {calledCustomer.full_name} (Queue #{calledCustomer.queue_number}) has been notified.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCalledCustomer(null)}
              className="text-green-600 hover:text-green-700"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-primary-50 to-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Today</p>
              <p className="text-3xl font-bold text-primary-600">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-primary-400" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-blue-50 to-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Waiting</p>
              <p className="text-3xl font-bold text-blue-600">{stats.waiting}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-yellow-50 to-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Notified</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.notified}</p>
            </div>
            <Bell className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-green-50 to-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Served</p>
              <p className="text-3xl font-bold text-green-600">{stats.served}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCallNext}
          disabled={actionLoading || stats.waiting === 0}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-lg"
        >
          {actionLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Call Next Customer
              {stats.waiting > 0 && (
                <span className="bg-white text-primary-600 px-2 py-1 rounded-full text-sm">
                  {stats.waiting} waiting
                </span>
              )}
            </>
          )}
        </motion.button>
      </div>

      {/* Queue Table */}
      <div className="card overflow-hidden">
        <h3 className="text-xl font-semibold text-primary-600 mb-4">
          Queue Management
        </h3>
        
        {queue.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No customers in queue today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary-50">
                  <th className="text-left py-3 px-4 text-gray-600">Queue #</th>
                  <th className="text-left py-3 px-4 text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 text-gray-600">Contact</th>
                  <th className="text-left py-3 px-4 text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600">Position</th>
                  <th className="text-left py-3 px-4 text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-b border-primary-50 hover:bg-primary-50/50 transition-colors ${
                      customer.status === 'notified' ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold">
                      #{customer.queue_number}
                    </td>
                    <td className="py-3 px-4">{customer.full_name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <a href={`mailto:${customer.email}`} className="text-primary-600 hover:text-primary-700">
                          <Mail className="w-4 h-4" />
                        </a>
                        <a href={`tel:${customer.phone}`} className="text-primary-600 hover:text-primary-700">
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        customer.status === 'waiting' ? 'bg-primary-100 text-primary-700' :
                        customer.status === 'notified' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {customer.status === 'waiting' ? (
                        <span className="font-semibold text-primary-600">
                          #{customer.position}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {customer.status === 'notified' && (
                        <button
                          onClick={() => handleMarkServed(customer.id)}
                          disabled={actionLoading}
                          className="text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;