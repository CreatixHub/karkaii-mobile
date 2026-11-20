import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useCollection } from '@/core/store/useCollection';
import { formatDate } from '@/core/utils/date';
import { pct } from '@/core/utils/format';
import type { PromotionRecord } from '@/data/seed/admissionsAlumni';
import { ACADEMIC_YEAR } from '@/data/seed/finance';
import type { ClassRecord, SectionRecord, StudentRecord } from '@/data/seed/master';
import { classSection } from '@/features/common/refs';
import { attendancePct } from '@/features/hrm/configs';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, EmptyState, Pill, ProgressBar } from '@/ui/basics';
import { SelectField } from '@/ui/Fields';
import { SegmentedTabs, SummaryStrip } from '@/ui/ListChrome';
import { useToast } from '@/ui/Toast';
import { TONES } from '@/ui/tone';
import { applyPromotion, checkPlan, classNameOf, defaultDecision, freeSeats, inStrength, itemsOf, nextClassId, recommendationOf, sectionsOfClass, sessionAfter, type Decision, type PromotionSummary } from './promotionLogic';
import { academicPercent, behaviourLabel, behaviourScore, feeSummary } from './studentData';

const STEPS = ['Academic year', 'Class & section', 'Review students', 'Confirm'];
const DECISIONS: { key: Decision; label: string }[] = [{ key: 'promote', label: 'Move up' }, { key: 'retain', label: 'Retain' }, { key: 'skip', label: 'Skip' }];

const className = classNameOf;

export function StudentPromotion({ breadcrumb }: { breadcrumb: string }) {
  const { user, canManage, role } = useAuth();
  const toast = useToast();
  const students = useCollection<StudentRecord>('students');
  const sections = useCollection<SectionRecord>('sections');
  const classes = useCollection<ClassRecord>('classes');
  const history = useCollection<PromotionRecord>('promotions');
  const staff = canManage && role !== 'student' && role !== 'parent';

  const [step, setStep] = useState(1);
  const [fromClass, setFromClass] = useState(classes[classes.length - 1]?.id ?? 'cls-10');
  const [fromSection, setFromSection] = useState<string>('all');
  const [toSection, setToSection] = useState<string>('auto');
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [recFilter, setRecFilter] = useState('all');
  const [done, setDone] = useState<PromotionSummary | null>(null);
  const [tl, setTl] = useState('all');

  const pool = useMemo(() => students.filter((s) => s.classId === fromClass && inStrength(s) && (fromSection === 'all' || s.sectionId === fromSection)), [students, fromClass, fromSection]);
  const toClassId = nextClassId(fromClass);
  const final = !toClassId;
  // Decisions the user has not touched fall back to the rule-based default.
  const effective = useMemo(() => Object.fromEntries(pool.map((s) => [s.id, decisions[s.id] ?? defaultDecision(s)])) as Record<string, Decision>, [pool, decisions]);
  // Cheap to recompute on every render, and it must see seats change right after a promotion (students / sections update).
  const check = checkPlan(fromClass, effective, toSection);
  const targetSections = toClassId ? sectionsOfClass(toClassId) : [];
  const free = targetSections.reduce((n, s) => n + freeSeats(s), 0);

  const pickClass = (id: string) => { setFromClass(id); setFromSection('all'); setToSection('auto'); setDecisions({}); setDone(null); };
  const setAll = (d: Decision, only?: (s: StudentRecord) => boolean) => setDecisions((cur) => ({ ...cur, ...Object.fromEntries(pool.filter((s) => (only ? only(s) : true)).map((s) => [s.id, d])) }));

  const thisSession = history.filter((h) => h.academicYear === ACADEMIC_YEAR);
  const sum = (rows: PromotionRecord[], kinds: string[]) => rows.filter((r) => kinds.includes(r.kind)).reduce((n, r) => n + r.count, 0);
  const moved = sum(history, ['Promoted', 'Graduated']);
  const held = sum(history, ['Detained']);

  const shown = pool.filter((s) => recFilter === 'all' || recommendationOf(s).kind === recFilter);

  const finalise = () => {
    const items = itemsOf(check);
    Alert.alert('Finalise promotion?', `${check.promote.length} ${final ? 'will graduate' : `will move to ${className(toClassId)}`}, ${check.retain.length} will be retained and ${check.skip.length} will be left as they are. Parent notifications are not sent in this demo.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finalise',
        onPress: () => {
          const res = applyPromotion(items, { fromClassId: fromClass, toClassId: toClassId || fromClass, academicYear: ACADEMIC_YEAR, approvedBy: user?.name ?? 'Admin', note: `${className(fromClass)} → ${final ? 'graduation' : className(toClassId)}` });
          setDone(res);
          setDecisions({});
          setStep(1);
          toast(`Promotion finished: ${res.promoted} moved up, ${res.graduated} graduated, ${res.retained} retained`);
        },
      },
    ]);
  };

  const timeline = history.filter((h) => tl === 'all' || h.kind.toLowerCase().startsWith(tl)).sort((a, b) => b.date.localeCompare(a.date) || b.batchNo.localeCompare(a.batchNo));

  return (
    <ScrollView className="flex-1 bg-[#f4f6fb]" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View className="px-4 pt-3">
        <Text className="mb-2 text-[11px] text-slate-400" numberOfLines={1}>{breadcrumb}</Text>
      </View>
      <SummaryStrip
        items={[
          { label: 'Session', value: `${ACADEMIC_YEAR} → ${sessionAfter(ACADEMIC_YEAR)}`, tone: 'primary', icon: 'calendar' },
          { label: 'In this class', value: pool.length, tone: 'info', icon: 'users' },
          { label: 'Moved up (all time)', value: moved, tone: 'success', icon: 'trending-up' },
          { label: 'Needs review', value: pool.filter((s) => !recommendationOf(s).clear).length, tone: 'warning', icon: 'clipboard' },
          { label: 'Retained (all time)', value: held, tone: 'danger', icon: 'user-x' },
          { label: 'Success rate', value: pct(moved + held ? (moved / (moved + held)) * 100 : 0, 1), tone: 'success', icon: 'percent' },
        ]}
      />

      {done ? (
        <View className="px-4">
          <Card style={{ marginBottom: 12, borderColor: TONES.success.border }}>
            <Text className="text-sm font-extrabold text-[#15803D]">Promotion finished</Text>
            <Text className="mt-1 text-xs text-slate-600">{done.promoted} moved up · {done.graduated} graduated · {done.retained} retained. Batches {done.batchNos.join(', ') || '—'} are in the history below.</Text>
          </Card>
        </View>
      ) : null}

      <View className="mt-1">
        <SegmentedTabs tabs={STEPS.map((s, i) => ({ key: String(i + 1), label: `${i + 1}. ${s}` }))} active={String(step)} onChange={(k) => setStep(Number(k))} />
      </View>

      <View className="px-4">
        {step === 1 ? (
          <View>
            {[{ id: ACADEMIC_YEAR, label: ACADEMIC_YEAR, sub: 'Current session — promote from here', on: true }, { id: sessionAfter(ACADEMIC_YEAR), label: sessionAfter(ACADEMIC_YEAR), sub: 'Target session — new classes', on: false }].map((y) => (
              <Card key={y.id} style={{ marginBottom: 8, borderColor: y.on ? TONES.primary.border : undefined }}>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-base font-extrabold text-[#1b2240]">{y.label}</Text>
                    <Text className="text-[11px] text-slate-500">{y.sub}</Text>
                  </View>
                  <Pill label={y.on ? 'From' : 'To'} tone={y.on ? 'primary' : 'success'} />
                </View>
              </Card>
            ))}
            <Text className="mb-3 text-[11px] text-slate-400">Students keep their attendance, fee and exam records when they move up. Promote the top class first so seats are free in the class below.</Text>
            <Button label="Next: choose class" onPress={() => setStep(2)} />
          </View>
        ) : null}

        {step === 2 ? (
          <View>
            <SelectField label="Promote from class" value={fromClass} options={classes.map((c) => ({ label: c.name, value: c.id, hint: `${students.filter((s) => s.classId === c.id && inStrength(s)).length} students` }))} onChange={pickClass} />
            <SelectField label="Section" value={fromSection} options={[{ label: 'All sections', value: 'all' }, ...sections.filter((s) => s.classId === fromClass).map((s) => ({ label: `Section ${s.name}`, value: s.id }))]} onChange={(v) => { setFromSection(v); setDecisions({}); }} />
            {final ? (
              <Card style={{ marginBottom: 12 }}>
                <Text className="text-sm font-bold text-[#1b2240]">Graduation</Text>
                <Text className="mt-0.5 text-[11px] text-slate-500">{className(fromClass)} is the final class. Students who move up graduate and are added to the alumni network.</Text>
              </Card>
            ) : (
              <>
                <SelectField label="Move up to" value={toClassId} options={[{ label: className(toClassId), value: toClassId }]} onChange={() => {}} disabled />
                <SelectField label="Target section" value={toSection} options={[{ label: 'Auto-assign (most free seats)', value: 'auto' }, ...targetSections.map((s) => ({ label: `Section ${s.name}`, value: s.id, hint: `${freeSeats(s)} of ${s.capacity} seats free` }))]} onChange={setToSection} />
                <Card style={{ marginBottom: 12 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-[#1b2240]">{className(toClassId)} seats</Text>
                    <Pill label={`${free} free`} tone={free >= pool.length ? 'success' : 'warning'} />
                  </View>
                  <View className="mt-2"><ProgressBar value={targetSections.reduce((n, s) => n + (s.capacity - freeSeats(s)), 0)} max={Math.max(1, targetSections.reduce((n, s) => n + s.capacity, 0))} tone={free >= pool.length ? 'primary' : 'danger'} /></View>
                  <Text className="mt-1.5 text-[11px] text-slate-500">{pool.length} students in {className(fromClass)} · {free} seat{free === 1 ? '' : 's'} free in {className(toClassId)}</Text>
                </Card>
              </>
            )}
            <Button label="Next: review students" onPress={() => setStep(3)} disabled={pool.length === 0} />
            {pool.length === 0 ? <Text className="mt-2 text-center text-[11px] text-slate-400">There are no active students in this selection.</Text> : null}
          </View>
        ) : null}

        {step === 3 ? (
          <View>
            <View className="mb-2 flex-row flex-wrap gap-2">
              <Button small variant="secondary" icon="zap" label="Auto-select" onPress={() => setDecisions({})} />
              <Button small variant="secondary" label={final ? 'All graduate' : 'All move up'} onPress={() => setAll('promote')} />
              <Button small variant="secondary" label="All retain" onPress={() => setAll('retain')} />
              <Button small variant="secondary" label="Clear" onPress={() => setAll('skip')} />
            </View>
            <SegmentedTabs tabs={[{ key: 'all', label: 'All' }, { key: 'eligible', label: 'Eligible' }, { key: 'graduate', label: 'Graduate' }, { key: 'fee', label: 'Fee pending' }, { key: 'lowatt', label: 'Low attendance' }, { key: 'risk', label: 'Academic risk' }]} active={recFilter} onChange={setRecFilter} />
            {shown.length === 0 ? <Text className="py-6 text-center text-xs text-slate-400">No students match this filter.</Text> : null}
            {shown.map((s) => {
              const rec = recommendationOf(s);
              const fee = feeSummary(s.id);
              const d = effective[s.id];
              return (
                <Card key={s.id} style={{ marginBottom: 8 }}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                      <Text className="text-sm font-bold text-[#1b2240]">{s.name}</Text>
                      <Text className="text-[11px] text-slate-500">{s.admissionNo} · {classSection(s)} · Roll {s.rollNo}</Text>
                    </View>
                    <Pill label={rec.label} tone={rec.tone} />
                  </View>
                  <Text className="mt-1.5 text-[11px] text-slate-500">Attendance {pct(attendancePct(s.id))} · Academic {pct(academicPercent(s.id))} · {behaviourLabel(behaviourScore(s.id))} · Fees {fee.status}</Text>
                  <View className="mt-2 flex-row gap-2">
                    {DECISIONS.map((o) => {
                      const on = d === o.key;
                      return (
                        <Pressable key={o.key} onPress={() => setDecisions((cur) => ({ ...cur, [s.id]: o.key }))} className={`flex-1 items-center rounded-lg border py-1.5 ${on ? 'border-[#3D5EE1] bg-[#3D5EE1]' : 'border-slate-200 bg-white'}`}>
                          <Text className={`text-[11px] font-bold ${on ? 'text-white' : 'text-slate-600'}`}>{o.key === 'promote' && final ? 'Graduate' : o.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>
              );
            })}
            <Button label="Next: confirm" onPress={() => setStep(4)} />
          </View>
        ) : null}

        {step === 4 ? (
          <View>
            <Card style={{ marginBottom: 10 }}>
              <Text className="text-sm font-bold text-[#1b2240]">{className(fromClass)}{fromSection !== 'all' ? ` · ${sections.find((s) => s.id === fromSection)?.name}` : ''} → {final ? 'Graduation' : className(toClassId)}</Text>
              <View className="mt-2 flex-row justify-between">
                <View className="items-center"><Text className="text-lg font-extrabold text-[#15803D]">{check.promote.length}</Text><Text className="text-[10px] text-slate-500">{final ? 'Graduate' : 'Move up'}</Text></View>
                <View className="items-center"><Text className="text-lg font-extrabold text-[#B91C1C]">{check.retain.length}</Text><Text className="text-[10px] text-slate-500">Retain</Text></View>
                <View className="items-center"><Text className="text-lg font-extrabold text-slate-500">{check.skip.length}</Text><Text className="text-[10px] text-slate-500">Unchanged</Text></View>
              </View>
            </Card>
            {[
              { ok: check.short.length === 0, text: final ? 'No seats needed — students graduate' : check.short.length ? `Not enough seats in ${className(toClassId)}: ${check.short.length} student${check.short.length > 1 ? 's' : ''} short (${free} free). Promote ${className(toClassId)} first or choose a different section.` : `Seats confirmed in ${className(toClassId)} (${free} free)` },
              { ok: !pool.some((s) => recommendationOf(s).kind === 'fee' && effective[s.id] === 'skip'), text: 'Every fee-pending student has been decided' },
              { ok: !pool.some((s) => recommendationOf(s).kind === 'risk' && effective[s.id] === 'promote'), text: 'No academic-risk student is being moved up without review' },
              { ok: check.promote.length + check.retain.length > 0, text: 'At least one student is selected' },
            ].map((c) => (
              <View key={c.text} className="mb-1.5 flex-row items-start">
                <Text className={`mr-2 text-sm ${c.ok ? 'text-[#15803D]' : 'text-[#B45309]'}`}>{c.ok ? '✓' : '!'}</Text>
                <Text className="flex-1 text-xs text-slate-600">{c.text}</Text>
              </View>
            ))}
            <Text className="mb-3 mt-1 text-[11px] text-slate-400">Parents are not notified in this demo, and roll numbers stay as they are.</Text>
            {staff ? <Button label="Finalise promotion" icon="check" onPress={finalise} disabled={check.short.length > 0 || check.promote.length + check.retain.length === 0} /> : <Text className="text-center text-xs text-slate-400">Your role can review a promotion plan but not finalise it.</Text>}
          </View>
        ) : null}
      </View>

      <View className="mt-6">
        <Text className="mb-2 px-4 text-[11px] font-extrabold uppercase tracking-wide text-[#3D5EE1]">Promotion history · {thisSession.length} batch{thisSession.length === 1 ? '' : 'es'} this session</Text>
        <SegmentedTabs tabs={[{ key: 'all', label: 'All' }, { key: 'promoted', label: 'Promoted' }, { key: 'graduated', label: 'Graduated' }, { key: 'detained', label: 'Detained' }]} active={tl} onChange={setTl} />
        <View className="gap-2 px-4">
          {timeline.length === 0 ? <EmptyState icon="clock" title="No batches yet" /> : null}
          {timeline.slice(0, 20).map((h) => (
            <Card key={h.id}>
              <View className="flex-row items-start justify-between">
                <Text className="flex-1 pr-2 text-sm font-bold text-[#1b2240]">{h.count} student{h.count === 1 ? '' : 's'} · {className(h.fromClassId)}{h.toClassId && h.toClassId !== h.fromClassId ? ` → ${className(h.toClassId)}` : h.kind === 'Graduated' ? ' → Graduated' : ' (retained)'}</Text>
                <Pill label={h.kind} tone={h.kind === 'Promoted' ? 'success' : h.kind === 'Graduated' ? 'purple' : 'warning'} />
              </View>
              <Text className="mt-1 text-[11px] text-slate-500">{h.batchNo} · {h.academicYear} · {formatDate(h.date)} · approved by {h.approvedBy}</Text>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
