# FRONTEND TO MOBILE VERIFICATION MATRIX
## Karkkai School ERP – Expo React Native Implementation

> **Primary Specification**: `Karkaii-Frontend-Module-Map.pdf` (43 pages)  
> **Secondary Reference**: `D:\Agaramsoft\Karkaii\Karkkai Frontend\karkaii-frontend`  
> **Target Project**: `D:\Agaramsoft\Karkaii\Karkkai Mobile App\karkaii-mobile`  
> **Status Values**: `Pending` | `In Progress` | `Implemented` | `Tested` | `Verified` | `Blocked`

---

## Batch 1: Dashboard (4 Pages)

| # | Page Title | Submodule | Frontend Route | PDF Page | Frontend Source File | Target Mobile Screen Path | Status | Verification & Implementation Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Admin Dashboard | Dashboard | `/admin-dashboard` | Page 16 (§6.1.1) | `src/views/dashboard/admin/AdminDashboard.tsx` | `src/components/dashboard/AdminDashboardView.tsx` | Verified | Implemented Welcome banner, 4 KPI tiles, 4 top performers spotlight cards carousel (Janet Daniel, Aaron Fox, Grade X-A, Marcus Vance), and all 20 analytical widgets in exact order: 1. Class Distribution, 2. Risk Matrix, 3. Attendance Heatmap, 4. Attendance Breakdown, 5. Communication Trend, 6. Parent Engagement, 7. Activity Timeline, 8. Parent Messages, 9. Delivery Success, 10. Enrollment Trend, 11. Gender Distribution, 12. Books Issued, 13. Book Availability, 14. Most Borrowed Books, 15. Popular Categories, 16. Fuel Consumption, 17. Fleet Utilization, 18. Live Route Status, 19. Maintenance Timeline, 20. Live Fleet Map. Modals: Add Class Routine & Schedule School Event. |
| 2 | Teacher Dashboard | Dashboard | `/teacher-dashboard` | Page 17 (§6.1.2) | `src/views/dashboard/teacher/TeacherDashboard.tsx` | `src/components/dashboard/TeacherDashboardView.tsx` | Verified | Implemented Teacher Hero card with 4 profile chips (Teacher ID, Department, Designation, Homeroom Class), 10 KPI tiles, Quick Actions row (Take Attendance, Create Assignment, Enter Marks, Announcement), and all 13 widgets in exact order: 1. Today's Timetable (with Live/Scheduled/Done/Next status badges, duration, room, students), 2. AI Insights, 3. Class Performance, 4. My Classes, 5. Assignments, 6. Exam Grading, 7. Attendance Center, 8. Parent Communication, 9. Student Insights, 10. Achievements, 11. Calendar, 12. Activity Timeline, 13. Notifications. Modals: Quick Attendance, Create Assignment, Enter Marks, Broadcast Announcement. |
| 3 | Student Dashboard | Dashboard | `/student-dashboard` | Page 18 (§6.1.3) | `src/views/dashboard/student/StudentDashboard.tsx` | `src/components/dashboard/StudentDashboardView.tsx` | Verified | Implemented Student Hero with tags (Admission No, House, Scholarship, Route #4), 6 KPI tiles (Attendance, GPA, AI Score, Profile, Class Rank, Library Books), Quick Actions row (View Timetable, Submit Work, Hall Ticket, Scorecard), and all 16 widgets: 1. Today's Schedule, 2. AI Learning Insights, 3. Academic Performance (Subject rows with Subject, Teacher, Percent, Class Avg, Grade, Delta), 4. Assignments, 5. Exam Center, 6. Attendance Center, 7. Fee Summary, 8. Learning Progress, 9. Goals, 10. Achievements, 11. My Teachers, 12. Communication, 13. Library, 14. Transport, 15. Calendar, 16. Activity Timeline. Modals: Submit Assignment, Digital Hall Ticket, Request Faculty Meeting. |
| 4 | Parent Dashboard | Dashboard | `/parent-dashboard` | Page 19 (§6.1.4) | `src/views/dashboard/parent/ParentDashboard.tsx` | `src/components/dashboard/ParentDashboardView.tsx` | Verified | Implemented Child Switcher (Emma Watson <-> Lucas Watson with reactive state), Command Bar quick actions (Pay Fees, Report Card, Apply Leave, Teacher Msg), and all 12 widgets: 1. My Children, 2. Subject Vitals, 3. Child Timeline (Today's Journey), 4. Parent Insights, 5. Communication Hub, 6. Live Bus Tracker, 7. Homework Board, 8. Fee Timeline, 9. Exam Hub, 10. Achievement Gallery, 11. Agenda, 12. Smart Notifications. Modals: School Fee Payment, Apply Student Leave, Message Homeroom Teacher, Term Report Card Preview. |

---

## Batch 2: People & Admission (17 Pages)

| # | Page Title | Submodule | Frontend Route | PDF Page | Frontend Source File | Target Mobile Screen Path | Status | Verification & Implementation Notes |
|---|---|---|---|---|---|---|---|---|
| 5 | Students | Students | `/students` | Page 20 (§7.1.1) | `src/views/peoples/students/student-grid/index.tsx` | `src/app/(app)/people.tsx` (Students Tab) | Verified | Card grid with preview panel, summary strip (Total, Present, Pending Fee), student roster with admission no, grade, section, roll, parent, attendance %, and tap-to-inspect 360 profile. |
| 6 | Student Profile | Students | `/student-details` | Page 21 (§7.1.2) | `src/views/peoples/students/student-details` | `src/app/(app)/people.tsx` (Student 360 Modal) | Verified | Full 360-degree profile modal with hero card, personal info (blood group, religion, parents), and tabs: Overview, Fees (installments table with codes & status), Exams (scorecard), Attendance (leave history), and Timeline logs. |
| 7 | Admissions | Students | `/admissions` | Page 21 (§7.1.3) | `src/views/peoples/admissions/admission-grid` | `src/app/(app)/people.tsx` (Admissions Tab) | Verified | Admissions pipeline table with summary strip (Applied, Under Review, Accepted), application no, student, guardian, applied class, date, and interactive Approve/Reject workflow with local state updates. Modal for New Student Admission. |
| 8 | Student Promotion | Students | `/student-promotion` | Page 22 (§7.1.4) | `src/views/peoples/students/student-promotion` | `src/app/(app)/people.tsx` (Promotions Tab) | Verified | Step-by-step promotion wizard interface: Current Grade to Target Promoted Grade mapping, student GPA, promotion status pills, and interactive Confirm Promotion action. |
| 9 | Alumni | Students | `/alumni` | Page 22 (§7.1.5) | `src/views/peoples/alumni/alumni-grid` | `src/app/(app)/people.tsx` (Alumni Tab) | Verified | Alumni network directory: graduating batch pill, higher education institute, current profession/company, contact email, and Connect action. |
| 10 | Student Attendance History | Students | `/student-attendance-history` | Page 22 (§7.1.6) | `src/views/peoples/students/student-attendance-history` | `src/app/(app)/people.tsx` (Attendance History Tab) | Verified | Analytics stat cards (Monthly Rate 98.5%, Present days, Late/Leave days) and chronological day-by-day attendance register log (date, subject, check in/out, teacher, remarks). |
| 11 | Student Documents | Students | `/student-documents` | Page 23 (§7.1.7) | `src/views/peoples/students/student-documents` | `src/app/(app)/people.tsx` (Documents Tab) | Verified | Document vault cards: categories (Identity, Academic, Medical, Transfer), size, upload date, verification badges (Verified/Pending), preview button, and Upload Document modal with category selector. |
| 12 | Teachers | Teachers | `/teachers` | Page 23 (§7.2.1) | `src/views/peoples/teacher/teacher-grid` | `src/app/(app)/people.tsx` (Teachers Directory Tab) | Verified | Faculty directory cards: employee ID, department, subjects list tags, star rating, pass percentage, and tap-to-inspect teacher profile. |
| 13 | Add Teacher | Teachers | `/add-teacher` | Page 23 (§7.2.2) | `src/views/peoples/teacher/teacherForm` | `src/app/(app)/people.tsx` (Add Teacher Modal) | Verified | Form modal with full multi-field sections: Full Name, Department, Subjects, Contact Phone, Email Address, and local save handler adding record to directory. |
| 14 | Teacher Profile | Teachers | `/teacher-details` | Page 24 (§7.2.3) | `src/views/peoples/teacher/teacher-details` | `src/app/(app)/people.tsx` (Teacher Profile Modal) | Verified | Profile modal with employee ID, qualification, department, assigned classes, weekly teaching hours, contact details, and direct messaging channel action. |
| 15 | Routine | Teachers | `/routine-teachers` | Page 24 (§7.2.4) | `src/views/peoples/teacher/teacher-details/teachersRoutine` | `src/app/(app)/people.tsx` (Teacher Routine Tab) | Verified | Timetable routine grid: Day pills (Monday to Friday), periods (Period 1 to 4), time duration, subject, grade section, room, and duration tag. |
| 16 | Staff List | Staff | `/staffs` | Page 24 (§7.3.1) | `src/views/peoples/staff/staff-list` | `src/app/(app)/people.tsx` (Staff Tab) | Verified | Staff register table: employee ID, staff member name, role (Bursar, Librarian, Transport Director, Nurse), department, join date, phone, and status badge. |
| 17 | Departments | Staff | `/departments` | Page 25 (§7.3.2) | `src/views/hrm/departments` | `src/app/(app)/people.tsx` (Departments Tab) | Verified | Department master cards: department name, faculty strength, Head of Department, allocated annual budget, and active status. |
| 18 | Designation | Staff | `/designation` | Page 25 (§7.3.3) | `src/views/hrm/designation` | `src/app/(app)/people.tsx` (Designation Tab) | Verified | Designation master table: job title (PGT Faculty, HOD, Bursar, Librarian), department, hierarchy level, and total staff count holding designation. |
| 19 | Users | Users | `/users` | Page 25 (§7.4.1) | `src/views/userManagement/manage-users` | `src/app/(app)/people.tsx` (Users Tab) | Verified | System login accounts table: real-time online status green dot, user full name, role pill (Superadmin, Teacher, Parent, Student, Accountant), email, last login, and 1-tap Activate/Deactivate toggle. |
| 20 | Roles & Permissions | Users | `/roles-permission` | Page 25 (§7.4.2) | `src/views/userManagement/roles-permissions` | `src/app/(app)/people.tsx` (Roles & Permissions Tab) | Verified | Two-pane permission workspace cards: role name, role type (System, Academic, Administrative, Portal), assigned users count, total permissions granted, and granted category tags. |
| 21 | Delete Account Request | Users | `/delete-account` | Page 26 (§7.4.3) | `src/views/userManagement/deleteRequest` | `src/app/(app)/people.tsx` (Delete Requests Tab) | Verified | GDPR/Privacy account deletion queue table: user name, user ID, email, user type, department, reason for deletion, status badge, and interactive Approve Deletion workflow. |

---

## Batch 3: Academic (8 Pages)

| # | Page Title | Submodule | Frontend Route | PDF Page | Frontend Source File | Target Mobile Screen Path | Status |
|---|---|---|---|---|---|---|---|
| 22 | Classes | Classes & Sections | `/classes` | Page 27 (§8.1.1) | `src/views/academic/classes` | `src/app/(app)/academic.tsx` (Classes Tab) | Pending |
| 23 | Classrooms | Classes & Sections | `/classrooms` | Page 27 (§8.1.2) | `src/views/academic/class-room` | `src/app/(app)/academic.tsx` (Classrooms Tab) | Pending |
| 24 | Sections | Classes & Sections | `/class-section` | Page 28 (§8.1.3) | `src/views/academic/class-section` | `src/app/(app)/academic.tsx` (Sections Tab) | Pending |
| 25 | Subjects | Subjects | `/class-subject` | Page 28 (§8.2) | `src/views/academic/class-subject` | `src/app/(app)/academic.tsx` (Subjects Tab) | Pending |
| 26 | Class Timetable | Timetable | `/class-time-table` | Page 28 (§8.3.1) | `src/views/academic/class-timetable` | `src/app/(app)/academic.tsx` (Class Timetable) | Pending |
| 27 | Teacher Timetable | Timetable | `/teacher-time-table` | Page 28 (§8.3.2) | `src/views/academic/teacher-time-table` | `src/app/(app)/academic.tsx` (Teacher Timetable) | Pending |
| 28 | Study Materials | Learning | `/study-materials` | Page 29 (§8.4.1) | `src/views/academic/study-materials` | `src/app/(app)/academic.tsx` (Study Materials) | Pending |
| 29 | Homework | Learning | `/homework` | Page 29 (§8.4.2) | `src/views/academic/homework` | `src/app/(app)/academic.tsx` (Homework Tab) | Pending |

---

## Batch 4: HRM (5 Pages)

| # | Page Title | Submodule | Frontend Route | PDF Page | Frontend Source File | Target Mobile Screen Path | Status |
|---|---|---|---|---|---|---|---|
| 30 | Holidays | Holidays | `/holidays` | Page 30 (§9.1) | `src/views/hrm/holidays` | `src/app/(app)/hrm.tsx` (Holidays Tab) | Pending |
| 31 | Student Attendance | Attendance | `/student-attendance` | Page 30 (§9.2.1) | `src/views/hrm/attendance/student-attendance` | `src/app/(app)/hrm.tsx` (Student Attendance) | Pending |
| 32 | Teacher Attendance | Attendance | `/teacher-attendance` | Page 30 (§9.2.2) | `src/views/hrm/attendance/teacher-attendance.tsx` | `src/app/(app)/hrm.tsx` (Teacher Attendance) | Pending |
| 33 | Staff Attendance | Attendance | `/staff-attendance` | Page 31 (§9.2.3) | `src/views/hrm/attendance/staff-attendance` | `src/app/(app)/hrm.tsx` (Staff Attendance) | Pending |
| 34 | Leave List | Attendance | `/leave-list` | Page 31 (§9.2.4) | `src/views/hrm/leaves/list-leaves` | `src/app/(app)/hrm.tsx` (Leaves Tab) | Pending |

---

## Batch 5: Finance & Accounts (11 Pages)

| # | Page Title | Submodule | Frontend Route | PDF Page | Frontend Source File | Target Mobile Screen Path | Status |
|---|---|---|---|---|---|---|---|
| 35 | Fee Structure | Fees | `/fees-master` | Page 32 (§10.1.1) | `src/views/finance-accounts/fees/fees-master` | `src/app/(app)/finance.tsx` (Fee Structure) | Pending |
| 36 | Fees Assign | Fees | `/fees-assign` | Page 32 (§10.1.2) | `src/views/finance-accounts/fees/fees-assign` | `src/app/(app)/finance.tsx` (Fees Assign) | Pending |
| 37 | Fee Collection | Fees | `/collect-fees` | Page 33 (§10.1.3) | `src/views/finance-accounts/fees/collect-fees` | `src/app/(app)/finance.tsx` (Fee Collection) | Pending |
| 38 | Fees Type (Fee Categories) | Fees | `/fees-type` | Page 33 (§10.1.4) | `src/views/finance-accounts/fees/fees-type` | `src/app/(app)/finance.tsx` (Fee Types) | Pending |
| 39 | Fee Groups | Fees | `/fees-group` | Page 33 (§10.1.5) | `src/views/finance-accounts/fees/fees-group` | `src/app/(app)/finance.tsx` (Fee Groups) | Pending |
| 40 | Fine Management | Fees | `/fine-management` | Page 33 (§10.1.6) | `src/views/finance-accounts/fees/fine-management` | `src/app/(app)/finance.tsx` (Fine Management) | Pending |
| 41 | Scholarships | Fees | `/scholarships` | Page 34 (§10.1.7) | `src/views/finance-accounts/fees/scholarships` | `src/app/(app)/finance.tsx` (Scholarships) | Pending |
| 42 | Due Reports | Fees | `/due-reports` | Page 34 (§10.1.8) | `src/views/finance-accounts/fees/due-reports` | `src/app/(app)/finance.tsx` (Due Reports) | Pending |
| 43 | Receipts | Fees | `/receipts` | Page 34 (§10.1.9) | `src/views/finance-accounts/fees/receipts` | `src/app/(app)/finance.tsx` (Receipts) | Pending |
| 44 | Expenses | Accounts | `/expenses` | Page 34 (§10.2.1) | `src/views/finance-accounts/accounts/expenses` | `src/app/(app)/finance.tsx` (Expenses) | Pending |
| 45 | Expense Category | Accounts | `/expenses-category` | Page 35 (§10.2.2) | `src/views/finance-accounts/accounts/expenses-category` | `src/app/(app)/finance.tsx` (Expense Categories) | Pending |

---

## Batch 6: Campus Operations (13 Pages)

| # | Page Title | Submodule | Frontend Route | PDF Page | Frontend Source File | Target Mobile Screen Path | Status |
|---|---|---|---|---|---|---|---|
| 46 | Routes | Transport | `/transport-routes` | Page 36 (§11.1.1) | `src/views/campus-operations/transport/routes` | `src/app/(app)/campus.tsx` (Routes Tab) | Pending |
| 47 | Pickup Points | Transport | `/transport-pickup-points` | Page 36 (§11.1.2) | `src/views/campus-operations/transport/pickup-points` | `src/app/(app)/campus.tsx` (Pickup Points) | Pending |
| 48 | Vehicles | Transport | `/transport-vehicles` | Page 37 (§11.1.3) | `src/views/campus-operations/transport/vehicles` | `src/app/(app)/campus.tsx` (Vehicles Tab) | Pending |
| 49 | Drivers | Transport | `/transport-drivers` | Page 37 (§11.1.4) | `src/views/campus-operations/transport/drivers` | `src/app/(app)/campus.tsx` (Drivers Tab) | Pending |
| 50 | Assign Vehicle | Transport | `/transport-assign-vehicle` | Page 37 (§11.1.5) | `src/views/campus-operations/transport/assign-vehicle` | `src/app/(app)/campus.tsx` (Assign Vehicle) | Pending |
| 51 | Assign Students | Transport | `/transport-assign-students` | Page 37 (§11.1.6) | `src/views/campus-operations/transport/assign-students` | `src/app/(app)/campus.tsx` (Assign Students) | Pending |
| 52 | GPS Tracking | Transport | `/transport-gps-tracking` | Page 37 (§11.1.7) | `src/views/campus-operations/transport/gps-tracking` | `src/app/(app)/campus.tsx` (GPS Tracking) | Pending |
| 53 | Route Scheduling | Transport | `/transport-route-scheduling` | Page 38 (§11.1.8) | `src/views/campus-operations/transport/route-scheduling` | `src/app/(app)/campus.tsx` (Route Scheduling) | Pending |
| 54 | Assets | Assets | `/assets` | Page 38 (§11.2.1) | `src/views/campus-operations/assets/register` | `src/app/(app)/campus.tsx` (Assets Tab) | Pending |
| 55 | Asset Allocation | Assets | `/asset-allocation` | Page 38 (§11.2.2) | `src/views/campus-operations/assets/allocation` | `src/app/(app)/campus.tsx` (Asset Allocation) | Pending |
| 56 | Asset Maintenance | Assets | `/asset-maintenance` | Page 38 (§11.2.3) | `src/views/campus-operations/assets/maintenance` | `src/app/(app)/campus.tsx` (Asset Maintenance) | Pending |
| 57 | Stock Management | Assets | `/stock-management` | Page 39 (§11.2.4) | `src/views/campus-operations/assets/stock` | `src/app/(app)/campus.tsx` (Stock Management) | Pending |
| 58 | Gate Pass | Gate Pass | `/gate-pass` | Page 39 (§11.3) | `src/views/campus-operations/security/gate-pass` | `src/app/(app)/campus.tsx` (Gate Pass Tab) | Pending |

---

## Batch 7: Reports (1 Page)

| # | Page Title | Submodule | Frontend Route | PDF Page | Frontend Source File | Target Mobile Screen Path | Status |
|---|---|---|---|---|---|---|---|
| 59 | School Strength Report | School Strength Report | `/school-strength-report` | Page 40 (§12.1) | `src/views/reports/school-strength` | `src/app/(app)/reports.tsx` (Strength Report) | Pending |

---

## Non-Sidebar Supporting Routes & Modules (Discovered in Frontend)

*Documented for reference per Chapter 13 & 15; prioritized for supporting workflows after primary 59 pages:*
- **Communication** (`/communication`): Announcements (`/announcements`), Notice Board (`/notice-board`), Broadcast Scheduler (`/broadcast-scheduler`), SMS Logs (`/sms-logs`), Templates (`/sms-templates`).
- **Campus Extra**: Library Books (`/library-books`), Hostel Rooms (`/hostel-rooms`), Cafeteria Menu (`/cafeteria-menu`).
- **HRM Extra**: Payroll (`/employee-payroll`), Payslips (`/payslips`).
- **Academic Extra**: Exams (`/exams`), Exam Results (`/exam-results`).
- **Administration Extra**: Branches (`/branch-management`), School Profile (`/school-profile`), Academic Years (`/academic-year`), Audit Logs (`/audit-log`).
