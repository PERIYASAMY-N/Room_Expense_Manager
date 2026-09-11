import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import Welcome from './pages/Welcome';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import Login from './pages/Login';

import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Expenses from './pages/Expenses';
import AddExpense from './pages/AddExpense';
import ExpenseDetails from './pages/ExpenseDetails';
import Settlements from './pages/Settlements';
import MyMoney from './pages/MyMoney';
import AddPersonalTransaction from './pages/AddPersonalTransaction';

import PersonalLogin from './pages/PersonalLogin';
import PersonalRegister from './pages/PersonalRegister';
import PersonalLayout from './layouts/PersonalLayout';
import PersonalDashboard from './pages/PersonalDashboard';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/create-room" element={<CreateRoom />} />
            <Route path="/join-room" element={<JoinRoom />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/personal/login" element={<PersonalLogin />} />
            <Route path="/personal/register" element={<PersonalRegister />} />
            
            {/* Room User Routes */}
            <Route element={<ProtectedRoute allowedAccountType="ROOM" />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/dashboard/expenses" element={<ErrorBoundary><Expenses /></ErrorBoundary>} />
                <Route path="/dashboard/expenses/add" element={<ErrorBoundary><AddExpense /></ErrorBoundary>} />
                <Route path="/dashboard/expenses/:id" element={<ErrorBoundary><ExpenseDetails /></ErrorBoundary>} />
                <Route path="/dashboard/expenses/:id/edit" element={<ErrorBoundary><AddExpense /></ErrorBoundary>} />
                <Route path="/dashboard/settlements" element={<ErrorBoundary><Settlements /></ErrorBoundary>} />
                <Route path="/dashboard/my-money" element={<ErrorBoundary><MyMoney /></ErrorBoundary>} />
                <Route path="/dashboard/my-money/add-income" element={<ErrorBoundary><AddPersonalTransaction /></ErrorBoundary>} />
                <Route path="/dashboard/my-money/add-expense" element={<ErrorBoundary><AddPersonalTransaction /></ErrorBoundary>} />
                
                <Route element={<AdminRoute />}>
                  <Route path="/dashboard/members" element={<ErrorBoundary><Members /></ErrorBoundary>} />
                </Route>
              </Route>
            </Route>

            {/* Personal Only User Routes */}
            <Route element={<ProtectedRoute allowedAccountType="PERSONAL" />}>
              <Route element={<PersonalLayout />}>
                <Route path="/personal/dashboard" element={<ErrorBoundary><PersonalDashboard /></ErrorBoundary>} />
                <Route path="/personal/add-income" element={<ErrorBoundary><AddPersonalTransaction /></ErrorBoundary>} />
                <Route path="/personal/add-expense" element={<ErrorBoundary><AddPersonalTransaction /></ErrorBoundary>} />
              </Route>
            </Route>

            {/* Catch-all route to redirect any unknown paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
