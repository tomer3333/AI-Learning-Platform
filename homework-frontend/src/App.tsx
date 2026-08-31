import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import StudentsPage from './pages/StudentsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import CreatePage from './pages/CreatePage';
import AddStudentPage from './pages/AddStudentPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        {/* Route /  — Student roster / CRM home */}
        <Route path="/" element={<StudentsPage />} />

        {/* Route /students/new — Add new student form (must come before :id) */}
        <Route path="/students/new" element={<AddStudentPage />} />

        {/* Route /students/:id — Student profile with payment & homework history */}
        <Route path="/students/:id" element={<StudentProfilePage />} />

        {/* Route /create?studentId=... — Homework generation wizard */}
        <Route path="/create" element={<CreatePage />} />
      </Routes>
    </AppShell>
  );
}
