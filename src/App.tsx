import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import OrgChart from './pages/OrgChart';
import AttendanceView from './pages/AttendanceView';
import Members from './pages/Members';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/org" replace />} />
          <Route path="/org" element={<OrgChart />} />
          <Route path="/attendance" element={<AttendanceView />} />
          <Route path="/members" element={<Members />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
