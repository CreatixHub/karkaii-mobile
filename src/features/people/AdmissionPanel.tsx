import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { repo } from '@/core/store/store';
import { useCollection } from '@/core/store/useCollection';
import { formatDate, todayISO } from '@/core/utils/date';
import type { AdmissionDocStatus, AdmissionRecord } from '@/data/seed/admissionsAlumni';
import type { FieldDef } from '@/features/engine/types';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, Pill } from '@/ui/basics';
import { useToast } from '@/ui/Toast';
import { TONES, type Tone } from '@/ui/tone';
import { docProgress, logOf, stagesOf } from './admissionLogic';
import { AddButton, Block, Empty, Item, useRecordForm } from './StudentProfileTabs';

const docTone: Record<AdmissionDocStatus, Tone> = { Verified: 'success', Pending: 'warning', Rejected: 'danger', 'Not Uploaded': 'neutral' };
const stageStyle = { done: { tone: 'success' as Tone, icon: 'check' as const }, active: { tone: 'info' as Tone, icon: 'clock' as const }, pending: { tone: 'neutral' as Tone, icon: 'circle' as const }, stopped: { tone: 'danger' as Tone, icon: 'x' as const } };

/** Documents, timeline, notes and activity of one application, shown under its details. */
export function AdmissionPanel({ applicationId }: { applicationId: string }) {
  const app = useCollection<AdmissionRecord>('admissions').find((a) => a.id === applicationId);
  const { canManage, user, role } = useAuth();
  const toast = useToast();
  const noteFields: FieldDef[] = [{ key: 'text', label: 'Note', type: 'textarea', required: true }];
  const noteForm = useRecordForm<{ text: string }>(noteFields, {}, (v) => {
    if (!app) return;
    repo<AdmissionRecord>('admissions').update(app.id, { notes: [...app.notes, { text: v.text, by: user?.name ?? 'Admissions Office', at: new Date().toISOString() }] });
    toast('Note added');
  }, 'Add note');
  if (!app) return null;

  const editable = canManage && role !== 'student' && role !== 'parent' && app.status !== 'Enrolled';
  const progress = docProgress(app);
  const setDoc = (type: string, status: AdmissionDocStatus) => {
    const documents = app.documents.map((d) => (d.type === type ? { ...d, status, uploadedOn: status === 'Not Uploaded' ? '' : d.uploadedOn || todayISO() } : d));
    repo<AdmissionRecord>('admissions').update(app.id, { documents, activity: [...app.activity, logOf(`${type}: ${status === 'Not Uploaded' ? 'removed' : status.toLowerCase()}`, user?.name ?? 'Admissions Office')] });
    toast(`${type}: ${status}`, status === 'Rejected' ? 'info' : 'success');
  };

  return (
    <View>
      <Block title="Admission journey">
        {stagesOf(app).map((s, i, all) => {
          const st = stageStyle[s.state];
          const t = TONES[st.tone];
          return (
            <View key={s.title} className="flex-row">
              <View className="mr-3 items-center">
                <View style={{ backgroundColor: t.bg, borderColor: t.border }} className="h-6 w-6 items-center justify-center rounded-full border">
                  <Feather name={st.icon} size={11} color={t.fg} />
                </View>
                {i < all.length - 1 ? <View className="my-0.5 w-px flex-1 bg-slate-200 dark:bg-[#322D46]" /> : null}
              </View>
              <View className="flex-1 pb-3">
                <Text className={`text-xs font-bold ${s.state === 'pending' ? 'text-slate-400 dark:text-[#8b879b]' : 'text-slate-800 dark:text-[#EFEFF2]'}`}>{s.title}</Text>
                {s.meta ? <Text className="mt-0.5 text-[11px] text-slate-500 dark:text-[#a29fb0]">{s.meta}</Text> : null}
              </View>
            </View>
          );
        })}
      </Block>

      <Block title={`Documents · ${progress.verified} of ${progress.required} required verified`}>
        {app.documents.map((d) => (
          <Card key={d.type} style={{ marginBottom: 8 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{d.type}</Text>
                <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">{d.uploadedOn ? `Uploaded ${formatDate(d.uploadedOn)}` : 'Not uploaded'}</Text>
              </View>
              <Pill label={d.status} tone={docTone[d.status]} />
            </View>
            {editable ? (
              <View className="mt-2 flex-row flex-wrap gap-2">
                {d.status === 'Not Uploaded' ? <Button small variant="secondary" label="Mark uploaded" onPress={() => setDoc(d.type, 'Pending')} /> : null}
                {d.status === 'Pending' || d.status === 'Rejected' ? <Button small label="Verify" onPress={() => setDoc(d.type, 'Verified')} /> : null}
                {d.status === 'Pending' || d.status === 'Verified' ? <Button small variant="danger" label="Reject" onPress={() => setDoc(d.type, 'Rejected')} /> : null}
                {d.status === 'Rejected' ? <Button small variant="secondary" label="Ask to re-upload" onPress={() => setDoc(d.type, 'Not Uploaded')} /> : null}
              </View>
            ) : null}
          </Card>
        ))}
        <Text className="text-[10px] text-slate-400 dark:text-[#8b879b]">Documents are recorded as metadata in this demo; no file is stored.</Text>
      </Block>

      <Block title="Notes" right={editable ? <AddButton label="Add" onPress={noteForm.open} /> : undefined}>
        {app.notes.length === 0 ? <Empty text="No notes yet." /> : null}
        {[...app.notes].reverse().map((n, i) => <Item key={`${n.at}-${i}`} title={n.text} meta={`${n.by} · ${formatDate(n.at.slice(0, 10))}`} />)}
      </Block>

      <Block title="Activity">
        {[...app.activity].reverse().slice(0, 12).map((a, i) => <Item key={`${a.at}-${i}`} title={a.title} meta={`${a.by} · ${formatDate(a.at.slice(0, 10))} ${a.at.slice(11, 16)}`} />)}
      </Block>
      {noteForm.node}
    </View>
  );
}
