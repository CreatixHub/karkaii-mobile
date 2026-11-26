import { request } from './authApi';

export interface AdmissionInput {
  academicYearId: string;
  classId: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender?: string;
  bloodGroup?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherOccupation?: string;
  addressLine1?: string;
  addressLine2?: string;
  previousSchool?: string;
  previousClass?: string;
  needsTransport?: boolean;
  needsHostel?: boolean;
  source: 'walk_in' | 'website' | 'referral' |
          'agent' | 'event' | 'other';
}

export interface ApiAdmission extends AdmissionInput {
  id: string;
  applicationNo: string;
  status: string;
  appliedOn: string;
}

const BASE = '/api/admissions';

export const admissionApi = {

  async list(page = 1, limit = 20) {
    return request<ApiAdmission[]>(
      `${BASE}?page=${page}&limit=${limit}`,
      { method: 'GET' }
    );
  },

  async get(id: string) {
    return request<ApiAdmission>(
      `${BASE}/${encodeURIComponent(id)}`,
      { method: 'GET' }
    );
  },

  async create(input: AdmissionInput) {
    return request<ApiAdmission>(BASE, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: Partial<AdmissionInput>) {
    return request<ApiAdmission>(
      `${BASE}/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      }
    );
  },

  async history(id: string) {
    return request<unknown[]>(
      `${BASE}/${encodeURIComponent(id)}/history`,
      { method: 'GET' }
    );
  },

};

export const admissionOperations = {
  async listAll(): Promise<ApiAdmission[]> {
    const records: ApiAdmission[] = [];
    const limit = 100;

    for (let page = 1; page <= 100; page++) {
      const rows = await admissionApi.list(page, limit);

      if (!Array.isArray(rows)) {
        throw new Error('Invalid admission API response');
      }

      records.push(...rows);

      if (rows.length < limit) {
        return records;
      }
    }

    throw new Error('Admission pagination limit exceeded');
  },

  async remove(id: string): Promise<void> {
    await request(
      `/api/admissions/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
  },

  async changeStatus(
    id: string,
    status:
      | 'enquiry'
      | 'applied'
      | 'document_review'
      | 'shortlisted'
      | 'waitlisted'
      | 'offered'
      | 'rejected'
      | 'withdrawn',
    note?: string
  ) {
    return request<ApiAdmission>(
      `/api/admissions/${encodeURIComponent(id)}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ status, note }),
      }
    );
  },

  async accept(id: string) {
    return request<unknown>(
      `/api/admissions/${encodeURIComponent(id)}/accept`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
  },
};
