import { lazy, Suspense, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { isLoggedIn } from "./api";
import LoginPage from "./pages/LoginPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import UsersPage from "./pages/UsersPage";
import QuestionsPage from "./pages/QuestionsPage";
import EntriesPage from "./pages/EntriesPage";
import MeetingsPage from "./pages/MeetingsPage";
import WebinarsPage from "./pages/WebinarsPage";
import BugReportsPage from "./pages/BugReportsPage";
import VideosPage from "./pages/VideosPage";
import ChallengesPage from "./pages/ChallengesPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import BooksPage from "./pages/BooksPage";
import Sidebar from "./components/Sidebar";
import "./App.css";
import "./neutral.css";
const DashboardPage = lazy(() => import("./pages/AnalyticsDashboard"));

function App() {
  const [authed, setAuthed] = useState(isLoggedIn());

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  return (
    <BrowserRouter>
      <PanelLayout onLogout={() => setAuthed(false)}>
        <Suspense
          fallback={
            <div className="page-loading" role="status">
              Se încarcă pagina…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/entries" element={<EntriesPage />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/webinars" element={<WebinarsPage />} />
            <Route path="/bug-reports" element={<BugReportsPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route
              path="*"
              element={
                <div className="page">
                  <div className="page-header">
                    <h1>Pagina nu există</h1>
                    <p>
                      Poți reveni la dashboard sau alege o secțiune din meniu.
                    </p>
                  </div>
                  <Link to="/" className="btn btn-primary">
                    Înapoi la dashboard
                  </Link>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </PanelLayout>
    </BrowserRouter>
  );
}

export default App;

function PanelLayout({ children, onLogout }) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("panel_sidebar_collapsed") === "1",
  );
  const location = useLocation();
  const title =
    {
      "/": "Dashboard",
      "/users": "Utilizatori",
      "/subscriptions": "Abonamente",
      "/entries": "Progres",
      "/questions": "Întrebări",
      "/meetings": "Calendar",
      "/webinars": "Webinarii",
      "/bug-reports": "Sesizări",
      "/videos": "Videoclipuri",
      "/challenges": "Provocări",
      "/announcements": "Anunțuri",
      "/books": "Cărți PDF",
    }[location.pathname] || "Administrare";
  return (
    <div className={`app-layout${collapsed ? " sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        Sari la conținut
      </a>
      <Sidebar onLogout={onLogout} />
      <div className="app-workspace">
        <header className="workspace-header">
          <button
            className="sidebar-toggle"
            aria-label={collapsed ? "Extinde meniul" : "Restrânge meniul"}
            onClick={() => {
              setCollapsed(!collapsed);
              localStorage.setItem(
                "panel_sidebar_collapsed",
                collapsed ? "0" : "1",
              );
            }}
          >
            {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
          </button>
          <span className="header-separator" />
          <span className="header-breadcrumb">
            Administrare <span>/</span> <strong>{title}</strong>
          </span>
          <span className="admin-identity">
            <span className="admin-avatar">D</span> Dan
          </span>
        </header>
        <main className="app-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="workspace-footer">
          Dan fost anxios <span>Panou de administrare</span>
        </footer>
      </div>
    </div>
  );
}
