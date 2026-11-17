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

export const ADMIN_DASHBOARD_DATA = {
  schoolName: 'Oxford International School',
  academicYear: 'AY 2026-27',
  dateFormatted: 'Tue, 17 Nov 2026',
  welcomeKpis: [
    {
      id: 'attendance',
      label: "Today's Attendance",
      value: '94.8%',
      delta: '+0.8%',
      deltaDirection: 'up',
      icon: 'check-square',
      iconBg: '#10b98115',
      iconColor: '#10b981',
    },
    {
      id: 'admissions',
      label: 'New Admissions',
      value: '128',
      delta: '+12',
      deltaDirection: 'up',
      icon: 'user-plus',
      iconBg: '#3D5EE115',
      iconColor: '#3D5EE1',
    },
    {
      id: 'fees',
      label: 'Fees Today',
      value: '$48.6K',
      delta: '+3.2%',
      deltaDirection: 'up',
      icon: 'dollar-sign',
      iconBg: '#f59e0b15',
      iconColor: '#f59e0b',
    },
    {
      id: 'exams',
      label: 'Upcoming Exams',
      value: '09',
      delta: 'in 2d',
      deltaDirection: 'down',
      icon: 'file-text',
      iconBg: '#8b5cf615',
      iconColor: '#8b5cf6',
    },
  ] as DashboardKpi[],

  bestTeacher: {
    name: 'Sarah Mitchell',
    department: 'Physics Department',
    award: 'Teacher of the Year 2024',
    rating: 4.9,
    passRate: '98%',
    totalStudents: 320,
    color: '#10b981',
  },

  topStudent: {
    name: 'Emily Carter',
    grade: 'Grade XII-A • Science',
    award: 'National Olympiad Gold',
    gpa: '3.98',
    rank: '#1',
    attendance: '99%',
    color: '#3D5EE1',
  },

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

  riskMatrix: {
    totalAssessed: 3654,
    healthPercent: '78% Healthy',
    lowRisk: { count: 2851, percent: 78, color: '#10b981' },
    mediumRisk: { count: 642, percent: 18, color: '#f59e0b' },
    highRisk: { count: 161, percent: 4, color: '#ef4444' },
  },

  attendanceBreakdown: {
    overallPercentage: 94.8,
    presentCount: 3464,
    absentCount: 190,
    leaveCount: 64,
    lateCount: 37,
  },

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
      title: 'Holiday Notice Published',
      detail: 'Winter Vacation Circular sent to all parents & teachers',
      time: '2h ago',
      icon: 'bell',
      color: '#f59e0b',
    },
    {
      id: 'act-4',
      title: 'Mathematics Unit Test Grades Uploaded',
      detail: 'Mrs. Anderson posted results for Grade IX-A (Avg 84%)',
      time: '4h ago',
      icon: 'award',
      color: '#8b5cf6',
    },
  ],
};
