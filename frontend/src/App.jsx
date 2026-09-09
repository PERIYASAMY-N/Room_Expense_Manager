import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/expenses" element={<Expenses />} />
              <Route path="/dashboard/expenses/add" element={<AddExpense />} />
              <Route path="/dashboard/expenses/:id" element={<ExpenseDetails />} />
              <Route path="/dashboard/expenses/:id/edit" element={<AddExpense />} />
              <Route path="/dashboard/settlements" element={<Settlements />} />
              <Route path="/dashboard/my-money" element={<MyMoney />} />
              <Route path="/dashboard/my-money/add-income" element={<AddPersonalTransaction />} />
              <Route path="/dashboard/my-money/add-expense" element={<AddPersonalTransaction />} />
              
              <Route element={<AdminRoute />}>
                <Route path="/dashboard/members" element={<Members />} />
              </Route>
            </Route>
          </Route>

          {/* Personal Only User Routes */}
          <Route element={<ProtectedRoute allowedAccountType="PERSONAL" />}>
            <Route element={<PersonalLayout />}>
              <Route path="/personal/dashboard" element={<PersonalDashboard />} />
              <Route path="/personal/add-income" element={<AddPersonalTransaction />} />
              <Route path="/personal/add-expense" element={<AddPersonalTransaction />} />
            </Route>
          </Route>

          {/* Catch-all route to redirect any unknown paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
