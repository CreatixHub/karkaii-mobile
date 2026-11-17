// ==========================================
// KARKAII SCHOOL MANAGEMENT DOMAIN TYPES
// ==========================================

// --- PEOPLE & ADMISSION ---
export interface StudentRecord {
  id: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  grade: string;
  section: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  parentName: string;
  phone: string;
  email: string;
  address: string;
  status: 'Active' | 'Inactive' | 'Transferred' | 'Suspended';
  avatarUrl?: string;
  attendancePercent: number;
}

export interface AdmissionRecord {
  id: string;
  applicationNo: string;
  studentName: string;
  appliedGrade: string;
  guardianName: string;
  phone: string;
  email: string;
  submissionDate: string;
  status: 'Under Review' | 'Interview Scheduled' | 'Accepted' | 'Waitlisted' | 'Rejected';
  feesPaid: boolean;
}

export interface TeacherRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  subjects: string[];
  designation: string;
  qualification: string;
  phone: string;
  email: string;
  rating: number;
  passPercentage: number;
  totalStudents: number;
  status: 'Active' | 'On Leave' | 'Inactive';
  award?: string;
}

export interface StaffRecord {
  id: string;
  staffId: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  joinDate: string;
  status: 'Active' | 'On Leave';
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status: 'Active' | 'Inactive' | 'Invited';
}

// --- ACADEMIC ---
export interface ClassItem {
  id: string;
  name: string;
  numericGrade: number;
  sections: string[];
  classTeacher: string;
  totalStudents: number;
  capacity: number;
  roomNo: string;
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  type: 'Theory' | 'Practical' | 'Both';
  department: string;
  weeklyHours: number;
  credits: number;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: number;
  time: string;
  subject: string;
  teacher: string;
  className: string;
  section: string;
  room: string;
}

export interface HomeworkItem {
  id: string;
  title: string;
  subject: string;
  className: string;
  section: string;
  assignedDate: string;
  dueDate: string;
  totalSubmissions: number;
  totalStudents: number;
  description: string;
  status: 'Open' | 'Evaluated' | 'Closed';
}

export interface ExamItem {
  id: string;
  title: string;
  examType: 'Mid Term' | 'Final Exam' | 'Unit Test' | 'Quiz';
  startDate: string;
  endDate: string;
  classes: string[];
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  totalPapers: number;
}

// --- HRM ---
export interface StaffAttendanceItem {
  id: string;
  staffId: string;
  name: string;
  department: string;
  checkInTime: string;
  checkOutTime: string;
  status: 'Present' | 'Late' | 'Half Day' | 'On Leave' | 'Absent';
  date: string;
}

export interface LeaveRequestItem {
  id: string;
  applicantName: string;
  applicantRole: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Maternity Leave' | 'Emergency Leave';
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
}

export interface HolidayItem {
  id: string;
  title: string;
  date: string;
  dayOfWeek: string;
  type: 'Public Holiday' | 'School Holiday' | 'Observance';
  durationDays: number;
}

export interface DepartmentItem {
  id: string;
  name: string;
  headOfDept: string;
  staffCount: number;
  budgetAllocated: string;
}

// --- FINANCE & ACCOUNTS ---
export interface FeeStructureItem {
  id: string;
  grade: string;
  feeType: string;
  term: 'Annual' | 'Term 1' | 'Term 2' | 'Monthly';
  amount: number;
  dueDate: string;
}

export interface FeeInvoiceItem {
  id: string;
  invoiceNo: string;
  studentName: string;
  grade: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue';
}

export interface ExpenseItem {
  id: string;
  voucherNo: string;
  category: 'Utilities' | 'Maintenance' | 'Salaries' | 'Stationery' | 'Events' | 'Transportation';
  title: string;
  amount: number;
  date: string;
  paidTo: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque';
  status: 'Approved' | 'Pending';
}

// --- CAMPUS OPERATIONS ---
export interface TransportRouteItem {
  id: string;
  routeNumber: string;
  routeName: string;
  startPoint: string;
  endPoint: string;
  pickupStopsCount: number;
  assignedVehicle: string;
  driverName: string;
  driverPhone: string;
  studentCount: number;
  status: 'On Route' | 'Completed' | 'Idle';
}

export interface VehicleItem {
  id: string;
  registrationNo: string;
  vehicleType: 'School Bus' | 'Van' | 'Mini Bus';
  seatingCapacity: number;
  fuelType: 'Diesel' | 'EV' | 'CNG';
  driver: string;
  insuranceExpiry: string;
  gpsStatus: 'Online' | 'Offline';
  status: 'Active' | 'In Maintenance';
}

export interface AssetItem {
  id: string;
  assetCode: string;
  name: string;
  category: 'IT Equipment' | 'Furniture' | 'Laboratory' | 'Sports' | 'Audio/Visual';
  location: string;
  assignedTo: string;
  purchaseDate: string;
  condition: 'Excellent' | 'Good' | 'Needs Repair' | 'Damaged';
}

export interface GatePassItem {
  id: string;
  passNo: string;
  personName: string;
  personType: 'Student' | 'Visitor' | 'Staff' | 'Vendor';
  purpose: string;
  hostName: string;
  issueTime: string;
  exitTime?: string;
  status: 'Issued' | 'Active' | 'Exited' | 'Expired';
}

// --- REPORTS ---
export interface ReportCategoryItem {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  tint: string;
  metricLabel: string;
  metricValue: string;
  trend: string;
  trendDirection: 'up' | 'down';
}

// --- ADMINISTRATION ---
export interface RolePermissionItem {
  id: string;
  role: string;
  description: string;
  usersCount: number;
  permissions: {
    students: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    academics: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    finance: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    staff: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  };
}

export interface SchoolSetting {
  schoolName: string;
  schoolCode: string;
  email: string;
  phone: string;
  address: string;
  currentAcademicYear: string;
  currency: string;
  timezone: string;
}
