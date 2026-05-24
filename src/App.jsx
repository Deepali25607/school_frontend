import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import LogoOrb3D from "./components/fx/LogoOrb3D.jsx";

// Top-level pages — lazy so heavy 3D / charts / animations only load on demand
const Landing = lazy(() => import("./pages/Landing.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const AppLayout = lazy(() => import("./layouts/AppLayout.jsx"));

// Module pages — each ships as its own chunk
const Dashboard = lazy(() => import("./pages/app/Dashboard.jsx"));
const Admissions = lazy(() => import("./pages/app/Admissions.jsx"));
const Students = lazy(() => import("./pages/app/Students.jsx"));
const StudentProfile = lazy(() => import("./pages/app/StudentProfile.jsx"));
const Teachers = lazy(() => import("./pages/app/Teachers.jsx"));
const TeacherProfile = lazy(() => import("./pages/app/TeacherProfile.jsx"));
const Attendance = lazy(() => import("./pages/app/Attendance.jsx"));
const Fees = lazy(() => import("./pages/app/Fees.jsx"));
const Exams = lazy(() => import("./pages/app/Exams.jsx"));
const ExamDetail = lazy(() => import("./pages/app/ExamDetail.jsx"));
const Timetable = lazy(() => import("./pages/app/Timetable.jsx"));
const Library = lazy(() => import("./pages/app/Library.jsx"));
const Transport = lazy(() => import("./pages/app/Transport.jsx"));
const Hostel = lazy(() => import("./pages/app/Hostel.jsx"));
const Payroll = lazy(() => import("./pages/app/Payroll.jsx"));
const Learning = lazy(() => import("./pages/app/Learning.jsx"));
const Communications = lazy(() => import("./pages/app/Communications.jsx"));
const Events = lazy(() => import("./pages/app/Events.jsx"));
const Inventory = lazy(() => import("./pages/app/Inventory.jsx"));
const Leave = lazy(() => import("./pages/app/Leave.jsx"));
const Settings = lazy(() => import("./pages/app/Settings.jsx"));
const Maintenance = lazy(() => import("./pages/app/Maintenance.jsx"));
const Visitors = lazy(() => import("./pages/app/Visitors.jsx"));
const Audit = lazy(() => import("./pages/app/Audit.jsx"));
const Reports = lazy(() => import("./pages/app/Reports.jsx"));
const Documents = lazy(() => import("./pages/app/Documents.jsx"));
const CertificatePrint = lazy(() => import("./pages/app/CertificatePrint.jsx"));
const ReceiptPrint = lazy(() => import("./pages/app/ReceiptPrint.jsx"));
const Health = lazy(() => import("./pages/app/Health.jsx"));
const Discipline = lazy(() => import("./pages/app/Discipline.jsx"));
const Achievements = lazy(() => import("./pages/app/Achievements.jsx"));
const Cafeteria = lazy(() => import("./pages/app/Cafeteria.jsx"));
const Calendar = lazy(() => import("./pages/app/Calendar.jsx"));
const Alumni = lazy(() => import("./pages/app/Alumni.jsx"));
const NoticeBoard = lazy(() => import("./pages/app/NoticeBoard.jsx"));
const PTM = lazy(() => import("./pages/app/PTM.jsx"));
const Polls = lazy(() => import("./pages/app/Polls.jsx"));
const Scholarships = lazy(() => import("./pages/app/Scholarships.jsx"));
const HousePoints = lazy(() => import("./pages/app/HousePoints.jsx"));
const Fundraising = lazy(() => import("./pages/app/Fundraising.jsx"));
const Sports = lazy(() => import("./pages/app/Sports.jsx"));
const Careers = lazy(() => import("./pages/app/Careers.jsx"));
const Suggestions = lazy(() => import("./pages/app/Suggestions.jsx"));
const Promotion = lazy(() => import("./pages/app/Promotion.jsx"));
const Substitutes = lazy(() => import("./pages/app/Substitutes.jsx"));
const Staff = lazy(() => import("./pages/app/Staff.jsx"));

function Splash({ label = "Loading…" }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06061a] text-white">
      <div className="flex flex-col items-center gap-4">
        <LogoOrb3D size={80} />
        <div className="text-sm uppercase tracking-[0.3em] text-white/55">
          {label}
        </div>
      </div>
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LogoOrb3D size={48} />
        <div className="text-xs uppercase tracking-[0.3em] text-white/55">
          Loading module…
        </div>
      </div>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash label="Authenticating…" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          {/* Inner suspense so app shell stays mounted while sub-route loads */}
          <Route
            index
            element={
              <Suspense fallback={<RouteFallback />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route path="admissions" element={<Suspense fallback={<RouteFallback />}><Admissions /></Suspense>} />
          <Route path="students" element={<Suspense fallback={<RouteFallback />}><Students /></Suspense>} />
          <Route path="students/:id" element={<Suspense fallback={<RouteFallback />}><StudentProfile /></Suspense>} />
          <Route path="teachers" element={<Suspense fallback={<RouteFallback />}><Teachers /></Suspense>} />
          <Route path="teachers/:id" element={<Suspense fallback={<RouteFallback />}><TeacherProfile /></Suspense>} />
          <Route path="attendance" element={<Suspense fallback={<RouteFallback />}><Attendance /></Suspense>} />
          <Route path="fees" element={<Suspense fallback={<RouteFallback />}><Fees /></Suspense>} />
          <Route path="exams" element={<Suspense fallback={<RouteFallback />}><Exams /></Suspense>} />
          <Route path="exams/:id" element={<Suspense fallback={<RouteFallback />}><ExamDetail /></Suspense>} />
          <Route path="timetable" element={<Suspense fallback={<RouteFallback />}><Timetable /></Suspense>} />
          <Route path="library" element={<Suspense fallback={<RouteFallback />}><Library /></Suspense>} />
          <Route path="transport" element={<Suspense fallback={<RouteFallback />}><Transport /></Suspense>} />
          <Route path="hostel" element={<Suspense fallback={<RouteFallback />}><Hostel /></Suspense>} />
          <Route path="payroll" element={<Suspense fallback={<RouteFallback />}><Payroll /></Suspense>} />
          <Route path="learning" element={<Suspense fallback={<RouteFallback />}><Learning /></Suspense>} />
          <Route path="communications" element={<Suspense fallback={<RouteFallback />}><Communications /></Suspense>} />
          <Route path="events" element={<Suspense fallback={<RouteFallback />}><Events /></Suspense>} />
          <Route path="inventory" element={<Suspense fallback={<RouteFallback />}><Inventory /></Suspense>} />
          <Route path="leave" element={<Suspense fallback={<RouteFallback />}><Leave /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<RouteFallback />}><Settings /></Suspense>} />
          <Route path="maintenance" element={<Suspense fallback={<RouteFallback />}><Maintenance /></Suspense>} />
          <Route path="visitors" element={<Suspense fallback={<RouteFallback />}><Visitors /></Suspense>} />
          <Route path="audit" element={<Suspense fallback={<RouteFallback />}><Audit /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<RouteFallback />}><Reports /></Suspense>} />
          <Route path="documents" element={<Suspense fallback={<RouteFallback />}><Documents /></Suspense>} />
          <Route path="health" element={<Suspense fallback={<RouteFallback />}><Health /></Suspense>} />
          <Route path="discipline" element={<Suspense fallback={<RouteFallback />}><Discipline /></Suspense>} />
          <Route path="achievements" element={<Suspense fallback={<RouteFallback />}><Achievements /></Suspense>} />
          <Route path="cafeteria" element={<Suspense fallback={<RouteFallback />}><Cafeteria /></Suspense>} />
          <Route path="calendar" element={<Suspense fallback={<RouteFallback />}><Calendar /></Suspense>} />
          <Route path="alumni" element={<Suspense fallback={<RouteFallback />}><Alumni /></Suspense>} />
          <Route path="notices" element={<Suspense fallback={<RouteFallback />}><NoticeBoard /></Suspense>} />
          <Route path="ptm" element={<Suspense fallback={<RouteFallback />}><PTM /></Suspense>} />
          <Route path="polls" element={<Suspense fallback={<RouteFallback />}><Polls /></Suspense>} />
          <Route path="scholarships" element={<Suspense fallback={<RouteFallback />}><Scholarships /></Suspense>} />
          <Route path="house-points" element={<Suspense fallback={<RouteFallback />}><HousePoints /></Suspense>} />
          <Route path="fundraising" element={<Suspense fallback={<RouteFallback />}><Fundraising /></Suspense>} />
          <Route path="sports" element={<Suspense fallback={<RouteFallback />}><Sports /></Suspense>} />
          <Route path="careers" element={<Suspense fallback={<RouteFallback />}><Careers /></Suspense>} />
          <Route path="suggestions" element={<Suspense fallback={<RouteFallback />}><Suggestions /></Suspense>} />
          <Route path="promotion" element={<Suspense fallback={<RouteFallback />}><Promotion /></Suspense>} />
          <Route path="substitutes" element={<Suspense fallback={<RouteFallback />}><Substitutes /></Suspense>} />
          <Route path="staff" element={<Suspense fallback={<RouteFallback />}><Staff /></Suspense>} />
        </Route>
        {/* Standalone print views — authenticated but render outside the app shell so
            the sidebar/topbar don't appear in the printed output. */}
        <Route
          path="/print/documents/:id"
          element={
            <RequireAuth>
              <Suspense fallback={<Splash label="Loading certificate…" />}>
                <CertificatePrint />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/print/receipts/:id"
          element={
            <RequireAuth>
              <Suspense fallback={<Splash label="Loading receipt…" />}>
                <ReceiptPrint />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
