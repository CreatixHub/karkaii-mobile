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

export interface AlumniRecord {
  id: string;
  admissionNo: string;
  name: string;
  graduatingBatch: string;
  higherEducation: string;
  currentProfession: string;
  contactEmail: string;
  phone: string;
}

export interface StudentPromotionItem {
  id: string;
  studentName: string;
  currentGrade: string;
  promotedGrade: string;
  gpa: string;
  promotionStatus: 'Promoted' | 'Under Review' | 'Held Back';
  academicYear: string;
}

export interface StudentAttendanceHistoryItem {
  id: string;
  date: string;
  section: string;
  subject: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave';
  timeIn: string;
  timeOut: string;
  teacher: string;
  remarks: string;
}

export interface StudentDocumentItem {
  id: string;
  name: string;
  category: 'Identity' | 'Academic' | 'Medical' | 'Transfer' | 'Other';
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  isFavourite: boolean;
  studentName: string;
  admissionNo: string;
  size: string;
  date: string;
  uploadedBy: string;
}

export interface TeacherRoutineSlot {
  id: string;
  day: string;
  time: string;
  period: string;
  subject: string;
  grade: string;
  room: string;
  duration: string;
}

export interface DeleteAccountRequestItem {
  id: string;
  name: string;
  userId: string;
  email: string;
  userType: 'Student' | 'Teacher' | 'Parent' | 'Employee';
  department: string;
  reason: string;
  requestedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewer: string;
}

// --- ACADEMIC ---
export interface ClassItem {
  id: string;
  name: string;
  numeral: string;
  category: 'Primary' | 'Middle' | 'Secondary' | 'Higher Secondary';
  sections: string[] | string;
  classTeacher: string;
  teacherSubject?: string;
  teacherAvatar?: string;
  totalStudents: number;
  capacity: number;
  roomNo: string;
  numericGrade?: number;
  status: 'Active' | 'New' | 'Inactive' | 'Archived';
  boysCount?: number;
  girlsCount?: number;
  subjectsCount?: number;
}

export interface ClassroomItem {
  id: string;
  name: string;
  roomNo: string;
  building: string;
  floor: string;
  type: 'Lecture Hall' | 'Classroom' | 'Science Lab' | 'Computer Lab' | 'Auditorium';
  capacity: number;
  status: 'Available' | 'Occupied' | 'Maintenance' | 'Reserved' | 'Inactive';
  assignedClass: string;
  teacher: string;
  students: number;
  availableSeats: number;
  year: string;
  facilities: string[];
}

export interface SectionItem {
  id: string;
  name: string;
  className: string;
  year: string;
  classTeacher: string;
  roomNo: string;
  floor: string;
  shift: 'Morning' | 'Afternoon' | 'Evening';
  medium: 'English' | 'Regional';
  students: number;
  capacity: number;
  seatsLeft: number;
  boys: number;
  girls: number;
  status: 'Active' | 'Full' | 'Inactive' | 'Archived';
  note: string;
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  category: 'Core' | 'Elective' | 'Language' | 'Vocational';
  teacher: string;
  className: string;
  section: string;
  year: string;
  department: string;
  type: 'Theory' | 'Practical' | 'Both';
  weeklyHours?: number;
  periods: number;
  credits: number;
  units: number;
  lessons: number;
  assignments: number;
  exams: number;
  resources: number;
  updated: string;
  status: 'Active' | 'Published' | 'Draft' | 'Archived';
  examMarks?: number;
  internalMarks?: number;
  passMarks?: number;
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
  duration?: string;
  tone?: 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'purple';
}

export interface TeacherTimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: number;
  time: string;
  heading: string;
  subject: string;
  className: string;
  section: string;
  room: string;
  mode: 'Teaching' | 'Free Period' | 'Exam Duty' | 'Lab Session' | 'Staff Meeting';
  tone: 'primary' | 'success' | 'warning' | 'info' | 'danger';
  teacherName: string;
  notes?: string;
}

export interface StudyMaterialItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  className?: string;
  chapter: string;
  fileType: 'PDF' | 'PPT' | 'DOC' | 'Video' | 'Audio' | 'Link';
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  downloads: number;
  status: 'Published' | 'Draft' | 'Archived';
  description?: string;
}

export interface HomeworkItem {
  id: string;
  title?: string;
  name?: string;
  subject: string;
  type: 'Assignment' | 'Project' | 'Essay' | 'Problem Set' | 'Lab Report';
  priority: 'High' | 'Medium' | 'Low';
  teacher: string;
  className: string;
  section: string;
  assignedDate?: string;
  assigned?: string;
  dueDate?: string;
  due?: string;
  duration?: string;
  totalSubmissions?: number;
  submitted?: number;
  totalStudents?: number;
  total?: number;
  percent?: number;
  pending?: number;
  late?: number;
  files?: number;
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Evaluated' | 'Overdue' | 'Draft' | 'Open' | 'Closed';
  description: string;
  maxMarks?: number;
}

export interface HomeworkGradingItem {
  homeworkId: string;
  studentName: string;
  rollNo: string;
  submittedDate: string;
  marksObtained: number;
  outOf: number;
  gradeLetter: string;
  rubricScore: string;
  remarks: string;
  feedbackType: 'Appreciation' | 'Improvement' | 'Action Required';
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
export interface StudentAttendanceItem {
  id: string;
  studentName: string;
  admissionNo: string;
  rollNo: string;
  className: string;
  section: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  checkInGate?: string;
  attendancePercent: number;
  status: 'Present' | 'Late' | 'Half Day' | 'On Leave' | 'Absent';
  guardianName: string;
  guardianPhone: string;
  notes?: string;
}

export interface TeacherAttendanceItem {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  subjects: string;
  classes: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  workingHours: string;
  breakTime?: string;
  overtime?: string;
  method: 'Biometric' | 'RFID' | 'Manual';
  status: 'Present' | 'Late' | 'Half Day' | 'On Leave' | 'Absent';
  notes?: string;
}

export interface StaffAttendanceItem {
  id: string;
  staffId: string;
  name: string;
  department: string;
  designation?: string;
  shift?: string;
  checkInTime: string;
  checkOutTime: string;
  workingHours?: string;
  overtime?: string;
  method?: 'Biometric' | 'RFID' | 'Manual';
  status: 'Present' | 'Late' | 'Half Day' | 'On Leave' | 'Absent';
  date: string;
}

export interface LeaveRequestItem {
  id: string;
  applicantName: string;
  applicantRole: string;
  staffId?: string;
  department?: string;
  designation?: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Maternity Leave' | 'Emergency Leave' | string;
  fromDate: string;
  toDate: string;
  from?: string;
  to?: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Forwarded' | 'Cancelled';
  appliedOn: string;
  applied?: string;
  approver?: string;
}

export interface HolidayItem {
  id: string;
  title: string;
  name?: string;
  category?: 'Public' | 'School' | 'Festival' | 'Examination' | 'Optional';
  date: string;
  dayOfWeek: string;
  type: 'Public Holiday' | 'School Holiday' | 'Observance' | string;
  durationDays: number;
  duration?: string;
  start?: string;
  end?: string;
  classes?: string;
  branch?: string;
  description?: string;
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

export interface FeeReceiptItem {
  id: string;
  receiptNo: string;
  invoiceNo: string;
  studentName: string;
  grade: string;
  amountPaid: number;
  paymentMode: 'Cash' | 'Card' | 'Online / UPI' | 'Bank Transfer';
  paymentDate: string;
  collectedBy: string;
}

export interface FeeGroupItem {
  id: string;
  name: string;
  description: string;
  feeTypesCount: number;
  totalAnnualAmount: number;
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

// --- COMMUNICATION ---
export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetAudience: 'All' | 'Teachers' | 'Parents' | 'Students' | 'Staff';
  priority: 'Urgent' | 'General' | 'Academic' | 'Event';
  publishedDate: string;
  author: string;
  attachmentName?: string;
}

export interface BroadcastScheduleItem {
  id: string;
  title: string;
  channel: 'SMS' | 'WhatsApp' | 'Push Notification' | 'Email';
  scheduledTime: string;
  targetGroup: string;
  status: 'Scheduled' | 'Sent' | 'Draft';
  recipientCount: number;
}

export interface MessageLogItem {
  id: string;
  recipientName: string;
  recipientPhone: string;
  channel: 'SMS' | 'WhatsApp';
  messageText: string;
  sentTime: string;
  status: 'Delivered' | 'Sent' | 'Failed';
}

export interface MessageTemplateItem {
  id: string;
  name: string;
  category: 'Fee' | 'Attendance' | 'Exam' | 'General';
  channel: 'SMS' | 'WhatsApp';
  templateBody: string;
}

// --- CAMPUS OPERATIONS EXTENDED ---
export interface LibraryBookItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  rackNumber: string;
  status: 'Available' | 'Low Stock' | 'Checked Out';
}

export interface HostelRoomItem {
  id: string;
  hostelName: string;
  roomNumber: string;
  floor: string;
  roomType: 'Single AC' | 'Double Non-AC' | 'Triple Shared' | 'Dormitory';
  capacity: number;
  occupied: number;
  feePerTerm: number;
  status: 'Available' | 'Full' | 'Maintenance';
}

export interface CafeteriaMenuItem {
  id: string;
  itemName: string;
  category: 'Breakfast' | 'Lunch' | 'Snacks' | 'Beverages';
  price: number;
  calories: number;
  isVeg: boolean;
  isAvailable: boolean;
}

// --- HRM EXTENDED ---
export interface PayrollItem {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'Paid' | 'Processing' | 'Pending';
  paymentDate: string;
}

export interface PayslipItem {
  id: string;
  payslipNumber: string;
  employeeName: string;
  month: string;
  year: number;
  grossPay: number;
  deductions: number;
  netPay: number;
}

export interface DesignationItem {
  id: string;
  title: string;
  department: string;
  totalHolders: number;
  level: string;
}

// --- ACADEMIC EXTENDED ---
export interface ExamResultItem {
  id: string;
  studentName: string;
  rollNo: string;
  grade: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  gradeLetter: string;
  remarks: string;
}

// --- ADMINISTRATION EXTENDED ---
export interface BranchItem {
  id: string;
  name: string;
  campusCode: string;
  address: string;
  principal: string;
  totalStudents: number;
  phone: string;
  email: string;
  isMain: boolean;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  ipAddress: string;
  status: 'Success' | 'Warning' | 'Failed';
}

