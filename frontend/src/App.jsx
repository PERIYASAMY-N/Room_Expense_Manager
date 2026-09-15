import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import RoomLayout from './layouts/RoomLayout';

// Pages - Auth
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';

// Pages - Personal
import PersonalDashboard from './pages/PersonalDashboard';
import PersonalExpenses from './pages/PersonalExpenses';

// Pages - Rooms List
import RoomsList from './pages/RoomsList';
import CreateJoinRoom from './pages/CreateJoinRoom';

// Pages - Inside Room
import RoomDashboard from './pages/room/RoomDashboard';
import MyRoomDashboard from './pages/room/MyRoomDashboard';
import RoomExpenses from './pages/room/RoomExpenses';
import RoomSettlements from './pages/room/RoomSettlements';
import RoomMembers from './pages/room/RoomMembers';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/personal" element={<PersonalDashboard />} />
              <Route path="/personal/expenses" element={<PersonalExpenses />} />
              <Route path="/rooms" element={<RoomsList />} />
              <Route path="/rooms/new" element={<CreateJoinRoom />} />
            </Route>

            <Route path="/rooms/:roomId" element={<RoomLayout />}>
              <Route index element={<RoomDashboard />} />
              <Route path="my-dashboard" element={<MyRoomDashboard />} />
              <Route path="expenses" element={<RoomExpenses />} />
              <Route path="settlements" element={<RoomSettlements />} />
              <Route path="members" element={<RoomMembers />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
