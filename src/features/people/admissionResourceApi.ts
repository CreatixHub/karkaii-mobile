import type { ResourceApi } from '@/features/engine/ResourceApi';
import type { AdmissionRecord } from '@/data/seed/admissionsAlumni';

import {
  admissionApi,
  admissionOperations,
} from '@/services/api/admissionApi';

import {
  admissionMasterApi,
  type AdmissionClass,
  type AdmissionAcademicYear,
} from '@/services/api/admissionMasterApi';


import { toApiAdmission } from './admissionMapper';
import { toAdmissionRecord } from './admissionRecordAdapter';

export function createAdmissionResourceApi(
  classes: AdmissionClass[],
  academicYear: AdmissionAcademicYear
): ResourceApi<AdmissionRecord> {
  return {
    async list() {
      const records = await admissionOperations.listAll();

      return records.map(
        (record) => toAdmissionRecord(record, classes)
      );
    },

    async create(values) {
      const activeClasses =
        await admissionMasterApi.getClasses();

      if (!activeClasses.some(
        (c) => String(c.id) === String(values.classId)
      )) {
        throw new Error('Select an active school class');
      }

      const currentYear =
        await admissionMasterApi.getCurrentAcademicYear();

      if (currentYear.id !== academicYear.id) {
        throw new Error(
          'Academic year has changed. Reopen the Admission page and try again.'
        );
      }

      const payload = toApiAdmission(
        values,
        currentYear.id
      );

      const record = await admissionApi.create(payload);

      return toAdmissionRecord(record, activeClasses);
    },

    async update() {
      throw new Error(
        'Live editing is not enabled yet'
      );
    },
  };
}
