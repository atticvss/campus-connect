import { useState, useEffect, createContext, useContext } from 'react';

const ToastContext = createContext(null);

let globalShowToast = () => {};

export function useToast() {
  return useContext(ToastContext);
}

export function showToast(msg) {
  globalShowToast(msg);
}

export default function Toast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    globalShowToast = (msg) => {
      setMessage(msg);
      setVisible(true);
      setTimeout(() => setVisible(false), 3000);
    };
  }, []);

  return (
    <div className={`success-toast ${visible ? 'show' : ''}`}>
      <i className="fas fa-check-circle"></i>
      <span>{message}</span>
    </div>
  );
}
