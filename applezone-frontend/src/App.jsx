import React, { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import useAuthStore from './store/useAuthStore';
import './App.css';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="App">
      <AppRoutes />
    </div>
  );
}

export default App;
