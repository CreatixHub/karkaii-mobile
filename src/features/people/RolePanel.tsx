import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { canManage } from '@/core/auth/access';
import { repo } from '@/core/store/store';
import { useCollection } from '@/core/store/useCollection';
import { todayISO } from '@/core/utils/date';
import { PERMISSION_ACTIONS, PERMISSION_MODULES, type RoleRecord, type UserRecord } from '@/data/seed/peopleAdmin';
import { logAudit } from '@/features/common/audit';
import { useAuth } from '@/hooks/useAuth';
import { Pill } from '@/ui/basics';
import { useToast } from '@/ui/Toast';
import { TONES } from '@/ui/tone';
import { applyPreset, permissionCount } from './adminConfigs';

const PRESET_LABELS: [string, string][] = [
  ['none', 'None'],
  ['read_only', 'Read only'],
  ['editor', 'Editor'],
  ['manager', 'Manager'],
  ['full_access', 'Full access'],
];

/** Permission matrix for one role: toggle each action per module, apply a preset, see who holds the role. */
export function RolePanel({ roleId }: { roleId: string }) {
  const roles = useCollection<RoleRecord>('roles');
  const users = useCollection<UserRecord>('users');
  const { user } = useAuth();
  const toast = useToast();
  const role = roles.find((r) => r.id === roleId);
  if (!role) return null;
  const editable = canManage(user?.role);
  const holders = users.filter((u) => u.roleId === role.id);

  const save = (permissions: Record<string, boolean[]>, summary: string) => {
    repo<RoleRecord>('roles').update(role.id, { permissions, updatedOn: todayISO() });
    logAudit({ entity: 'role', entityId: role.id, action: 'Updated', summary: `${role.name}: ${summary}`, by: user?.name ?? 'System' });
  };

  const toggle = (moduleId: string, index: number) => {
    const next = { ...role.permissions, [moduleId]: role.permissions[moduleId].map((v, i) => (i === index ? !v : v)) };
    const mod = PERMISSION_MODULES.find((m) => m.id === moduleId)?.label ?? moduleId;
    save(next, `${PERMISSION_ACTIONS[index]} on ${mod} ${next[moduleId][index] ? 'granted' : 'revoked'}`);
  };

  const preset = (key: string, moduleId?: string) => {
    const label = PRESET_LABELS.find(([k]) => k === key)?.[1] ?? key;
    save(applyPreset(role, key, moduleId), `${label} preset applied to ${moduleId ? PERMISSION_MODULES.find((m) => m.id === moduleId)?.label : 'all modules'}`);
    toast(`${label} applied to ${moduleId ? PERMISSION_MODULES.find((m) => m.id === moduleId)?.label : 'all modules'}`, 'info');
  };

  return (
    <View className="mb-3">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-[11px] font-extrabold uppercase tracking-wide text-[#3D5EE1] dark:text-[#7d95f5]">Permissions</Text>
        <Text className="text-[11px] font-semibold text-slate-400 dark:text-[#8b879b]">{permissionCount(role)} granted</Text>
      </View>
      {editable ? (
        <View className="mb-2 flex-row flex-wrap gap-1.5">
          {PRESET_LABELS.map(([key, label]) => (
            <Pressable key={key} onPress={() => preset(key)} className="rounded-full border border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022] px-2.5 py-1 active:bg-slate-50">
              <Text className="text-[10px] font-bold text-slate-600 dark:text-[#B9B7C0]">All: {label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {PERMISSION_MODULES.map((m) => {
        const flags = role.permissions[m.id] ?? [];
        return (
          <View key={m.id} className="mb-2 rounded-xl border border-slate-100 dark:border-[#262038] bg-slate-50 dark:bg-[#1B1632] p-2.5">
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text className="text-xs font-bold text-slate-800 dark:text-[#EFEFF2]">{m.label}</Text>
              <Text className="text-[10px] text-slate-400 dark:text-[#8b879b]">
                {flags.filter(Boolean).length}/{PERMISSION_ACTIONS.length}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-1.5">
              {PERMISSION_ACTIONS.map((action, i) => {
                const on = !!flags[i];
                const t = on ? TONES.primary : TONES.neutral;
                return (
                  <Pressable
                    key={action}
                    disabled={!editable}
                    onPress={() => toggle(m.id, i)}
                    accessibilityLabel={`${m.label} ${action} ${on ? 'granted' : 'not granted'}`}
                    style={{ backgroundColor: t.bg, borderColor: t.border }}
                    className="flex-row items-center rounded-full border px-2 py-1"
                  >
                    <Feather name={on ? 'check' : 'minus'} size={10} color={t.fg} />
                    <Text style={{ color: t.fg }} className="ml-1 text-[10px] font-bold">
                      {action}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {editable ? (
              <View className="mt-1.5 flex-row flex-wrap gap-x-3">
                {PRESET_LABELS.filter(([k]) => k === 'none' || k === 'read_only' || k === 'full_access').map(([key, label]) => (
                  <Pressable key={key} onPress={() => preset(key, m.id)} hitSlop={6}>
                    <Text className="text-[10px] font-bold text-[#3D5EE1] dark:text-[#7d95f5]">{label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
      {!editable ? <Text className="mb-2 text-[11px] text-slate-400 dark:text-[#8b879b]">Your role can view permissions but not change them.</Text> : null}

      <Text className="mb-1 mt-2 text-[11px] font-extrabold uppercase tracking-wide text-[#3D5EE1] dark:text-[#7d95f5]">Assigned users ({holders.length})</Text>
      {holders.length ? (
        <View className="flex-row flex-wrap gap-1.5">
          {holders.slice(0, 12).map((u) => (
            <Pill key={u.id} label={u.name} tone={u.status === 'Active' ? 'success' : 'neutral'} />
          ))}
          {holders.length > 12 ? <Pill label={`+${holders.length - 12} more`} tone="neutral" /> : null}
        </View>
      ) : (
        <Text className="text-xs text-slate-400 dark:text-[#8b879b]">No users have this role yet.</Text>
      )}
    </View>
  );
}
