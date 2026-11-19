import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import TabNavigation from '@/components/common/TabNavigation';
import SearchBar from '@/components/common/SearchBar';
import { REPORTS, ReportItem } from '@/data/reports';
import { INITIAL_SCHOOL_STRENGTH } from '@/data/reportsMock';
import type { SchoolStrengthReportData } from '@/types/modules';

type ReportsTab = 'strength' | 'analytics' | 'certificates' | 'ai';

interface ReportDetailData {
  primaryMetricLabel: string;
  primaryMetricValue: string;
  trendText: string;
  breakdown: { label: string; value: string; percent: number }[];
  summaryNote: string;
}

const REPORT_MOCK_DETAILS: Record<string, ReportDetailData> = {
  attendance: {
    primaryMetricLabel: 'Overall School Attendance',
    primaryMetricValue: '94.8%',
    trendText: '+0.8% compared to last term',
    breakdown: [
      { label: 'Pre-Primary (KG)', value: '96.2%', percent: 96 },
      { label: 'Primary (I-V)', value: '95.4%', percent: 95 },
      { label: 'Middle (VI-VIII)', value: '94.1%', percent: 94 },
      { label: 'Secondary (IX-X)', value: '93.8%', percent: 94 },
      { label: 'Senior Secondary (XI-XII)', value: '95.1%', percent: 95 },
    ],
    summaryNote: 'Attendance remains highest in Pre-Primary with minimal unexcused absences.',
  },
  academic: {
    primaryMetricLabel: 'Curriculum Completion Rate',
    primaryMetricValue: '88.5%',
    trendText: 'On track for Term 1 finals',
    breakdown: [
      { label: 'STEM & Mathematics', value: '92%', percent: 92 },
      { label: 'Languages & Literature', value: '87%', percent: 87 },
      { label: 'Social Sciences', value: '85%', percent: 85 },
      { label: 'Computer Science', value: '90%', percent: 90 },
    ],
    summaryNote: 'Syllabus coverage is progressing 3 weeks ahead of scheduled calendar.',
  },
  performance: {
    primaryMetricLabel: 'School Average GPA',
    primaryMetricValue: '3.72 / 4.0',
    trendText: 'Top 5% regional benchmark',
    breakdown: [
      { label: 'Grade A+ (90-100%)', value: '412 Students', percent: 68 },
      { label: 'Grade A (80-89%)', value: '840 Students', percent: 85 },
      { label: 'Grade B (70-79%)', value: '520 Students', percent: 55 },
      { label: 'Needs Support (<60%)', value: '82 Students', percent: 12 },
    ],
    summaryNote: '82 students flagged for personalized peer tutoring and remedial classes.',
  },
  'class-analytics': {
    primaryMetricLabel: 'Total Active Enrolled Students',
    primaryMetricValue: '3,654',
    trendText: '+4.6% YoY Growth',
    breakdown: [
      { label: 'Grade XII', value: '512 Enrolled', percent: 75 },
      { label: 'Grade XI', value: '540 Enrolled', percent: 80 },
      { label: 'Grade X', value: '748 Enrolled', percent: 90 },
      { label: 'Grade IX', value: '674 Enrolled', percent: 84 },
    ],
    summaryNote: 'Classroom occupancy ratio averages 92% across all 5 wings.',
  },
  grades: {
    primaryMetricLabel: 'Exam Passing Percentage',
    primaryMetricValue: '97.4%',
    trendText: '+1.2% improvement from AY 2025',
    breakdown: [
      { label: 'Mathematics', value: '96.5% Pass', percent: 96 },
      { label: 'Physics & Chemistry', value: '98.1% Pass', percent: 98 },
      { label: 'English & World Languages', value: '99.0% Pass', percent: 99 },
      { label: 'Computer Science', value: '99.4% Pass', percent: 99 },
    ],
    summaryNote: 'Senior secondary science streams achieved 100% first-class qualifications.',
  },
  fees: {
    primaryMetricLabel: 'Total Fee Realization',
    primaryMetricValue: '$284,500',
    trendText: '84.2% collected of $338,000 billed',
    breakdown: [
      { label: 'Term 1 Tuition', value: '$198,000 Paid', percent: 88 },
      { label: 'Transport Fleet Fee', value: '$48,500 Paid', percent: 82 },
      { label: 'Laboratory & IT Fee', value: '$38,000 Paid', percent: 80 },
    ],
    summaryNote: 'Automated SMS and email reminders scheduled for overdue balance.',
  },
  'teacher-performance': {
    primaryMetricLabel: 'Faculty Satisfaction & Rating',
    primaryMetricValue: '4.85 / 5.0',
    trendText: 'Evaluated by 2,400+ student ratings',
    breakdown: [
      { label: 'Teaching Quality', value: '4.9 / 5.0', percent: 98 },
      { label: 'Timely Syllabus Delivery', value: '4.8 / 5.0', percent: 96 },
      { label: 'Student Mentorship', value: '4.9 / 5.0', percent: 98 },
    ],
    summaryNote: 'Best Teacher of the Year: Sarah Mitchell (Physics Department).',
  },
  custom: {
    primaryMetricLabel: 'Custom School Report Builder',
    primaryMetricValue: 'Ready',
    trendText: 'Configure custom columns and exports',
    breakdown: [
      { label: 'Student Demographics', value: 'Configured', percent: 100 },
      { label: 'Financial Audit Ledger', value: 'Configured', percent: 100 },
      { label: 'Asset Depreciation', value: 'Configured', percent: 100 },
    ],
    summaryNote: 'Connects with export endpoints when API is configured.',
  },
};

const CERTIFICATE_TYPES = [
  {
    id: 'cert-1',
    title: 'Bonafide Certificate',
    description: 'Official student bonafide and enrollment verification letter.',
    icon: 'award',
    color: '#3D5EE1',
    issuedCount: 142,
  },
  {
    id: 'cert-2',
    title: 'Transfer Certificate (TC)',
    description: 'Formal school leaving and character conduct certificate.',
    icon: 'file-text',
    color: '#0ca678',
    issuedCount: 28,
  },
  {
    id: 'cert-3',
    title: 'Digital Student ID Card',
    description: 'Barcode-enabled printable student identity credential card.',
    icon: 'user-check',
    color: '#f39c12',
    issuedCount: 3654,
  },
];

const AI_INSIGHTS_DATA = [
  {
    id: 'ai-1',
    title: 'AI Attendance Risk Warning',
    metric: '18 Students at Risk',
    severity: 'High Priority',
    description:
      'Neural prediction identified 18 students likely to fall below the mandatory 75% attendance threshold before term finals.',
    recommendation: 'Trigger automated parental advisory notification and schedule academic counseling.',
    color: '#dc2626',
  },
  {
    id: 'ai-2',
    title: 'AI Fee Collection Forecasting',
    metric: '92.4% Projected Realization',
    severity: 'Positive Forecast',
    description:
      'Machine learning cashflow model predicts $312,000 of total $338,000 dues will be settled by 05 December.',
    recommendation: 'Target WhatsApp reminders to the remaining 142 unpaid accounts on 20 November.',
    color: '#0ca678',
  },
  {
    id: 'ai-3',
    title: 'STEM Curriculum Acceleration Alert',
    metric: '3 Weeks Ahead of Schedule',
    severity: 'Curriculum Optimization',
    description:
      'Senior Secondary Physics and Computer Science pacing is outpacing state requirements with 96% comprehension.',
    recommendation: 'Introduce advanced Olympiad and competitive entrance test prep modules.',
    color: '#3D5EE1',
  },
];

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<ReportsTab>('strength');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1 (2026-27)');
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);

  // School Strength Report (Page 59, §12.1) State
  const [strengthData] = useState<SchoolStrengthReportData>(INITIAL_SCHOOL_STRENGTH);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [schoolName, setSchoolName] = useState<string>('Karkaii International Academy');
  const [preparedBy, setPreparedBy] = useState<string>('Academic Registrar & MIS Cell');

  // Section checkboxes for report generation
  const [incSummary, setIncSummary] = useState(true);
  const [incFaculty, setIncFaculty] = useState(true);
  const [incFacultyList, setIncFacultyList] = useState(true);
  const [incStudentsGender, setIncStudentsGender] = useState(true);
  const [incClassWise, setIncClassWise] = useState(true);
  const [incStudentList, setIncStudentList] = useState(true);

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  const tabs = useMemo(
    () => [
      { id: 'strength', label: 'School Strength', badge: 'P59' },
      { id: 'analytics', label: 'Analytics Reports', badge: REPORTS.length },
      { id: 'certificates', label: 'Certificates & ID' },
      { id: 'ai', label: 'AI Insights' },
    ],
    []
  );

  const filteredReports = useMemo(() => {
    return REPORTS.filter(
      (r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const detailData = activeReport
    ? REPORT_MOCK_DETAILS[activeReport.key] || REPORT_MOCK_DETAILS.attendance
    : null;

  // Filtered classes and students based on selectedClassId
  const displayedClasses = useMemo(() => {
    if (selectedClassId === 'all') return strengthData.students.classes;
    return strengthData.students.classes.filter((c) => c.classId === selectedClassId);
  }, [selectedClassId, strengthData.students.classes]);

  const displayedStudents = useMemo(() => {
    if (selectedClassId === 'all') return strengthData.students.list;
    return strengthData.students.list.filter((s) => s.classId === selectedClassId);
  }, [selectedClassId, strengthData.students.list]);

  // Derived metrics for School Strength
  const teacherRatio = useMemo(() => {
    if (strengthData.faculty.teaching > 0) {
      return `${(strengthData.students.total / strengthData.faculty.teaching).toFixed(1)} : 1`;
    }
    return '—';
  }, [strengthData.faculty.teaching, strengthData.students.total]);

  const handleExport = (format: 'PDF' | 'Excel') => {
    Alert.alert(
      'Export Report',
      `${activeReport?.title || 'School Strength Report'} (${selectedTerm}) generated as ${format}. Saved locally to device storage.`,
      [{ text: 'OK' }]
    );
  };

  const handleGenerateStrengthReport = () => {
    Alert.alert(
      'Strength Report Generated',
      `School Strength Report updated for ${schoolName}. Filter: ${
        selectedClassId === 'all' ? 'All Classes' : selectedClassId
      }. Prepared by: ${preparedBy}.`,
      [{ text: 'Preview Document', onPress: () => setShowPrintModal(true) }, { text: 'Done' }]
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Tab Bar */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(tabId: string) => {
          setActiveTab(tabId as ReportsTab);
          setSearchQuery('');
        }}
      />

      {/* Header & Term Selector */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-base font-bold text-slate-900">
              {activeTab === 'strength' ? 'School Strength Report' : 'Reports & Analytics'}
            </Text>
            <Text className="text-xs text-slate-500">
              {activeTab === 'strength'
                ? 'Student & Faculty demographics, class ratios & strength audit'
                : 'Audits, academic progress, certificates & AI forecasting'}
            </Text>
          </View>

          <Pressable
            onPress={() =>
              setSelectedTerm((prev) =>
                prev === 'Term 1 (2026-27)' ? 'Term 2 (2026-27)' : 'Term 1 (2026-27)'
              )
            }
            className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 flex-row items-center active:bg-slate-200"
          >
            <Feather name="calendar" size={11} color="#3D5EE1" />
            <Text className="ml-1 text-[11px] font-semibold text-slate-700">{selectedTerm}</Text>
          </Pressable>
        </View>

        {activeTab === 'analytics' && (
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search reports by title or domain…"
          />
        )}
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* ========================================================================= */}
        {/* TAB 1: SCHOOL STRENGTH REPORT (PAGE 59, §12.1) */}
        {/* ========================================================================= */}
        {activeTab === 'strength' && (
          <View className="space-y-4">
            {/* Report Configuration & Filters Card */}
            <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 items-center justify-center mr-2">
                    <Feather name="sliders" size={16} color="#4f46e5" />
                  </View>
                  <Text className="text-sm font-bold text-slate-800">Report Configuration</Text>
                </View>
                <Pressable
                  onPress={() => setShowPrintModal(true)}
                  className="flex-row items-center bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg"
                >
                  <Feather name="printer" size={13} color="#4f46e5" />
                  <Text className="text-xs font-bold text-indigo-700 ml-1">Print Preview</Text>
                </Pressable>
              </View>

              <View className="space-y-2 mb-3">
                <View>
                  <Text className="text-[11px] font-semibold text-slate-500 uppercase mb-1">School Name</Text>
                  <TextInput
                    value={schoolName}
                    onChangeText={setSchoolName}
                    placeholder="Enter school name"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                  />
                </View>
                <View>
                  <Text className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Prepared By</Text>
                  <TextInput
                    value={preparedBy}
                    onChangeText={setPreparedBy}
                    placeholder="Enter author or designation"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                  />
                </View>
              </View>

              {/* Class Filter Selector Pills */}
              <View className="mb-3">
                <Text className="text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Class Scope Filter</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  <Pressable
                    onPress={() => setSelectedClassId('all')}
                    className={`mr-2 px-3 py-1 rounded-full border ${
                      selectedClassId === 'all'
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        selectedClassId === 'all' ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      All Classes ({strengthData.students.classes.length})
                    </Text>
                  </Pressable>
                  {strengthData.students.classes.map((c) => (
                    <Pressable
                      key={c.classId}
                      onPress={() => setSelectedClassId(c.classId)}
                      className={`mr-2 px-3 py-1 rounded-full border ${
                        selectedClassId === c.classId
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          selectedClassId === c.classId ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {c.name.split(' ')[0]} {c.name.split(' ')[1] || ''}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Section Inclusions Checkboxes */}
              <View className="pt-2 border-t border-slate-100">
                <Text className="text-[11px] font-bold text-slate-600 uppercase mb-2">Sections to Include</Text>
                <View className="flex-row flex-wrap justify-between">
                  <Pressable
                    onPress={() => setIncSummary(!incSummary)}
                    className="flex-row items-center w-[48%] mb-2"
                  >
                    <Feather
                      name={incSummary ? 'check-square' : 'square'}
                      size={15}
                      color={incSummary ? '#4f46e5' : '#94a3b8'}
                    />
                    <Text className="text-xs text-slate-700 ml-1.5">Key Summary</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setIncFaculty(!incFaculty)}
                    className="flex-row items-center w-[48%] mb-2"
                  >
                    <Feather
                      name={incFaculty ? 'check-square' : 'square'}
                      size={15}
                      color={incFaculty ? '#4f46e5' : '#94a3b8'}
                    />
                    <Text className="text-xs text-slate-700 ml-1.5">Faculty Counts</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setIncFacultyList(!incFacultyList)}
                    className="flex-row items-center w-[48%] mb-2"
                  >
                    <Feather
                      name={incFacultyList ? 'check-square' : 'square'}
                      size={15}
                      color={incFacultyList ? '#4f46e5' : '#94a3b8'}
                    />
                    <Text className="text-xs text-slate-700 ml-1.5">Faculty Roster</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setIncStudentsGender(!incStudentsGender)}
                    className="flex-row items-center w-[48%] mb-2"
                  >
                    <Feather
                      name={incStudentsGender ? 'check-square' : 'square'}
                      size={15}
                      color={incStudentsGender ? '#4f46e5' : '#94a3b8'}
                    />
                    <Text className="text-xs text-slate-700 ml-1.5">Students Gender</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setIncClassWise(!incClassWise)}
                    className="flex-row items-center w-[48%] mb-2"
                  >
                    <Feather
                      name={incClassWise ? 'check-square' : 'square'}
                      size={15}
                      color={incClassWise ? '#4f46e5' : '#94a3b8'}
                    />
                    <Text className="text-xs text-slate-700 ml-1.5">Class Breakdown</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setIncStudentList(!incStudentList)}
                    className="flex-row items-center w-[48%] mb-2"
                  >
                    <Feather
                      name={incStudentList ? 'check-square' : 'square'}
                      size={15}
                      color={incStudentList ? '#4f46e5' : '#94a3b8'}
                    />
                    <Text className="text-xs text-slate-700 ml-1.5">Student Directory</Text>
                  </Pressable>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-x-2 mt-3 pt-2 border-t border-slate-100">
                <Pressable
                  onPress={handleGenerateStrengthReport}
                  className="flex-1 bg-indigo-600 py-2.5 rounded-xl items-center active:bg-indigo-700"
                >
                  <Text className="text-xs font-bold text-white">Generate Strength Report</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleExport('Excel')}
                  className="bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 items-center justify-center active:bg-slate-200"
                >
                  <Feather name="download" size={15} color="#475569" />
                </Pressable>
              </View>
            </View>

            {/* SECTION 1: KEY FIGURES SUMMARY */}
            {incSummary && (
              <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  1. Executive Summary & Key Figures
                </Text>

                <View className="flex-row flex-wrap justify-between gap-y-2.5">
                  <View className="w-[48%] bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                    <Text className="text-[10px] uppercase font-bold text-indigo-500">Total Enrolled</Text>
                    <Text className="text-xl font-bold text-indigo-900 mt-0.5">
                      {strengthData.students.total.toLocaleString()}
                    </Text>
                    <Text className="text-[10px] text-indigo-600 mt-1">91.3% overall capacity</Text>
                  </View>

                  <View className="w-[48%] bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                    <Text className="text-[10px] uppercase font-bold text-emerald-500">Total Faculty</Text>
                    <Text className="text-xl font-bold text-emerald-900 mt-0.5">
                      {strengthData.faculty.total}
                    </Text>
                    <Text className="text-[10px] text-emerald-600 mt-1">
                      {strengthData.faculty.teaching} teaching staff
                    </Text>
                  </View>

                  <View className="w-[48%] bg-purple-50/70 p-3 rounded-xl border border-purple-100">
                    <Text className="text-[10px] uppercase font-bold text-purple-500">Student-Faculty Ratio</Text>
                    <Text className="text-xl font-bold text-purple-900 mt-0.5">{teacherRatio}</Text>
                    <Text className="text-[10px] text-purple-600 mt-1">Target benchmark: 40:1</Text>
                  </View>

                  <View className="w-[48%] bg-amber-50/70 p-3 rounded-xl border border-amber-100">
                    <Text className="text-[10px] uppercase font-bold text-amber-500">Active Classes</Text>
                    <Text className="text-xl font-bold text-amber-900 mt-0.5">
                      {strengthData.students.classes.length} Grades
                    </Text>
                    <Text className="text-[10px] text-amber-600 mt-1">24 academic sections</Text>
                  </View>
                </View>
              </View>
            )}

            {/* SECTION 2: FACULTY COUNTS */}
            {incFaculty && (
              <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  2. Faculty Counts & Demographics
                </Text>

                <View className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                  <View className="flex-row justify-between text-xs mb-1.5">
                    <Text className="text-xs font-semibold text-slate-700">Teaching Staff</Text>
                    <Text className="text-xs font-bold text-indigo-700">
                      {strengthData.faculty.teaching} ({((strengthData.faculty.teaching / strengthData.faculty.total) * 100).toFixed(1)}%)
                    </Text>
                  </View>
                  <View className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <View
                      className="h-full rounded-full bg-indigo-600"
                      style={{
                        width: `${(strengthData.faculty.teaching / strengthData.faculty.total) * 100}%`,
                      }}
                    />
                  </View>
                  <View className="flex-row justify-between text-[10px] text-slate-500 mt-1">
                    <Text className="text-[10px] text-slate-500">Male: {strengthData.faculty.teachingByGender.male}</Text>
                    <Text className="text-[10px] text-slate-500">Female: {strengthData.faculty.teachingByGender.female}</Text>
                  </View>
                </View>

                <View className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <View className="flex-row justify-between text-xs mb-1.5">
                    <Text className="text-xs font-semibold text-slate-700">Non-Teaching Operations Staff</Text>
                    <Text className="text-xs font-bold text-emerald-700">
                      {strengthData.faculty.nonTeaching} ({((strengthData.faculty.nonTeaching / strengthData.faculty.total) * 100).toFixed(1)}%)
                    </Text>
                  </View>
                  <View className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <View
                      className="h-full rounded-full bg-emerald-600"
                      style={{
                        width: `${(strengthData.faculty.nonTeaching / strengthData.faculty.total) * 100}%`,
                      }}
                    />
                  </View>
                  <View className="flex-row justify-between text-[10px] text-slate-500 mt-1">
                    <Text className="text-[10px] text-slate-500">Male: {strengthData.faculty.nonTeachingByGender.male}</Text>
                    <Text className="text-[10px] text-slate-500">Female: {strengthData.faculty.nonTeachingByGender.female}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* SECTION 3: FACULTY ROSTER */}
            {incFacultyList && (
              <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  3. Faculty Member Directory ({strengthData.faculty.list.length})
                </Text>

                <View className="space-y-2">
                  {strengthData.faculty.list.map((fac) => (
                    <View
                      key={fac.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex-row items-center justify-between"
                    >
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center">
                          <Text className="text-xs font-bold text-slate-800">{fac.name}</Text>
                          <View className="ml-2 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                            <Text className="text-[10px] font-bold text-indigo-700">{fac.employeeNo}</Text>
                          </View>
                        </View>
                        <Text className="text-[11px] text-slate-500 mt-0.5">
                          {fac.department} · {fac.staffType === 'teaching' ? 'Teaching Faculty' : 'Staff'}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-[10px] font-semibold text-slate-600 capitalize">{fac.gender}</Text>
                        <Text className="text-[10px] font-bold text-emerald-600 capitalize mt-0.5">{fac.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* SECTION 4: STUDENTS GENDER-WISE */}
            {incStudentsGender && (
              <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  4. Student Demographics & Gender Ratio
                </Text>

                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-blue-600 mr-1.5" />
                    <Text className="text-xs text-slate-600">
                      Boys: <Text className="font-bold text-slate-900">{strengthData.students.byGender.male}</Text> (
                      {((strengthData.students.byGender.male / strengthData.students.total) * 100).toFixed(1)}%)
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-pink-500 mr-1.5" />
                    <Text className="text-xs text-slate-600">
                      Girls: <Text className="font-bold text-slate-900">{strengthData.students.byGender.female}</Text> (
                      {((strengthData.students.byGender.female / strengthData.students.total) * 100).toFixed(1)}%)
                    </Text>
                  </View>
                </View>

                {/* Combined split visual bar */}
                <View className="h-3 w-full overflow-hidden rounded-full bg-slate-100 flex-row">
                  <View
                    className="h-full bg-blue-600"
                    style={{
                      width: `${(strengthData.students.byGender.male / strengthData.students.total) * 100}%`,
                    }}
                  />
                  <View
                    className="h-full bg-pink-500"
                    style={{
                      width: `${(strengthData.students.byGender.female / strengthData.students.total) * 100}%`,
                    }}
                  />
                </View>
              </View>
            )}

            {/* SECTION 5: CLASS-WISE & GENDER-WISE */}
            {incClassWise && (
              <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  5. Class-Wise & Gender-Wise Distribution ({displayedClasses.length})
                </Text>

                <View className="space-y-3">
                  {displayedClasses.map((cls) => {
                    const capacity = cls.capacity || 600;
                    const occupancy = Math.round((cls.total / capacity) * 100);
                    return (
                      <View
                        key={cls.classId}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <View className="flex-row items-center justify-between mb-1.5">
                          <Text className="text-xs font-bold text-slate-900">{cls.name}</Text>
                          <Text className="text-xs font-bold text-indigo-700">
                            {cls.total} / {capacity} ({occupancy}%)
                          </Text>
                        </View>

                        {/* Progress Bar */}
                        <View className="h-2 w-full overflow-hidden rounded-full bg-slate-200 mb-2">
                          <View
                            className="h-full rounded-full bg-indigo-600"
                            style={{ width: `${occupancy}%` }}
                          />
                        </View>

                        <View className="flex-row items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                          <Text className="text-xs text-blue-700 font-semibold">Boys: {cls.male}</Text>
                          <Text className="text-xs text-pink-700 font-semibold">Girls: {cls.female}</Text>
                          <Text className="text-xs text-slate-500">
                            Ratio: {(cls.male / (cls.female || 1)).toFixed(2)} : 1
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* SECTION 6: STUDENT ROSTER */}
            {incStudentList && (
              <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  6. Student Directory ({displayedStudents.length})
                </Text>

                <View className="space-y-2">
                  {displayedStudents.map((stu) => (
                    <View
                      key={stu.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex-row items-center justify-between"
                    >
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center">
                          <Text className="text-xs font-bold text-slate-800">{stu.name}</Text>
                          <View className="ml-2 bg-slate-200 px-1.5 py-0.2 rounded">
                            <Text className="text-[10px] font-bold text-slate-700">{stu.rollNo || stu.admissionNo}</Text>
                          </View>
                        </View>
                        <Text className="text-[11px] text-slate-500 mt-0.5">{stu.className}</Text>
                      </View>
                      <View
                        className={`px-2 py-0.5 rounded ${
                          stu.gender === 'male'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-pink-50 border border-pink-200'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold capitalize ${
                            stu.gender === 'male' ? 'text-blue-700' : 'text-pink-700'
                          }`}
                        >
                          {stu.gender}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ANALYTICS REPORTS */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <View className="gap-y-3">
            {filteredReports.map((report) => (
              <Pressable
                key={report.key}
                onPress={() => setActiveReport(report)}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 active:bg-slate-50"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1 pr-2">
                    <View
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${report.tint}1A` }}
                    >
                      <Feather name={report.icon as any} size={18} color={report.tint} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-bold text-slate-900">{report.title}</Text>
                      <Text className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {report.description}
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={16} color="#94a3b8" />
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">Available in PDF & Excel</Text>
                  <Text className="text-xs font-bold text-[#3D5EE1]">Inspect Analytics →</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CERTIFICATES & ID CARDS */}
        {/* ========================================================================= */}
        {activeTab === 'certificates' && (
          <View className="gap-y-3">
            {CERTIFICATE_TYPES.map((cert) => (
              <View
                key={cert.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1 pr-2">
                    <View
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${cert.color}1A` }}
                    >
                      <Feather name={cert.icon as any} size={18} color={cert.color} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-bold text-slate-900">{cert.title}</Text>
                      <Text className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {cert.description}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-500">
                    Issued This Term: <Text className="font-bold text-slate-800">{cert.issuedCount}</Text>
                  </Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        'Generate Document',
                        `Opening generator for ${cert.title}. PDF template loaded.`
                      )
                    }
                    className="flex-row items-center rounded-lg bg-blue-50 px-2.5 py-1 border border-blue-200"
                  >
                    <Feather name="printer" size={13} color="#3D5EE1" />
                    <Text className="ml-1 text-xs font-bold text-[#3D5EE1]">Generate</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {/* Visual Digital ID Card Preview */}
            <View className="mt-2 rounded-2xl bg-[#1b2240] p-4 text-white shadow-md">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold uppercase tracking-wider text-white/80">
                  {schoolName}
                </Text>
                <Text className="text-[10px] font-mono text-emerald-400">STUDENT ID</Text>
              </View>

              <View className="mt-3 flex-row items-center">
                <View className="h-14 w-14 rounded-full bg-white/20 items-center justify-center border-2 border-white/40">
                  <Text className="text-lg font-bold text-white">AP</Text>
                </View>
                <View className="ml-3">
                  <Text className="text-base font-bold text-white">Aarav Patel</Text>
                  <Text className="text-xs text-white/70">Grade X-A · Roll #101</Text>
                  <Text className="text-[10px] font-mono text-white/50">ID: ADM-2026-001</Text>
                </View>
              </View>

              <View className="mt-3 pt-2.5 border-t border-white/10 flex-row items-center justify-between">
                <Text className="text-[10px] text-white/60">Valid Thru: 30 Jun 2027</Text>
                <Text className="text-[10px] font-mono text-white/80">||||| | ||||| || |||</Text>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: AI PREDICTIVE INSIGHTS */}
        {/* ========================================================================= */}
        {activeTab === 'ai' && (
          <View className="gap-y-3">
            {AI_INSIGHTS_DATA.map((ai) => (
              <View
                key={ai.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View className="rounded-md bg-purple-50 px-2 py-0.5 border border-purple-200">
                        <Text className="text-[10px] font-bold text-purple-700">AI Intelligence</Text>
                      </View>
                      <View className="rounded-md bg-slate-100 px-2 py-0.5">
                        <Text className="text-[10px] font-semibold text-slate-600">{ai.severity}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900">{ai.title}</Text>
                    <Text className="text-xs font-bold text-[#3D5EE1] mt-0.5">{ai.metric}</Text>
                  </View>
                </View>

                <Text className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {ai.description}
                </Text>

                <View className="mt-3 rounded-xl bg-slate-50 p-2.5 border-l-2 border-[#3D5EE1]">
                  <Text className="text-[11px] font-bold text-slate-800">Action Recommendation</Text>
                  <Text className="text-xs text-slate-600 mt-0.5">{ai.recommendation}</Text>
                </View>

                <View className="mt-3 flex-row items-center justify-end border-t border-slate-100 pt-2.5">
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        'AI Action Triggered',
                        `Automated workflow executed for ${ai.title}.`
                      )
                    }
                    className="rounded-lg bg-[#3D5EE1] px-3 py-1.5"
                  >
                    <Text className="text-xs font-bold text-white">Execute Action</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Analytics Detail Modal */}
      <Modal
        visible={Boolean(activeReport)}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveReport(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8 max-h-[85%]">
            {activeReport && detailData && (
              <>
                <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
                  <View className="flex-row items-center flex-1 pr-2">
                    <View
                      className="h-9 w-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${activeReport.tint}1A` }}
                    >
                      <Feather name={activeReport.icon as any} size={18} color={activeReport.tint} />
                    </View>
                    <View className="ml-2.5 flex-1">
                      <Text className="text-base font-bold text-slate-900">
                        {activeReport.title}
                      </Text>
                      <Text className="text-xs text-slate-500">{selectedTerm}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setActiveReport(null)} hitSlop={10}>
                    <Feather name="x" size={20} color="#64748b" />
                  </Pressable>
                </View>

                <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
                  {/* Primary KPI Card */}
                  <View className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <Text className="text-xs text-slate-500 font-medium">
                      {detailData.primaryMetricLabel}
                    </Text>
                    <Text className="text-2xl font-bold text-slate-900 mt-1">
                      {detailData.primaryMetricValue}
                    </Text>
                    <Text className="text-xs font-semibold text-emerald-600 mt-1">
                      {detailData.trendText}
                    </Text>
                  </View>

                  {/* Breakdown Bars */}
                  <View className="mt-4 gap-y-3">
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Cohort Distribution
                    </Text>
                    {detailData.breakdown.map((item) => (
                      <View key={item.label}>
                        <View className="flex-row items-center justify-between text-xs mb-1">
                          <Text className="text-xs font-medium text-slate-700">{item.label}</Text>
                          <Text className="text-xs font-bold text-slate-900">{item.value}</Text>
                        </View>
                        <View className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <View
                            className="h-full rounded-full bg-[#3D5EE1]"
                            style={{ width: `${item.percent}%` }}
                          />
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Summary Note */}
                  <View className="mt-4 rounded-xl bg-blue-50/60 p-3 border border-blue-100">
                    <Text className="text-xs text-blue-900 leading-relaxed font-medium">
                      {detailData.summaryNote}
                    </Text>
                  </View>

                  {/* Export Buttons */}
                  <View className="mt-6 flex-row gap-x-3">
                    <Pressable
                      onPress={() => handleExport('PDF')}
                      className="flex-1 items-center rounded-xl bg-slate-100 py-3"
                    >
                      <Text className="text-sm font-semibold text-slate-800">Export PDF</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleExport('Excel')}
                      className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
                    >
                      <Text className="text-sm font-bold text-white">Export Excel</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* School Strength Official Print Document Preview Modal */}
      <Modal visible={showPrintModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl bg-white p-5 pb-8 max-h-[90%]">
            <View className="flex-row items-center justify-between border-b border-slate-200 pb-3">
              <View>
                <Text className="text-base font-bold text-slate-900">Official Report Document</Text>
                <Text className="text-xs text-slate-500">School Strength Audit Summary</Text>
              </View>
              <Pressable onPress={() => setShowPrintModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              {/* Document Letterhead */}
              <View className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4 items-center">
                <Text className="text-base font-extrabold text-indigo-900 uppercase tracking-wide">
                  {schoolName}
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">ACADEMIC AUDIT & ENROLLMENT CENSUS REPORT</Text>
                <View className="flex-row items-center justify-between w-full mt-3 pt-2 border-t border-slate-200 text-xs">
                  <Text className="text-[11px] text-slate-500">Academic Year: {strengthData.academicYear}</Text>
                  <Text className="text-[11px] text-slate-500">Prepared by: {preparedBy}</Text>
                </View>
              </View>

              {/* Document Summary Table */}
              <View className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <View className="bg-indigo-900 px-3 py-2">
                  <Text className="text-xs font-bold text-white uppercase">Enrollment & Faculty Census</Text>
                </View>
                <View className="p-3 bg-white space-y-2">
                  <View className="flex-row justify-between border-b border-slate-100 pb-1">
                    <Text className="text-xs text-slate-600">Total Enrolled Students:</Text>
                    <Text className="text-xs font-bold text-slate-900">{strengthData.students.total}</Text>
                  </View>
                  <View className="flex-row justify-between border-b border-slate-100 pb-1">
                    <Text className="text-xs text-slate-600">Student Male / Female Split:</Text>
                    <Text className="text-xs font-bold text-slate-900">
                      {strengthData.students.byGender.male} Boys / {strengthData.students.byGender.female} Girls
                    </Text>
                  </View>
                  <View className="flex-row justify-between border-b border-slate-100 pb-1">
                    <Text className="text-xs text-slate-600">Total Teaching Faculty:</Text>
                    <Text className="text-xs font-bold text-slate-900">{strengthData.faculty.teaching}</Text>
                  </View>
                  <View className="flex-row justify-between border-b border-slate-100 pb-1">
                    <Text className="text-xs text-slate-600">Non-Teaching Operations Staff:</Text>
                    <Text className="text-xs font-bold text-slate-900">{strengthData.faculty.nonTeaching}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-600">Student-Faculty Ratio:</Text>
                    <Text className="text-xs font-bold text-indigo-700">{teacherRatio}</Text>
                  </View>
                </View>
              </View>

              {/* Class Strength Summary Table */}
              <View className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <View className="bg-slate-800 px-3 py-2 flex-row justify-between">
                  <Text className="text-xs font-bold text-white">Class</Text>
                  <Text className="text-xs font-bold text-white">Boys</Text>
                  <Text className="text-xs font-bold text-white">Girls</Text>
                  <Text className="text-xs font-bold text-white">Total</Text>
                </View>
                {displayedClasses.map((c, i) => (
                  <View
                    key={c.classId}
                    className={`px-3 py-2 flex-row justify-between ${
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } border-b border-slate-100`}
                  >
                    <Text className="text-xs font-medium text-slate-800 flex-1">{c.name.split(' ')[0]} {c.name.split(' ')[1]}</Text>
                    <Text className="text-xs text-slate-700 w-12 text-center">{c.male}</Text>
                    <Text className="text-xs text-slate-700 w-12 text-center">{c.female}</Text>
                    <Text className="text-xs font-bold text-indigo-700 w-12 text-right">{c.total}</Text>
                  </View>
                ))}
              </View>

              {/* Print Action Buttons */}
              <View className="flex-row gap-x-3 pt-2">
                <Pressable
                  onPress={() => {
                    setShowPrintModal(false);
                    Alert.alert('Download Complete', 'School-Strength-Report.pdf saved to Downloads.');
                  }}
                  className="flex-1 bg-indigo-600 py-3 rounded-xl items-center active:bg-indigo-700"
                >
                  <Text className="text-xs font-bold text-white">Download PDF</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowPrintModal(false);
                    Alert.alert('CSV Exported', 'school-strength-census.csv saved to device storage.');
                  }}
                  className="flex-1 bg-slate-100 py-3 rounded-xl border border-slate-200 items-center active:bg-slate-200"
                >
                  <Text className="text-xs font-bold text-slate-800">Export CSV / Excel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
