import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import TabNavigation from '@/components/common/TabNavigation';
import SearchBar from '@/components/common/SearchBar';
import { REPORTS, ReportItem } from '@/data/reports';

type ReportsTab = 'analytics' | 'strength' | 'certificates' | 'ai';

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

const SCHOOL_STRENGTH_DATA = [
  { grade: 'Grade XII', boys: 260, girls: 252, total: 512, capacity: 550 },
  { grade: 'Grade XI', boys: 280, girls: 260, total: 540, capacity: 550 },
  { grade: 'Grade X', boys: 390, girls: 358, total: 748, capacity: 800 },
  { grade: 'Grade IX', boys: 340, girls: 334, total: 674, capacity: 700 },
  { grade: 'Grade VIII', boys: 310, girls: 295, total: 605, capacity: 650 },
  { grade: 'Primary (I-VII)', boys: 290, girls: 285, total: 575, capacity: 600 },
];

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
    description: 'Neural prediction identified 18 students likely to fall below the mandatory 75% attendance threshold before term finals.',
    recommendation: 'Trigger automated parental advisory notification and schedule academic counseling.',
    color: '#dc2626',
  },
  {
    id: 'ai-2',
    title: 'AI Fee Collection Forecasting',
    metric: '92.4% Projected Realization',
    severity: 'Positive Forecast',
    description: 'Machine learning cashflow model predicts $312,000 of total $338,000 dues will be settled by 05 December.',
    recommendation: 'Target WhatsApp reminders to the remaining 142 unpaid accounts on 20 November.',
    color: '#0ca678',
  },
  {
    id: 'ai-3',
    title: 'STEM Curriculum Acceleration Alert',
    metric: '3 Weeks Ahead of Schedule',
    severity: 'Curriculum Optimization',
    description: 'Senior Secondary Physics and Computer Science pacing is outpacing state requirements with 96% comprehension.',
    recommendation: 'Introduce advanced Olympiad and competitive entrance test prep modules.',
    color: '#3D5EE1',
  },
];

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<ReportsTab>('analytics');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1 (2026-27)');
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);

  const tabs = useMemo(
    () => [
      { id: 'analytics', label: 'Analytics Reports', badge: REPORTS.length },
      { id: 'strength', label: 'School Strength' },
      { id: 'certificates', label: 'Certificates & ID' },
      { id: 'ai', label: 'AI Predictive Insights' },
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

  const handleExport = (format: 'PDF' | 'Excel') => {
    Alert.alert(
      'Export Report',
      `${activeReport?.title} (${selectedTerm}) is being generated as ${format}. Saved locally to device storage.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Tab Bar */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId as ReportsTab);
          setSearchQuery('');
        }}
      />

      {/* Header & Search */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2.5">
          <View>
            <Text className="text-base font-bold text-slate-900">Reports & Insights</Text>
            <Text className="text-xs text-slate-500">
              Audits, attendance, academic progress, certificates & AI forecasting
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
        contentContainerClassName="p-4 pb-14"
      >
        {/* CORE ANALYTICS REPORTS */}
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

        {/* SCHOOL STRENGTH REPORT */}
        {activeTab === 'strength' && (
          <View className="gap-y-3">
            <View className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-bold text-indigo-900">Total Enrolled Strength</Text>
                  <Text className="text-xs text-indigo-700 mt-0.5">3,654 Students (91.3% Capacity)</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs font-bold text-indigo-900">Boys: 1,870</Text>
                  <Text className="text-xs font-bold text-indigo-900">Girls: 1,784</Text>
                </View>
              </View>
            </View>

            {SCHOOL_STRENGTH_DATA.map((st) => {
              const occupancy = Math.round((st.total / st.capacity) * 100);
              return (
                <View
                  key={st.grade}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-slate-900">{st.grade}</Text>
                    <Text className="text-xs font-bold text-slate-800">
                      {st.total} / {st.capacity} ({occupancy}%)
                    </Text>
                  </View>

                  <View className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <View
                      className="h-full rounded-full bg-[#3D5EE1]"
                      style={{ width: `${occupancy}%` }}
                    />
                  </View>

                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2">
                    <Text className="text-xs text-slate-600">
                      Boys: <Text className="font-bold text-blue-600">{st.boys}</Text>
                    </Text>
                    <Text className="text-xs text-slate-600">
                      Girls: <Text className="font-bold text-pink-600">{st.girls}</Text>
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* CERTIFICATES & ID CARDS */}
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
                  Oxford International School
                </Text>
                <Text className="text-[10px] font-mono text-emerald-400">STUDENT ID</Text>
              </View>

              <View className="mt-3 flex-row items-center">
                <View className="h-14 w-14 rounded-full bg-white/20 items-center justify-center border-2 border-white/40">
                  <Text className="text-lg font-bold text-white">EC</Text>
                </View>
                <View className="ml-3">
                  <Text className="text-base font-bold text-white">Emily Carter</Text>
                  <Text className="text-xs text-white/70">Grade XII-A · Roll #101</Text>
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

        {/* AI PREDICTIVE INSIGHTS */}
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

      {/* Report Detail Modal */}
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
    </View>
  );
}
