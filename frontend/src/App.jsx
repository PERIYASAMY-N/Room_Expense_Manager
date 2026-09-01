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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
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

          {/* Catch-all route to redirect any unknown paths */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
