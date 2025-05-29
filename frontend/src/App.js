// /home/huyen/handmade-store/frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;