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
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import {
  INITIAL_CLASSES,
  INITIAL_CLASSROOMS,
  INITIAL_EXAMS,
  INITIAL_EXAM_RESULTS,
  INITIAL_HOMEWORK_GRADING,
  INITIAL_HOMEWORKS,
  INITIAL_SECTIONS,
  INITIAL_STUDY_MATERIALS,
  INITIAL_SUBJECTS,
  INITIAL_TEACHER_TIMETABLE,
  INITIAL_TIMETABLE,
} from '@/data/academicMock';
import type {
  ClassItem,
  ClassroomItem,
  ExamItem,
  ExamResultItem,
  HomeworkGradingItem,
  HomeworkItem,
  SectionItem,
  StudyMaterialItem,
  SubjectItem,
  TeacherTimetableSlot,
  TimetableSlot,
} from '@/types/modules';

type MainAcademicModule =
  | 'classes_sections'
  | 'subjects'
  | 'timetable'
  | 'learning'
  | 'assessments';

type ClassSubTab = 'classes' | 'classrooms' | 'sections';
type TimetableSubTab = 'class_tt' | 'teacher_tt';
type LearningSubTab = 'materials' | 'homework';
type AssessmentSubTab = 'exams' | 'results';

export default function AcademicScreen() {
  // Top-level Academic Module Selector
  const [activeModule, setActiveModule] = useState<MainAcademicModule>('classes_sections');

  // Sub-tabs for each module
  const [classSubTab, setClassSubTab] = useState<ClassSubTab>('classes');
  const [timetableSubTab, setTimetableSubTab] = useState<TimetableSubTab>('class_tt');
  const [learningSubTab, setLearningSubTab] = useState<LearningSubTab>('homework');
  const [assessmentSubTab, setAssessmentSubTab] = useState<AssessmentSubTab>('exams');

  // Global search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<TimetableSlot['day']>('Monday');
  const [savedViewFilter, setSavedViewFilter] = useState<string>('All');

  // Local state for all 8 Academic pages + Assessments
  const [classes, setClasses] = useState<ClassItem[]>(INITIAL_CLASSES);
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>(INITIAL_CLASSROOMS);
  const [sections, setSections] = useState<SectionItem[]>(INITIAL_SECTIONS);
  const [subjects, setSubjects] = useState<SubjectItem[]>(INITIAL_SUBJECTS);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(INITIAL_TIMETABLE);
  const [teacherTimetable, setTeacherTimetable] = useState<TeacherTimetableSlot[]>(INITIAL_TEACHER_TIMETABLE);
  const [materials, setMaterials] = useState<StudyMaterialItem[]>(INITIAL_STUDY_MATERIALS);
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>(INITIAL_HOMEWORKS);
  const [gradingRecords, setGradingRecords] = useState<HomeworkGradingItem[]>(INITIAL_HOMEWORK_GRADING);
  const [exams] = useState<ExamItem[]>(INITIAL_EXAMS);
  const [results] = useState<ExamResultItem[]>(INITIAL_EXAM_RESULTS);

  // Modals state
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddTimetableModal, setShowAddTimetableModal] = useState(false);
  const [showAddTeacherSlotModal, setShowAddTeacherSlotModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showAddHomeworkModal, setShowAddHomeworkModal] = useState(false);
  const [showGradingDrawer, setShowGradingDrawer] = useState(false);
  const [showClassDetailModal, setShowClassDetailModal] = useState(false);
  const [selectedClassDetail, setSelectedClassDetail] = useState<ClassItem | null>(null);
  const [selectedHomeworkForGrading, setSelectedHomeworkForGrading] = useState<HomeworkItem | null>(null);

  // Generic form inputs
  const [formField1, setFormField1] = useState('');
  const [formField2, setFormField2] = useState('');
  const [formField3, setFormField3] = useState('');
  const [formField4, setFormField4] = useState('');
  const [formField5, setFormField5] = useState('');
  const [formField6, setFormField6] = useState('');

  // Grading form inputs
  const [gradeMarks, setGradeMarks] = useState('90');
  const [gradeLetter, setGradeLetter] = useState('A+');
  const [gradeRemarks, setGradeRemarks] = useState('');
  const [gradeStudent, setGradeStudent] = useState('Janet Daniel');

  const resetFormFields = () => {
    setFormField1('');
    setFormField2('');
    setFormField3('');
    setFormField4('');
    setFormField5('');
    setFormField6('');
  };

  // --- FILTERED DATA SETS ---
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.classTeacher.toLowerCase().includes(q) ||
        c.roomNo.toLowerCase().includes(q) ||
        c.numeral.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (savedViewFilter === 'Active Classes') return c.status === 'Active';
      if (savedViewFilter === 'New This Year') return c.status === 'New';
      if (savedViewFilter === 'Inactive') return c.status === 'Inactive' || c.status === 'Archived';
      return true;
    });
  }, [classes, searchQuery, savedViewFilter]);

  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        r.name.toLowerCase().includes(q) ||
        r.roomNo.toLowerCase().includes(q) ||
        r.building.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.teacher.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (savedViewFilter === 'Available') return r.status === 'Available';
      if (savedViewFilter === 'Occupied') return r.status === 'Occupied';
      if (savedViewFilter === 'Maintenance') return r.status === 'Maintenance';
      return true;
    });
  }, [classrooms, searchQuery, savedViewFilter]);

  const filteredSections = useMemo(() => {
    return sections.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.classTeacher.toLowerCase().includes(q) ||
        s.roomNo.toLowerCase().includes(q) ||
        s.shift.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (savedViewFilter === 'Active') return s.status === 'Active';
      if (savedViewFilter === 'Full') return s.status === 'Full';
      if (savedViewFilter === 'Morning') return s.shift === 'Morning';
      if (savedViewFilter === 'Afternoon') return s.shift === 'Afternoon';
      return true;
    });
  }, [sections, searchQuery, savedViewFilter]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((sbj) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        sbj.name.toLowerCase().includes(q) ||
        sbj.code.toLowerCase().includes(q) ||
        sbj.department.toLowerCase().includes(q) ||
        sbj.teacher.toLowerCase().includes(q) ||
        sbj.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (savedViewFilter === 'Active') return sbj.status === 'Active';
      if (savedViewFilter === 'Published') return sbj.status === 'Published';
      if (savedViewFilter === 'Draft') return sbj.status === 'Draft';
      if (savedViewFilter === 'Core') return sbj.category === 'Core';
      if (savedViewFilter === 'Vocational') return sbj.category === 'Vocational';
      return true;
    });
  }, [subjects, searchQuery, savedViewFilter]);

  const filteredTimetable = useMemo(() => {
    return timetable.filter((slot) => {
      const matchesDay = slot.day === selectedDay;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        slot.subject.toLowerCase().includes(q) ||
        slot.teacher.toLowerCase().includes(q) ||
        slot.className.toLowerCase().includes(q) ||
        slot.room.toLowerCase().includes(q);
      return matchesDay && matchesSearch;
    });
  }, [timetable, selectedDay, searchQuery]);

  const filteredTeacherTimetable = useMemo(() => {
    return teacherTimetable.filter((slot) => {
      const matchesDay = slot.day === selectedDay;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        slot.subject.toLowerCase().includes(q) ||
        slot.heading.toLowerCase().includes(q) ||
        slot.className.toLowerCase().includes(q) ||
        slot.room.toLowerCase().includes(q) ||
        slot.mode.toLowerCase().includes(q);

      if (!matchesDay || !matchesSearch) return false;
      if (savedViewFilter === 'Teaching') return slot.mode === 'Teaching';
      if (savedViewFilter === 'Free Period') return slot.mode === 'Free Period';
      if (savedViewFilter === 'Exam Duty') return slot.mode === 'Exam Duty';
      return true;
    });
  }, [teacherTimetable, selectedDay, searchQuery, savedViewFilter]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((mat) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        mat.title.toLowerCase().includes(q) ||
        mat.subject.toLowerCase().includes(q) ||
        mat.chapter.toLowerCase().includes(q) ||
        mat.grade.toLowerCase().includes(q) ||
        mat.uploadedBy.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (savedViewFilter === 'Published') return mat.status === 'Published';
      if (savedViewFilter === 'Draft') return mat.status === 'Draft';
      if (savedViewFilter === 'PDF') return mat.fileType === 'PDF';
      if (savedViewFilter === 'Video') return mat.fileType === 'Video';
      return true;
    });
  }, [materials, searchQuery, savedViewFilter]);

  const filteredHomeworks = useMemo(() => {
    return homeworks.filter((hw) => {
      const q = searchQuery.toLowerCase();
      const titleStr = hw.title || hw.name || '';
      const matchesSearch =
        titleStr.toLowerCase().includes(q) ||
        hw.subject.toLowerCase().includes(q) ||
        hw.className.toLowerCase().includes(q) ||
        hw.teacher.toLowerCase().includes(q) ||
        hw.type.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (savedViewFilter === 'In Progress') return hw.status === 'In Progress';
      if (savedViewFilter === 'Evaluated') return hw.status === 'Evaluated';
      if (savedViewFilter === 'Overdue') return hw.status === 'Overdue';
      if (savedViewFilter === 'High Priority') return hw.priority === 'High';
      return true;
    });
  }, [homeworks, searchQuery, savedViewFilter]);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.examType.toLowerCase().includes(q)
      );
    });
  }, [exams, searchQuery]);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.rollNo.includes(q) ||
        r.subject.toLowerCase().includes(q)
      );
    });
  }, [results, searchQuery]);

  // --- ACTIONS & SUBMISSIONS ---
  const handleCreateClass = () => {
    if (!formField1.trim()) {
      Alert.alert('Required', 'Please enter class name.');
      return;
    }
    const newClass: ClassItem = {
      id: `CLS-2024-${Date.now().toString().slice(-3)}`,
      name: formField1,
      numeral: formField2 || 'X',
      category: (formField3 as ClassItem['category']) || 'Secondary',
      sections: ['A', 'B'],
      classTeacher: formField4 || 'Staff Faculty',
      teacherSubject: 'Curriculum Core',
      totalStudents: parseInt(formField5, 10) || 35,
      capacity: parseInt(formField6, 10) || 40,
      roomNo: 'Room 205',
      status: 'Active',
      boysCount: 18,
      girlsCount: 17,
      subjectsCount: 7,
    };
    setClasses([newClass, ...classes]);
    resetFormFields();
    setShowAddClassModal(false);
    Alert.alert('Success', `Class "${formField1}" created.`);
  };

  const handleCreateRoom = () => {
    if (!formField1.trim() || !formField2.trim()) {
      Alert.alert('Required', 'Please enter room name and number.');
      return;
    }
    const newRoom: ClassroomItem = {
      id: `R${Date.now().toString().slice(-6)}`,
      name: formField1,
      roomNo: formField2,
      building: formField3 || 'Block A',
      floor: formField4 || '1st Floor',
      type: (formField5 as ClassroomItem['type']) || 'Lecture Hall',
      capacity: parseInt(formField6, 10) || 45,
      status: 'Available',
      assignedClass: 'Grade X, A',
      teacher: 'Assigned Faculty',
      students: 38,
      availableSeats: 7,
      year: '2024/2025',
      facilities: ['Smart Board', 'Wi-Fi', 'Air Conditioning'],
    };
    setClassrooms([newRoom, ...classrooms]);
    resetFormFields();
    setShowAddRoomModal(false);
    Alert.alert('Success', `Classroom ${newRoom.roomNo} (${newRoom.name}) registered.`);
  };

  const handleCreateSection = () => {
    if (!formField1.trim() || !formField2.trim()) {
      Alert.alert('Required', 'Please enter section name and class.');
      return;
    }
    const cap = parseInt(formField5, 10) || 35;
    const studs = parseInt(formField4, 10) || 30;
    const newSection: SectionItem = {
      id: `SEC-${Date.now().toString().slice(-3)}`,
      name: formField1,
      className: formField2,
      year: '2024/2025',
      classTeacher: formField3 || 'Senior Teacher',
      roomNo: 'Room 102',
      floor: '1st Floor',
      shift: 'Morning',
      medium: 'English',
      students: studs,
      capacity: cap,
      seatsLeft: Math.max(0, cap - studs),
      boys: Math.floor(studs / 2),
      girls: Math.ceil(studs / 2),
      status: studs >= cap ? 'Full' : 'Active',
      note: formField6 || 'Regular academic section.',
    };
    setSections([newSection, ...sections]);
    resetFormFields();
    setShowAddSectionModal(false);
    Alert.alert('Success', `Section "${newSection.name}" created.`);
  };

  const handleCreateSubject = () => {
    if (!formField1.trim() || !formField2.trim()) {
      Alert.alert('Required', 'Please enter subject code and name.');
      return;
    }
    const newSubject: SubjectItem = {
      id: `sbj-${Date.now()}`,
      code: formField1,
      name: formField2,
      category: (formField3 as SubjectItem['category']) || 'Core',
      department: formField4 || 'General',
      teacher: formField5 || 'Senior Faculty',
      className: 'Grade X',
      section: 'A',
      year: '2024/2025',
      type: (formField6 as SubjectItem['type']) || 'Theory',
      weeklyHours: 5,
      periods: 5,
      credits: 4,
      units: 6,
      lessons: 24,
      assignments: 8,
      exams: 2,
      resources: 12,
      updated: 'Just now',
      status: 'Active',
      examMarks: 80,
      internalMarks: 20,
      passMarks: 40,
    };
    setSubjects([newSubject, ...subjects]);
    resetFormFields();
    setShowAddSubjectModal(false);
    Alert.alert('Success', `Subject "${newSubject.name}" published.`);
  };

  const handleCreateTimetableSlot = () => {
    if (!formField1.trim()) {
      Alert.alert('Required', 'Please enter subject title.');
      return;
    }
    const newSlot: TimetableSlot = {
      id: `tt-${Date.now()}`,
      day: selectedDay,
      period: timetable.filter((s) => s.day === selectedDay).length + 1,
      time: formField2 || '08:30 AM - 09:15 AM',
      subject: formField1,
      teacher: formField3 || 'Staff Teacher',
      className: formField4 || 'Grade XII',
      section: 'A',
      room: formField5 || 'Room 301',
      duration: '45 min',
      tone: 'primary',
    };
    setTimetable([...timetable, newSlot]);
    resetFormFields();
    setShowAddTimetableModal(false);
    Alert.alert('Success', `Period added to ${selectedDay} timetable.`);
  };

  const handleCreateTeacherSlot = () => {
    if (!formField1.trim()) {
      Alert.alert('Required', 'Please enter period subject or duty.');
      return;
    }
    const newTeacherSlot: TeacherTimetableSlot = {
      id: `ttt-${Date.now()}`,
      day: selectedDay,
      period: teacherTimetable.filter((s) => s.day === selectedDay).length + 1,
      time: formField2 || '10:20 - 11:05 AM',
      heading: formField3 || 'Faculty Assignment',
      subject: formField1,
      className: formField4 || 'Grade X',
      section: 'A',
      room: formField5 || 'Room 201',
      mode: (formField6 as TeacherTimetableSlot['mode']) || 'Teaching',
      tone: 'primary',
      teacherName: 'Sarah Mitchell',
      notes: 'Scheduled by academic coordinator.',
    };
    setTeacherTimetable([...teacherTimetable, newTeacherSlot]);
    resetFormFields();
    setShowAddTeacherSlotModal(false);
    Alert.alert('Success', `Teacher timetable slot registered for ${selectedDay}.`);
  };

  const handleUploadMaterial = () => {
    if (!formField1.trim() || !formField2.trim()) {
      Alert.alert('Required', 'Please enter material title and subject.');
      return;
    }
    const newMaterial: StudyMaterialItem = {
      id: `sm-${Date.now()}`,
      title: formField1,
      subject: formField2,
      grade: formField3 || 'Grade XII',
      className: `${formField3 || 'Grade XII'} - Sec A`,
      chapter: formField4 || 'Unit 1 Overview',
      fileType: (formField5 as StudyMaterialItem['fileType']) || 'PDF',
      fileSize: '3.4 MB',
      uploadDate: 'Today',
      uploadedBy: 'Faculty Instructor',
      downloads: 0,
      status: 'Published',
      description: formField6 || 'Academic course material and notes.',
    };
    setMaterials([newMaterial, ...materials]);
    resetFormFields();
    setShowAddMaterialModal(false);
    Alert.alert('Success', `Study material "${newMaterial.title}" published.`);
  };

  const handleCreateHomework = () => {
    if (!formField1.trim() || !formField2.trim()) {
      Alert.alert('Required', 'Please enter homework title and subject.');
      return;
    }
    const newHw: HomeworkItem = {
      id: `HW-2024-${Date.now().toString().slice(-3)}`,
      title: formField1,
      name: formField1,
      subject: formField2,
      type: (formField3 as HomeworkItem['type']) || 'Assignment',
      priority: (formField4 as HomeworkItem['priority']) || 'Medium',
      teacher: formField5 || 'Sarah Mitchell',
      className: formField6 || 'Grade XII',
      section: 'A',
      assignedDate: 'Today',
      assigned: 'Today',
      dueDate: 'In 5 Days',
      due: 'In 5 Days',
      duration: '5 Days Left',
      totalSubmissions: 0,
      submitted: 0,
      totalStudents: 40,
      total: 40,
      percent: 0,
      pending: 40,
      late: 0,
      files: 0,
      status: 'In Progress',
      description: 'Complete the attached problem set and submit before deadline.',
      maxMarks: 100,
    };
    setHomeworks([newHw, ...homeworks]);
    resetFormFields();
    setShowAddHomeworkModal(false);
    Alert.alert('Success', `Homework "${newHw.title}" published.`);
  };

  const handleSaveGrading = () => {
    if (!selectedHomeworkForGrading) return;
    const newRecord: HomeworkGradingItem = {
      homeworkId: selectedHomeworkForGrading.id,
      studentName: gradeStudent,
      rollNo: `STD-${Math.floor(1000 + Math.random() * 9000)}`,
      submittedDate: 'Just now',
      marksObtained: parseInt(gradeMarks, 10) || 85,
      outOf: 100,
      gradeLetter,
      rubricScore: `${gradeMarks}% (${gradeLetter})`,
      remarks: gradeRemarks || 'Evaluated and verified according to academic criteria.',
      feedbackType: parseInt(gradeMarks, 10) >= 80 ? 'Appreciation' : 'Improvement',
    };
    setGradingRecords([newRecord, ...gradingRecords]);
    // update homework evaluated count
    setHomeworks(
      homeworks.map((h) =>
        h.id === selectedHomeworkForGrading.id
          ? {
              ...h,
              status: 'Evaluated',
              submitted: (h.submitted || 0) + 1,
              totalSubmissions: (h.totalSubmissions || 0) + 1,
            }
          : h
      )
    );
    setShowGradingDrawer(false);
    Alert.alert('Graded', `Submission for ${gradeStudent} recorded successfully.`);
  };

  // Top Module Selection List
  const modulesList = [
    { id: 'classes_sections', title: 'Classes & Sections', icon: 'grid', badge: classes.length + classrooms.length + sections.length },
    { id: 'subjects', title: 'Subjects', icon: 'book', badge: subjects.length },
    { id: 'timetable', title: 'Timetable', icon: 'calendar', badge: timetable.length + teacherTimetable.length },
    { id: 'learning', title: 'Learning', icon: 'file-text', badge: materials.length + homeworks.length },
    { id: 'assessments', title: 'Assessments', icon: 'award', badge: exams.length + results.length },
  ];

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Top Main Module Selector */}
      <View className="bg-white border-b border-slate-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-3 pt-3 pb-2"
        >
          {modulesList.map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <Pressable
                key={mod.id}
                onPress={() => {
                  setActiveModule(mod.id as MainAcademicModule);
                  setSearchQuery('');
                  setSavedViewFilter('All');
                }}
                className={`mr-2.5 flex-row items-center rounded-xl px-3.5 py-2 ${
                  isActive
                    ? 'bg-[#3D5EE1]'
                    : 'bg-slate-50 border border-slate-200/80'
                }`}
              >
                <Feather
                  name={mod.icon as any}
                  size={14}
                  color={isActive ? '#ffffff' : '#64748b'}
                />
                <Text
                  className={`ml-1.5 text-xs font-bold ${
                    isActive ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {mod.title}
                </Text>
                <View
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 ${
                    isActive ? 'bg-white/20' : 'bg-slate-200'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      isActive ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {mod.badge}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Secondary Sub-Tabs */}
        <View className="px-3 pb-2.5 pt-1 border-t border-slate-100 flex-row items-center justify-between">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {activeModule === 'classes_sections' && (
              <View className="flex-row gap-x-2">
                {[
                  { id: 'classes', label: 'Classes (Page 22)', count: classes.length },
                  { id: 'classrooms', label: 'Classrooms (Page 23)', count: classrooms.length },
                  { id: 'sections', label: 'Sections (Page 24)', count: sections.length },
                ].map((st) => (
                  <Pressable
                    key={st.id}
                    onPress={() => {
                      setClassSubTab(st.id as ClassSubTab);
                      setSavedViewFilter('All');
                    }}
                    className={`rounded-lg px-3 py-1.5 ${
                      classSubTab === st.id
                        ? 'bg-blue-50 border border-[#3D5EE1]'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        classSubTab === st.id ? 'text-[#3D5EE1]' : 'text-slate-600'
                      }`}
                    >
                      {st.label} ({st.count})
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {activeModule === 'subjects' && (
              <View className="flex-row gap-x-2">
                <View className="rounded-lg bg-blue-50 px-3 py-1.5 border border-[#3D5EE1]">
                  <Text className="text-xs font-bold text-[#3D5EE1]">
                    Curriculum Subjects Catalog (Page 25) · {subjects.length}
                  </Text>
                </View>
              </View>
            )}

            {activeModule === 'timetable' && (
              <View className="flex-row gap-x-2">
                {[
                  { id: 'class_tt', label: 'Class Timetable (Page 26)', count: timetable.length },
                  { id: 'teacher_tt', label: 'Teacher Timetable (Page 27)', count: teacherTimetable.length },
                ].map((st) => (
                  <Pressable
                    key={st.id}
                    onPress={() => {
                      setTimetableSubTab(st.id as TimetableSubTab);
                      setSavedViewFilter('All');
                    }}
                    className={`rounded-lg px-3 py-1.5 ${
                      timetableSubTab === st.id
                        ? 'bg-blue-50 border border-[#3D5EE1]'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        timetableSubTab === st.id ? 'text-[#3D5EE1]' : 'text-slate-600'
                      }`}
                    >
                      {st.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {activeModule === 'learning' && (
              <View className="flex-row gap-x-2">
                {[
                  { id: 'homework', label: 'Homework & Grading (Page 29)', count: homeworks.length },
                  { id: 'materials', label: 'Study Materials (Page 28)', count: materials.length },
                ].map((st) => (
                  <Pressable
                    key={st.id}
                    onPress={() => {
                      setLearningSubTab(st.id as LearningSubTab);
                      setSavedViewFilter('All');
                    }}
                    className={`rounded-lg px-3 py-1.5 ${
                      learningSubTab === st.id
                        ? 'bg-blue-50 border border-[#3D5EE1]'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        learningSubTab === st.id ? 'text-[#3D5EE1]' : 'text-slate-600'
                      }`}
                    >
                      {st.label} ({st.count})
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {activeModule === 'assessments' && (
              <View className="flex-row gap-x-2">
                {[
                  { id: 'exams', label: 'Exam Schedules', count: exams.length },
                  { id: 'results', label: 'Scorecards', count: results.length },
                ].map((st) => (
                  <Pressable
                    key={st.id}
                    onPress={() => setAssessmentSubTab(st.id as AssessmentSubTab)}
                    className={`rounded-lg px-3 py-1.5 ${
                      assessmentSubTab === st.id
                        ? 'bg-blue-50 border border-[#3D5EE1]'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        assessmentSubTab === st.id ? 'text-[#3D5EE1]' : 'text-slate-600'
                      }`}
                    >
                      {st.label} ({st.count})
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Quick Create Button */}
          <Pressable
            onPress={() => {
              resetFormFields();
              if (activeModule === 'classes_sections') {
                if (classSubTab === 'classes') setShowAddClassModal(true);
                else if (classSubTab === 'classrooms') setShowAddRoomModal(true);
                else setShowAddSectionModal(true);
              } else if (activeModule === 'subjects') {
                setShowAddSubjectModal(true);
              } else if (activeModule === 'timetable') {
                if (timetableSubTab === 'class_tt') setShowAddTimetableModal(true);
                else setShowAddTeacherSlotModal(true);
              } else if (activeModule === 'learning') {
                if (learningSubTab === 'homework') setShowAddHomeworkModal(true);
                else setShowAddMaterialModal(true);
              } else {
                Alert.alert('Assessment', 'Create new exam via curriculum board.');
              }
            }}
            className="ml-2 flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-1.5 shadow-sm shadow-[#3D5EE1]/30"
          >
            <Feather name="plus" size={14} color="#ffffff" />
            <Text className="ml-1 text-xs font-bold text-white">Add</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="px-3 pb-3">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search across ${
              activeModule === 'classes_sections'
                ? classSubTab
                : activeModule === 'timetable'
                ? timetableSubTab
                : activeModule === 'learning'
                ? learningSubTab
                : activeModule
            }…`}
          />

          {/* Day Selector for Timetable Modules */}
          {activeModule === 'timetable' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as TimetableSlot['day'][]).map(
                (day) => (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    className={`mr-2 rounded-xl px-3 py-1.5 ${
                      selectedDay === day
                        ? 'bg-[#3D5EE1]'
                        : 'bg-slate-100 border border-slate-200'
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

          {/* Saved Views Pill Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
            {['All', 'Active', 'Published', 'Draft', 'Full', 'Available', 'Occupied', 'Maintenance'].map((flt) => (
              <Pressable
                key={flt}
                onPress={() => setSavedViewFilter(flt)}
                className={`mr-1.5 rounded-full px-2.5 py-1 ${
                  savedViewFilter === flt
                    ? 'bg-slate-900'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    savedViewFilter === flt ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {flt}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Main Content Scroll Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-16"
      >
        {/* ================================================================= */}
        {/* 1. CLASSES (Page 22) */}
        {/* ================================================================= */}
        {activeModule === 'classes_sections' && classSubTab === 'classes' && (
          <View className="gap-y-3">
            {/* KPI Strip */}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Classes</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{classes.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Active Classes</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  {classes.filter((c) => c.status === 'Active').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Enrolled</Text>
                <Text className="text-lg font-bold text-[#3D5EE1] mt-0.5">
                  {classes.reduce((sum, c) => sum + c.totalStudents, 0)}
                </Text>
              </View>
            </View>

            {filteredClasses.map((cls) => {
              const occupancy = Math.round((cls.totalStudents / cls.capacity) * 100);
              const sectionsList = Array.isArray(cls.sections) ? cls.sections : [cls.sections];
              return (
                <View
                  key={cls.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 mr-3">
                        <Text className="text-base font-black text-[#3D5EE1]">{cls.numeral}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5">
                          <Text className="text-base font-bold text-slate-900">{cls.name}</Text>
                          <View className="rounded-md bg-slate-100 px-1.5 py-0.5">
                            <Text className="text-[10px] font-semibold text-slate-600">{cls.category}</Text>
                          </View>
                        </View>
                        <Text className="text-xs text-slate-500 mt-0.5">
                          Teacher: <Text className="font-semibold text-slate-800">{cls.classTeacher}</Text>
                          {cls.teacherSubject ? ` (${cls.teacherSubject})` : ''}
                        </Text>
                      </View>
                    </View>
                    <StatusBadge status={cls.status} />
                  </View>

                  {/* Seat meter */}
                  <View className="mt-3.5 rounded-xl bg-slate-50 p-2.5">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-xs text-slate-500">
                        Class Capacity · <Text className="font-bold text-slate-700">{cls.roomNo}</Text>
                      </Text>
                      <Text className="text-xs font-bold text-slate-800">
                        {cls.totalStudents} / {cls.capacity} ({occupancy}%)
                      </Text>
                    </View>
                    <View className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <View
                        className="h-full rounded-full bg-[#3D5EE1]"
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </View>
                    <View className="flex-row items-center justify-between mt-2 pt-1 border-t border-slate-200/60">
                      <Text className="text-[11px] text-slate-500">
                        Boys: <Text className="font-semibold text-slate-700">{cls.boysCount ?? 18}</Text> · Girls: <Text className="font-semibold text-slate-700">{cls.girlsCount ?? 16}</Text>
                      </Text>
                      <Text className="text-[11px] font-semibold text-indigo-700">
                        {cls.subjectsCount ?? 6} Subjects
                      </Text>
                    </View>
                  </View>

                  {/* Sections list and actions */}
                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
                    <View className="flex-row flex-wrap items-center gap-1 flex-1">
                      <Text className="text-[11px] text-slate-400 mr-1">Sections:</Text>
                      {sectionsList.map((sec) => (
                        <View key={sec} className="rounded-md bg-slate-100 px-2 py-0.5">
                          <Text className="text-[11px] font-semibold text-slate-700">{sec}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      onPress={() => {
                        setSelectedClassDetail(cls);
                        setShowClassDetailModal(true);
                      }}
                      className="rounded-lg bg-blue-50 px-2.5 py-1 border border-blue-200"
                    >
                      <Text className="text-xs font-bold text-[#3D5EE1]">Class 360°</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ================================================================= */}
        {/* 2. CLASSROOMS (Page 23) */}
        {/* ================================================================= */}
        {activeModule === 'classes_sections' && classSubTab === 'classrooms' && (
          <View className="gap-y-3">
            {/* KPI Strip */}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Rooms</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{classrooms.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Available</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  {classrooms.filter((r) => r.status === 'Available').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Occupied</Text>
                <Text className="text-lg font-bold text-amber-600 mt-0.5">
                  {classrooms.filter((r) => r.status === 'Occupied').length}
                </Text>
              </View>
            </View>

            {filteredClassrooms.map((room) => (
              <View
                key={room.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <View className="rounded-md bg-blue-50 px-2 py-0.5 border border-blue-200">
                        <Text className="text-xs font-bold text-[#3D5EE1]">Room {room.roomNo}</Text>
                      </View>
                      <Text className="text-base font-bold text-slate-900">{room.name}</Text>
                    </View>
                    <Text className="text-xs text-slate-500 mt-1">
                      {room.building} · {room.floor} · <Text className="font-semibold text-slate-700">{room.type}</Text>
                    </Text>
                  </View>
                  <StatusBadge status={room.status} />
                </View>

                {/* Utilization meter */}
                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs text-slate-500">
                      Assigned: <Text className="font-semibold text-slate-800">{room.assignedClass}</Text>
                    </Text>
                    <Text className="text-xs font-bold text-slate-800">
                      {room.students} / {room.capacity} seats ({room.availableSeats} left)
                    </Text>
                  </View>
                  <View className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <View
                      className={`h-full rounded-full ${
                        room.availableSeats === 0 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.round((room.students / room.capacity) * 100),
                          100
                        )}%`,
                      }}
                    />
                  </View>
                  <Text className="mt-2 text-[11px] text-slate-500">
                    Faculty In-Charge: <Text className="font-semibold text-slate-700">{room.teacher}</Text>
                  </Text>
                </View>

                {/* Facilities tags */}
                <View className="mt-3 flex-row flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
                  {room.facilities.map((fac) => (
                    <View key={fac} className="flex-row items-center rounded-md bg-slate-100 px-2 py-0.5">
                      <Feather name="check-circle" size={10} color="#10b981" />
                      <Text className="ml-1 text-[10px] font-medium text-slate-700">{fac}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 3. SECTIONS (Page 24) */}
        {/* ================================================================= */}
        {activeModule === 'classes_sections' && classSubTab === 'sections' && (
          <View className="gap-y-3">
            {/* KPI Strip */}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Sections</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{sections.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Active</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  {sections.filter((s) => s.status === 'Active').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Full</Text>
                <Text className="text-lg font-bold text-rose-600 mt-0.5">
                  {sections.filter((s) => s.status === 'Full').length}
                </Text>
              </View>
            </View>

            {filteredSections.map((sec) => {
              const seatPercent = Math.round((sec.students / sec.capacity) * 100);
              return (
                <View
                  key={sec.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-base font-bold text-slate-900">
                          {sec.className} · {sec.name}
                        </Text>
                        <View className="rounded-md bg-indigo-50 px-2 py-0.5 border border-indigo-200">
                          <Text className="text-[10px] font-bold text-indigo-700">{sec.shift}</Text>
                        </View>
                      </View>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        Teacher: <Text className="font-semibold text-slate-800">{sec.classTeacher}</Text> · {sec.roomNo} ({sec.floor})
                      </Text>
                    </View>
                    <StatusBadge status={sec.status} />
                  </View>

                  {/* Seat Meter (PDF §8.1.3 specification) */}
                  <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-slate-500">
                        Enrollment: <Text className="font-bold text-slate-800">{sec.students} / {sec.capacity}</Text>
                      </Text>
                      <Text
                        className={`text-xs font-bold ${
                          sec.seatsLeft === 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {sec.seatsLeft === 0 ? 'Full (0 Seats)' : `${sec.seatsLeft} Seats Left`}
                      </Text>
                    </View>
                    <View className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <View
                        className={`h-full rounded-full ${
                          sec.seatsLeft === 0 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(seatPercent, 100)}%` }}
                      />
                    </View>
                    <View className="flex-row items-center justify-between mt-2 text-[11px] text-slate-600">
                      <Text className="text-[11px] text-slate-500">
                        Boys: <Text className="font-bold text-slate-700">{sec.boys}</Text> · Girls: <Text className="font-bold text-slate-700">{sec.girls}</Text>
                      </Text>
                      <Text className="text-[11px] font-medium text-slate-600">Medium: {sec.medium}</Text>
                    </View>
                  </View>

                  <Text className="mt-2.5 text-xs text-slate-500 italic">
                    &ldquo;{sec.note}&rdquo;
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ================================================================= */}
        {/* 4. SUBJECTS (Page 25) */}
        {/* ================================================================= */}
        {activeModule === 'subjects' && (
          <View className="gap-y-3">
            {/* KPI Strip */}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Curriculum Total</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{subjects.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Core Subjects</Text>
                <Text className="text-lg font-bold text-[#3D5EE1] mt-0.5">
                  {subjects.filter((s) => s.category === 'Core').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Active / Published</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  {subjects.filter((s) => s.status === 'Active' || s.status === 'Published').length}
                </Text>
              </View>
            </View>

            {filteredSubjects.map((sbj) => (
              <View
                key={sbj.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{sbj.code}</Text>
                      <View className="rounded-md bg-purple-50 px-2 py-0.5 border border-purple-200">
                        <Text className="text-[10px] font-bold text-purple-700">{sbj.category}</Text>
                      </View>
                    </View>
                    <Text className="mt-1 text-base font-bold text-slate-900">{sbj.name}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {sbj.department} Dept · Faculty: <Text className="font-semibold text-slate-800">{sbj.teacher}</Text>
                    </Text>
                  </View>
                  <StatusBadge status={sbj.status} />
                </View>

                {/* Coursework & Metrics Grid */}
                <View className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Structure</Text>
                    <Text className="text-xs font-bold text-slate-800">
                      {sbj.type} · {sbj.periods} P/wk · {sbj.credits} Cr
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Curriculum Depth</Text>
                    <Text className="text-xs font-bold text-indigo-700">
                      {sbj.units} Units · {sbj.lessons} Lessons
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Assignments / Exams</Text>
                    <Text className="text-xs font-semibold text-slate-700">
                      {sbj.assignments} Assignments · {sbj.exams} Exams
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Marks Evaluation</Text>
                    <Text className="text-xs font-bold text-slate-800">
                      Exam: {sbj.examMarks ?? 80} · Int: {sbj.internalMarks ?? 20} (Pass: {sbj.passMarks ?? 40})
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">
                    Applicable: {sbj.className} (Sec {sbj.section})
                  </Text>
                  <Text className="text-[11px] text-slate-400">Updated: {sbj.updated}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 5. CLASS TIMETABLE (Page 26) */}
        {/* ================================================================= */}
        {activeModule === 'timetable' && timetableSubTab === 'class_tt' && (
          <View className="gap-y-3">
            <View className="rounded-2xl bg-blue-50/70 p-3.5 border border-blue-100 flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-bold text-[#3D5EE1]">Class Schedule · {selectedDay}</Text>
                <Text className="text-xs text-slate-600 mt-0.5">
                  Grade XII - Section A · Room 301 · 7 Scheduled Periods
                </Text>
              </View>
              <View className="rounded-lg bg-blue-600 px-2.5 py-1">
                <Text className="text-[11px] font-bold text-white">Full Week</Text>
              </View>
            </View>

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
                    <View className="flex-row items-center flex-1">
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#3D5EE1]/10 mr-3">
                        <Text className="text-xs font-bold text-[#3D5EE1]">P{slot.period}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-slate-900">{slot.subject}</Text>
                        <Text className="text-xs text-slate-500">{slot.time} ({slot.duration ?? '45 min'})</Text>
                      </View>
                    </View>
                    <View className="rounded-lg bg-slate-100 px-2.5 py-1">
                      <Text className="text-xs font-bold text-slate-700">{slot.room}</Text>
                    </View>
                  </View>

                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                    <View className="flex-row items-center">
                      <Feather name="user" size={13} color="#64748b" />
                      <Text className="ml-1 text-xs text-slate-700 font-semibold">{slot.teacher}</Text>
                    </View>
                    <Text className="text-xs font-medium text-slate-600">
                      {slot.className} - Sec {slot.section}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================================================================= */}
        {/* 6. TEACHER TIMETABLE (Page 27) */}
        {/* ================================================================= */}
        {activeModule === 'timetable' && timetableSubTab === 'teacher_tt' && (
          <View className="gap-y-3">
            {/* Teacher Profile Banner (PDF Page 28 §8.3.2) */}
            <View className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm shadow-black/5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 mr-3">
                    <Feather name="user-check" size={20} color="#4f46e5" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-base font-bold text-slate-900">Sarah Mitchell</Text>
                      <View className="rounded-md bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                        <Text className="text-[10px] font-bold text-emerald-700">On Duty</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      Senior Faculty · Science Dept · Emp #T849126
                    </Text>
                  </View>
                </View>
                <View className="rounded-lg bg-slate-100 px-2 py-1">
                  <Text className="text-[11px] font-semibold text-slate-700">Physics, Science</Text>
                </View>
              </View>
            </View>

            {filteredTeacherTimetable.length === 0 ? (
              <View className="items-center py-12">
                <Feather name="calendar" size={36} color="#94a3b8" />
                <Text className="mt-2 text-sm text-slate-500">No periods or duties for {selectedDay}.</Text>
              </View>
            ) : (
              filteredTeacherTimetable.map((slot) => {
                const isDuty = slot.mode === 'Exam Duty';
                const isFree = slot.mode === 'Free Period';
                const isMeeting = slot.mode === 'Staff Meeting';
                return (
                  <View
                    key={slot.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5 mb-1">
                          <View
                            className={`rounded-md px-2 py-0.5 ${
                              isDuty
                                ? 'bg-amber-50 border border-amber-200'
                                : isFree
                                ? 'bg-cyan-50 border border-cyan-200'
                                : isMeeting
                                ? 'bg-rose-50 border border-rose-200'
                                : 'bg-blue-50 border border-blue-200'
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${
                                isDuty
                                  ? 'text-amber-700'
                                  : isFree
                                  ? 'text-cyan-700'
                                  : isMeeting
                                  ? 'text-rose-700'
                                  : 'text-[#3D5EE1]'
                              }`}
                            >
                              {slot.mode}
                            </Text>
                          </View>
                          <Text className="text-xs font-semibold text-slate-400">Period #{slot.period}</Text>
                        </View>
                        <Text className="text-base font-bold text-slate-900">{slot.heading}</Text>
                        <Text className="text-xs text-slate-600 mt-0.5">{slot.subject}</Text>
                      </View>
                      <View className="rounded-lg bg-slate-100 px-2.5 py-1">
                        <Text className="text-xs font-bold text-slate-700">{slot.room}</Text>
                      </View>
                    </View>

                    <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                      <View className="flex-row items-center justify-between text-xs">
                        <Text className="text-xs text-slate-500">Slot Time: <Text className="font-semibold text-slate-800">{slot.time}</Text></Text>
                        <Text className="text-xs font-semibold text-slate-700">{slot.className} ({slot.section})</Text>
                      </View>
                      {slot.notes && (
                        <Text className="mt-1 text-[11px] text-slate-500 italic">
                          &ldquo;{slot.notes}&rdquo;
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ================================================================= */}
        {/* 7. STUDY MATERIALS (Page 28) */}
        {/* ================================================================= */}
        {activeModule === 'learning' && learningSubTab === 'materials' && (
          <View className="gap-y-3">
            {/* KPI Strip */}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Repository Files</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{materials.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Downloads</Text>
                <Text className="text-lg font-bold text-[#3D5EE1] mt-0.5">
                  {materials.reduce((sum, m) => sum + (m.downloads || 0), 0)}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Published</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  {materials.filter((m) => m.status === 'Published').length}
                </Text>
              </View>
            </View>

            {filteredMaterials.map((mat) => (
              <View
                key={mat.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View className="rounded-md bg-rose-50 px-2 py-0.5 border border-rose-200">
                        <Text className="text-[10px] font-bold text-rose-700">{mat.fileType}</Text>
                      </View>
                      <View className="rounded-md bg-slate-100 px-2 py-0.5">
                        <Text className="text-[10px] font-semibold text-slate-600">{mat.grade}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900">{mat.title}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {mat.subject} · {mat.chapter}
                    </Text>
                  </View>
                  <StatusBadge status={mat.status} />
                </View>

                {mat.description && (
                  <Text className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {mat.description}
                  </Text>
                )}

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">
                    Uploaded by {mat.uploadedBy} · {mat.uploadDate} ({mat.fileSize})
                  </Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        'Download Material',
                        `Downloading "${mat.title}" (${mat.fileSize}) to device storage.`
                      )
                    }
                    className="flex-row items-center rounded-lg bg-blue-50 px-2.5 py-1 border border-blue-200"
                  >
                    <Feather name="download" size={12} color="#3D5EE1" />
                    <Text className="ml-1 text-xs font-bold text-[#3D5EE1]">
                      Download ({mat.downloads})
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 8. HOMEWORK & SUBMISSION TRACKER (Page 29) */}
        {/* ================================================================= */}
        {activeModule === 'learning' && learningSubTab === 'homework' && (
          <View className="gap-y-3">
            {/* KPI Strip */}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Active Tasks</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{homeworks.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">In Progress</Text>
                <Text className="text-lg font-bold text-amber-600 mt-0.5">
                  {homeworks.filter((h) => h.status === 'In Progress').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Evaluated</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  {homeworks.filter((h) => h.status === 'Evaluated').length}
                </Text>
              </View>
            </View>

            {filteredHomeworks.map((hw) => {
              const totalSubs = hw.submitted ?? hw.totalSubmissions ?? 0;
              const totalStuds = hw.total ?? hw.totalStudents ?? 40;
              const rate = Math.round((totalSubs / totalStuds) * 100);
              const titleText = hw.title || hw.name || 'Homework Assignment';

              return (
                <View
                  key={hw.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <View
                          className={`rounded-md px-2 py-0.5 ${
                            hw.priority === 'High'
                              ? 'bg-rose-50 border border-rose-200'
                              : hw.priority === 'Medium'
                              ? 'bg-amber-50 border border-amber-200'
                              : 'bg-slate-100'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold ${
                              hw.priority === 'High'
                                ? 'text-rose-700'
                                : hw.priority === 'Medium'
                                ? 'text-amber-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {hw.priority} Priority
                          </Text>
                        </View>
                        <View className="rounded-md bg-blue-50 px-2 py-0.5 border border-blue-200">
                          <Text className="text-[10px] font-bold text-[#3D5EE1]">{hw.type}</Text>
                        </View>
                      </View>
                      <Text className="text-base font-bold text-slate-900">{titleText}</Text>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        {hw.subject} · {hw.className} (Sec {hw.section}) · Faculty: {hw.teacher}
                      </Text>
                    </View>
                    <StatusBadge status={hw.status} />
                  </View>

                  <Text className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {hw.description}
                  </Text>

                  {/* Submission Tracker specification */}
                  <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-slate-500">
                        Submissions: <Text className="font-bold text-slate-800">{totalSubs} / {totalStuds}</Text>
                      </Text>
                      <Text className="text-xs font-bold text-slate-800">{rate}% Complete</Text>
                    </View>
                    <View className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <View
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </View>
                    <View className="flex-row items-center justify-between mt-2 pt-1 border-t border-slate-200/60">
                      <Text className="text-[11px] text-slate-500">
                        Pending: <Text className="font-semibold text-amber-600">{hw.pending ?? 0}</Text> · Late: <Text className="font-semibold text-rose-600">{hw.late ?? 0}</Text>
                      </Text>
                      <Text className="text-[11px] font-semibold text-slate-700">
                        Due: {hw.dueDate || hw.due} ({hw.duration || 'Active'})
                      </Text>
                    </View>
                  </View>

                  {/* Actions & Grading Drawer trigger */}
                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                    <Text className="text-[11px] text-slate-400">Assigned: {hw.assignedDate || hw.assigned}</Text>
                    <Pressable
                      onPress={() => {
                        setSelectedHomeworkForGrading(hw);
                        setShowGradingDrawer(true);
                      }}
                      className="flex-row items-center rounded-lg bg-[#3D5EE1] px-3 py-1.5"
                    >
                      <Feather name="check-square" size={12} color="#ffffff" />
                      <Text className="ml-1.5 text-xs font-bold text-white">
                        Grade Submissions
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ================================================================= */}
        {/* ASSESSMENTS (Exams & Results) */}
        {/* ================================================================= */}
        {activeModule === 'assessments' && assessmentSubTab === 'exams' && (
          <View className="gap-y-3">
            {filteredExams.map((ex) => (
              <View
                key={ex.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">{ex.title}</Text>
                    <Text className="text-xs text-slate-500">{ex.examType}</Text>
                  </View>
                  <StatusBadge status={ex.status} />
                </View>
                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-xs text-slate-600">
                    Schedule: <Text className="font-semibold text-slate-800">{ex.startDate} → {ex.endDate}</Text>
                  </Text>
                  <Text className="text-xs text-slate-600 mt-1">
                    Applicable: <Text className="font-semibold text-slate-800">{ex.classes.join(', ')}</Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeModule === 'assessments' && assessmentSubTab === 'results' && (
          <View className="gap-y-3">
            {filteredResults.map((res) => (
              <View
                key={res.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-[#3D5EE1]">Roll #{res.rollNo} · {res.grade}</Text>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{res.studentName}</Text>
                    <Text className="text-xs text-slate-500">{res.subject}</Text>
                  </View>
                  <View className="items-center rounded-xl bg-emerald-50 px-3 py-1.5 border border-emerald-200">
                    <Text className="text-base font-bold text-emerald-700">{res.gradeLetter}</Text>
                    <Text className="text-[10px] font-semibold text-emerald-600">
                      {res.marksObtained}/{res.totalMarks}
                    </Text>
                  </View>
                </View>
                <View className="mt-2.5 rounded-xl bg-slate-50 p-2">
                  <Text className="text-xs text-slate-600 italic">
                    &ldquo;{res.remarks}&rdquo;
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ================================================================= */}
      {/* MODAL 1: ADD CLASS */}
      {/* ================================================================= */}
      <Modal
        visible={showAddClassModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddClassModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">Add New Class</Text>
              <Pressable onPress={() => setShowAddClassModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>
            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Class Name *</Text>
                <TextInput
                  value={formField1}
                  onChangeText={setFormField1}
                  placeholder="e.g. Grade X · Section A"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Numeral *</Text>
                <TextInput
                  value={formField2}
                  onChangeText={setFormField2}
                  placeholder="e.g. X, XII, IV"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Category</Text>
                <TextInput
                  value={formField3}
                  onChangeText={setFormField3}
                  placeholder="Primary / Middle / Secondary / Higher Secondary"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Class Teacher</Text>
                <TextInput
                  value={formField4}
                  onChangeText={setFormField4}
                  placeholder="e.g. Marcus Vance"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Students</Text>
                  <TextInput
                    value={formField5}
                    onChangeText={setFormField5}
                    placeholder="35"
                    keyboardType="numeric"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Capacity</Text>
                  <TextInput
                    value={formField6}
                    onChangeText={setFormField6}
                    placeholder="40"
                    keyboardType="numeric"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
            </View>
            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddClassModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateClass}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Class</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 2: ADD CLASSROOM */}
      {/* ================================================================= */}
      <Modal
        visible={showAddRoomModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddRoomModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">Add New Classroom</Text>
              <Pressable onPress={() => setShowAddRoomModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>
            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Room Name *</Text>
                <TextInput
                  value={formField1}
                  onChangeText={setFormField1}
                  placeholder="e.g. Newton Hall"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Room Number *</Text>
                <TextInput
                  value={formField2}
                  onChangeText={setFormField2}
                  placeholder="e.g. 101, 204"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Building</Text>
                  <TextInput
                    value={formField3}
                    onChangeText={setFormField3}
                    placeholder="Block A"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Floor</Text>
                  <TextInput
                    value={formField4}
                    onChangeText={setFormField4}
                    placeholder="1st Floor"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Type</Text>
                  <TextInput
                    value={formField5}
                    onChangeText={setFormField5}
                    placeholder="Lecture Hall / Lab"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Capacity</Text>
                  <TextInput
                    value={formField6}
                    onChangeText={setFormField6}
                    placeholder="50"
                    keyboardType="numeric"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
            </View>
            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddRoomModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateRoom}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Room</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 3: ADD SECTION */}
      {/* ================================================================= */}
      <Modal
        visible={showAddSectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddSectionModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">Add New Section</Text>
              <Pressable onPress={() => setShowAddSectionModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>
            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Section Name *</Text>
                <TextInput
                  value={formField1}
                  onChangeText={setFormField1}
                  placeholder="e.g. Section A"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Class *</Text>
                <TextInput
                  value={formField2}
                  onChangeText={setFormField2}
                  placeholder="e.g. Grade X, Class III"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Class Teacher</Text>
                <TextInput
                  value={formField3}
                  onChangeText={setFormField3}
                  placeholder="e.g. Ms. Teresa Susan"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Current Students</Text>
                  <TextInput
                    value={formField4}
                    onChangeText={setFormField4}
                    placeholder="30"
                    keyboardType="numeric"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Max Capacity</Text>
                  <TextInput
                    value={formField5}
                    onChangeText={setFormField5}
                    placeholder="35"
                    keyboardType="numeric"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Notes</Text>
                <TextInput
                  value={formField6}
                  onChangeText={setFormField6}
                  placeholder="e.g. Smart board enabled section."
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
            </View>
            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddSectionModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateSection}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Section</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 4: ADD SUBJECT */}
      {/* ================================================================= */}
      <Modal
        visible={showAddSubjectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddSubjectModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">Add Curriculum Subject</Text>
              <Pressable onPress={() => setShowAddSubjectModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>
            <View className="mt-4 gap-y-3">
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Code *</Text>
                  <TextInput
                    value={formField1}
                    onChangeText={setFormField1}
                    placeholder="MAT-101"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-2">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Name *</Text>
                  <TextInput
                    value={formField2}
                    onChangeText={setFormField2}
                    placeholder="Advanced Calculus"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Category</Text>
                  <TextInput
                    value={formField3}
                    onChangeText={setFormField3}
                    placeholder="Core / Language / Elective"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Department</Text>
                  <TextInput
                    value={formField4}
                    onChangeText={setFormField4}
                    placeholder="Science / Math"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Teacher</Text>
                <TextInput
                  value={formField5}
                  onChangeText={setFormField5}
                  placeholder="e.g. Sarah Mitchell"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Type</Text>
                <TextInput
                  value={formField6}
                  onChangeText={setFormField6}
                  placeholder="Theory / Practical / Both"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
            </View>
            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddSubjectModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateSubject}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Subject</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 5: ADD TIMETABLE PERIOD */}
      {/* ================================================================= */}
      <Modal
        visible={showAddTimetableModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddTimetableModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">
                Add Period to {selectedDay}
              </Text>
              <Pressable onPress={() => setShowAddTimetableModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>
            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Subject *</Text>
                <TextInput
                  value={formField1}
                  onChangeText={setFormField1}
                  placeholder="e.g. Physics, Mathematics"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Time Range</Text>
                <TextInput
                  value={formField2}
                  onChangeText={setFormField2}
                  placeholder="e.g. 08:30 AM - 09:15 AM"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Teacher</Text>
                <TextInput
                  value={formField3}
                  onChangeText={setFormField3}
                  placeholder="e.g. Sarah Mitchell"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Class</Text>
                  <TextInput
                    value={formField4}
                    onChangeText={setFormField4}
                    placeholder="Grade XII"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Room</Text>
                  <TextInput
                    value={formField5}
                    onChangeText={setFormField5}
                    placeholder="Room 301"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
            </View>
            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddTimetableModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateTimetableSlot}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Slot</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 6: ADD TEACHER TIMETABLE SLOT */}
      {/* ================================================================= */}
      <Modal
        visible={showAddTeacherSlotModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddTeacherSlotModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">
                Add Teacher Routine Slot
              </Text>
              <Pressable onPress={() => setShowAddTeacherSlotModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>
            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Subject / Duty *</Text>
                <TextInput
                  value={formField1}
                  onChangeText={setFormField1}
                  placeholder="Physics Lecture / Exam Duty"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Slot Heading</Text>
                <TextInput
                  value={formField3}
                  onChangeText={setFormField3}
                  placeholder="Grade XII - Sec A Lecture"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Time</Text>
                  <TextInput
                    value={formField2}
                    onChangeText={setFormField2}
                    placeholder="08:30 - 09:15 AM"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Mode</Text>
                  <TextInput
                    value={formField6}
                    onChangeText={setFormField6}
                    placeholder="Teaching / Exam Duty / Free"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Class</Text>
                  <TextInput
                    value={formField4}
                    onChangeText={setFormField4}
                    placeholder="Grade XII"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Room</Text>
                  <TextInput
                    value={formField5}
                    onChangeText={setFormField5}
                    placeholder="Lab 2 / Room 301"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
            </View>
            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddTeacherSlotModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateTeacherSlot}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Slot</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 7: UPLOAD STUDY MATERIAL */}
      {/* ================================================================= */}
      <Modal
        visible={showAddMaterialModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMaterialModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">Upload Study Material</Text>
              <Pressable onPress={() => setShowAddMaterialModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>
            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Title *</Text>
                <TextInput
                  value={formField1}
                  onChangeText={setFormField1}
                  placeholder="e.g. Thermodynamics Chapter Notes"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Subject *</Text>
                  <TextInput
                    value={formField2}
                    onChangeText={setFormField2}
                    placeholder="Physics"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Grade / Class</Text>
                  <TextInput
                    value={formField3}
                    onChangeText={setFormField3}
                    placeholder="Grade XII"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Chapter / Unit</Text>
                <TextInput
                  value={formField4}
                  onChangeText={setFormField4}
                  placeholder="Chapter 4: Heat & Temperature"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">File Type</Text>
                  <TextInput
                    value={formField5}
                    onChangeText={setFormField5}
                    placeholder="PDF / PPT / Video / DOC"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Description</Text>
                  <TextInput
                    value={formField6}
                    onChangeText={setFormField6}
                    placeholder="Derivations & numericals"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
            </View>
            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddMaterialModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleUploadMaterial}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Publish</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 8: CREATE HOMEWORK */}
      {/* ================================================================= */}
      <Modal
        visible={showAddHomeworkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddHomeworkModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">Create Homework</Text>
              <Pressable onPress={() => setShowAddHomeworkModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>
            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Assignment Title *</Text>
                <TextInput
                  value={formField1}
                  onChangeText={setFormField1}
                  placeholder="e.g. Calculus Problem Set 5"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Subject *</Text>
                  <TextInput
                    value={formField2}
                    onChangeText={setFormField2}
                    placeholder="Mathematics"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Type</Text>
                  <TextInput
                    value={formField3}
                    onChangeText={setFormField3}
                    placeholder="Assignment / Project / Essay"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Priority</Text>
                  <TextInput
                    value={formField4}
                    onChangeText={setFormField4}
                    placeholder="High / Medium / Low"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Class</Text>
                  <TextInput
                    value={formField6}
                    onChangeText={setFormField6}
                    placeholder="Grade XII"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Assigned Teacher</Text>
                <TextInput
                  value={formField5}
                  onChangeText={setFormField5}
                  placeholder="Sarah Mitchell"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
            </View>
            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddHomeworkModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateHomework}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Publish</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 9: HOMEWORK GRADING DRAWER (PDF Page 29 §8.4.2) */}
      {/* ================================================================= */}
      <Modal
        visible={showGradingDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGradingDrawer(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[85%] rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <View>
                <Text className="text-base font-bold text-slate-900">Grading Drawer</Text>
                <Text className="text-xs text-slate-500">
                  {selectedHomeworkForGrading?.title || selectedHomeworkForGrading?.name || 'Homework'}
                </Text>
              </View>
              <Pressable onPress={() => setShowGradingDrawer(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
              {/* Previous Evaluation Records */}
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Recent Evaluated Submissions
              </Text>
              {gradingRecords.map((rec, idx) => (
                <View
                  key={idx}
                  className="mb-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                >
                  <View className="flex-row items-start justify-between">
                    <View>
                      <Text className="text-sm font-bold text-slate-900">{rec.studentName}</Text>
                      <Text className="text-[11px] text-slate-500">
                        Roll: {rec.rollNo} · Submitted: {rec.submittedDate}
                      </Text>
                    </View>
                    <View className="items-center rounded-lg bg-emerald-50 px-2 py-1 border border-emerald-200">
                      <Text className="text-xs font-bold text-emerald-700">{rec.gradeLetter}</Text>
                      <Text className="text-[10px] font-semibold text-emerald-600">
                        {rec.marksObtained}/{rec.outOf}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-1.5 text-xs text-slate-600 italic">
                    &ldquo;{rec.remarks}&rdquo;
                  </Text>
                </View>
              ))}

              {/* Grade Next Student Form */}
              <View className="mt-3 border-t border-slate-200 pt-3 gap-y-3">
                <Text className="text-xs font-bold text-[#3D5EE1] uppercase tracking-wider">
                  Grade Next Student Submission
                </Text>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Student Name</Text>
                  <TextInput
                    value={gradeStudent}
                    onChangeText={setGradeStudent}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm"
                  />
                </View>

                <View className="flex-row gap-x-2">
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-700 mb-1">Marks Obtained (Out of 100)</Text>
                    <TextInput
                      value={gradeMarks}
                      onChangeText={setGradeMarks}
                      keyboardType="numeric"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-700 mb-1">Letter Grade</Text>
                    <TextInput
                      value={gradeLetter}
                      onChangeText={setGradeLetter}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Rubric Remarks & Feedback</Text>
                  <TextInput
                    value={gradeRemarks}
                    onChangeText={setGradeRemarks}
                    placeholder="Enter analytical review and improvement recommendations"
                    multiline
                    numberOfLines={2}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm"
                  />
                </View>

                <Pressable
                  onPress={handleSaveGrading}
                  className="mt-2 items-center rounded-xl bg-emerald-600 py-3 shadow-md shadow-emerald-600/30"
                >
                  <Text className="text-sm font-bold text-white">Save Evaluation</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 10: CLASS 360 DETAILS */}
      {/* ================================================================= */}
      <Modal
        visible={showClassDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowClassDetailModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <View>
                <Text className="text-base font-bold text-slate-900">
                  {selectedClassDetail?.name}
                </Text>
                <Text className="text-xs text-slate-500">
                  Room: {selectedClassDetail?.roomNo} · Class Teacher: {selectedClassDetail?.classTeacher}
                </Text>
              </View>
              <Pressable onPress={() => setShowClassDetailModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View className="flex-row gap-2">
                <View className="flex-1 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-[11px] text-slate-500">Category</Text>
                  <Text className="text-sm font-bold text-slate-800 mt-0.5">{selectedClassDetail?.category}</Text>
                </View>
                <View className="flex-1 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-[11px] text-slate-500">Enrolled</Text>
                  <Text className="text-sm font-bold text-[#3D5EE1] mt-0.5">
                    {selectedClassDetail?.totalStudents} Students
                  </Text>
                </View>
                <View className="flex-1 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-[11px] text-slate-500">Capacity</Text>
                  <Text className="text-sm font-bold text-slate-800 mt-0.5">{selectedClassDetail?.capacity}</Text>
                </View>
              </View>

              <View className="rounded-xl bg-indigo-50/50 p-3 border border-indigo-100">
                <Text className="text-xs font-bold text-indigo-900 mb-1">Curriculum & Cohort Metrics</Text>
                <Text className="text-xs text-indigo-800">
                  Boys: {selectedClassDetail?.boysCount ?? 18} · Girls: {selectedClassDetail?.girlsCount ?? 16} · Total Subjects: {selectedClassDetail?.subjectsCount ?? 7}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setShowClassDetailModal(false)}
              className="mt-6 items-center rounded-xl bg-slate-100 py-3"
            >
              <Text className="text-sm font-semibold text-slate-700">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
