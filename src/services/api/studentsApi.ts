/**
 * Backend API client for the Add / Edit Student module and its dynamic lookups.
 * Uses `apiRequest` from `./authApi` so auth headers, `X-Client: mobile`, envelope unwrapping,
 * and 401 token refresh are shared in one place.
 */
import { ApiError, apiRequest } from './authApi';

export type BackendStudentStatus = 'active' | 'inactive' | 'alumni' | 'transferred_out' | 'expelled';
export type BackendGuardianRelation = 'father' | 'mother' | 'guardian' | 'other';

export interface BackendClass {
  id: string;
  gradeLevel: number;
  name: string;
  code: string;
  stream?: string | null;
  category?: string | null;
  status: string;
  sectionCount?: number;
}

export interface BackendSection {
  id: string;
  classId: string;
  name: string;
  capacity: number;
  shift?: string;
  medium?: string | null;
  status: string;
  className?: string;
}

export interface BackendStudentHouse {
  id: string;
  name: string;
  color?: string | null;
  motto?: string | null;
  isActive: boolean;
  studentCount?: number;
}

export interface BackendTransportRoute {
  id: string;
  code: string;
  name: string;
  startLocation?: string | null;
  endLocation?: string | null;
  shift?: string;
  status: string;
  pickupPointCount?: number;
}

export interface BackendPickupPoint {
  id: string;
  routeId: string;
  name: string;
  sequence: number;
  landmark?: string | null;
  pickupTime?: string | null;
  dropTime?: string | null;
  monthlyFee: string;
}

export interface BackendRouteSchedule {
  id: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  shift: string;
  vehicleRegistrationNo?: string;
  driverName?: string;
}

export interface BackendGuardian {
  id: string;
  fullName: string;
  relation: BackendGuardianRelation;
  phone: string;
  altPhone?: string | null;
  email?: string | null;
  occupation?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  isEmergencyContact?: boolean;
  isPrimary?: boolean;
  canPickUp?: boolean;
}

export interface BackendStudent {
  id: string;
  admissionId?: string | null;
  admissionNo: string;
  rollNo?: string | null;
  firstName: string;
  lastName: string;
  fullName?: string | null;
  dob: string;
  gender?: string | null;
  bloodGroup?: string | null;
  religionId?: string | null;
  socialCategory?: string | null;
  motherTongueId?: string | null;
  fatherName?: string | null;
  fatherPhone?: string | null;
  fatherEmail?: string | null;
  fatherOccupation?: string | null;
  motherName?: string | null;
  motherPhone?: string | null;
  motherEmail?: string | null;
  motherOccupation?: string | null;
  primaryGuardianId?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  studentHouseId?: string | null;
  houseName?: string | null;
  className?: string | null;
  status: BackendStudentStatus;
  admittedOn: string;
  leftOn?: string | null;
  leftReason?: string | null;
  guardians?: BackendGuardian[];
}

export interface CreateStudentPayload {
  admissionNo?: string;
  firstName: string;
  lastName: string;
  fullName?: string | null;
  dob: string;
  gender?: string | null;
  bloodGroup?: string | null;
  socialCategory?: string | null;
  fatherName?: string | null;
  fatherPhone?: string | null;
  fatherEmail?: string | null;
  fatherOccupation?: string | null;
  motherName?: string | null;
  motherPhone?: string | null;
  motherEmail?: string | null;
  motherOccupation?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  studentHouseId?: string | null;
  admittedOn?: string;
  status?: BackendStudentStatus;
  leftOn?: string | null;
  leftReason?: string | null;
}

export type UpdateStudentPayload = Partial<CreateStudentPayload>;

export interface LinkStudentGuardianPayload {
  guardian: {
    fullName: string;
    relation: BackendGuardianRelation;
    phone: string;
    email?: string | null;
    occupation?: string | null;
    addressLine1?: string | null;
    isEmergencyContact?: boolean;
  };
  isPrimary: boolean;
  canPickUp: boolean;
}

export interface CreateTransportAssignmentPayload {
  studentId: string;
  academicYearId: number;
  routeId: string;
  pickupPointId: string;
  direction?: 'pickup' | 'drop' | 'both';
}

export interface StudentFormLookups {
  classes: BackendClass[];
  sections: BackendSection[];
  houses: BackendStudentHouse[];
  routes: BackendTransportRoute[];
  pickupPoints: BackendPickupPoint[];
  schedules: BackendRouteSchedule[];
  students: BackendStudent[];
  loaded: boolean;
  failedSources: string[];
}

export const EMPTY_STUDENT_LOOKUPS: StudentFormLookups = {
  classes: [],
  sections: [],
  houses: [],
  routes: [],
  pickupPoints: [],
  schedules: [],
  students: [],
  loaded: false,
  failedSources: [],
};

async function safeLookup<T>(label: string, fn: () => Promise<T>, fallback: T, failed: string[]): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError && err.status === 0) throw err;
    failed.push(label);
    return fallback;
  }
}

export const studentsApi = {
  fetchClasses(): Promise<BackendClass[]> {
    return apiRequest<BackendClass[]>('/api/classes?limit=100');
  },

  fetchSections(classId?: string): Promise<BackendSection[]> {
    const qs = classId ? `?classId=${encodeURIComponent(classId)}&limit=100` : '?limit=100';
    return apiRequest<BackendSection[]>(`/api/sections${qs}`);
  },

  fetchStudentHouses(): Promise<BackendStudentHouse[]> {
    return apiRequest<BackendStudentHouse[]>('/api/student-houses?isActive=true');
  },

  fetchTransportRoutes(): Promise<BackendTransportRoute[]> {
    return apiRequest<BackendTransportRoute[]>('/api/transport-routes?status=active&limit=100');
  },

  fetchPickupPoints(routeId?: string): Promise<BackendPickupPoint[]> {
    const qs = routeId ? `?routeId=${encodeURIComponent(routeId)}` : '';
    return apiRequest<BackendPickupPoint[]>(`/api/pickup-points${qs}`);
  },

  fetchRouteSchedules(): Promise<BackendRouteSchedule[]> {
    return apiRequest<BackendRouteSchedule[]>('/api/route-schedules?limit=100');
  },

  fetchStudents(limit = 100): Promise<BackendStudent[]> {
    return apiRequest<BackendStudent[]>(`/api/students?limit=${limit}`);
  },

  fetchStudentById(id: string): Promise<BackendStudent> {
    return apiRequest<BackendStudent>(`/api/students/${encodeURIComponent(id)}`);
  },

  createStudent(payload: CreateStudentPayload): Promise<BackendStudent> {
    return apiRequest<BackendStudent>('/api/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateStudent(id: string, payload: UpdateStudentPayload): Promise<BackendStudent> {
    return apiRequest<BackendStudent>(`/api/students/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  linkStudentGuardian(studentId: string, payload: LinkStudentGuardianPayload): Promise<BackendGuardian[]> {
    return apiRequest<BackendGuardian[]>(`/api/students/${encodeURIComponent(studentId)}/guardians`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createTransportAssignment(payload: CreateTransportAssignmentPayload): Promise<unknown> {
    return apiRequest<unknown>('/api/transport-assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

/**
 * Loads all lookup datasets needed by Add / Edit Student in parallel.
 * Tolerates partial 403/404 permissions per resource while surfacing network failures.
 */
export async function loadStudentFormLookups(): Promise<StudentFormLookups> {
  const failedSources: string[] = [];
  const [classes, sections, houses, routes, pickupPoints, schedules, students] = await Promise.all([
    safeLookup('classes', () => studentsApi.fetchClasses(), [], failedSources),
    safeLookup('sections', () => studentsApi.fetchSections(), [], failedSources),
    safeLookup('houses', () => studentsApi.fetchStudentHouses(), [], failedSources),
    safeLookup('routes', () => studentsApi.fetchTransportRoutes(), [], failedSources),
    safeLookup('pickupPoints', () => studentsApi.fetchPickupPoints(), [], failedSources),
    safeLookup('schedules', () => studentsApi.fetchRouteSchedules(), [], failedSources),
    safeLookup('students', () => studentsApi.fetchStudents(100), [], failedSources),
  ]);

  return {
    classes: classes.filter((c) => c.status !== 'inactive'),
    sections: sections.filter((s) => s.status !== 'inactive'),
    houses: houses.filter((h) => h.isActive !== false),
    routes: routes.filter((r) => r.status !== 'inactive'),
    pickupPoints,
    schedules,
    students,
    loaded: true,
    failedSources,
  };
}

const BACKEND_TO_FORM_FIELD: Record<string, string> = {
  admissionNo: 'admissionNo',
  firstName: 'firstName',
  lastName: 'lastName',
  dob: 'dob',
  admittedOn: 'joinedOn',
  gender: 'gender',
  bloodGroup: 'bloodGroup',
  socialCategory: 'category',
  studentHouseId: 'house',
  fatherName: 'fatherName',
  fatherPhone: 'fatherPhone',
  fatherEmail: 'fatherEmail',
  fatherOccupation: 'fatherOccupation',
  motherName: 'motherName',
  motherPhone: 'motherPhone',
  motherEmail: 'motherEmail',
  motherOccupation: 'motherOccupation',
  addressLine1: 'address',
  addressLine2: 'permanentAddress',
  status: 'status',
  leftOn: 'status',
  'guardian.fullName': 'guardianName',
  'guardian.phone': 'guardianPhone',
  'guardian.email': 'guardianEmail',
  'guardian.occupation': 'guardianOccupation',
  'guardian.addressLine1': 'guardianAddress',
  routeId: 'routeId',
  pickupPointId: 'pickupPointId',
};

export function extractApiErrors(error: unknown): { message: string; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  if (!(error instanceof ApiError)) {
    return {
      message: error instanceof Error ? error.message : 'Unable to save student. Please try again.',
      fieldErrors,
    };
  }

  const data = error.data as { message?: string; errors?: { field?: string; message?: string }[] } | undefined;
  if (Array.isArray(data?.errors)) {
    for (const item of data.errors) {
      if (item?.field && item?.message) {
        const mapped = BACKEND_TO_FORM_FIELD[item.field] ?? item.field;
        if (!fieldErrors[mapped]) fieldErrors[mapped] = item.message;
      }
    }
  }

  if (error.status === 409 && /admission number/i.test(error.message)) {
    fieldErrors.admissionNo = error.message;
  }

  return {
    message: error.message || 'Unable to save student. Please try again.',
    fieldErrors,
  };
}
