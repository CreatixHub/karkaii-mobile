import { request } from './authApi';

export interface AdmissionClass {
  id: string;
  name: string;
  gradeLevel: number;
  status: 'active' | 'inactive';
}

export interface AdmissionSection {
  id: string;
  classId: string;
  name: string;
  status: 'active' | 'inactive';
}

async function getAll<T>(endpoint: string): Promise<T[]> {
  const rows: T[] = [];
  const limit = 100;

  for (let page = 1; page <= 100; page++) {
    const separator = endpoint.includes('?') ? '&' : '?';

    const result = await request<T[]>(
      `${endpoint}${separator}page=${page}&limit=${limit}&status=active`,
      { method: 'GET' }
    );

    if (!Array.isArray(result)) {
      throw new Error('Invalid master-data response');
    }

    rows.push(...result);

    if (result.length < limit) {
      return rows;
    }
  }

  throw new Error('Master-data pagination limit exceeded');
}

export const admissionMasterApi = {
  async getClasses() {
    return getAll<AdmissionClass>('/api/classes');
  },

  async getSections(classId?: string) {
    const endpoint = classId
      ? `/api/sections?classId=${encodeURIComponent(classId)}`
      : '/api/sections';

    return getAll<AdmissionSection>(endpoint);
  },
};
