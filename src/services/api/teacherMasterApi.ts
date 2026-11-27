import { request } from './authApi';

export interface TeacherSubject {
  id: string;
  name: string;
  code: string;
  status: 'active';
}

interface BackendSubject {
  id: string | number;
  name: string;
  code: string;
  status: string;
}

export const teacherMasterApi = {
  async fetchSubjects(): Promise<TeacherSubject[]> {
    const subjects: TeacherSubject[] = [];
    const seen = new Set<string>();
    const limit = 100;

    for (let page = 1; page <= 100; page++) {
      const rows = await request<BackendSubject[]>(
        `/api/subjects?status=active&page=${page}&limit=${limit}`,
        { method: 'GET' }
      );

      if (!Array.isArray(rows)) {
        throw new Error('Invalid subject API response');
      }

      for (const row of rows) {
        if (
          !row ||
          !/^[1-9]\d*$/.test(String(row.id)) ||
          typeof row.name !== 'string' ||
          !row.name.trim() ||
          typeof row.code !== 'string' ||
          row.status !== 'active'
        ) {
          throw new Error('Invalid subject record received');
        }

        const id = String(row.id);

        if (seen.has(id)) {
          throw new Error('Duplicate subject record received');
        }

        seen.add(id);

        subjects.push({
          id,
          name: row.name,
          code: row.code,
          status: 'active',
        });
      }

      if (rows.length < limit) {
        return subjects.sort(
          (a, b) => a.name.localeCompare(b.name)
        );
      }
    }

    throw new Error('Subject pagination limit exceeded');
  },
};