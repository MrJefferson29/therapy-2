import React, { createContext, useContext, useState, useCallback } from 'react';
import Loader from './Loader';

const LoaderContext = createContext({
  showLoader: (msg) => {},
  hideLoader: () => {},
});

export function LoaderProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const showLoader = useCallback((msg) => {
    setMessage(msg || '');
    setVisible(true);
  }, []);

  const hideLoader = useCallback(() => {
    setVisible(false);
    setMessage('');
  }, []);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      <Loader visible={visible} message={message} />
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  return useContext(LoaderContext);
} 