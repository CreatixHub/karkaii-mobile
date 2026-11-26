import type { ResourceApi } from '@/features/engine/ResourceApi';
import type { AdmissionRecord } from '@/data/seed/admissionsAlumni';

import {
  admissionApi,
  admissionOperations,
} from '@/services/api/admissionApi';

import {
  admissionMasterApi,
  type AdmissionClass,
} from '@/services/api/admissionMasterApi';

import { ACADEMIC_YEAR_ID } from '@/config/admission';
import { toApiAdmission } from './admissionMapper';
import { toAdmissionRecord } from './admissionRecordAdapter';

export function createAdmissionResourceApi(
  classes: AdmissionClass[]
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

      const payload = toApiAdmission(
        values,
        String(ACADEMIC_YEAR_ID)
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
