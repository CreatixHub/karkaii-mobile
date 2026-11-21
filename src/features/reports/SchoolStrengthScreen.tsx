import React, { useState } from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import { useCollection } from '@/core/store/useCollection';
import type { SchoolProfileRecord } from '@/data/seed/administration';
import type { ClassRecord } from '@/data/seed/master';
import { Button, Card } from '@/ui/basics';
import { SelectField, SwitchField, TextField } from '@/ui/Fields';
import { useToast } from '@/ui/Toast';
import { DEFAULT_OPTIONS, SECTIONS, anySection, buildCsv, buildText, classRowsFor, computeSchoolStrength, genderLabel, nice, pctText, ratioText, roleLabel, studentGroups, type ReportOptions, type SchoolStrength, type SectionKey } from './strength';

const NAVY = '#1e3a8a';

const H = ({ n, title }: { n: number; title: string }) => (
  <Text style={{ color: NAVY, borderBottomColor: NAVY }} className="mb-2 mt-5 border-b-2 pb-1 text-sm font-extrabold">{n}. {title}</Text>
);

/** A small table: header row on navy, body rows, optional bold last row. */
function Table({ head, rows, widths, boldLast }: { head: string[]; rows: (string | number)[][]; widths: number[]; boldLast?: boolean }) {
  return (
    <View className="mb-3 overflow-hidden rounded-lg border border-slate-200">
      <View style={{ backgroundColor: NAVY }} className="flex-row px-2 py-1.5">
        {head.map((h, i) => (
          <Text key={h + i} style={{ flex: widths[i] }} className={`text-[10px] font-bold text-white ${i > 0 && widths[i] <= 1 ? 'text-right' : ''}`}>{h}</Text>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} className={`flex-row border-t border-slate-100 px-2 py-1.5 ${boldLast && ri === rows.length - 1 ? 'bg-slate-100' : ''}`}>
          {r.map((c, i) => (
            <Text key={i} style={{ flex: widths[i] }} className={`text-[11px] ${boldLast && ri === rows.length - 1 ? 'font-bold' : ''} text-slate-800 ${i > 0 && widths[i] <= 1 ? 'text-right' : ''}`}>{c}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="mb-2 w-[48.5%] rounded-xl border border-slate-200 bg-white px-3 py-2">
      <Text className="text-[10px] text-slate-500">{label}</Text>
      <Text style={{ color: NAVY }} className="text-xl font-extrabold">{value}</Text>
    </View>
  );
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  return (
    <View className="my-1.5">
      <View className="flex-row justify-between"><Text className="text-[11px] text-slate-700">{label}</Text><Text className="text-[11px] text-slate-700"><Text className="font-bold">{value}</Text> ({pctText(value, total)})</Text></View>
      <View className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><View style={{ width: `${total ? (value / total) * 100 : 0}%`, backgroundColor: color }} className="h-full rounded-full" /></View>
    </View>
  );
}

/** The generated report, laid out for the phone. */
export function ReportPreview({ data, o }: { data: SchoolStrength; o: ReportOptions }) {
  const f = data.faculty;
  const s = data.students;
  const cls = o.classId === 'all' ? null : s.classes.find((c) => c.classId === o.classId);
  // Numbering follows the sections that are switched on.
  const num = (key: SectionKey) => SECTIONS.filter(([k]) => o[k]).findIndex(([k]) => k === key) + 1;
  const classRows = classRowsFor(data, o.classId);
  const total = classRows.reduce((a, c) => ({ male: a.male + c.male, female: a.female + c.female }), { male: 0, female: 0 });
  const extra = o.classId === 'all' ? s.unassigned : { male: 0, female: 0, total: 0 };
  return (
    <View>
      <View style={{ backgroundColor: NAVY }} className="rounded-xl px-4 py-3">
        <Text className="text-lg font-extrabold text-white">{o.schoolName || 'School'}</Text>
        <Text className="text-xs text-white">School Strength Report{cls ? ` — ${cls.name}` : ''}</Text>
        <Text className="mt-1.5 text-[10px] text-white/80">Generated {new Date(data.generatedAt).toLocaleString()}{o.preparedBy ? ` · Prepared by ${o.preparedBy}` : ''}</Text>
      </View>

      {o.summary ? (
        <>
          <H n={num('summary')} title="Summary" />
          <View className="flex-row flex-wrap justify-between">
            <Tile label="Total Faculty" value={f.total} /><Tile label="Teaching Staff" value={f.teaching} />
            <Tile label="Non-teaching Staff" value={f.nonTeaching} /><Tile label="Total Students" value={s.total} />
            <Tile label="Boys" value={s.byGender.male} /><Tile label="Girls" value={s.byGender.female} />
            <Tile label="Student : Teacher" value={ratioText(data)} />
          </View>
        </>
      ) : null}

      {o.faculty ? (
        <>
          <H n={num('faculty')} title="Faculty" />
          <Table head={['Category', 'Male', 'Female', 'Total']} widths={[2, 1, 1, 1]} boldLast rows={[['Teaching', f.teachingByGender.male, f.teachingByGender.female, f.teaching], ['Non-teaching', f.nonTeachingByGender.male, f.nonTeachingByGender.female, f.nonTeaching], ['All faculty', f.byGender.male, f.byGender.female, f.total]]} />
          <Table head={['Employment type', 'Faculty', 'Share']} widths={[2, 1, 1]} rows={Object.entries(f.byEmploymentType).map(([k, v]) => [nice(k), v, pctText(v, f.total)])} />
          <Table head={['Staff status (all records)', 'Staff']} widths={[3, 1]} rows={Object.entries(f.byStatus).map(([k, v]) => [nice(k), v])} />
        </>
      ) : null}

      {o.facultyList ? (
        <>
          <H n={num('facultyList')} title="Faculty list" />
          {f.list.length === 0 ? <Text className="text-xs text-slate-500">No faculty found.</Text> : <Table head={['#', 'Emp. no', 'Name', 'Role', 'Gender']} widths={[0.6, 1.4, 2.4, 1.6, 1]} rows={f.list.map((m, i) => [i + 1, m.employeeNo, m.name, `${roleLabel(m.staffType)} · ${nice(m.employmentType)}`, genderLabel(m.gender)])} />}
        </>
      ) : null}

      {o.studentsGender ? (
        <>
          <H n={num('studentsGender')} title="Students — gender-wise" />
          <Bar label="Boys" value={s.byGender.male} total={s.total} color="#2563eb" />
          <Bar label="Girls" value={s.byGender.female} total={s.total} color="#db2777" />
          {Object.keys(s.byStatus).length > 1 ? <View className="mt-2"><Table head={['Student status (all records)', 'Students']} widths={[3, 1]} rows={Object.entries(s.byStatus).map(([k, v]) => [nice(k), v])} /></View> : null}
        </>
      ) : null}

      {o.classWise ? (
        <>
          <H n={num('classWise')} title="Students — class-wise and gender-wise" />
          <Table
            head={['Class', 'Boys', 'Girls', 'Total', 'Girls %']}
            widths={[2, 1, 1, 1, 1.2]}
            boldLast
            rows={[...classRows.map((c) => [c.name, c.male, c.female, c.total, pctText(c.female, c.total)]), ...(extra.total ? [['Not assigned', extra.male, extra.female, extra.total, pctText(extra.female, extra.total)]] : []), ['Total', total.male + extra.male, total.female + extra.female, total.male + total.female + extra.total, pctText(total.female + extra.female, total.male + total.female + extra.total)]]}
          />
          <Text className="text-[10px] text-slate-500">Class is taken from each student’s record. Active and on-leave students only.</Text>
        </>
      ) : null}

      {o.studentList ? (
        <>
          <H n={num('studentList')} title="Student list" />
          {studentGroups(data, o.classId).length === 0 ? <Text className="text-xs text-slate-500">No students found.</Text> : null}
          {studentGroups(data, o.classId).map((g) => (
            <View key={g.title} className="mb-1">
              <Text className="mt-2 text-xs font-bold text-slate-900">{g.title} <Text className="font-normal text-slate-500">— {g.members.length} students ({g.members.filter((m) => m.gender === 'male').length} boys, {g.members.filter((m) => m.gender === 'female').length} girls)</Text></Text>
              <Table head={['#', 'Adm. no', 'Name', 'Gender']} widths={[0.6, 1.6, 3, 1]} rows={g.members.map((m, i) => [i + 1, m.admissionNo, m.name, genderLabel(m.gender)])} />
            </View>
          ))}
        </>
      ) : null}
      <Text className="mt-4 border-t border-slate-200 pt-2 text-[10px] text-slate-400">{o.schoolName || 'School'} — School Strength Report — computer generated</Text>
    </View>
  );
}

export function SchoolStrengthScreen({ breadcrumb }: { breadcrumb: string }) {
  const toast = useToast();
  const classes = useCollection<ClassRecord>('classes');
  // The report heading starts as the name saved on the School Profile page.
  const profile = useCollection<SchoolProfileRecord>('schoolProfile');
  const [opts, setOpts] = useState<ReportOptions>(() => ({ ...DEFAULT_OPTIONS, schoolName: profile[0]?.name || DEFAULT_OPTIONS.schoolName }));
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<{ data: SchoolStrength; opts: ReportOptions } | null>(null);
  const patch = (change: Partial<ReportOptions>) => setOpts((cur) => ({ ...cur, ...change }));

  const generate = () => {
    if (!anySection(opts)) { setError('Tick at least one section to include in the report.'); return; }
    setError('');
    setGenerated({ data: computeSchoolStrength(), opts: { ...opts } }); // always the latest numbers
  };

  const share = (kind: 'csv' | 'text') => {
    if (!generated) return;
    const title = `school-strength-report${kind === 'csv' ? '.csv' : ''}`;
    Share.share({ title, message: kind === 'csv' ? buildCsv(generated.data, generated.opts) : buildText(generated.data, generated.opts) }).catch(() => toast('Could not open the share sheet', 'error'));
  };

  return (
    <ScrollView className="flex-1 bg-[#f4f6fb]" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View className="px-4 pt-3">
        <Text className="mb-2 text-[11px] text-slate-400" numberOfLines={1}>{breadcrumb}</Text>
        <Card style={{ marginBottom: 12 }}>
          <Text className="mb-2 text-sm font-bold text-[#1b2240]">Choose report contents</Text>
          <TextField label="School name" value={opts.schoolName} onChange={(v) => patch({ schoolName: v })} />
          <TextField label="Prepared by (optional)" value={opts.preparedBy} onChange={(v) => patch({ preparedBy: v })} placeholder="e.g. Principal / Admin office" />
          <Text className="mb-1 text-xs font-semibold text-slate-600">Sections to include</Text>
          {SECTIONS.map(([key, label]) => <SwitchField key={key} label={label} value={opts[key]} onChange={(v) => patch({ [key]: v } as Partial<ReportOptions>)} />)}
          <SelectField label="Class (for the student sections)" value={opts.classId} options={[{ label: 'All classes', value: 'all' }, ...classes.map((c) => ({ label: c.name, value: c.id }))]} onChange={(v) => patch({ classId: v })} />
          {error ? <Text className="mb-2 text-xs font-semibold text-red-600">{error}</Text> : null}
          <Button label="Generate Report" icon="bar-chart-2" onPress={generate} />
        </Card>

        {generated ? (
          <>
            <View className="mb-3 flex-row gap-2">
              <Button small variant="secondary" icon="file-text" label="Share Excel (CSV)" onPress={() => share('csv')} style={{ flex: 1 }} />
              <Button small icon="share-2" label="Share report" onPress={() => share('text')} style={{ flex: 1 }} />
            </View>
            <Card><ReportPreview data={generated.data} o={generated.opts} /></Card>
          </>
        ) : (
          <Text className="py-8 text-center text-xs text-slate-400">Choose what to include, then tap Generate Report. The preview appears here.</Text>
        )}
      </View>
    </ScrollView>
  );
}
