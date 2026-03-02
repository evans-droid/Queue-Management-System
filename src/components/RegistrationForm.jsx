import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerCustomer, getSocket } from '../services/api';

const RegistrationForm = ({ onRegistrationSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [registeredCustomer, setRegisteredCustomer] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await registerCustomer(formData);
      
      // Emit socket event for real-time update
      const socket = getSocket();
      socket.emit('new-registration', result);
      
      setRegisteredCustomer(result.customer);
      toast.success('Registration successful! Check your email/SMS.');
      
      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: ''
      });

      // Notify parent component
      if (onRegistrationSuccess) {
        onRegistrationSuccess(result.customer);
      }
    } catch (error) {
      toast.error(error.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {registeredCustomer ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-primary-600 mb-4">
              Registration Successful!
            </h2>
            
            <div className="bg-primary-50 rounded-xl p-6 mb-6">
              <p className="text-gray-600 mb-2">Your Queue Number</p>
              <p className="text-5xl font-bold text-primary-600 mb-4">
                #{registeredCustomer.queue_number}
              </p>
              <p className="text-gray-600">
                Position: <span className="font-semibold text-primary-600">{registeredCustomer.position}</span>
              </p>
            </div>
            
            <p className="text-gray-500 mb-6">
              You'll receive notifications via email and SMS when it's your turn.
            </p>
            
            <button
              onClick={() => setRegisteredCustomer(null)}
              className="btn-primary"
            >
              Register Another Person
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card"
          >
            <h2 className="text-3xl font-bold text-primary-600 mb-2">
              Join the Queue
            </h2>
            <p className="text-gray-500 mb-8">
              Fill in your details to get your queue number
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="Kwaku Gyasi"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="Kwaku@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="+xxxxxxxxxxxx"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Get Queue Number
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegistrationForm;