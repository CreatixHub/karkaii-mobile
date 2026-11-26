/**
 * Page registry: route page-key -> component. A page missing from here shows "being rebuilt" in the hub
 * (see FRONTEND_TO_MOBILE_VERIFICATION.md for the live status of each page).
 */
import React from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useAuth } from '@/core/auth/AuthProvider';
import { LIVE_MODULES } from '@/config/liveModules';
import { admissionMasterApi, type AdmissionClass } from '@/services/api/admissionMasterApi';
import { buildLiveAdmissionConfig } from '@/features/people/buildLiveAdmissionConfig';
import { useLocalSearchParams } from 'expo-router';
import type { Entity } from '@/core/store/store';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ResourceScreen } from '@/features/engine/ResourceScreen';
import type { ResourceConfig } from '@/features/engine/types';
import {
  dueReportsCfg,
  expenseCategoriesCfg,
  expensesCfg,
  feeCollectionCfg,
  feeGroupsCfg,
  feeStructureCfg,
  feeTypesCfg,
  feesAssignCfg,
  finesCfg,
  receiptsCfg,
  scholarshipsCfg,
} from '@/features/finance/configs';
import { classesCfg, classroomsCfg, materialsCfg, sectionsCfg, subjectsCfg } from '@/features/academic/configs';
import { HomeworkScreen } from '@/features/academic/HomeworkScreen';
import { TimetableScreen } from '@/features/academic/TimetableScreen';
import type { HolidayRecord } from '@/data/seed/hrm';
import type { AdmissionRecord } from '@/data/seed/admissionsAlumni';
import type { DeleteRequestRecord, RoleRecord } from '@/data/seed/peopleAdmin';
import { HolidayCalendar } from '@/features/hrm/HolidayCalendar';
import { holidaysCfg, leavesCfg, staffAttendanceCfg, studentAttendanceCfg, teacherAttendanceCfg } from '@/features/hrm/configs';

import { deleteRequestsCfg, departmentsCfg, designationsCfg, rolesCfg, staffCfg, usersCfg } from '@/features/people/adminConfigs';
import { AdmissionPanel } from '@/features/people/AdmissionPanel';
import { admissionsCfg } from '@/features/people/admissionConfigs';
import { TeacherForm } from '@/features/people/TeacherForm';
import { TeacherProfile, TeacherRoutine } from '@/features/people/TeacherProfile';
import { teachersCfg } from '@/features/people/teacherConfigs';
import { allocationsCfg, assetsCfg, servicesCfg, stockCfg } from '@/features/campus/assetConfigs';
import { gatePassCfg } from '@/features/campus/gatePassConfigs';
import { TrackingScreen } from '@/features/campus/TrackingScreen';
import { assignStudentsCfg, assignVehicleCfg, driversCfg, pickupPointsCfg, routesCfg, schedulesCfg, vehiclesCfg } from '@/features/campus/transportConfigs';
import { SchoolStrengthScreen } from '@/features/reports/SchoolStrengthScreen';
import { academicYearsCfg, auditLogsCfg, campusesCfg, eventsCfg, schoolProfileCfg } from '@/features/administration/adminConfigs';
import { announcementsCfg, broadcastsCfg, noticesCfg, notificationsCfg } from '@/features/communication/announcementConfigs';
import { smsLogCfg, smsTemplatesCfg, waTemplatesCfg, waThreadsCfg } from '@/features/communication/messagingConfigs';
import { AlumniScreen } from '@/features/people/AlumniScreen';
import { StudentPromotion } from '@/features/people/StudentPromotion';
import { StudentAttendanceHistory } from '@/features/people/StudentAttendanceHistory';
import { StudentProfile } from '@/features/people/StudentProfile';
import { documentsCfg, studentsCfg } from '@/features/people/studentConfigs';
import { StudentForm } from '@/features/people/StudentForm';
import { RolePanel } from '@/features/people/RolePanel';
import { WorkflowPanel } from '@/features/people/WorkflowPanel';

export type PageComponent = React.ComponentType<{ breadcrumb: string }>;

function resource<T extends Entity>(cfg: ResourceConfig<T>): PageComponent {
  return function ResourcePage({ breadcrumb }) {
    // A link such as /people/student-documents?q=AD1256507 opens the page already searched.
    const { q } = useLocalSearchParams<{ q?: string }>();
    return <ResourceScreen cfg={cfg} breadcrumb={breadcrumb} initialQuery={typeof q === 'string' ? q : undefined} />;
  };
}

const dashboard = (kind: 'admin' | 'teacher' | 'student' | 'parent'): PageComponent =>
  function Dashboard() {
    return <DashboardPage kind={kind} />;
  };

const timetable = (mode: 'class' | 'teacher'): PageComponent =>
  function Timetable({ breadcrumb }) {
    return <TimetableScreen mode={mode} breadcrumb={breadcrumb} />;
  };

const holidaysWithCalendar: ResourceConfig<HolidayRecord> = {
  ...holidaysCfg,
  header: (rows) => <HolidayCalendar rows={rows} />,
};

const rolesWithPanel: ResourceConfig<RoleRecord> = {
  ...rolesCfg,
  extra: (r) => <RolePanel roleId={r.id} />,
};

const admissionsWithPanel: ResourceConfig<AdmissionRecord> = {
  ...admissionsCfg,
  extra: (r) => <AdmissionPanel applicationId={r.id} />,
};

const deleteRequestsWithWorkflow: ResourceConfig<DeleteRequestRecord> = {
  ...deleteRequestsCfg,
  extra: (r) => <WorkflowPanel request={r} />,
};

const OriginalAdmissionPage = resource(admissionsWithPanel);

function ConnectedAdmissionPage({
  breadcrumb,
}: {
  breadcrumb: string;
}) {
  const { user } = useAuth();
  const { q } = useLocalSearchParams<{ q?: string }>();

  const [result, setResult] = React.useState<{
    owner: typeof user;
    classes: AdmissionClass[];
  } | null>(null);

  const [failure, setFailure] = React.useState<{
    owner: typeof user;
    message: string;
  } | null>(null);

  const [retry, setRetry] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;

    let active = true;

    setResult(null);
    setFailure(null);

    admissionMasterApi.getClasses()
      .then((classes) => {
        if (active) {
          setResult({ owner: user, classes });
        }
      })
      .catch((err) => {
        if (active) {
          setFailure({
            owner: user,
            message: err instanceof Error
              ? err.message
              : 'Unable to load school classes',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [user, retry]);

  const cfg = React.useMemo(
    () => result && result.owner === user
      ? buildLiveAdmissionConfig(result.classes)
      : null,
    [result, user]
  );

  if (!user) return null;

  if (failure && failure.owner === user) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="mb-4 text-center text-red-600">
          {failure.message}
        </Text>

        <Pressable
          className="rounded-xl bg-[#3D5EE1] px-6 py-3"
          onPress={() => {
            setFailure(null);
            setResult(null);
            setRetry((n) => n + 1);
          }}
        >
          <Text className="font-bold text-white">
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!cfg) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3D5EE1" />

        <Text className="mt-3 text-slate-500">
          Loading school admission data...
        </Text>
      </View>
    );
  }

  return (
    <ResourceScreen
      cfg={cfg}
      breadcrumb={breadcrumb}
      initialQuery={typeof q === 'string' ? q : undefined}
    />
  );
}

function AdmissionPage(props: { breadcrumb: string }) {
  return LIVE_MODULES.admissions
    ? <ConnectedAdmissionPage {...props} />
    : <OriginalAdmissionPage {...props} />;
}

export const PAGES: Record<string, PageComponent> = {
  // Main
  'admin-dashboard': dashboard('admin'),
  'teacher-dashboard': dashboard('teacher'),
  'student-dashboard': dashboard('student'),
  'parent-dashboard': dashboard('parent'),

  // People & Admission
  students: resource(studentsCfg),
  'add-student': StudentForm,
  'student-profile': StudentProfile,
  admissions: AdmissionPage,
  'student-promotion': StudentPromotion,
  alumni: AlumniScreen,
  teachers: resource(teachersCfg),
  'add-teacher': TeacherForm,
  'teacher-profile': TeacherProfile,
  'teacher-routine': TeacherRoutine,
  'student-attendance-history': StudentAttendanceHistory,
  'student-documents': resource(documentsCfg),
  'staff-list': resource(staffCfg),
  departments: resource(departmentsCfg),
  designation: resource(designationsCfg),
  users: resource(usersCfg),
  'roles-permissions': resource(rolesWithPanel),
  'delete-account-requests': resource(deleteRequestsWithWorkflow),

  // Campus Operations
  routes: resource(routesCfg),
  'pickup-points': resource(pickupPointsCfg),
  vehicles: resource(vehiclesCfg),
  drivers: resource(driversCfg),
  'assign-vehicle': resource(assignVehicleCfg),
  'assign-students': resource(assignStudentsCfg),
  'gps-tracking': TrackingScreen,
  'route-scheduling': resource(schedulesCfg),
  assets: resource(assetsCfg),
  'asset-allocation': resource(allocationsCfg),
  'asset-maintenance': resource(servicesCfg),
  'stock-management': resource(stockCfg),
  'gate-pass': resource(gatePassCfg),

  // Reports
  'school-strength-report': SchoolStrengthScreen,

  // Communication
  announcements: resource(announcementsCfg),
  'notice-board': resource(noticesCfg),
  'broadcast-scheduler': resource(broadcastsCfg),
  'notification-center': resource(notificationsCfg),
  'sms-send': resource(smsLogCfg),
  'sms-templates': resource(smsTemplatesCfg),
  'whatsapp-inbox': resource(waThreadsCfg),
  'whatsapp-templates': resource(waTemplatesCfg),

  // Administration
  events: resource(eventsCfg),
  'school-profile': resource(schoolProfileCfg),
  campuses: resource(campusesCfg),
  'academic-years': resource(academicYearsCfg),
  'audit-logs': resource(auditLogsCfg),

  // Academic
  classes: resource(classesCfg),
  classrooms: resource(classroomsCfg),
  sections: resource(sectionsCfg),
  subjects: resource(subjectsCfg),
  'class-timetable': timetable('class'),
  'teacher-timetable': timetable('teacher'),
  'study-materials': resource(materialsCfg),
  homework: HomeworkScreen,

  // HRM
  holidays: resource(holidaysWithCalendar),
  'student-attendance': resource(studentAttendanceCfg),
  'teacher-attendance': resource(teacherAttendanceCfg),
  'staff-attendance': resource(staffAttendanceCfg),
  'leave-list': resource(leavesCfg),

  // Finance & Accounts
  'fee-structure': resource(feeStructureCfg),
  'fees-assign': resource(feesAssignCfg),
  'fee-collection': resource(feeCollectionCfg),
  'fee-types': resource(feeTypesCfg),
  'fee-groups': resource(feeGroupsCfg),
  'fine-management': resource(finesCfg),
  scholarships: resource(scholarshipsCfg),
  'due-reports': resource(dueReportsCfg),
  receipts: resource(receiptsCfg),
  expenses: resource(expensesCfg),
  'expense-categories': resource(expenseCategoriesCfg),
};

