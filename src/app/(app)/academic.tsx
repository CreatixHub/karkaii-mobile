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
import StatusBadge from '@/components/common/StatusBadge';
import {
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_TIMETABLE,
  INITIAL_HOMEWORKS,
  INITIAL_EXAMS,
} from '@/data/academicMock';
import type {
  ClassItem,
  ExamItem,
  HomeworkItem,
  SubjectItem,
  TimetableSlot,
} from '@/types/modules';

type AcademicTab = 'classes' | 'subjects' | 'timetable' | 'homework' | 'exams';

export default function AcademicScreen() {
  const [activeTab, setActiveTab] = useState<AcademicTab>('classes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<TimetableSlot['day']>('Monday');

  // Local state for interactive data
  const [classes, setClasses] = useState<ClassItem[]>(INITIAL_CLASSES);
  const [subjects, setSubjects] = useState<SubjectItem[]>(INITIAL_SUBJECTS);
  const [timetable] = useState<TimetableSlot[]>(INITIAL_TIMETABLE);
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>(INITIAL_HOMEWORKS);
  const [exams, setExams] = useState<ExamItem[]>(INITIAL_EXAMS);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formMeta, setFormMeta] = useState('');

  const tabs = useMemo(
    () => [
      { id: 'classes', label: 'Classes & Sections', badge: classes.length },
      { id: 'subjects', label: 'Subjects', badge: subjects.length },
      { id: 'timetable', label: 'Timetable', badge: timetable.length },
      { id: 'homework', label: 'Homework', badge: homeworks.length },
      { id: 'exams', label: 'Examinations', badge: exams.length },
    ],
    [classes.length, subjects.length, timetable.length, homeworks.length, exams.length]
  );

  // Filtered queries
  const filteredClasses = useMemo(() => {
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.classTeacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.roomNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [classes, searchQuery]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subjects, searchQuery]);

  const filteredTimetable = useMemo(() => {
    return timetable.filter((t) => {
      const matchesDay = t.day === selectedDay;
      const matchesSearch =
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.className.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDay && matchesSearch;
    });
  }, [timetable, selectedDay, searchQuery]);

  const filteredHomeworks = useMemo(() => {
    return homeworks.filter(
      (h) =>
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.className.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [homeworks, searchQuery]);

  const filteredExams = useMemo(() => {
    return exams.filter(
      (e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.examType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [exams, searchQuery]);

  // Handlers
  const handleAddNewItem = () => {
    if (!formTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a name or title.');
      return;
    }

    if (activeTab === 'classes') {
      const newClass: ClassItem = {
        id: `cls-${Date.now()}`,
        name: formTitle,
        numericGrade: 10,
        sections: ['A', 'B'],
        classTeacher: formSubtitle || 'Senior Faculty',
        totalStudents: 35,
        capacity: 40,
        roomNo: formMeta || 'Room 101',
      };
      setClasses([...classes, newClass]);
      Alert.alert('Success', `Class ${formTitle} created.`);
    } else if (activeTab === 'subjects') {
      const newSbj: SubjectItem = {
        id: `sbj-${Date.now()}`,
        code: `SUB-${Math.floor(100 + Math.random() * 900)}`,
        name: formTitle,
        type: 'Theory',
        department: formSubtitle || 'General',
        weeklyHours: 4,
        credits: 3,
      };
      setSubjects([...subjects, newSbj]);
      Alert.alert('Success', `Subject ${formTitle} added to curriculum.`);
    } else if (activeTab === 'homework') {
      const newHw: HomeworkItem = {
        id: `hw-${Date.now()}`,
        title: formTitle,
        subject: formSubtitle || 'General Subject',
        className: formMeta || 'Grade XII',
        section: 'A',
        assignedDate: 'Today',
        dueDate: 'Next Week',
        totalSubmissions: 0,
        totalStudents: 40,
        description: 'Review chapters and complete exercises.',
        status: 'Open',
      };
      setHomeworks([newHw, ...homeworks]);
      Alert.alert('Success', `Homework assignment published.`);
    } else if (activeTab === 'exams') {
      const newExam: ExamItem = {
        id: `ex-${Date.now()}`,
        title: formTitle,
        examType: 'Unit Test',
        startDate: 'Next Month',
        endDate: 'Next Month',
        classes: ['Grade X', 'Grade XII'],
        status: 'Upcoming',
        totalPapers: 6,
      };
      setExams([newExam, ...exams]);
      Alert.alert('Success', `Exam schedule registered.`);
    }

    setFormTitle('');
    setFormSubtitle('');
    setFormMeta('');
    setShowAddModal(false);
  };

  const handleToggleHomeworkStatus = (id: string) => {
    setHomeworks(
      homeworks.map((h) =>
        h.id === id
          ? { ...h, status: h.status === 'Open' ? 'Evaluated' : 'Open' }
          : h
      )
    );
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Tab Bar */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId as AcademicTab);
          setSearchQuery('');
        }}
      />

      {/* Action Header & Search */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2.5">
          <View>
            <Text className="text-base font-bold text-slate-900 capitalize">
              Academic Management
            </Text>
            <Text className="text-xs text-slate-500">
              Classes, subjects, daily timetable & homework tracking
            </Text>
          </View>

          <Pressable
            onPress={() => setShowAddModal(true)}
            className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-2 shadow-sm shadow-[#3D5EE1]/30"
          >
            <Feather name="plus" size={15} color="#ffffff" />
            <Text className="ml-1 text-xs font-bold text-white">Create</Text>
          </Pressable>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${activeTab}…`}
        />

        {/* Day Selector for Timetable */}
        {activeTab === 'timetable' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5">
            {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as TimetableSlot['day'][]).map(
              (day) => (
                <Pressable
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  className={`mr-2 rounded-xl px-3 py-1.5 ${
                    selectedDay === day ? 'bg-[#3D5EE1]' : 'bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selectedDay === day ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {day}
                  </Text>
                </Pressable>
              )
            )}
          </ScrollView>
        )}
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-12"
      >
        {/* CLASSES & SECTIONS */}
        {activeTab === 'classes' && (
          <View className="gap-y-3">
            {filteredClasses.map((cls) => {
              const occupancy = Math.round((cls.totalStudents / cls.capacity) * 100);
              return (
                <View
                  key={cls.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-900">{cls.name}</Text>
                      <Text className="text-xs text-slate-500">
                        Class Teacher: <Text className="font-semibold text-slate-800">{cls.classTeacher}</Text>
                      </Text>
                    </View>
                    <View className="rounded-lg bg-blue-50 px-2 py-1 border border-blue-200">
                      <Text className="text-[11px] font-bold text-blue-700">{cls.roomNo}</Text>
                    </View>
                  </View>

                  <View className="mt-3">
                    <View className="flex-row items-center justify-between text-xs mb-1">
                      <Text className="text-xs text-slate-500">Classroom Capacity</Text>
                      <Text className="text-xs font-bold text-slate-800">
                        {cls.totalStudents} / {cls.capacity} ({occupancy}%)
                      </Text>
                    </View>
                    <View className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <View
                        className="h-full rounded-full bg-[#3D5EE1]"
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </View>
                  </View>

                  <View className="mt-3 flex-row flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                    <Text className="text-xs text-slate-400 mr-1 self-center">Sections:</Text>
                    {cls.sections.map((sec) => (
                      <View key={sec} className="rounded-md bg-slate-100 px-2 py-0.5">
                        <Text className="text-[11px] font-medium text-slate-700">{sec}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* SUBJECTS CATALOG */}
        {activeTab === 'subjects' && (
          <View className="gap-y-3">
            {filteredSubjects.map((sbj) => (
              <View
                key={sbj.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{sbj.code}</Text>
                    <Text className="mt-0.5 text-base font-bold text-slate-900">{sbj.name}</Text>
                    <Text className="text-xs text-slate-500">{sbj.department} Dept.</Text>
                  </View>
                  <View className="rounded-lg bg-indigo-50 px-2 py-1 border border-indigo-200">
                    <Text className="text-[11px] font-bold text-indigo-700">{sbj.type}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center">
                    <Feather name="clock" size={14} color="#64748b" />
                    <Text className="ml-1.5 text-xs font-semibold text-slate-700">
                      {sbj.weeklyHours} Hours / Week
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="award" size={14} color="#64748b" />
                    <Text className="ml-1.5 text-xs font-semibold text-slate-700">
                      {sbj.credits} Credits
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TIMETABLE SCHEDULE */}
        {activeTab === 'timetable' && (
          <View className="gap-y-3">
            {filteredTimetable.length === 0 ? (
              <View className="items-center py-12">
                <Feather name="calendar" size={36} color="#94a3b8" />
                <Text className="mt-2 text-sm text-slate-500">No scheduled periods for {selectedDay}.</Text>
              </View>
            ) : (
              filteredTimetable.map((slot) => (
                <View
                  key={slot.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="h-8 w-8 items-center justify-center rounded-lg bg-[#3D5EE1]/10">
                        <Text className="text-xs font-bold text-[#3D5EE1]">P{slot.period}</Text>
                      </View>
                      <View className="ml-2.5">
                        <Text className="text-sm font-bold text-slate-900">{slot.subject}</Text>
                        <Text className="text-xs text-slate-500">{slot.time}</Text>
                      </View>
                    </View>
                    <View className="rounded-lg bg-slate-100 px-2.5 py-1">
                      <Text className="text-xs font-bold text-slate-700">{slot.room}</Text>
                    </View>
                  </View>

                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                    <View className="flex-row items-center">
                      <Feather name="user" size={13} color="#64748b" />
                      <Text className="ml-1 text-xs text-slate-600">{slot.teacher}</Text>
                    </View>
                    <Text className="text-xs font-semibold text-slate-700">
                      {slot.className} - Sec {slot.section}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* HOMEWORK TAB */}
        {activeTab === 'homework' && (
          <View className="gap-y-3">
            {filteredHomeworks.map((hw) => {
              const submissionRate = Math.round(
                (hw.totalSubmissions / hw.totalStudents) * 100
              );
              return (
                <View
                  key={hw.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{hw.subject}</Text>
                      <Text className="mt-0.5 text-sm font-bold text-slate-900">{hw.title}</Text>
                      <Text className="text-xs text-slate-500">
                        {hw.className} ({hw.section}) · Due: {hw.dueDate}
                      </Text>
                    </View>
                    <StatusBadge status={hw.status} />
                  </View>

                  <Text className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                    {hw.description}
                  </Text>

                  <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-slate-500">Submissions</Text>
                      <Text className="text-xs font-bold text-slate-800">
                        {hw.totalSubmissions} / {hw.totalStudents} ({submissionRate}%)
                      </Text>
                    </View>
                    <View className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <View
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${submissionRate}%` }}
                      />
                    </View>
                  </View>

                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                    <Text className="text-[11px] text-slate-400">Assigned: {hw.assignedDate}</Text>
                    <Pressable
                      onPress={() => handleToggleHomeworkStatus(hw.id)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5"
                    >
                      <Text className="text-xs font-semibold text-[#3D5EE1]">
                        {hw.status === 'Open' ? 'Mark Evaluated' : 'Reopen'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* EXAMS TAB */}
        {activeTab === 'exams' && (
          <View className="gap-y-3">
            {filteredExams.map((ex) => (
              <View
                key={ex.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">{ex.title}</Text>
                    <Text className="text-xs text-slate-500">{ex.examType}</Text>
                  </View>
                  <StatusBadge status={ex.status} />
                </View>

                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Duration</Text>
                    <Text className="text-xs font-semibold text-slate-800">
                      {ex.startDate} → {ex.endDate}
                    </Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Question Papers</Text>
                    <Text className="text-xs font-bold text-[#3D5EE1]">{ex.totalPapers} Papers</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Applicable</Text>
                    <Text className="text-xs text-slate-700">{ex.classes.join(', ')}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900 capitalize">
                New {activeTab === 'classes' ? 'Class' : activeTab === 'subjects' ? 'Subject' : activeTab === 'homework' ? 'Homework' : 'Exam'}
              </Text>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Title / Name *</Text>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="e.g. Grade VII, Advanced Physics, Essay Assignment"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'classes' ? 'Class Teacher' : activeTab === 'subjects' ? 'Department' : 'Subject'}
                </Text>
                <TextInput
                  value={formSubtitle}
                  onChangeText={setFormSubtitle}
                  placeholder="e.g. Sarah Mitchell, Science, Mathematics"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Room / Grade / Details</Text>
                <TextInput
                  value={formMeta}
                  onChangeText={setFormMeta}
                  placeholder="e.g. Room 204, Grade XII"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>
            </View>

            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddNewItem}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
