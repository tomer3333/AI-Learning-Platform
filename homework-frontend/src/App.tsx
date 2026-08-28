import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import StudentsPage from './pages/StudentsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import CreatePage from './pages/CreatePage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        {/* Route /  — Student roster / CRM home */}
        <Route path="/" element={<StudentsPage />} />

        {/* Route /students/:id — Student profile with payment & homework history */}
        <Route path="/students/:id" element={<StudentProfilePage />} />

        {/* Route /create?studentId=... — Homework generation wizard */}
        <Route path="/create" element={<CreatePage />} />
      </Routes>
    </AppShell>
  );
}
