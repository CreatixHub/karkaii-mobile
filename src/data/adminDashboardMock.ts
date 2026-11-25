export interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaDirection: 'up' | 'down';
  icon: string;
  iconBg: string;
  iconColor: string;
}

export interface SpotlightCardItem {
  id: string;
  category: string;
  name: string;
  subtitle: string;
  achievement: string;
  rating: number;
  statLabel: string;
  statValue: string;
  badgeColor: string;
  avatarBg: string;
  icon: string;
}

/* =========================================================================
   1. ADMIN DASHBOARD DATA (PDF Page 16, §6.1.1)
   ========================================================================= */

export const ADMIN_DASHBOARD_DATA = {
  schoolName: 'Karkkai International School',
  academicYear: 'AY 2026-27',
  dateFormatted: 'Wed, 18 Nov 2026',

  // Welcome Header KPIs
  welcomeKpis: [
    {
      id: 'attendance',
      label: "Today's Attendance",
      value: '94.8%',
      delta: '+0.8%',
      deltaDirection: 'up' as const,
      icon: 'check-square',
      iconBg: '#10b98115',
      iconColor: '#10b981',
    },
    {
      id: 'admissions',
      label: 'New Admissions',
      value: '128',
      delta: '+12',
      deltaDirection: 'up' as const,
      icon: 'user-plus',
      iconBg: '#3D5EE115',
      iconColor: '#3D5EE1',
    },
    {
      id: 'fees',
      label: 'Fees Today',
      value: '$48.6K',
      delta: '+3.2%',
      deltaDirection: 'up' as const,
      icon: 'dollar-sign',
      iconBg: '#f59e0b15',
      iconColor: '#f59e0b',
    },
    {
      id: 'exams',
      label: 'Upcoming Exams',
      value: '09',
      delta: 'in 2d',
      deltaDirection: 'down' as const,
      icon: 'file-text',
      iconBg: '#8b5cf615',
      iconColor: '#8b5cf6',
    },
  ] as DashboardKpi[],

  // Top of page Spotlights
  spotlightCards: [
    {
      id: 'sp-1',
      category: 'Top Student Performer',
      name: 'Janet Daniel',
      subtitle: 'Grade X-A • Science Stream',
      achievement: 'National Olympiad Rank 1',
      rating: 5.0,
      statLabel: 'Term Avg',
      statValue: '98.4%',
      badgeColor: '#3D5EE1',
      avatarBg: '#3D5EE115',
      icon: 'award',
    },
    {
      id: 'sp-2',
      category: 'Outstanding Faculty',
      name: 'Aaron Fox',
      subtitle: 'Dept of Mathematics & Computing',
      achievement: 'Teacher of the Year 2026',
      rating: 4.9,
      statLabel: 'Class Avg',
      statValue: '92.6%',
      badgeColor: '#10b981',
      avatarBg: '#10b98115',
      icon: 'user-check',
    },
    {
      id: 'sp-3',
      category: 'Best Attendance Class',
      name: 'Grade X-A (Senior)',
      subtitle: 'Class Teacher: Aaron Fox',
      achievement: '100% On-time Arrival Record',
      rating: 5.0,
      statLabel: 'Attendance',
      statValue: '99.2%',
      badgeColor: '#0ea5e9',
      avatarBg: '#0ea5e915',
      icon: 'calendar',
    },
    {
      id: 'sp-4',
      category: 'Sports Champion',
      name: 'Marcus Vance',
      subtitle: 'Grade XI-B • Red Hawks House',
      achievement: 'State Athletics Gold (100m Sprint)',
      rating: 4.8,
      statLabel: 'Points',
      statValue: '1,450',
      badgeColor: '#f59e0b',
      avatarBg: '#f59e0b15',
      icon: 'zap',
    },
  ] as SpotlightCardItem[],

  // Widget 1: Class Distribution
  classDistribution: {
    totalEnrolled: 3654,
    yoyGrowth: '+4.6% YoY',
    levels: [
      { name: 'Pre-Primary (KG)', count: 312, percent: 9, barColor: '#8b5cf6' },
      { name: 'Primary (I–V)', count: 1180, percent: 32, barColor: '#3D5EE1' },
      { name: 'Middle (VI–VIII)', count: 902, percent: 25, barColor: '#0ea5e9' },
      { name: 'Secondary (IX–X)', count: 748, percent: 20, barColor: '#10b981' },
      { name: 'Senior (XI–XII)', count: 512, percent: 14, barColor: '#f59e0b' },
    ],
  },

  // Widget 2: Risk Matrix
  riskMatrix: {
    totalAssessed: 3654,
    healthPercent: '78% Healthy',
    lowRisk: { count: 2851, percent: 78, color: '#10b981' },
    mediumRisk: { count: 642, percent: 18, color: '#f59e0b' },
    highRisk: { count: 161, percent: 4, color: '#ef4444' },
  },

  // Widget 3: Attendance Heatmap (Weekly by Wing)
  attendanceHeatmap: [
    { wing: 'Primary Wing', mon: 96, tue: 95, wed: 97, thu: 94, fri: 93, sat: 91 },
    { wing: 'Middle Wing', mon: 94, tue: 93, wed: 95, thu: 96, fri: 92, sat: 90 },
    { wing: 'Senior Wing', mon: 98, tue: 97, wed: 96, thu: 95, fri: 94, sat: 92 },
  ],

  // Widget 4: Attendance Breakdown
  attendanceBreakdown: {
    overallPercentage: 94.8,
    presentCount: 3464,
    absentCount: 190,
    leaveCount: 64,
    lateCount: 37,
  },

  // Widget 5: Communication Trend
  communicationTrend: {
    totalMessages: '24,850',
    growth: '+14% this month',
    channels: [
      { channel: 'WhatsApp Alerts', count: '14,200', percent: 57, color: '#22c55e' },
      { channel: 'SMS Gateways', count: '6,450', percent: 26, color: '#3b82f6' },
      { channel: 'Mobile App Push', count: '2,900', percent: 12, color: '#8b5cf6' },
      { channel: 'Email Digests', count: '1,300', percent: 5, color: '#f59e0b' },
    ],
  },

  // Widget 6: Parent Engagement
  parentEngagement: {
    portalLoginRate: '92.4%',
    messageReadRate: '96.1%',
    ptmAttendanceRate: '88.5%',
    feeResponseRate: '81.2%',
  },

  // Widget 7: Activity Timeline
  recentActivities: [
    {
      id: 'act-1',
      title: 'Term 1 Fee Collected',
      detail: 'Ethan Davis (Grade X-B) paid $1,250 via Online Portal',
      time: '12m ago',
      icon: 'credit-card',
      color: '#10b981',
    },
    {
      id: 'act-2',
      title: 'New Admission Registered',
      detail: 'Sophia Williams enrolled in Grade VII-A',
      time: '45m ago',
      icon: 'user-check',
      color: '#3D5EE1',
    },
    {
      id: 'act-3',
      title: 'Annual Sports Day Circular Published',
      detail: 'Notice sent to all parents & homeroom staff',
      time: '2h ago',
      icon: 'bell',
      color: '#f59e0b',
    },
    {
      id: 'act-4',
      title: 'Mathematics Unit Test Scores Finalized',
      detail: 'Aaron Fox posted results for Grade IX-A (Avg 86%)',
      time: '4h ago',
      icon: 'award',
      color: '#8b5cf6',
    },
  ],

  // Widget 8: Parent Messages
  parentMessages: [
    {
      id: 'pm-1',
      parent: 'Eleanor Vance',
      student: 'Marcus Vance (XI-B)',
      message: 'Kindly grant leave for athletic state trials on Friday.',
      time: '25m ago',
      status: 'Pending',
    },
    {
      id: 'pm-2',
      parent: 'David Daniel',
      student: 'Janet Daniel (X-A)',
      message: 'Acknowledged the Olympiad felicitations letter. Thank you!',
      time: '1h ago',
      status: 'Replied',
    },
    {
      id: 'pm-3',
      parent: 'Sarah Jenkins',
      student: 'Oliver Jenkins (VII-A)',
      message: 'Please update route #4 evening drop-off timing.',
      time: '3h ago',
      status: 'Pending',
    },
  ],

  // Widget 9: Delivery Success
  deliverySuccess: [
    { channel: 'WhatsApp', successRate: '99.4%', sent: 14200, failed: 85, color: '#22c55e' },
    { channel: 'SMS', successRate: '98.1%', sent: 6450, failed: 122, color: '#3b82f6' },
    { channel: 'App Push', successRate: '96.8%', sent: 2900, failed: 92, color: '#8b5cf6' },
    { channel: 'Email', successRate: '97.5%', sent: 1300, failed: 32, color: '#f59e0b' },
  ],

  // Widget 10: Enrollment Trend
  enrollmentTrend: {
    currentYearAdmissions: 342,
    previousYearAdmissions: 310,
    withdrawn: 14,
    netGrowth: '+10.3%',
  },

  // Widget 11: Gender Distribution
  genderDistribution: {
    boysCount: 1900,
    boysPercent: 52,
    girlsCount: 1754,
    girlsPercent: 48,
  },

  // Widget 12: Books Issued
  booksIssued: {
    totalIssuedThisMonth: 1240,
    returnedOnTime: '91%',
    overdueNoticeSent: 42,
  },

  // Widget 13: Book Availability
  bookAvailability: {
    totalCatalog: 14500,
    availableInStalls: 11250,
    currentlyCheckedOut: 2850,
    underBinding: 400,
  },

  // Widget 14: Most Borrowed Books
  mostBorrowedBooks: [
    { title: 'A Brief History of Time', author: 'Stephen Hawking', count: 184, category: 'Physics' },
    { title: 'Advanced Calculus & Analysis', author: 'Dr. James Stewart', count: 162, category: 'Mathematics' },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', count: 145, category: 'Literature' },
    { title: 'The Double Helix', author: 'James D. Watson', count: 128, category: 'Biology' },
  ],

  // Widget 15: Popular Categories
  popularCategories: [
    { name: 'Pure Sciences', percentage: 38, count: '5,510 books', color: '#3D5EE1' },
    { name: 'Literature & Fiction', percentage: 26, count: '3,770 books', color: '#10b981' },
    { name: 'World History & Civics', percentage: 18, count: '2,610 books', color: '#f59e0b' },
    { name: 'Computer Science & AI', percentage: 18, count: '2,610 books', color: '#8b5cf6' },
  ],

  // Widget 16: Fuel Consumption
  fuelConsumption: {
    monthlySpend: '$3,840',
    distanceCovered: '16,240 km',
    avgEconomy: '12.4 km/L',
    efficiencyDelta: '+4.2% optimized',
  },

  // Widget 17: Fleet Utilization
  fleetUtilization: {
    totalFleet: 16,
    activeOnRoad: 14,
    inMaintenance: 1,
    standbySpare: 1,
    occupancyRate: '92.6%',
  },

  // Widget 18: Live Route Status
  liveRouteStatus: [
    { route: 'Route #1 (North Metro)', vehicle: 'Bus KA-01-EA-1042', driver: 'Rajesh Kumar', status: 'On Time', nextStop: 'Oakwood Crossing', delay: '0 min', color: '#10b981' },
    { route: 'Route #4 (South Valley)', vehicle: 'Bus KA-01-EA-2084', driver: 'Suresh Nair', status: 'Delayed', nextStop: 'Pine Hill Circle', delay: '+6 mins', color: '#f59e0b' },
    { route: 'Route #7 (East Campus)', vehicle: 'Bus KA-01-EA-3190', driver: 'Anand Verma', status: 'On Time', nextStop: 'Rosewood Boulevard', delay: '0 min', color: '#10b981' },
    { route: 'Route #11 (West Express)', vehicle: 'Bus KA-01-EA-4215', driver: 'Kiran Patel', status: 'Trip Completed', nextStop: 'School Depot', delay: '0 min', color: '#3D5EE1' },
  ],

  // Widget 19: Maintenance Timeline
  maintenanceTimeline: [
    { vehicle: 'Bus #04 (KA-01-EA-2084)', service: 'Comprehensive Brake & Engine Tuning', date: 'Nov 22, 2026', garage: 'Apex Fleet Motors', status: 'Scheduled' },
    { vehicle: 'Bus #08 (KA-01-EA-5120)', service: 'Mandatory RTO Fitness & Emission Test', date: 'Nov 28, 2026', garage: 'Govt RTO Testing Center', status: 'Pending' },
    { vehicle: 'Van #02 (KA-01-EA-6012)', service: 'Air Conditioning System Overhaul', date: 'Dec 04, 2026', garage: 'CoolAir Auto Works', status: 'Scheduled' },
  ],

  // Widget 20: Live Fleet Map
  liveFleetMap: {
    depotLocation: 'Main Campus East Gate',
    gpsSatelliteSync: 'Connected (16/16 vehicles GPS active)',
    speedAlertsToday: 0,
    geofenceBreaches: 0,
  },
};

/* =========================================================================
   2. TEACHER DASHBOARD DATA (PDF Page 17, §6.1.2)
   ========================================================================= */

export const TEACHER_DASHBOARD_DATA = {
  profile: {
    name: 'Aaron Fox',
    teacherId: 'TCH-2024-042',
    department: 'Mathematics & Computing',
    designation: 'Senior Faculty & Homeroom Head',
    homeroomClass: 'Grade X-A',
    email: 'aaron.fox@karkaii.edu',
    phone: '+1 (555) 234-8901',
  },

  // 10 KPI Tiles
  kpis: [
    { id: 'schedule', label: "Today's Schedule", value: '4 Classes', delta: '3.5 Teaching hrs', deltaDirection: 'up' as const, icon: 'clock', iconBg: '#3D5EE115', iconColor: '#3D5EE1' },
    { id: 'hours', label: 'Teaching Hours', value: '3.5 hrs', delta: '25 hrs / wk', deltaDirection: 'up' as const, icon: 'book-open', iconBg: '#10b98115', iconColor: '#10b981' },
    { id: 'upcoming', label: 'Upcoming Classes', value: '2 Classes', delta: 'Next at 11:30 AM', deltaDirection: 'up' as const, icon: 'calendar', iconBg: '#f59e0b15', iconColor: '#f59e0b' },
    { id: 'att_today', label: 'Attendance Today', value: '98.2%', delta: '+1.4% avg', deltaDirection: 'up' as const, icon: 'check-square', iconBg: '#0ea5e915', iconColor: '#0ea5e9' },
    { id: 'profile', label: 'Profile Completion', value: '100%', delta: 'Verified', deltaDirection: 'up' as const, icon: 'shield', iconBg: '#8b5cf615', iconColor: '#8b5cf6' },
    { id: 'ai_score', label: 'AI Teaching Score', value: '9.4 / 10', delta: 'Top 5% Faculty', deltaDirection: 'up' as const, icon: 'zap', iconBg: '#ec489915', iconColor: '#ec4899' },
    { id: 'classes', label: "Today's Classes", value: '4 Sections', delta: 'X-A, IX-B, XI-A, X-B', deltaDirection: 'up' as const, icon: 'layers', iconBg: '#3D5EE115', iconColor: '#3D5EE1' },
    { id: 'present', label: 'Students Present', value: '142 Students', delta: '97.2%', deltaDirection: 'up' as const, icon: 'user-check', iconBg: '#10b98115', iconColor: '#10b981' },
    { id: 'absent', label: 'Students Absent', value: '4 Students', delta: 'Leaves logged', deltaDirection: 'down' as const, icon: 'user-x', iconBg: '#ef444415', iconColor: '#ef4444' },
    { id: 'grading', label: 'Assignments Pending', value: '18 Papers', delta: 'Due tomorrow', deltaDirection: 'down' as const, icon: 'clipboard', iconBg: '#f59e0b15', iconColor: '#f59e0b' },
  ],

  // Widget 1: Today's Timetable
  todayTimetable: [
    { id: 'tt-1', time: '09:00 - 09:45 AM', duration: '45m', subject: 'Advanced Mathematics', grade: 'Grade X-A', room: 'Room 204', students: 38, status: 'Done' as const },
    { id: 'tt-2', time: '10:00 - 10:45 AM', duration: '45m', subject: 'Calculus & Geometry', grade: 'Grade IX-B', room: 'Room 108', students: 36, status: 'Live' as const },
    { id: 'tt-3', time: '11:45 - 12:30 PM', duration: '45m', subject: 'Linear Algebra Lab', grade: 'Grade XI-A', room: 'Math Lab 1', students: 34, status: 'Next' as const },
    { id: 'tt-4', time: '02:00 - 02:45 PM', duration: '45m', subject: 'Remedial Problem Solving', grade: 'Grade X-B', room: 'Room 204', students: 34, status: 'Scheduled' as const },
  ],

  // Widget 2: AI Insights
  aiInsights: [
    { title: 'Quadratic Equations Remedial', suggestion: '7 students in Grade X-A scored below 70% in parabolic factoring. Recommend a 15-min practice drill before Friday.', tag: 'Academic Tip' },
    { title: 'High Attendance Momentum', suggestion: 'Homeroom Grade X-A reached 99.2% attendance for two consecutive weeks. Nominated for Monthly Best Class.', tag: 'Commendation' },
  ],

  // Widget 3: Class Performance
  classPerformance: [
    { className: 'Grade X-A', subject: 'Mathematics', avgScore: '89.4%', passRate: '100%', syllabus: 88 },
    { className: 'Grade IX-B', subject: 'Geometry', avgScore: '82.6%', passRate: '97%', syllabus: 82 },
    { className: 'Grade XI-A', subject: 'Adv Calculus', avgScore: '92.1%', passRate: '100%', syllabus: 76 },
    { className: 'Grade X-B', subject: 'Mathematics', avgScore: '78.5%', passRate: '94%', syllabus: 85 },
  ],

  // Widget 4: My Classes
  myClasses: [
    { name: 'Grade X - Section A', role: 'Class Teacher & Math Head', strength: 38, nextClass: 'Tomorrow 09:00 AM', room: 'Room 204' },
    { name: 'Grade IX - Section B', role: 'Subject Faculty', strength: 36, nextClass: 'Today 10:00 AM', room: 'Room 108' },
    { name: 'Grade XI - Section A', role: 'Higher Secondary Math', strength: 34, nextClass: 'Today 11:45 AM', room: 'Math Lab 1' },
  ],

  // Widget 5: Assignments
  assignments: [
    { id: 'as-1', title: 'Polynomial Factorization Set #4', grade: 'Grade X-A', due: 'Tomorrow, 5:00 PM', submittedCount: 34, totalCount: 38, urgent: true },
    { id: 'as-2', title: 'Coordinate Geometry Worksheet', grade: 'Grade IX-B', due: 'Nov 21, 11:59 PM', submittedCount: 22, totalCount: 36, urgent: false },
    { id: 'as-3', title: 'Calculus Continuity Theorems', grade: 'Grade XI-A', due: 'Nov 24, 5:00 PM', submittedCount: 12, totalCount: 34, urgent: false },
  ],

  // Widget 6: Exam Grading
  examGrading: [
    { title: 'Term 1 Midterm Algebra Papers', grade: 'Grade X-A', graded: 38, total: 38, status: 'Complete (100%)', color: '#10b981' },
    { title: 'Unit Test 3 Geometry Review', grade: 'Grade IX-B', graded: 18, total: 36, status: 'In Progress (50%)', color: '#f59e0b' },
  ],

  // Widget 7: Attendance Center
  attendanceSummary: {
    homeroom: 'Grade X-A',
    presentToday: 37,
    absentToday: 1,
    onLeave: 0,
    attendanceRate: '97.4%',
  },

  // Widget 8: Parent Communication
  parentQueries: [
    { id: 'pq-1', parent: 'David Daniel', student: 'Janet Daniel (X-A)', topic: 'Math Olympiad Prep Material', time: '1h ago', unread: true },
    { id: 'pq-2', parent: 'Rachel Green', student: 'Leo Green (X-A)', topic: 'Sick Leave Medical Note', time: '3h ago', unread: false },
  ],

  // Widget 9: Student Insights
  studentInsights: {
    topPerformer: 'Janet Daniel (Avg 98.4%)',
    mostImproved: 'Liam Chen (+14% score increase)',
    needsAttention: 'Noah Miller (Missed 2 homework sets)',
  },

  // Widget 10: Achievements
  achievements: [
    { title: 'National Mathematics Olympiad Mentor 2026', date: 'Oct 2026', badge: 'Gold' },
    { title: 'Best Homeroom Teacher Q3', date: 'Sep 2026', badge: 'Honor' },
  ],

  // Widget 11: Calendar & Schedule
  upcomingEvents: [
    { title: 'Mathematics Department Review', date: 'Nov 20, 3:30 PM', venue: 'Faculty Lounge' },
    { title: 'Inter-School Science & Math Fair', date: 'Nov 26, 9:00 AM', venue: 'Main Auditorium' },
  ],

  // Widget 12: Activity Timeline
  timelineLogs: [
    { time: '09:45 AM', action: 'Completed Period 1 class with Grade X-A' },
    { time: '08:30 AM', action: 'Marked daily attendance for Grade X-A homeroom' },
    { time: 'Yesterday', action: 'Published Polynomial Factorization Worksheet #4' },
  ],

  // Widget 13: Notifications
  notifications: [
    { id: 'notif-1', title: 'Winter Vacation Circular Published', time: '2h ago', urgent: false },
    { id: 'notif-2', title: 'Staff Council Meeting at 4:00 PM Today', time: '4h ago', urgent: true },
  ],
};

/* =========================================================================
   3. STUDENT DASHBOARD DATA (PDF Page 18, §6.1.3)
   ========================================================================= */

export const STUDENT_DASHBOARD_DATA = {
  profile: {
    name: 'Janet Daniel',
    admissionNo: 'AD1256589',
    grade: 'Grade X - Section A',
    rollNo: '35013',
    house: 'Emerald Green',
    academicYear: '2026 - 2027',
    tags: ['Scholarship Holder', 'School Bus Route #4', 'Day Scholar'],
    classTeacher: 'Aaron Fox',
  },

  // 6 KPI Tiles
  kpis: [
    { id: 'att', label: 'Attendance', value: '98.5%', delta: '162/165 Days', deltaDirection: 'up' as const, icon: 'check-circle', iconBg: '#10b98115', iconColor: '#10b981' },
    { id: 'gpa', label: 'Current GPA', value: '3.98', delta: 'Top 1% Percentile', deltaDirection: 'up' as const, icon: 'award', iconBg: '#3D5EE115', iconColor: '#3D5EE1' },
    { id: 'ai_score', label: 'AI Learning Score', value: '94%', delta: '+5% this term', deltaDirection: 'up' as const, icon: 'zap', iconBg: '#ec489915', iconColor: '#ec4899' },
    { id: 'profile', label: 'Profile Completion', value: '100%', delta: 'Verified Info', deltaDirection: 'up' as const, icon: 'shield', iconBg: '#8b5cf615', iconColor: '#8b5cf6' },
    { id: 'rank', label: 'Class Rank', value: 'Rank #1', delta: 'Out of 38 Students', deltaDirection: 'up' as const, icon: 'star', iconBg: '#f59e0b15', iconColor: '#f59e0b' },
    { id: 'books', label: 'Library Books', value: '2 Issued', delta: 'No Overdue', deltaDirection: 'up' as const, icon: 'book', iconBg: '#0ea5e915', iconColor: '#0ea5e9' },
  ],

  // Widget 1: Today's Schedule
  todaySchedule: [
    { id: 'ts-1', time: '09:00 - 09:45 AM', subject: 'Advanced Mathematics', teacher: 'Aaron Fox', room: 'Room 204', active: false },
    { id: 'ts-2', time: '10:00 - 10:45 AM', subject: 'Physics (Optics)', teacher: 'Sarah Mitchell', room: 'Physics Lab 1', active: true },
    { id: 'ts-3', time: '11:30 - 12:15 PM', subject: 'English Literature', teacher: 'Clara Oswald', room: 'Room 102', active: false },
    { id: 'ts-4', time: '02:00 - 02:45 PM', subject: 'Computer Science Lab', teacher: 'Amanda Ross', room: 'CS Lab 3', active: false },
  ],

  // Widget 2: AI Learning Insights
  aiInsights: [
    { title: 'Olympiad Preparation Momentum', desc: 'Outstanding precision in Calculus. Strengthen Organic Chemistry mechanism problems for the December National Exam.', icon: 'award' },
    { title: 'Revision Reminder', desc: 'English Literature Macbeth essay due in 2 days. Draft is ready for final teacher submission.', icon: 'clock' },
  ],

  // Widget 3: Academic Performance (Subject rows with class avg & delta)
  subjectPerformance: [
    { subject: 'Advanced Mathematics', teacher: 'Aaron Fox', percent: '98.5%', classAvg: '86.2%', grade: 'A+', delta: '+12.3%', color: '#3D5EE1' },
    { subject: 'Physics & Optics', teacher: 'Sarah Mitchell', percent: '96.0%', classAvg: '81.4%', grade: 'A+', delta: '+14.6%', color: '#10b981' },
    { subject: 'Chemistry (Organic)', teacher: 'Dr. Bruce Banner', percent: '92.5%', classAvg: '78.0%', grade: 'A', delta: '+14.5%', color: '#0ea5e9' },
    { subject: 'English Literature', teacher: 'Clara Oswald', percent: '94.0%', classAvg: '84.5%', grade: 'A', delta: '+9.5%', color: '#f59e0b' },
    { subject: 'Computer Science', teacher: 'Amanda Ross', percent: '99.0%', classAvg: '88.0%', grade: 'A+', delta: '+11.0%', color: '#8b5cf6' },
  ],

  // Widget 4: Assignments
  assignments: [
    { id: 'a1', title: 'Polynomial Factorization Set #4', subject: 'Mathematics', due: 'Tomorrow, 5:00 PM', status: 'Pending', priority: 'High' },
    { id: 'a2', title: 'Ray Optics Ray Diagrams', subject: 'Physics', due: 'Nov 21, 11:59 PM', status: 'Submitted', priority: 'Medium' },
    { id: 'a3', title: 'Macbeth Character Analysis', subject: 'English', due: 'Nov 22, 5:00 PM', status: 'Pending', priority: 'High' },
  ],

  // Widget 5: Exam Center
  upcomingExams: [
    { title: 'Mathematics Midterm Exam', date: 'Nov 25, 09:30 AM', room: 'Hall A', syllabus: 'Units 1-6' },
    { title: 'Physics Practical Assessment', date: 'Nov 28, 11:00 AM', room: 'Physics Lab 1', syllabus: 'Optics & Mechanics' },
  ],

  // Widget 6: Attendance Center
  attendanceCenter: {
    monthlyRate: '98.5%',
    daysPresent: 162,
    daysAbsent: 3,
    lateArrivals: 0,
  },

  // Widget 7: Fee Summary
  feeSummary: {
    totalTermFee: '$2,400',
    amountPaid: '$2,400',
    pendingDue: '$0.00',
    status: 'Fully Paid (Term 1 & 2)',
    receiptNo: 'REC-2026-9921',
  },

  // Widget 8: Learning Progress
  learningProgress: [
    { subject: 'Mathematics', progress: 88, topicsCovered: '22 / 25 Topics' },
    { subject: 'Physics', progress: 84, topicsCovered: '18 / 22 Topics' },
    { subject: 'Chemistry', progress: 80, topicsCovered: '16 / 20 Topics' },
    { subject: 'Computer Science', progress: 92, topicsCovered: '24 / 26 Topics' },
  ],

  // Widget 9: Goals
  goals: [
    { title: 'Score 98%+ in Math Midterm', targetDate: 'Nov 25', progress: 95 },
    { title: 'Complete Physics Lab Manual', targetDate: 'Nov 28', progress: 80 },
    { title: 'Read 6 Literature Classics', targetDate: 'Dec 15', progress: 66 },
  ],

  // Widget 10: Achievements
  achievements: [
    { title: 'State Science Olympiad - Gold Medal', year: '2026', icon: 'award' },
    { title: 'Principal Honor Roll for Academic Excellence', year: '2026', icon: 'star' },
    { title: 'First Place - Inter-School Debate', year: '2025', icon: 'zap' },
  ],

  // Widget 11: My Teachers
  teachers: [
    { name: 'Aaron Fox', subject: 'Mathematics', email: 'aaron.fox@karkaii.edu' },
    { name: 'Sarah Mitchell', subject: 'Physics', email: 'sarah.mitchell@karkaii.edu' },
    { name: 'Dr. Bruce Banner', subject: 'Chemistry', email: 'bruce.banner@karkaii.edu' },
    { name: 'Clara Oswald', subject: 'English', email: 'clara.oswald@karkaii.edu' },
  ],

  // Widget 12: Communication
  announcements: [
    { title: 'Annual Day Auditions Scheduled for Next Monday', date: 'Nov 17' },
    { title: 'Library Book Returns Due Before Midterms', date: 'Nov 16' },
  ],

  // Widget 13: Library
  issuedBooks: [
    { title: 'A Brief History of Time', issueDate: 'Nov 02', dueDate: 'Nov 24', status: 'Active' },
    { title: 'Advanced Calculus', issueDate: 'Oct 28', dueDate: 'Nov 20', status: 'Renewable' },
  ],

  // Widget 14: Transport
  transportDetails: {
    route: 'Route #4 (South Valley Express)',
    busNumber: 'Bus KA-01-EA-2084',
    pickupPoint: 'Pine Hill Circle (07:45 AM)',
    driverName: 'Suresh Nair',
    driverPhone: '+1 (555) 432-1098',
  },

  // Widget 15: Calendar
  calendarHighlights: [
    { date: 'Nov 20', event: 'Winter Project Submission Deadline' },
    { date: 'Nov 25', event: 'Midterm Examination Commences' },
  ],

  // Widget 16: Activity Timeline
  activityTimeline: [
    { time: '10:45 AM', action: 'Completed Physics Lab Quiz with 98% score' },
    { time: 'Yesterday', action: 'Submitted Ray Optics Ray Diagrams homework' },
  ],
};

/* =========================================================================
   4. PARENT DASHBOARD DATA (PDF Page 19, §6.1.4)
   ========================================================================= */

export const PARENT_DASHBOARD_DATA = {
  activeChildKey: 'Emma' as 'Emma' | 'Lucas',

  children: {
    Emma: {
      name: 'Emma Watson',
      grade: 'Grade X - Section A',
      rollNo: '24',
      avatarBg: '#3D5EE115',
      gpa: '3.94',
      attendance: '98.2%',
      teacherRating: 4.9,
      tags: ['Honor Roll', 'Route #4 Bus', 'Prefect'],
      homeroomTeacher: 'Aaron Fox',
      teacherPhone: '+1 (555) 234-8901',
      dailyTimeline: [
        { time: '07:45 AM', activity: 'Boarded Bus KA-01-EA-2084 at Pine Hill' },
        { time: '08:15 AM', activity: 'Arrived at School • RFID Verified at Gate 1' },
        { time: '09:00 AM', activity: 'Attended Period 1: Advanced Mathematics' },
        { time: '12:30 PM', activity: 'Nutritious Hot Lunch at Cafeteria' },
        { time: '02:00 PM', activity: 'Physics Laboratory Experiment in Lab 1' },
      ],
      subjectVitals: [
        { subject: 'Mathematics', score: '98%', grade: 'A+', feedback: 'Exceptional analytic skill' },
        { subject: 'Physics', score: '94%', grade: 'A+', feedback: 'Strong conceptual clarity' },
        { subject: 'Chemistry', score: '91%', grade: 'A', feedback: 'Very good practical work' },
        { subject: 'English', score: '93%', grade: 'A', feedback: 'Creative essay writing' },
      ],
      homework: [
        { title: 'Math Problem Set 4', subject: 'Mathematics', due: 'Tomorrow', status: 'Completed' },
        { title: 'Optics Lab Diagrams', subject: 'Physics', due: 'Nov 21', status: 'In Progress' },
        { title: 'Macbeth Essay Draft', subject: 'English', due: 'Nov 22', status: 'Pending' },
      ],
      feeStatus: {
        totalPaid: '$3,600',
        dueAmount: '$0.00',
        status: 'Fully Paid (Receipt #REC-8821)',
      },
      liveBus: {
        route: 'Route #4 (South Valley)',
        busNo: 'Bus KA-01-EA-2084',
        driver: 'Suresh Nair',
        driverContact: '+1 (555) 432-1098',
        currentLocation: 'Oakwood Avenue (Moving, 32 km/h)',
        etaPickup: '03:45 PM at Gate 1',
        status: 'On Schedule',
      },
    },

    Lucas: {
      name: 'Lucas Watson',
      grade: 'Grade VI - Section B',
      rollNo: '18',
      avatarBg: '#10b98115',
      gpa: '3.82',
      attendance: '96.5%',
      teacherRating: 4.7,
      tags: ['Junior Football Team', 'Route #4 Bus', 'Art Club'],
      homeroomTeacher: 'Robert Langdon',
      teacherPhone: '+1 (555) 987-6543',
      dailyTimeline: [
        { time: '07:45 AM', activity: 'Boarded Bus KA-01-EA-2084 at Pine Hill' },
        { time: '08:15 AM', activity: 'Arrived at School • RFID Verified at Gate 1' },
        { time: '09:00 AM', activity: 'Attended Period 1: General Science' },
        { time: '12:30 PM', activity: 'Lunch at Junior Cafeteria' },
        { time: '01:30 PM', activity: 'Football Practice on Sports Ground' },
      ],
      subjectVitals: [
        { subject: 'General Science', score: '90%', grade: 'A', feedback: 'Very curious and active' },
        { subject: 'Social Studies', score: '88%', grade: 'A', feedback: 'Good map work' },
        { subject: 'English Language', score: '89%', grade: 'A', feedback: 'Good reading fluency' },
        { subject: 'Mathematics', score: '85%', grade: 'B+', feedback: 'Needs practice with fractions' },
      ],
      homework: [
        { title: 'Solar System Model', subject: 'Science', due: 'Tomorrow', status: 'Completed' },
        { title: 'Fraction Exercises', subject: 'Mathematics', due: 'Nov 20', status: 'In Progress' },
      ],
      feeStatus: {
        totalPaid: '$3,100',
        dueAmount: '$0.00',
        status: 'Fully Paid (Receipt #REC-8822)',
      },
      liveBus: {
        route: 'Route #4 (South Valley)',
        busNo: 'Bus KA-01-EA-2084',
        driver: 'Suresh Nair',
        driverContact: '+1 (555) 432-1098',
        currentLocation: 'Oakwood Avenue (Moving, 32 km/h)',
        etaPickup: '03:45 PM at Gate 1',
        status: 'On Schedule',
      },
    },
  },

  parentInsights: [
    { title: 'Academic Excellence', desc: 'Both Emma and Lucas maintain above 95% attendance with commendable grades in STEM subjects.' },
    { title: 'Upcoming Parent-Teacher Conference', desc: 'Scheduled for Friday, Nov 27 at 2:30 PM in Room 204. Meeting confirmation confirmed.' },
  ],

  achievements: [
    { student: 'Emma', title: 'National Mathematics Olympiad Finalist 2026' },
    { student: 'Lucas', title: 'Best Striker - Junior Inter-House Football Cup' },
  ],

  agenda: [
    { date: 'Nov 24, 02:00 PM', event: 'Parent-Teacher Meeting (PTM) for Term 1 Review' },
    { date: 'Dec 10, 08:30 AM', event: 'Annual Athletics Meet & Parents Sports Event' },
  ],

  smartNotifications: [
    { id: 'sn-1', title: 'Bus Arrived Safely at Campus Gate', time: '08:15 AM', read: true },
    { id: 'sn-2', title: 'Term 1 Midterm Timetable Published', time: 'Yesterday', read: true },
    { id: 'sn-3', title: 'Fee Receipt #REC-8821 Generated', time: 'Nov 05', read: true },
  ],
};
