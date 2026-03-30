import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { isLoggedIn } from './api';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import QuestionsPage from './pages/QuestionsPage';
import EntriesPage from './pages/EntriesPage';
import MeetingsPage from './pages/MeetingsPage';
import BugReportsPage from './pages/BugReportsPage';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [authed, setAuthed] = useState(isLoggedIn());

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar onLogout={() => setAuthed(false)} />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/entries" element={<EntriesPage />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/bug-reports" element={<BugReportsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
