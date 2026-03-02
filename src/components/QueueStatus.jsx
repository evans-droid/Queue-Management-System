import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, UserCheck, Phone, Mail } from 'lucide-react';
import { getTodayQueue, getSocket } from '../services/api';

const QueueStatus = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentServing, setCurrentServing] = useState(null);

  useEffect(() => {
    fetchQueue();
    
    // Set up socket listeners for real-time updates
    const socket = getSocket();
    
    socket.on('queueUpdated', (updatedQueue) => {
      setQueue(updatedQueue);
    });
    
    socket.on('customerCalled', (customer) => {
      setCurrentServing(customer);
      // Auto-hide after 5 seconds
      setTimeout(() => setCurrentServing(null), 5000);
    });
    
    return () => {
      socket.off('queueUpdated');
      socket.off('customerCalled');
    };
  }, []);

  const fetchQueue = async () => {
    try {
      const data = await getTodayQueue();
      setQueue(data);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const waitingCount = queue.filter(c => c.status === 'waiting').length;
  const notifiedCount = queue.filter(c => c.status === 'notified').length;
  const servedCount = queue.filter(c => c.status === 'served').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Serving Alert */}
      <AnimatePresence>
        {currentServing && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Now Serving</p>
                <p className="font-semibold text-green-700">
                  {currentServing.full_name} - Queue #{currentServing.queue_number}
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentServing(null)}
              className="text-green-600 hover:text-green-700"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-primary-50 to-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Waiting</p>
              <p className="text-3xl font-bold text-primary-600">{waitingCount}</p>
            </div>
            <div className="bg-primary-100 rounded-full p-3">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-yellow-50 to-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Notified</p>
              <p className="text-3xl font-bold text-yellow-600">{notifiedCount}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-green-50 to-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Served</p>
              <p className="text-3xl font-bold text-green-600">{servedCount}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Queue List */}
      <div className="card overflow-hidden">
        <h3 className="text-xl font-semibold text-primary-600 mb-4">
          Today's Queue
        </h3>
        
        {queue.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No customers in queue today
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-primary-100">
                  <th className="text-left py-3 px-4 text-gray-600">Queue #</th>
                  <th className="text-left py-3 px-4 text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 text-gray-600">Contact</th>
                  <th className="text-left py-3 px-4 text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600">Position</th>
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
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <Phone className="w-4 h-4 text-gray-400" />
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

export default QueueStatus;