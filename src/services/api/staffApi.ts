import { request } from './authApi';

export type TeacherStatus =
  | 'active'
  | 'inactive'
  | 'on_leave'
  | 'suspended'
  | 'left';

export interface TeacherStatusUpdate {
  status: TeacherStatus;
  leftOn?: string | null;
  leftReason?: string | null;
}

export interface BackendStaff {
  id: string | number;
  employeeNo: string;
  firstName: string;
  lastName?: string | null;
  fullName?: string | null;
  staffType: string;
  employmentType: string;
  status: string;
  leftOn?: string | null;
  leftReason?: string | null;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  dob?: string | null;
  bloodGroup?: string | null;
  qualification?: string | null;
  experienceYears?: number | string | null;
  joinedOn?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  photoFileId?: string | number | null;

  teaching?: {
    classes: string[];
    sections: string[];
    subjects: string[];
  };
}

export interface CreateTeacherInput {
  permanentAddressSame?: boolean;
  permanentAddressLine1?: string;
  permanentAddressLine2?: string;
  permanentPostalCode?: string;
  pan?: string;
  epfNo?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  bankIfsc?: string;
  bankMicr?: string;
  socialLinks?: Record<string, string>;
  employeeNo?: string;
  firstName: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  fatherName?: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  qualification?: string;
  experienceYears?: number;
  joinedOn: string;

  employmentType:
    | 'full_time'
    | 'part_time'
    | 'contract'
    | 'visiting';

  departmentId?: string;
  designationId?: string;
  primarySubjectId?: string;
  additionalSubjectIds?: string[];
  maxPeriodsPerWeek?: number;

  academicYearId?: string;

  assignments?: {
    classId: string;
    subjectId: string;
  }[];

  createLogin: boolean;
}

export interface CreatedTeacher extends BackendStaff {
  userId?: string | number | null;
  login?: {
    username: string;
    password: string;
  };
}
export const staffApi = {
  async createTeacher(
    input: CreateTeacherInput
  ): Promise<CreatedTeacher> {
    const firstName = input.firstName.trim();

    if (!firstName || firstName.length > 60) {
      throw new Error('Enter a valid first name');
    }

    const validDate = (value: string): boolean => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const date = new Date(`${value}T00:00:00Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (!validDate(input.joinedOn)) {
      throw new Error('Enter a valid joining date');
    }

    if (input.dob && !validDate(input.dob)) {
      throw new Error('Enter a valid date of birth');
    }

    if (input.createLogin && !input.dob) {
      throw new Error(
        'Date of birth is required to create a teacher login'
      );
    }

    const employmentTypes = [
      'full_time',
      'part_time',
      'contract',
      'visiting',
    ];

    if (!employmentTypes.includes(input.employmentType)) {
      throw new Error('Select a valid employment type');
    }

    if (
      input.assignments?.length &&
      !input.academicYearId
    ) {
      throw new Error(
        'Academic year is required for teaching assignments'
      );
    }

    const ids = [
      input.departmentId,
      input.designationId,
      input.primarySubjectId,
      input.academicYearId,
      ...(input.additionalSubjectIds ?? []),
      ...(input.assignments ?? []).flatMap(
        item => [item.classId, item.subjectId]
      ),
    ];

    for (const id of ids) {
      if (id !== undefined && !/^[1-9]\d*$/.test(id)) {
        throw new Error('Invalid school master data ID');
      }
    }

    const payload = Object.fromEntries(
      Object.entries({
        ...input,
        firstName,
        staffType: 'teaching',
      })
        .map(([key, value]) => [
          key,
          typeof value === 'string' ? value.trim() : value,
        ])
        .filter(([, value]) =>
          value !== undefined && value !== ''
        )
    );

    const teacher = await request<CreatedTeacher>(
      '/api/staff',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        skipRefresh: true,
      }
    );

    if (
      !teacher ||
      !/^[1-9]\d*$/.test(String(teacher.id)) ||
      teacher.staffType !== 'teaching'
    ) {
      throw new Error(
        'Creation response could not be verified. ' +
        'Refresh the teacher list before retrying.'
      );
    }

    return teacher;
  },

  async updateTeacherStatus(
    id: string,
    input: TeacherStatusUpdate
  ): Promise<BackendStaff> {
    if (!/^[1-9]\d*$/.test(id)) {
      throw new Error('Invalid teacher ID');
    }

    const allowed: TeacherStatus[] = [
      'active',
      'inactive',
      'on_leave',
      'suspended',
      'left',
    ];

    if (!allowed.includes(input.status)) {
      throw new Error('Invalid teacher status');
    }

    const payload: TeacherStatusUpdate = {
      status: input.status,
    };

    if (input.status === 'left') {
      const date = input.leftOn?.trim() ?? '';

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('Enter last working date as YYYY-MM-DD');
      }

      const parsed = new Date(`${date}T00:00:00.000Z`);

      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== date
      ) {
        throw new Error('Invalid last working date');
      }

      const reason = input.leftReason?.trim() ?? '';

      if (reason.length > 300) {
        throw new Error('Reason cannot exceed 300 characters');
      }

      payload.leftOn = date;
      payload.leftReason = reason || null;
    }

    const current = await staffApi.fetchTeacherById(id);

    if (current.status === input.status) {
      return current;
    }

    const teacher = await request<BackendStaff>(
      `/api/staff/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
        skipRefresh: true,
      }
    );

    if (
      !teacher ||
      String(teacher.id) !== id ||
      teacher.staffType !== 'teaching' ||
      teacher.status !== input.status
    ) {
      throw new Error(
        'Unexpected update response. Refresh teacher details before retrying.'
      );
    }

    return teacher;
  },

  async fetchTeachers(status?: TeacherStatus): Promise<BackendStaff[]> {
    const records: BackendStaff[] = [];
    const seen = new Set<string>();
    const limit = 100;

    for (let page = 1; page <= 100; page++) {
      const rows = await request<BackendStaff[]>(
        `/api/staff?staffType=teaching&page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`,
        { method: 'GET' }
      );

      if (!Array.isArray(rows)) {
        throw new Error('Invalid teacher API response');
      }

      for (const row of rows) {
        if (
          !row ||
          !/^[1-9]\d*$/.test(String(row.id)) ||
          row.staffType !== 'teaching'
        ) {
          throw new Error('Invalid teaching staff record');
        }

        const id = String(row.id);

        if (seen.has(id)) {
          throw new Error('Duplicate teacher record received');
        }

        seen.add(id);
        records.push(row);
      }

      if (rows.length < limit) {
        return records;
      }
    }

    throw new Error('Teacher pagination limit exceeded');
  },

  async fetchTeacherById(id: string): Promise<BackendStaff> {
    if (!/^[1-9]\d*$/.test(id)) {
      throw new Error('Invalid teacher ID');
    }

    const teacher = await request<BackendStaff>(
      `/api/staff/${encodeURIComponent(id)}`,
      { method: 'GET' }
    );

    if (
      !teacher ||
      String(teacher.id) !== id ||
      teacher.staffType !== 'teaching'
    ) {
      throw new Error('Invalid teacher profile response');
    }

    return teacher;
  },
};