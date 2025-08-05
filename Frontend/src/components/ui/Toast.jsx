"use client"

import React, { useState, useEffect, createContext, useContext } from 'react';

// Create a context for the toast
const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-dismiss after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ message, type, onDismiss }) {
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }[type] || 'bg-gray-500';

  return (
    <div 
      className={`${bgColor} text-white px-4 py-2 rounded-md shadow-lg flex items-center justify-between min-w-[200px]`}
    >
      <span>{message}</span>
      <button 
        onClick={onDismiss}
        className="ml-2 text-white hover:text-gray-200"
      >
        &times;
      </button>
    </div>
  );
}

// Custom hook to use the toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}