import React, { createContext, useState } from 'react';

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alertMsg, setAlertMsg] = useState('');

  const showAlert = (message, duration = 3000) => {
    setAlertMsg(message);
    setTimeout(() => setAlertMsg(''), duration);
  };

  return (
    <AlertContext.Provider value={{ alertMsg, showAlert }}>
      {alertMsg && <div className="alert-banner">{alertMsg}</div>}
      {children}
    </AlertContext.Provider>
  );
};
