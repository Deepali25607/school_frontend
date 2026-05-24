// Centralized mock data — mirrors backend response shapes so we can swap
// `axios` calls in seamlessly once the API is live.

export const STATS = {
  totalStudents: 1842,
  totalTeachers: 124,
  feeCollected: 8420000,
  feePending: 1234500,
  attendanceToday: 92.4,
  upcomingExams: 6,
};

export const ATTENDANCE_TREND = [
  { day: "Mon", present: 92, absent: 8 },
  { day: "Tue", present: 95, absent: 5 },
  { day: "Wed", present: 89, absent: 11 },
  { day: "Thu", present: 93, absent: 7 },
  { day: "Fri", present: 90, absent: 10 },
  { day: "Sat", present: 88, absent: 12 },
];

export const FEE_BREAKDOWN = [
  { name: "Tuition", value: 5200000, color: "#5b81ff" },
  { name: "Transport", value: 1100000, color: "#ff5ec4" },
  { name: "Hostel", value: 820000, color: "#9b5cff" },
  { name: "Exam", value: 480000, color: "#ffd166" },
  { name: "Library", value: 220000, color: "#5cf2c4" },
];

export const RECENT_ACTIVITY = [
  { id: 1, type: "fee", text: "Aarav Sharma paid ₹12,400 (Term-2 Tuition)", time: "2m ago" },
  { id: 2, type: "attendance", text: "Class 10-B attendance marked by M. Chen", time: "8m ago" },
  { id: 3, type: "admission", text: "New admission: Zoya Khan, Grade 6", time: "21m ago" },
  { id: 4, type: "exam", text: "Mid-term schedule published for Grade 9", time: "1h ago" },
  { id: 5, type: "transport", text: "Bus 12 delayed by 8 min — route notified", time: "2h ago" },
];

const firstNames = [
  "Aarav", "Diya", "Vivaan", "Anaya", "Arjun", "Saanvi", "Reyansh", "Aadhya",
  "Krishna", "Myra", "Ayaan", "Ira", "Vihaan", "Pari", "Kabir", "Aanya",
  "Ishaan", "Riya", "Aryan", "Anika", "Atharv", "Navya", "Dhruv", "Tara",
];
const lastNames = [
  "Sharma", "Verma", "Iyer", "Khan", "Patel", "Reddy", "Mehta", "Singh",
  "Gupta", "Joshi", "Kapoor", "Bose", "Chowdhury", "Nair", "Rao",
];
const sections = ["A", "B", "C", "D"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let _students = null;
export function getStudents() {
  if (_students) return _students;
  const list = [];
  for (let i = 1; i <= 60; i++) {
    const fn = pick(firstNames);
    const ln = pick(lastNames);
    const grade = Math.floor(Math.random() * 12) + 1;
    list.push({
      id: `STU${String(1000 + i)}`,
      name: `${fn} ${ln}`,
      avatar: (fn[0] + ln[0]).toUpperCase(),
      grade,
      section: pick(sections),
      attendance: 75 + Math.floor(Math.random() * 25),
      feeStatus: ["Paid", "Pending", "Partial", "Paid", "Paid"][i % 5],
      parent: `${pick(firstNames)} ${ln}`,
      contact: `+91 9${Math.floor(100000000 + Math.random() * 899999999)}`,
      gpa: (2.5 + Math.random() * 1.5).toFixed(2),
      house: pick(["Crimson", "Azure", "Emerald", "Amber"]),
    });
  }
  _students = list;
  return list;
}

let _teachers = null;
export function getTeachers() {
  if (_teachers) return _teachers;
  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Geography", "Computer Sci", "PE", "Art"];
  const list = [];
  for (let i = 1; i <= 24; i++) {
    const fn = pick(firstNames);
    const ln = pick(lastNames);
    list.push({
      id: `TCH${100 + i}`,
      name: `${fn} ${ln}`,
      avatar: (fn[0] + ln[0]).toUpperCase(),
      subject: pick(subjects),
      classes: Math.floor(2 + Math.random() * 5),
      experience: 1 + Math.floor(Math.random() * 18),
      rating: (3.6 + Math.random() * 1.4).toFixed(1),
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@lumina.edu`,
      status: Math.random() > 0.2 ? "Active" : "On leave",
    });
  }
  _teachers = list;
  return list;
}

export function getAttendanceForToday() {
  const students = getStudents();
  return students.slice(0, 30).map((s) => ({
    ...s,
    status: ["Present", "Present", "Present", "Present", "Absent", "Late", "Present", "Leave"][Math.floor(Math.random() * 8)],
  }));
}

export function getFeeLedger() {
  const students = getStudents();
  return students.slice(0, 40).map((s) => ({
    id: s.id,
    name: s.name,
    grade: s.grade,
    section: s.section,
    total: 45000 + Math.floor(Math.random() * 25000),
    paid: 0,
    pending: 0,
    status: s.feeStatus,
  })).map((r) => {
    const ratio = r.status === "Paid" ? 1 : r.status === "Partial" ? 0.5 : r.status === "Pending" ? 0 : 1;
    r.paid = Math.floor(r.total * ratio);
    r.pending = r.total - r.paid;
    return r;
  });
}

export const ANNOUNCEMENTS = [
  { id: 1, title: "Annual Sports Day — Sign-ups open", body: "Track, field & e-sports events. Registration closes Friday.", tag: "Events" },
  { id: 2, title: "Parent–Teacher meeting Saturday", body: "Grades 6–10 from 9:00 AM, Grades 11–12 from 2:00 PM.", tag: "PTM" },
  { id: 3, title: "Library digital catalog live", body: "Browse, reserve, and renew books from the new portal.", tag: "Library" },
];
