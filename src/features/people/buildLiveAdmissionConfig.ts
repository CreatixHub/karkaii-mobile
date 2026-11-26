import type { ResourceConfig } from '@/features/engine/types';
import type { AdmissionRecord } from '@/data/seed/admissionsAlumni';
import type { AdmissionClass } from '@/services/api/admissionMasterApi';

import { admissionsCfg } from './admissionConfigs';
import { configureAdmissionFields } from './admissionLiveConfig';
import { createAdmissionResourceApi } from './admissionResourceApi';
import type { LiveAdmissionRecord } from './admissionRecordAdapter';
import { ACADEMIC_YEAR_ID } from '@/config/admission';

const live = (r: AdmissionRecord) =>
  r as LiveAdmissionRecord;

const statusLabel = (r: AdmissionRecord) =>
  live(r).backendStatus
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const className = (r: AdmissionRecord) =>
  live(r).className;

export function buildLiveAdmissionConfig(
  classes: AdmissionClass[]
): ResourceConfig<AdmissionRecord> {
  return {
    ...admissionsCfg,

    api: createAdmissionResourceApi(classes),

    form: configureAdmissionFields(
      admissionsCfg.form,
      classes
    ),

    defaults: () => ({
      academicYear: String(ACADEMIC_YEAR_ID),
    }),

    searchText: (r) =>
      `${r.name} ${r.applicationNo} ${className(r)}
       ${r.parentName} ${r.parentPhone} ${statusLabel(r)}`,

    subtitle: (r) =>
      `${className(r)} - ${r.parentName}`,

    status: (r) => ({
      label: statusLabel(r),
      tone:
        live(r).backendStatus === 'accepted'
          ? 'success'
          : live(r).backendStatus === 'rejected'
            ? 'danger'
            : live(r).backendStatus === 'withdrawn'
              ? 'neutral'
              : 'info',
    }),

    badges: () => [],

    facts: [
      { label: 'Applied', value: (r) => r.appliedOn },
      { label: 'Guardian phone', value: (r) => r.parentPhone },
      { label: 'Source', value: (r) => live(r).backendSource },
      { label: 'Class', value: className },
    ],

    detail: [
      {
        title: 'Application',
        items: [
          { label: 'Application no', value: (r) => r.applicationNo },
          { label: 'Applicant', value: (r) => r.name },
          { label: 'Status', value: statusLabel },
          { label: 'Class applied', value: className },
          { label: 'Academic year ID', value: (r) => r.academicYear },
          { label: 'Applied on', value: (r) => r.appliedOn },
          { label: 'Source', value: (r) => live(r).backendSource },
        ],
      },
      {
        title: 'Personal',
        items: [
          { label: 'Gender', value: (r) => r.gender },
          { label: 'Date of birth', value: (r) => r.dob },
          { label: 'Blood group', value: (r) => r.bloodGroup },
          { label: 'Address', value: (r) => r.address },
        ],
      },
      {
        title: 'Guardian Information',
        items: [
          { label: 'Name', value: (r) => r.parentName },
          { label: 'Phone', value: (r) => r.parentPhone },
          { label: 'Email', value: (r) => r.parentEmail },
        ],
      },
      {
        title: 'Additional Information',
        items: [
          { label: 'Previous school', value: (r) => r.previousSchool },
          { label: 'Previous class', value: (r) => r.lastClass },
          { label: 'Transport', value: (r) => r.transport ? 'Required' : 'Not required' },
          { label: 'Hostel', value: (r) => r.hostel ? 'Required' : 'Not required' },
        ],
      },
    ],

    stats: [
      {
        label: 'Applications',
        value: (rows) => rows.length,
        icon: 'file-text',
      },
      {
        label: 'Applied',
        value: (rows) => rows.filter(
          (r) => live(r).backendStatus === 'applied'
        ).length,
        icon: 'clock',
        tone: 'warning',
      },
      {
        label: 'Accepted',
        value: (rows) => rows.filter(
          (r) => live(r).backendStatus === 'accepted'
        ).length,
        icon: 'user-check',
        tone: 'success',
      },
    ],

    views: [
      {
        key: 'all',
        label: 'All Applications',
        match: () => true,
      },
      ...[
        'enquiry',
        'applied',
        'document_review',
        'shortlisted',
        'waitlisted',
        'offered',
        'accepted',
        'rejected',
        'withdrawn',
      ].map((status) => ({
        key: status,
        label: status.replace(/_/g, ' '),
        match: (r: AdmissionRecord) =>
          live(r).backendStatus === status,
      })),
    ],

    filters: [
      {
        key: 'class',
        label: 'Class applied',
        options: classes.map((c) => ({
          label: c.name,
          value: String(c.id),
        })),
        match: (r, v) => r.classId === v,
      },
    ],

    sorts: [
      {
        key: 'recent',
        label: 'Recently applied',
        compare: (a, b) =>
          b.appliedOn.localeCompare(a.appliedOn),
      },
      {
        key: 'name',
        label: 'Applicant (A-Z)',
        compare: (a, b) =>
          a.name.localeCompare(b.name),
      },
    ],

    validate: (v) => ({
      ...(String(v.dob) >= new Date().toISOString().slice(0, 10)
        ? { dob: 'Date of birth must be in the past' }
        : {}),
      ...(!classes.some(
        (c) => String(c.id) === String(v.classId)
      )
        ? { classId: 'Select a valid school class' }
        : {}),
      ...(String(v.address ?? '').length > 200
        ? { address: 'Maximum 200 characters' }
        : {}),
    }),

    prepare: undefined,
    afterSave: undefined,
    auditEntity: undefined,
    extra: undefined,

    actions: [],
    bulk: [],
    pageActions: [],

    canCreate: classes.length > 0,
    canEdit: false,
    canDelete: false,
  };
}
