import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import CaseList from './pages/CaseList';
import CaseDetail from './pages/CaseDetail';
import CaseForm from './pages/CaseForm';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import { useAuth } from './contexts/AuthContext';
import './index.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const { isAuthenticated } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCollapse = () => {
    const newValue = !sidebarCollapsed;
    setSidebarCollapsed(newValue);
    localStorage.setItem('sidebarCollapsed', String(newValue));
  };

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="app-layout">
                <Sidebar 
                  isOpen={sidebarOpen} 
                  toggleSidebar={toggleSidebar}
                  isCollapsed={sidebarCollapsed}
                  toggleCollapse={toggleCollapse}
                />
                
                <div className="app-main">
                  <Topbar toggleSidebar={toggleSidebar} />
                  
                  <main className="app-content">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/cases" element={<CaseList />} />
                      <Route path="/cases/new" element={<CaseForm />} />
                      <Route path="/cases/:id" element={<CaseDetail />} />
                      <Route path="/cases/:id/edit" element={<CaseForm />} />
                      <Route 
                        path="/users" 
                        element={
                          <ProtectedRoute requireAdmin={true}>
                            <UserManagement />
                          </ProtectedRoute>
                        } 
                      />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

