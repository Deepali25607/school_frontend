import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({ baseURL, timeout: 10000 });

// --- token storage ---
const TOKEN_KEY = "lumina-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

// --- interceptors ---
api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// auto-logout listener — pages/components can subscribe
const unauthorizedListeners = new Set();
export function onUnauthorized(fn) {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      setToken(null);
      unauthorizedListeners.forEach((fn) => fn());
    }
    return Promise.reject(err);
  }
);

export const endpoints = {
  // auth
  // The backend's login field has evolved from `email` to `identifier`
  // (email/phone). Send both so the client works against either backend
  // version — the unused key is ignored.
  login: (payload) => {
    const body =
      payload?.email && payload.identifier == null
        ? { ...payload, identifier: payload.email }
        : payload;
    return api.post("/api/auth/login", body).then((r) => r.data);
  },
  me: () => api.get("/api/auth/me").then((r) => r.data),
  updateProfile: (payload) =>
    api.patch("/api/auth/me", payload).then((r) => r.data),
  changePassword: (payload) =>
    api.post("/api/auth/change-password", payload).then((r) => r.data),
  forgotPassword: (email) =>
    api.post("/api/auth/forgot-password", { email }).then((r) => r.data),
  resetPasswordCheck: (token) =>
    api.get(`/api/auth/reset-password/${encodeURIComponent(token)}`).then((r) => r.data),
  resetPassword: (token, newPassword) =>
    api.post("/api/auth/reset-password", { token, newPassword }).then((r) => r.data),

  // two-factor authentication (BRD §12)
  twoFactorLogin: (challengeToken, code) =>
    api.post("/api/auth/2fa/login", { challengeToken, code }).then((r) => r.data),
  twoFactorSetup: () =>
    api.post("/api/auth/2fa/setup").then((r) => r.data),
  twoFactorEnable: (code) =>
    api.post("/api/auth/2fa/enable", { code }).then((r) => r.data),
  twoFactorDisable: (password) =>
    api.post("/api/auth/2fa/disable", { password }).then((r) => r.data),

  // dashboard
  dashboard: () => api.get("/api/dashboard/summary").then((r) => r.data),

  // students
  students: (params) =>
    api.get("/api/students", { params }).then((r) => r.data),
  student: (id) => api.get(`/api/students/${id}`).then((r) => r.data),
  studentProfile: (id) =>
    api.get(`/api/students/${id}/profile`).then((r) => r.data),
  studentReportCard: (id, params) =>
    api.get(`/api/students/${id}/report-card`, { params }).then((r) => r.data),
  studentAdd: (payload) =>
    api.post("/api/students", payload).then((r) => r.data),
  studentUpdate: (id, payload) =>
    api.patch(`/api/students/${id}`, payload).then((r) => r.data),
  studentDelete: (id) =>
    api.delete(`/api/students/${id}`).then((r) => r.data),

  // teachers
  teachers: (params) =>
    api.get("/api/teachers", { params }).then((r) => r.data),
  teacherProfile: (id) =>
    api.get(`/api/teachers/${id}/profile`).then((r) => r.data),
  teacherAdd: (payload) =>
    api.post("/api/teachers", payload).then((r) => r.data),
  teacherUpdate: (id, payload) =>
    api.patch(`/api/teachers/${id}`, payload).then((r) => r.data),
  teacherDelete: (id) =>
    api.delete(`/api/teachers/${id}`).then((r) => r.data),

  // attendance
  attendanceToday: () => api.get("/api/attendance/today").then((r) => r.data),
  saveAttendance: (date, entries) =>
    api.post(`/api/attendance/${date}`, { entries }).then((r) => r.data),

  // fees
  feesLedger: () => api.get("/api/fees/ledger").then((r) => r.data),
  feesMonthly: () => api.get("/api/fees/monthly").then((r) => r.data),
  feesStudent: (id) => api.get(`/api/fees/student/${id}`).then((r) => r.data),
  feesPayments: (params) =>
    api.get("/api/fees/payments", { params }).then((r) => r.data),
  feesPaymentAdd: (payload) =>
    api.post("/api/fees/payments", payload).then((r) => r.data),
  feesReceipt: (id) =>
    api.get(`/api/fees/payments/${id}/receipt`).then((r) => r.data),

  // fee adjustments — discounts / fines / refunds (BRD 7.7)
  feeAdjustments: (params) =>
    api.get("/api/fees/adjustments", { params }).then((r) => r.data),
  feeAdjustmentAdd: (payload) =>
    api.post("/api/fees/adjustments", payload).then((r) => r.data),
  feeAdjustmentSetStatus: (id, status) =>
    api.patch(`/api/fees/adjustments/${id}`, { status }).then((r) => r.data),
  feeAdjustmentDelete: (id) =>
    api.delete(`/api/fees/adjustments/${id}`).then((r) => r.data),

  // Payment-order flow (Razorpay-style two-step)
  feesOrderCreate: (payload) =>
    api.post("/api/fees/payments/order", payload).then((r) => r.data),
  feesOrder: (id) =>
    api.get(`/api/fees/payments/order/${id}`).then((r) => r.data),
  feesOrderCapture: (id, payload) =>
    api
      .post(`/api/fees/payments/order/${id}/capture`, payload || {})
      .then((r) => r.data),
  feesOrderCancel: (id) =>
    api.post(`/api/fees/payments/order/${id}/cancel`).then((r) => r.data),
  feesOrders: (params) =>
    api.get("/api/fees/payments/orders", { params }).then((r) => r.data),

  // exams
  exams: () => api.get("/api/exams").then((r) => r.data),
  exam: (id) => api.get(`/api/exams/${id}`).then((r) => r.data),
  examMarks: (examId) =>
    api.get(`/api/exams/${examId}/marks`).then((r) => r.data),
  saveMarks: (examId, marks) =>
    api.post(`/api/exams/${examId}/marks`, { marks }).then((r) => r.data),
  examAdd: (payload) => api.post("/api/exams", payload).then((r) => r.data),
  examUpdate: (id, payload) =>
    api.patch(`/api/exams/${id}`, payload).then((r) => r.data),
  examDelete: (id) => api.delete(`/api/exams/${id}`).then((r) => r.data),
  examAddPaper: (id, paper) =>
    api.post(`/api/exams/${id}/papers`, paper).then((r) => r.data),
  examUpdatePaper: (id, subject, paper) =>
    api.patch(`/api/exams/${id}/papers/${subject}`, paper).then((r) => r.data),
  examRemovePaper: (id, subject) =>
    api.delete(`/api/exams/${id}/papers/${subject}`).then((r) => r.data),
  results: (studentId) =>
    api.get(`/api/results/${studentId}`).then((r) => r.data),
  hallTicket: (examId, studentId) =>
    api.get(`/api/exams/${examId}/hall-ticket/${studentId}`).then((r) => r.data),
  hallTickets: (examId) =>
    api.get(`/api/exams/${examId}/hall-tickets`).then((r) => r.data),

  // timetable
  timetable: (params) =>
    api.get("/api/timetable", { params }).then((r) => r.data),
  timetableOverrides: () =>
    api.get("/api/timetable/overrides").then((r) => r.data),
  timetableSetCell: (payload) =>
    api.post("/api/timetable/cell", payload).then((r) => r.data),
  timetableClearCell: (payload) =>
    api.delete("/api/timetable/cell", { data: payload }).then((r) => r.data),
  timetableClearClass: (grade, section) =>
    api
      .post("/api/timetable/clear-class", { grade, section })
      .then((r) => r.data),
  timetableConflicts: () =>
    api.get("/api/timetable/conflicts").then((r) => r.data),
  timetableCheckCell: (params) =>
    api.get("/api/timetable/check", { params }).then((r) => r.data),

  // library
  libraryBooks: (params) =>
    api.get("/api/library/books", { params }).then((r) => r.data),
  libraryBookByBarcode: (code) =>
    api.get(`/api/library/books/by-barcode/${encodeURIComponent(code)}`).then((r) => r.data),
  libraryIssues: () => api.get("/api/library/issues").then((r) => r.data),
  libraryIssue: (payload) =>
    api.post("/api/library/issue", payload).then((r) => r.data),
  libraryReturn: (issueId) =>
    api.post(`/api/library/return/${issueId}`).then((r) => r.data),
  libraryReservations: (params) =>
    api.get("/api/library/reservations", { params }).then((r) => r.data),
  libraryBookQueue: (bookId) =>
    api.get(`/api/library/books/${bookId}/queue`).then((r) => r.data),
  libraryReserve: (payload) =>
    api.post("/api/library/reservations", payload).then((r) => r.data),
  libraryReservationCancel: (id) =>
    api.delete(`/api/library/reservations/${id}`).then((r) => r.data),

  // payroll
  payroll: (params) =>
    api.get("/api/payroll", { params }).then((r) => r.data),
  payrollStaff: (id) => api.get(`/api/payroll/${id}`).then((r) => r.data),
  payrollUpdate: (id, patch) =>
    api.patch(`/api/payroll/${id}`, patch).then((r) => r.data),
  payrollBulk: (payload) =>
    api.post("/api/payroll/bulk", payload).then((r) => r.data),

  // payroll processing — runs, payslips, bank report (BRD 7.8)
  payrollRuns: () => api.get("/api/payroll/runs").then((r) => r.data),
  payrollRun: (id) => api.get(`/api/payroll/runs/${id}`).then((r) => r.data),
  payrollRunCreate: (month) =>
    api.post("/api/payroll/runs", { month }).then((r) => r.data),
  payrollRunAction: (id, action) =>
    api.patch(`/api/payroll/runs/${id}`, { action }).then((r) => r.data),
  payrollRunDelete: (id) =>
    api.delete(`/api/payroll/runs/${id}`).then((r) => r.data),
  payrollBankReport: (id) =>
    api.get(`/api/payroll/runs/${id}/bank-report`).then((r) => r.data),
  payrollPayslip: (runId, employeeId) =>
    api.get(`/api/payroll/runs/${runId}/payslip/${employeeId}`).then((r) => r.data),

  // salary advances (BRD 7.8)
  payrollAdvances: (params) =>
    api.get("/api/payroll/advances", { params }).then((r) => r.data),
  payrollAdvanceGrant: (payload) =>
    api.post("/api/payroll/advances", payload).then((r) => r.data),
  payrollAdvanceCancel: (id) =>
    api.post(`/api/payroll/advances/${id}/cancel`).then((r) => r.data),

  // transport
  transportRoutes: () =>
    api.get("/api/transport/routes").then((r) => r.data),
  transportRoute: (id) =>
    api.get(`/api/transport/routes/${id}`).then((r) => r.data),
  transportRouteAdd: (payload) =>
    api.post("/api/transport/routes", payload).then((r) => r.data),
  transportRouteUpdate: (id, payload) =>
    api.patch(`/api/transport/routes/${id}`, payload).then((r) => r.data),
  transportRouteDelete: (id) =>
    api.delete(`/api/transport/routes/${id}`).then((r) => r.data),
  transportStopAdd: (routeId, stop) =>
    api.post(`/api/transport/routes/${routeId}/stops`, stop).then((r) => r.data),
  transportStopUpdate: (routeId, index, patch) =>
    api
      .patch(`/api/transport/routes/${routeId}/stops/${index}`, patch)
      .then((r) => r.data),
  transportStopRemove: (routeId, index) =>
    api
      .delete(`/api/transport/routes/${routeId}/stops/${index}`)
      .then((r) => r.data),

  // learning
  liveClasses: (params) =>
    api.get("/api/learning/live", { params }).then((r) => r.data),
  recordings: (params) =>
    api.get("/api/learning/recordings", { params }).then((r) => r.data),
  materials: () => api.get("/api/learning/materials").then((r) => r.data),

  // admissions
  admissions: (params) =>
    api.get("/api/admissions", { params }).then((r) => r.data),
  admission: (id) => api.get(`/api/admissions/${id}`).then((r) => r.data),
  admissionAdd: (payload) =>
    api.post("/api/admissions", payload).then((r) => r.data),
  admissionMove: (id, stage) =>
    api.patch(`/api/admissions/${id}/move`, { stage }).then((r) => r.data),

  // communications
  commsAudiences: () =>
    api.get("/api/communications/audiences").then((r) => r.data),
  commsBroadcasts: () =>
    api.get("/api/communications/broadcasts").then((r) => r.data),
  commsSend: (payload) =>
    api.post("/api/communications/broadcasts", payload).then((r) => r.data),

  // hostel
  hostelSummary: () => api.get("/api/hostel/summary").then((r) => r.data),
  hostelRooms: (params) =>
    api.get("/api/hostel/rooms", { params }).then((r) => r.data),
  hostelAssign: (roomId, payload) =>
    api.post(`/api/hostel/rooms/${roomId}/assign`, payload).then((r) => r.data),
  hostelEvict: (roomId, payload) =>
    api.post(`/api/hostel/rooms/${roomId}/evict`, payload).then((r) => r.data),

  // hostel warden & mess management (BRD 7.15)
  hostelWardens: () => api.get("/api/hostel/wardens").then((r) => r.data),
  hostelWardenAdd: (payload) =>
    api.post("/api/hostel/wardens", payload).then((r) => r.data),
  hostelWardenUpdate: (id, patch) =>
    api.patch(`/api/hostel/wardens/${id}`, patch).then((r) => r.data),
  hostelWardenDelete: (id) =>
    api.delete(`/api/hostel/wardens/${id}`).then((r) => r.data),
  hostelMess: () => api.get("/api/hostel/mess").then((r) => r.data),
  hostelMessSet: (day, meal, dish) =>
    api.patch("/api/hostel/mess", { day, meal, dish }).then((r) => r.data),

  // events
  events: (params) => api.get("/api/events", { params }).then((r) => r.data),
  eventAdd: (payload) => api.post("/api/events", payload).then((r) => r.data),
  eventDelete: (id) => api.delete(`/api/events/${id}`).then((r) => r.data),

  // inventory
  inventory: (params) =>
    api.get("/api/inventory", { params }).then((r) => r.data),
  inventoryItemAdd: (payload) =>
    api.post("/api/inventory", payload).then((r) => r.data),
  inventoryCategoryAdd: (name) =>
    api.post("/api/inventory/categories", { name }).then((r) => r.data),
  inventoryItemUpdate: (id, payload) =>
    api.patch(`/api/inventory/${id}`, payload).then((r) => r.data),
  inventoryItemDelete: (id) =>
    api.delete(`/api/inventory/${id}`).then((r) => r.data),
  inventoryAdjust: (id, payload) =>
    api.post(`/api/inventory/${id}/adjust`, payload).then((r) => r.data),
  inventoryVendors: () =>
    api.get("/api/inventory/vendors").then((r) => r.data),
  inventoryAlerts: () =>
    api.get("/api/inventory/alerts").then((r) => r.data),
  inventoryPurchases: (params) =>
    api.get("/api/inventory/purchases", { params }).then((r) => r.data),
  inventoryPurchaseAdd: (payload) =>
    api.post("/api/inventory/purchases", payload).then((r) => r.data),
  inventoryPurchaseAction: (id, action) =>
    api.patch(`/api/inventory/purchases/${id}`, { action }).then((r) => r.data),

  // expenses (BRD 7.17)
  expenses: (params) =>
    api.get("/api/expenses", { params }).then((r) => r.data),
  expenseAdd: (payload) =>
    api.post("/api/expenses", payload).then((r) => r.data),
  expenseSetStatus: (id, payload) =>
    api.patch(`/api/expenses/${id}`, payload).then((r) => r.data),
  expenseReport: (month) =>
    api.get("/api/expenses/report", { params: month ? { month } : {} }).then((r) => r.data),
  expenseBudgets: () =>
    api.get("/api/expenses/budgets").then((r) => r.data),
  expenseSetBudget: (category, amount) =>
    api.put(`/api/expenses/budgets/${encodeURIComponent(category)}`, { amount }).then((r) => r.data),

  // leave
  leave: (params) => api.get("/api/leave", { params }).then((r) => r.data),
  leaveApply: (payload) => api.post("/api/leave", payload).then((r) => r.data),
  leaveDecide: (id, status) =>
    api.patch(`/api/leave/${id}`, { status }).then((r) => r.data),

  // admin
  backup: () =>
    api.get("/api/admin/backup", { responseType: "blob" }).then((r) => r),
  restore: (snapshot) =>
    api.post("/api/admin/restore", snapshot).then((r) => r.data),

  // maintenance
  maintenance: (params) =>
    api.get("/api/maintenance", { params }).then((r) => r.data),
  maintenanceAdd: (payload) =>
    api.post("/api/maintenance", payload).then((r) => r.data),
  maintenanceUpdate: (id, patch) =>
    api.patch(`/api/maintenance/${id}`, patch).then((r) => r.data),

  // visitors
  visitors: (params) =>
    api.get("/api/visitors", { params }).then((r) => r.data),
  visitorCheckIn: (payload) =>
    api.post("/api/visitors", payload).then((r) => r.data),
  visitorCheckOut: (id) =>
    api.post(`/api/visitors/${id}/checkout`).then((r) => r.data),

  // audit
  audit: (params) => api.get("/api/audit", { params }).then((r) => r.data),
  auditActors: () => api.get("/api/audit/actors").then((r) => r.data),
  auditExport: (params) =>
    api
      .get("/api/audit/export.csv", { params, responseType: "blob" })
      .then((r) => ({
        blob: r.data,
        filename:
          /filename="?([^";]+)/.exec(r.headers["content-disposition"] || "")?.[1] ||
          "audit-log.csv",
      })),

  // documents & certificates
  documents: (params) =>
    api.get("/api/documents", { params }).then((r) => r.data),
  documentAdd: (payload) =>
    api.post("/api/documents", payload).then((r) => r.data),
  documentUpdate: (id, patch) =>
    api.patch(`/api/documents/${id}`, patch).then((r) => r.data),
  documentRender: (id) =>
    api.get(`/api/documents/${id}/render`).then((r) => r.data),

  // calendar
  calendar: (params) =>
    api.get("/api/calendar", { params }).then((r) => r.data),

  // global search
  search: (q) =>
    api.get("/api/search", { params: { q } }).then((r) => r.data),

  // notifications
  notifications: (params) =>
    api.get("/api/notifications", { params }).then((r) => r.data),
  notificationsUnreadCount: () =>
    api.get("/api/notifications/unread-count").then((r) => r.data),
  notificationRead: (id) =>
    api.patch(`/api/notifications/${id}/read`).then((r) => r.data),
  notificationsMarkAllRead: () =>
    api.post("/api/notifications/mark-all-read").then((r) => r.data),

  // cafeteria
  cafeteriaMenu: (params) =>
    api.get("/api/cafeteria/menu", { params }).then((r) => r.data),
  cafeteriaMealUpdate: (day, meal, payload) =>
    api.patch(`/api/cafeteria/menu/${day}/${meal}`, payload).then((r) => r.data),
  cafeteriaPreferences: (params) =>
    api.get("/api/cafeteria/preferences", { params }).then((r) => r.data),
  cafeteriaPref: (studentId) =>
    api.get(`/api/cafeteria/preferences/${studentId}`).then((r) => r.data),
  cafeteriaPrefUpdate: (studentId, patch) =>
    api.patch(`/api/cafeteria/preferences/${studentId}`, patch).then((r) => r.data),
  cafeteriaOrders: (params) =>
    api.get("/api/cafeteria/orders", { params }).then((r) => r.data),
  cafeteriaOrdersSummary: (date) =>
    api
      .get("/api/cafeteria/orders/summary", { params: { date } })
      .then((r) => r.data),
  cafeteriaOrderCreate: (payload) =>
    api.post("/api/cafeteria/orders", payload).then((r) => r.data),
  cafeteriaOrderCancel: (id) =>
    api.delete(`/api/cafeteria/orders/${id}`).then((r) => r.data),
  cafeteriaOrderServe: (id) =>
    api.post(`/api/cafeteria/orders/${id}/serve`).then((r) => r.data),
  cafeteriaOrderPayment: (id, paymentStatus) =>
    api
      .post(`/api/cafeteria/orders/${id}/payment`, { paymentStatus })
      .then((r) => r.data),

  // achievements
  achievements: (params) =>
    api.get("/api/achievements", { params }).then((r) => r.data),
  achievementsForStudent: (studentId) =>
    api.get(`/api/achievements/students/${studentId}`).then((r) => r.data),
  achievementAdd: (payload) =>
    api.post("/api/achievements", payload).then((r) => r.data),
  achievementUpdate: (id, patch) =>
    api.patch(`/api/achievements/${id}`, patch).then((r) => r.data),
  achievementDelete: (id) =>
    api.delete(`/api/achievements/${id}`).then((r) => r.data),

  // discipline & behavioral
  discipline: (params) =>
    api.get("/api/discipline", { params }).then((r) => r.data),
  disciplineLedger: (studentId) =>
    api.get(`/api/discipline/students/${studentId}`).then((r) => r.data),
  disciplineAdd: (payload) =>
    api.post("/api/discipline", payload).then((r) => r.data),
  disciplineUpdate: (id, patch) =>
    api.patch(`/api/discipline/${id}`, patch).then((r) => r.data),

  // quizzes / question bank
  quizSets: (params) => api.get("/api/quizzes/sets", { params }).then((r) => r.data),
  quizSet: (id) => api.get(`/api/quizzes/sets/${id}`).then((r) => r.data),
  quizSetCreate: (payload) =>
    api.post("/api/quizzes/sets", payload).then((r) => r.data),
  quizSetUpdate: (id, patch) =>
    api.patch(`/api/quizzes/sets/${id}`, patch).then((r) => r.data),
  quizSetDelete: (id) => api.delete(`/api/quizzes/sets/${id}`).then((r) => r.data),
  quizSetAnalytics: (id) =>
    api.get(`/api/quizzes/sets/${id}/analytics`).then((r) => r.data),
  quizAttemptStart: (setId, studentId) =>
    api
      .post(`/api/quizzes/sets/${setId}/attempt`, studentId ? { studentId } : {})
      .then((r) => r.data),
  quizAttemptSubmit: (attemptId, answers) =>
    api
      .post(`/api/quizzes/attempts/${attemptId}/submit`, { answers })
      .then((r) => r.data),
  quizAttempt: (attemptId) =>
    api.get(`/api/quizzes/attempts/${attemptId}`).then((r) => r.data),
  quizAttempts: (params) =>
    api.get("/api/quizzes/attempts", { params }).then((r) => r.data),

  // safe-space reporting
  safeReportSubmit: (payload) =>
    api.post("/api/safe-reports", payload).then((r) => r.data),
  safeReportLookup: (code) =>
    api.get(`/api/safe-reports/lookup/${encodeURIComponent(code)}`).then((r) => r.data),
  safeReportsMine: () =>
    api.get("/api/safe-reports/mine").then((r) => r.data),
  safeReports: (params) =>
    api.get("/api/safe-reports", { params }).then((r) => r.data),
  safeReport: (id) => api.get(`/api/safe-reports/${id}`).then((r) => r.data),
  safeReportUpdate: (id, patch) =>
    api.patch(`/api/safe-reports/${id}`, patch).then((r) => r.data),
  safeReportRespond: (id, payload) =>
    api.post(`/api/safe-reports/${id}/responses`, payload).then((r) => r.data),

  // health & medical
  healthProfiles: (params) =>
    api.get("/api/health/profiles", { params }).then((r) => r.data),
  healthProfile: (studentId) =>
    api.get(`/api/health/profiles/${studentId}`).then((r) => r.data),
  healthProfileUpdate: (studentId, patch) =>
    api.patch(`/api/health/profiles/${studentId}`, patch).then((r) => r.data),
  healthVisits: (params) =>
    api.get("/api/health/visits", { params }).then((r) => r.data),
  healthVisitAdd: (payload) =>
    api.post("/api/health/visits", payload).then((r) => r.data),
  vaccinationSchedule: () =>
    api.get("/api/health/vaccinations/schedule").then((r) => r.data),
  vaccinationCompliance: (params) =>
    api.get("/api/health/vaccinations/compliance", { params }).then((r) => r.data),
  vaccinationStatus: (studentId) =>
    api.get(`/api/health/vaccinations/${studentId}`).then((r) => r.data),
  vaccinationRecord: (studentId, payload) =>
    api
      .post(`/api/health/vaccinations/${studentId}/record`, payload)
      .then((r) => r.data),

  // reports
  reportsOverview: () =>
    api.get("/api/reports/overview").then((r) => r.data),

  // CSV exports. Returns a Blob so the caller can trigger a download.
  // `params` is forwarded as query string (e.g. {grade:"8", from:"2026-01-01"}).
  reportsExport: (kind, params) =>
    api
      .get(`/api/reports/export/${kind}.csv`, {
        params,
        responseType: "blob",
      })
      .then((r) => ({
        blob: r.data,
        // Server sends Content-Disposition: attachment; filename="..."
        filename:
          /filename="?([^";]+)/.exec(r.headers["content-disposition"] || "")?.[1] ||
          `${kind}.csv`,
      })),

  // Bulk imports — `kind` is "students" / "teachers" / "staff" / "attendance"
  // / "exam-marks". `dryRun` returns a preview without committing so the user
  // can fix validation errors first. `params` is forwarded as query string
  // (e.g. {examId: "EX123"} for exam-marks).
  reportsImport: (kind, csv, { dryRun = false, params } = {}) =>
    api
      .post(`/api/admin/import/${kind}`, { csv, dryRun }, { params })
      .then((r) => r.data),

  reportsImportTemplate: (kind, params) =>
    api
      .get(`/api/admin/import/template/${kind}`, {
        responseType: "blob",
        params,
      })
      .then((r) => ({
        blob: r.data,
        filename:
          /filename="?([^";]+)/.exec(r.headers["content-disposition"] || "")?.[1] ||
          `${kind}-template.csv`,
      })),

  // alumni
  alumni: (params) =>
    api.get("/api/alumni", { params }).then((r) => r.data),
  alumniSummary: () => api.get("/api/alumni/summary").then((r) => r.data),
  alumnus: (id) => api.get(`/api/alumni/${id}`).then((r) => r.data),
  alumniAdd: (payload) =>
    api.post("/api/alumni", payload).then((r) => r.data),
  alumniUpdate: (id, patch) =>
    api.patch(`/api/alumni/${id}`, patch).then((r) => r.data),
  alumniContact: (id, channel) =>
    api.post(`/api/alumni/${id}/contact`, { channel }).then((r) => r.data),
  alumniDelete: (id) =>
    api.delete(`/api/alumni/${id}`).then((r) => r.data),

  // notices
  notices: (params) =>
    api.get("/api/notices", { params }).then((r) => r.data),
  noticesSummary: () => api.get("/api/notices/summary").then((r) => r.data),
  notice: (id) => api.get(`/api/notices/${id}`).then((r) => r.data),
  noticeAdd: (payload) =>
    api.post("/api/notices", payload).then((r) => r.data),
  noticeUpdate: (id, patch) =>
    api.patch(`/api/notices/${id}`, patch).then((r) => r.data),
  noticeAck: (id) => api.post(`/api/notices/${id}/ack`).then((r) => r.data),
  noticeUnack: (id) =>
    api.delete(`/api/notices/${id}/ack`).then((r) => r.data),
  noticePin: (id) => api.post(`/api/notices/${id}/pin`).then((r) => r.data),
  noticeDelete: (id) =>
    api.delete(`/api/notices/${id}`).then((r) => r.data),

  // ptm
  ptmSessions: (params) =>
    api.get("/api/ptm/sessions", { params }).then((r) => r.data),
  ptmSummary: () => api.get("/api/ptm/summary").then((r) => r.data),
  ptmSession: (id) =>
    api.get(`/api/ptm/sessions/${id}`).then((r) => r.data),
  ptmAddSession: (payload) =>
    api.post("/api/ptm/sessions", payload).then((r) => r.data),
  ptmUpdateSession: (id, patch) =>
    api.patch(`/api/ptm/sessions/${id}`, patch).then((r) => r.data),
  ptmRemoveSession: (id) =>
    api.delete(`/api/ptm/sessions/${id}`).then((r) => r.data),
  ptmBook: (sessionId, payload) =>
    api.post(`/api/ptm/sessions/${sessionId}/book`, payload).then((r) => r.data),
  ptmBookingUpdate: (id, patch) =>
    api.patch(`/api/ptm/bookings/${id}`, patch).then((r) => r.data),
  ptmBookingCancel: (id) =>
    api.delete(`/api/ptm/bookings/${id}`).then((r) => r.data),
  ptmStudentBookings: (studentId) =>
    api.get(`/api/ptm/students/${studentId}/bookings`).then((r) => r.data),

  // polls & surveys
  polls: (params) => api.get("/api/polls", { params }).then((r) => r.data),
  pollsSummary: () => api.get("/api/polls/summary").then((r) => r.data),
  poll: (id) => api.get(`/api/polls/${id}`).then((r) => r.data),
  pollAdd: (payload) => api.post("/api/polls", payload).then((r) => r.data),
  pollUpdate: (id, patch) =>
    api.patch(`/api/polls/${id}`, patch).then((r) => r.data),
  pollClose: (id) => api.post(`/api/polls/${id}/close`).then((r) => r.data),
  pollReopen: (id) => api.post(`/api/polls/${id}/reopen`).then((r) => r.data),
  pollDelete: (id) => api.delete(`/api/polls/${id}`).then((r) => r.data),
  pollRespond: (id, answers) =>
    api.post(`/api/polls/${id}/respond`, { answers }).then((r) => r.data),
  pollWithdraw: (id) =>
    api.delete(`/api/polls/${id}/respond`).then((r) => r.data),

  // scholarships
  schemes: (params) =>
    api.get("/api/scholarships/schemes", { params }).then((r) => r.data),
  scheme: (id) =>
    api.get(`/api/scholarships/schemes/${id}`).then((r) => r.data),
  scholarshipsSummary: () =>
    api.get("/api/scholarships/summary").then((r) => r.data),
  schemeAdd: (payload) =>
    api.post("/api/scholarships/schemes", payload).then((r) => r.data),
  schemeUpdate: (id, patch) =>
    api.patch(`/api/scholarships/schemes/${id}`, patch).then((r) => r.data),
  schemeDelete: (id) =>
    api.delete(`/api/scholarships/schemes/${id}`).then((r) => r.data),
  scholarshipApplications: (params) =>
    api.get("/api/scholarships/applications", { params }).then((r) => r.data),
  scholarshipApply: (payload) =>
    api.post("/api/scholarships/applications", payload).then((r) => r.data),
  scholarshipDecide: (id, payload) =>
    api.patch(`/api/scholarships/applications/${id}`, payload).then((r) => r.data),
  scholarshipWithdraw: (id) =>
    api.delete(`/api/scholarships/applications/${id}`).then((r) => r.data),
  scholarshipAwardedForStudent: (studentId) =>
    api
      .get(`/api/scholarships/students/${studentId}/awarded`)
      .then((r) => r.data),

  // house points
  housePoints: (params) =>
    api.get("/api/housepoints", { params }).then((r) => r.data),
  housePointsSummary: (params) =>
    api.get("/api/housepoints/summary", { params }).then((r) => r.data),
  housePointAdd: (payload) =>
    api.post("/api/housepoints", payload).then((r) => r.data),
  housePointDelete: (id) =>
    api.delete(`/api/housepoints/${id}`).then((r) => r.data),

  // fundraising
  campaigns: (params) =>
    api.get("/api/fundraising/campaigns", { params }).then((r) => r.data),
  campaign: (id) =>
    api.get(`/api/fundraising/campaigns/${id}`).then((r) => r.data),
  fundraisingSummary: () =>
    api.get("/api/fundraising/summary").then((r) => r.data),
  campaignAdd: (payload) =>
    api.post("/api/fundraising/campaigns", payload).then((r) => r.data),
  campaignUpdate: (id, patch) =>
    api.patch(`/api/fundraising/campaigns/${id}`, patch).then((r) => r.data),
  campaignClose: (id) =>
    api.post(`/api/fundraising/campaigns/${id}/close`).then((r) => r.data),
  campaignDelete: (id) =>
    api.delete(`/api/fundraising/campaigns/${id}`).then((r) => r.data),
  donate: (payload) =>
    api.post("/api/fundraising/donate", payload).then((r) => r.data),
  donationCancel: (id) =>
    api.delete(`/api/fundraising/donations/${id}`).then((r) => r.data),
  topDonors: (params) =>
    api.get("/api/fundraising/top-donors", { params }).then((r) => r.data),

  // sports
  tournaments: (params) =>
    api.get("/api/sports/tournaments", { params }).then((r) => r.data),
  tournament: (id) =>
    api.get(`/api/sports/tournaments/${id}`).then((r) => r.data),
  sportsSummary: () => api.get("/api/sports/summary").then((r) => r.data),
  tournamentAdd: (payload) =>
    api.post("/api/sports/tournaments", payload).then((r) => r.data),
  tournamentUpdate: (id, patch) =>
    api.patch(`/api/sports/tournaments/${id}`, patch).then((r) => r.data),
  tournamentDelete: (id) =>
    api.delete(`/api/sports/tournaments/${id}`).then((r) => r.data),
  matches: (params) =>
    api.get("/api/sports/matches", { params }).then((r) => r.data),
  matchAdd: (payload) =>
    api.post("/api/sports/matches", payload).then((r) => r.data),
  matchUpdate: (id, patch) =>
    api.patch(`/api/sports/matches/${id}`, patch).then((r) => r.data),
  matchDelete: (id) =>
    api.delete(`/api/sports/matches/${id}`).then((r) => r.data),

  // careers
  careerProfiles: (params) =>
    api.get("/api/careers/profiles", { params }).then((r) => r.data),
  careerProfile: (studentId) =>
    api.get(`/api/careers/profiles/${studentId}`).then((r) => r.data),
  careersSummary: () => api.get("/api/careers/summary").then((r) => r.data),
  careerProfileUpdate: (studentId, patch) =>
    api.patch(`/api/careers/profiles/${studentId}`, patch).then((r) => r.data),
  careerSessions: (params) =>
    api.get("/api/careers/sessions", { params }).then((r) => r.data),
  careerSessionAdd: (payload) =>
    api.post("/api/careers/sessions", payload).then((r) => r.data),
  careerSessionUpdate: (id, patch) =>
    api.patch(`/api/careers/sessions/${id}`, patch).then((r) => r.data),
  careerSessionDelete: (id) =>
    api.delete(`/api/careers/sessions/${id}`).then((r) => r.data),
  careerApplications: (params) =>
    api.get("/api/careers/applications", { params }).then((r) => r.data),
  careerAppAdd: (payload) =>
    api.post("/api/careers/applications", payload).then((r) => r.data),
  careerAppUpdate: (id, patch) =>
    api.patch(`/api/careers/applications/${id}`, patch).then((r) => r.data),
  careerAppDelete: (id) =>
    api.delete(`/api/careers/applications/${id}`).then((r) => r.data),

  // suggestions / idea hub
  suggestions: (params) =>
    api.get("/api/suggestions", { params }).then((r) => r.data),
  suggestionsSummary: () =>
    api.get("/api/suggestions/summary").then((r) => r.data),
  suggestion: (id) =>
    api.get(`/api/suggestions/${id}`).then((r) => r.data),
  suggestionAdd: (payload) =>
    api.post("/api/suggestions", payload).then((r) => r.data),
  suggestionUpvote: (id) =>
    api.post(`/api/suggestions/${id}/upvote`).then((r) => r.data),
  suggestionUnvote: (id) =>
    api.delete(`/api/suggestions/${id}/upvote`).then((r) => r.data),
  suggestionTransition: (id, payload) =>
    api.patch(`/api/suggestions/${id}/status`, payload).then((r) => r.data),
  suggestionComment: (id, payload) =>
    api.post(`/api/suggestions/${id}/comments`, payload).then((r) => r.data),
  suggestionCommentDelete: (id, commentId) =>
    api
      .delete(`/api/suggestions/${id}/comments/${commentId}`)
      .then((r) => r.data),
  suggestionDelete: (id) =>
    api.delete(`/api/suggestions/${id}`).then((r) => r.data),

  // substitute teacher assignments
  substitutes: (date) =>
    api.get("/api/substitutes", { params: date ? { date } : {} }).then((r) => r.data),
  substitutesHistory: (params) =>
    api.get("/api/substitutes/history", { params }).then((r) => r.data),
  substituteAssign: (payload) =>
    api.post("/api/substitutes", payload).then((r) => r.data),
  substituteAutoFill: (date) =>
    api.post("/api/substitutes/auto-fill", { date }).then((r) => r.data),
  substituteCancel: (id, reason) =>
    api.delete(`/api/substitutes/${id}`, { data: { reason } }).then((r) => r.data),

  // staff directory
  staff: (params) =>
    api.get("/api/staff", { params }).then((r) => r.data),
  staffMember: (id) => api.get(`/api/staff/${id}`).then((r) => r.data),
  staffAdd: (payload) => api.post("/api/staff", payload).then((r) => r.data),
  staffUpdate: (id, payload) =>
    api.patch(`/api/staff/${id}`, payload).then((r) => r.data),
  staffDelete: (id) => api.delete(`/api/staff/${id}`).then((r) => r.data),

  // users & access management (admin)
  users: (params) =>
    api.get("/api/users", { params }).then((r) => r.data),
  userAdd: (payload) =>
    api.post("/api/users", payload).then((r) => r.data),
  userUpdate: (id, patch) =>
    api.patch(`/api/users/${id}`, patch).then((r) => r.data),
  userDelete: (id) =>
    api.delete(`/api/users/${id}`).then((r) => r.data),
  userResetPassword: (id, newPassword) =>
    api
      .post(`/api/users/${id}/reset-password`, { newPassword })
      .then((r) => r.data),
  userSetPermissions: (id, payload) =>
    api.patch(`/api/users/${id}/permissions`, payload).then((r) => r.data),
  dashboardWidgets: () =>
    api.get("/api/dashboard/widgets").then((r) => r.data),

  // assignments
  assignments: (params) =>
    api.get("/api/assignments", { params }).then((r) => r.data),
  assignment: (id) =>
    api.get(`/api/assignments/${id}`).then((r) => r.data),
  assignmentAdd: (payload) =>
    api.post("/api/assignments", payload).then((r) => r.data),
  assignmentUpdate: (id, payload) =>
    api.patch(`/api/assignments/${id}`, payload).then((r) => r.data),
  assignmentDelete: (id) =>
    api.delete(`/api/assignments/${id}`).then((r) => r.data),
  assignmentSubmit: (id, payload) =>
    api.post(`/api/assignments/${id}/submit`, payload).then((r) => r.data),
  assignmentGrade: (id, subId, payload) =>
    api
      .patch(`/api/assignments/${id}/submissions/${subId}`, payload)
      .then((r) => r.data),

  // 1:1 messages
  messages: () => api.get("/api/messages").then((r) => r.data),
  messagesSummary: () => api.get("/api/messages/summary").then((r) => r.data),
  messagesContacts: () => api.get("/api/messages/contacts").then((r) => r.data),
  messageThread: (id) => api.get(`/api/messages/${id}`).then((r) => r.data),
  messageStart: (payload) => api.post("/api/messages", payload).then((r) => r.data),
  messageSend: (id, payload) =>
    api.post(`/api/messages/${id}/messages`, payload).then((r) => r.data),
  messageMarkRead: (id) =>
    api.patch(`/api/messages/${id}/read`).then((r) => r.data),

  // year-end class promotion
  promotion: () => api.get("/api/promotion").then((r) => r.data),
  promotionPreview: (payload) =>
    api.post("/api/promotion/preview", payload).then((r) => r.data),
  promotionCommit: (payload) =>
    api.post("/api/promotion/commit", payload).then((r) => r.data),
  promotionCycle: (id) =>
    api.get(`/api/promotion/${id}`).then((r) => r.data),
  promotionRollback: (id) =>
    api.post(`/api/promotion/${id}/rollback`).then((r) => r.data),
};
