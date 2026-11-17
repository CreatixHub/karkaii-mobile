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
import SearchBar from '@/components/common/SearchBar';
import { REPORTS, ReportItem } from '@/data/reports';

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

export default function ReportsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1 (2026-27)');
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);

  const filteredReports = useMemo(() => {
    return REPORTS.filter(
      (r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const detailData = activeReport ? REPORT_MOCK_DETAILS[activeReport.key] || REPORT_MOCK_DETAILS.attendance : null;

  const handleExport = (format: 'PDF' | 'Excel') => {
    Alert.alert(
      'Export Report',
      `${activeReport?.title} (${selectedTerm}) is being exported as ${format}. The file will be saved to your device.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Header & Term Selector */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2.5">
          <View>
            <Text className="text-base font-bold text-slate-900">Reports & Analytics</Text>
            <Text className="text-xs text-slate-500">
              Audits, attendance, academic progress & financial statements
            </Text>
          </View>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search available reports…"
        />

        {/* Term Selector Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5">
          {['Term 1 (2026-27)', 'Term 2 (2026-27)', 'Full AY 2026-27', 'AY 2025-26'].map((term) => (
            <Pressable
              key={term}
              onPress={() => setSelectedTerm(term)}
              className={`mr-2 rounded-full px-3 py-1 ${
                selectedTerm === term
                  ? 'bg-[#3D5EE1]'
                  : 'bg-slate-100 border border-slate-200'
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  selectedTerm === term ? 'text-white' : 'text-slate-600'
                }`}
              >
                {term}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Reports Listing */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-12"
      >
        <View className="gap-y-3">
          {filteredReports.map((report) => (
            <Pressable
              key={report.key}
              onPress={() => setActiveReport(report)}
              className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 active:bg-slate-50"
            >
              <View
                className="h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${report.tint}1A` }}
              >
                <Feather name={report.icon as any} size={20} color={report.tint} />
              </View>

              <View className="ml-3.5 flex-1 pr-2">
                <Text className="text-sm font-bold text-slate-900">{report.title}</Text>
                <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={2}>
                  {report.description}
                </Text>
              </View>

              <View className="items-center justify-center rounded-full bg-slate-100 p-1.5">
                <Feather name="chevron-right" size={16} color="#64748b" />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Report Drill-down Detail Modal */}
      <Modal
        visible={!!activeReport}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveReport(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[85%] rounded-t-3xl bg-white p-5 pb-8">
            {activeReport && detailData && (
              <>
                <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
                  <View className="flex-row items-center">
                    <View
                      className="h-8 w-8 items-center justify-center rounded-lg mr-2.5"
                      style={{ backgroundColor: `${activeReport.tint}1A` }}
                    >
                      <Feather
                        name={activeReport.icon as any}
                        size={16}
                        color={activeReport.tint}
                      />
                    </View>
                    <View>
                      <Text className="text-base font-bold text-slate-900">
                        {activeReport.title}
                      </Text>
                      <Text className="text-[11px] text-slate-500">{selectedTerm}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setActiveReport(null)} hitSlop={10}>
                    <Feather name="x" size={20} color="#64748b" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
                  {/* Primary KPI Card */}
                  <View className="rounded-2xl bg-gradient-to-br bg-slate-900 p-4">
                    <Text className="text-xs font-medium text-slate-300">
                      {detailData.primaryMetricLabel}
                    </Text>
                    <Text className="mt-1 text-2xl font-extrabold text-white">
                      {detailData.primaryMetricValue}
                    </Text>
                    <View className="mt-2 flex-row items-center">
                      <Feather name="trending-up" size={13} color="#34d399" />
                      <Text className="ml-1 text-xs font-semibold text-emerald-400">
                        {detailData.trendText}
                      </Text>
                    </View>
                  </View>

                  {/* Breakdown Bars */}
                  <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <Text className="text-xs font-bold text-slate-900 mb-3">
                      Segment Breakdown
                    </Text>
                    <View className="gap-y-3">
                      {detailData.breakdown.map((item) => (
                        <View key={item.label}>
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-xs text-slate-600">{item.label}</Text>
                            <Text className="text-xs font-bold text-slate-800">
                              {item.value}
                            </Text>
                          </View>
                          <View className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <View
                              className="h-full rounded-full"
                              style={{
                                width: `${item.percent}%`,
                                backgroundColor: activeReport.tint,
                              }}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Summary Note */}
                  <View className="mt-3 rounded-xl bg-blue-50 p-3 border border-blue-200">
                    <Text className="text-xs text-blue-900 font-medium">
                      Note: {detailData.summaryNote}
                    </Text>
                  </View>

                  {/* Export Action Buttons */}
                  <View className="mt-5 flex-row gap-x-3">
                    <Pressable
                      onPress={() => handleExport('PDF')}
                      className="flex-1 flex-row items-center justify-center rounded-xl bg-slate-100 py-3"
                    >
                      <Feather name="file-text" size={15} color="#334155" />
                      <Text className="ml-1.5 text-xs font-bold text-slate-700">
                        Export PDF
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleExport('Excel')}
                      className="flex-1 flex-row items-center justify-center rounded-xl bg-[#3D5EE1] py-3 shadow-sm shadow-[#3D5EE1]/30"
                    >
                      <Feather name="download" size={15} color="#ffffff" />
                      <Text className="ml-1.5 text-xs font-bold text-white">
                        Export Excel
                      </Text>
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
