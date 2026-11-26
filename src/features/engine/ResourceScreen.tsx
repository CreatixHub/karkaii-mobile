import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useAuth } from '@/core/auth/AuthProvider';
import { repo, snapshot, type Entity } from '@/core/store/store';
import { useCollection } from '@/core/store/useCollection';
import { toCsv } from '@/core/utils/format';
import { Button, EmptyState, KeyValue, Pill } from '@/ui/basics';
import { DateStepper } from '@/ui/DateStepper';
import { todayISO } from '@/core/utils/date';
import { Sheet } from '@/ui/Sheet';
import { OptionSheet } from '@/ui/Fields';
import { FilterChips, SearchField, SegmentedTabs, SummaryStrip, ToolbarButton } from '@/ui/ListChrome';
import { useToast } from '@/ui/Toast';
import { TONES } from '@/ui/tone';
import { changedKeys, describeChange, logAudit } from '@/features/common/audit';
import { RecordCard } from './RecordCard';
import { FormSheet, fromFormValues, lookup, toFormValues } from './FormSheet';
import type { ActionContext, ActionDef, BulkActionDef, FormValues, PageActionDef, ResourceConfig } from './types';

const PAGE = 20;

export function ResourceScreen<T extends Entity>({ cfg, breadcrumb, initialQuery }: { cfg: ResourceConfig<T>; breadcrumb?: string; initialQuery?: string }) {
  const { user, role, canManage: roleCanManage } = useAuth();
  // Some pages (Events) are open to every role but only certain roles may change them.
  const canManage = roleCanManage && (!cfg.manageRoles || (!!role && cfg.manageRoles.includes(role)));
  const toast = useToast();
  const localRows = useCollection<T>(cfg.collection);
  const [remoteData, setRemoteData] = useState<{
    owner: typeof user;
    rows: T[];
  } | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const api = cfg.api;

  useEffect(() => {
    if (!api || !user) return;

    let active = true;

    setApiLoading(true);
    setApiError('');

    api.list()
      .then((data) => {
        if (active) {
          setRemoteData({ owner: user, rows: data });
        }
      })
      .catch((error) => {
        if (active) {
          setRemoteData(null);
          setApiError(
            error instanceof Error
              ? error.message
              : 'Unable to load records'
          );
        }
      })
      .finally(() => {
        if (active) setApiLoading(false);
      });

    return () => { active = false; };
  }, [api, user, reloadKey]);

  const allRows = api
    ? remoteData?.owner === user
      ? remoteData?.rows ?? []
      : []
    : localRows;
  // Row-level scoping (e.g. a student only sees their own fees), the mobile stand-in for the API's own scoping.
  const rows = useMemo(() => (cfg.rowScope ? allRows.filter((r) => cfg.rowScope!(r, user)) : allRows), [allRows, cfg, user]);
  const store = useMemo(() => repo<T>(cfg.collection), [cfg.collection]);

  const [query, setQuery] = useState(initialQuery ?? '');
  const [viewKey, setViewKey] = useState(cfg.views?.[0]?.key ?? 'all');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sortKey, setSortKey] = useState(cfg.sorts?.[0]?.key ?? '');
  const [selected, setSelected] = useState<string[]>([]);
  const [limit, setLimit] = useState(PAGE);
  // A per-day register opens on the most recent day that has records (today may be a weekend or holiday).
  const [date, setDate] = useState<string>(() => {
    const key = cfg.dateFilter?.key;
    if (!key) return todayISO();
    const dates = snapshot<T>(cfg.collection).map((r) => (r as Record<string, unknown>)[key]).filter((d): d is string => typeof d === 'string' && d <= todayISO());
    return dates.sort().pop() ?? todayISO();
  });
  const [bulkForm, setBulkForm] = useState<BulkActionDef<T> | null>(null);
  const [pageForm, setPageForm] = useState<PageActionDef<T> | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null);
  const [actionForm, setActionForm] = useState<{ action: ActionDef<T>; id: string } | null>(null);

  const allowCreate = canManage && cfg.canCreate !== false;
  const allowEdit = canManage && cfg.canEdit !== false;
  const allowDelete = !api && canManage && cfg.canDelete !== false;

  /** Rows for the selected date (or all rows when the page has no date filter / "All dates" is on). */
  const scoped = useMemo(() => {
    const key = cfg.dateFilter?.key;
    if (!key || date === 'all') return rows;
    return rows.filter((r) => (r as Record<string, unknown>)[key] === date);
  }, [rows, cfg.dateFilter, date]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const view = cfg.views?.find((v) => v.key === viewKey);
    let out = scoped.filter((r) => {
      if (view && !view.match(r)) return false;
      if (q && !cfg.searchText(r).toLowerCase().includes(q)) return false;
      for (const f of cfg.filters ?? []) {
        const picked = filters[f.key];
        if (picked?.length && !picked.some((v) => f.match(r, v))) return false;
      }
      return true;
    });
    const sort = cfg.sorts?.find((s) => s.key === sortKey);
    if (sort) out = [...out].sort(sort.compare);
    return out;
  }, [scoped, query, viewKey, filters, sortKey, cfg]);

  const shown = filtered.slice(0, limit);
  const detail = detailId ? rows.find((r) => r.id === detailId) : undefined;
  const activeFilterCount = Object.values(filters).reduce((n, v) => n + v.length, 0);
  const selecting = selected.length > 0;

  const optionList = useCallback(
    (f: NonNullable<ResourceConfig<T>['filters']>[number]) => (typeof f.options === 'function' ? f.options(rows) : f.options),
    [rows],
  );

  const chips = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    for (const f of cfg.filters ?? []) {
      for (const v of filters[f.key] ?? []) {
        const label = (typeof f.options === 'function' ? f.options(rows) : f.options).find((o) => o.value === v)?.label ?? v;
        out.push({ key: `${f.key}::${v}`, label: `${f.label}: ${label}` });
      }
    }
    return out;
  }, [filters, cfg, rows]);

  const toggleSelect = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const share = (title: string, message: string) => {
    Share.share({ title, message }).catch(() => toast('Share cancelled', 'info'));
  };

  const go = (href: string) => router.push(href as Href);
  const showAlert = (title: string, message: string) => Alert.alert(title, message);

  /** Audit + after-save hook for one change. */
  const recordChange = (kind: 'create' | 'update' | 'delete', record: T, previous?: T, how?: string) => {
    if (cfg.auditEntity) {
      const keys = changedKeys(previous as Record<string, unknown> | undefined, record as Record<string, unknown>);
      const action = kind === 'create' ? 'Created' : kind === 'delete' ? 'Deleted' : how ? 'Action' : 'Updated';
      logAudit({ entity: cfg.auditEntity, entityId: record.id, action, summary: how ? `${cfg.title(record)}: ${how}${keys.length ? ` (${keys.join(', ')})` : ''}` : describeChange(action, cfg.title(record), keys), by: user?.name ?? 'System' });
    }
    cfg.afterSave?.(kind, record, previous);
  };

  const actionCtx = (id: string, how?: string): ActionContext<T> => ({
    update: (patch) => {
      const previous = store.get(id);
      const next = store.update(id, patch);
      if (previous && next) recordChange('update', next, previous, how ?? 'updated');
    },
    remove: () => {
      const previous = store.get(id);
      store.remove(id);
      if (previous) recordChange('delete', previous);
    },
    toast,
    rows,
    role,
    user,
    share,
    go,
    alert: showAlert,
  });

  const runAction = (action: ActionDef<T>, row: T, values: FormValues) => {
    action.run(row, values, actionCtx(row.id, action.label));
    setActionForm(null);
  };

  const triggerAction = (action: ActionDef<T>, row: T) => {
    if (action.form) {
      setActionForm({ action, id: row.id });
    } else if (action.confirm) {
      Alert.alert(action.label, action.confirm, [
        { text: 'Cancel', style: 'cancel' },
        { text: action.label, style: action.tone === 'danger' ? 'destructive' : 'default', onPress: () => runAction(action, row, {}) },
      ]);
    } else {
      runAction(action, row, {});
    }
  };

  const confirmDelete = (ids: string[]) => {
    const blocked = ids.map((id) => rows.find((r) => r.id === id)).flatMap((r) => (r && cfg.canDeleteRecord ? [{ r, why: cfg.canDeleteRecord(r) }] : [])).find((x) => x.why);
    if (blocked) {
      Alert.alert(`Can’t delete ${cfg.title(blocked.r)}`, blocked.why!);
      return;
    }
    Alert.alert(`Delete ${ids.length > 1 ? `${ids.length} ${cfg.entity} records` : cfg.entity}?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const gone = ids.map((id) => store.get(id)).filter((r): r is T => !!r);
          store.removeMany(ids);
          gone.forEach((r) => recordChange('delete', r));
          setSelected([]);
          setDetailId(null);
          toast(`${ids.length > 1 ? `${ids.length} records` : cfg.entity} deleted`);
        },
      },
    ]);
  };

  const exportCsv = async (list: T[]) => {
    const cols = cfg.exportColumns ?? [
      { label: 'Name', value: cfg.title },
      ...cfg.facts.map((f) => ({ label: f.label, value: f.value as (r: T) => string | number | undefined | null })),
    ];
    const csv = toCsv(cols.map((c) => c.label), list.map((r) => cols.map((c) => c.value(r))));
    try {
      await Share.share({ title: `${cfg.entity} export`, message: csv });
    } catch {
      toast('Export cancelled', 'info');
    }
  };

  const save = async (values: FormValues) => {
    if (api) {
      if (!user) throw new Error('Please sign in again');

      if (form?.mode === 'edit' && form.id) {
        await api.update(form.id, values);
        toast(`${cfg.entity} updated`);
      } else {
        await api.create(values);
        toast(`${cfg.entity} added`);
      }

      setForm(null);
      setReloadKey((key) => key + 1);
      return;
    }
    const existing = form?.mode === 'edit' ? rows.find((r) => r.id === form.id) : undefined;
    const typed = fromFormValues(cfg.form, values);
    const computed = cfg.prepare?.(typed, { existing, rows, lookup, user }) ?? {};
    if (existing) {
      const next = store.update(existing.id, { ...typed, ...computed } as Partial<T>);
      if (next) recordChange('update', next, existing);
      toast(`${cfg.entity} updated`);
    } else {
      const created = store.create({ ...typed, ...computed } as Omit<T, 'id'>);
      recordChange('create', created);
      toast(`${cfg.entity} added`);
    }
    setForm(null);
  };

  const editing = form?.mode === 'edit' ? rows.find((r) => r.id === form.id) : undefined;
  const formInitial = useMemo(
    () => (editing ? toFormValues(cfg.form, editing as any) : { ...toFormValues(cfg.form), ...(cfg.defaults?.(rows, { date: cfg.dateFilter && date !== 'all' ? date : undefined }) ?? {}) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form?.mode, form?.id, cfg.form],
  );

  const pageActionsVisible = (api ? [] : cfg.pageActions ?? []).filter((a) => a.manage === false || canManage);

  const runPageAction = (a: PageActionDef<T>, values: FormValues) => {
    a.run(values, {
      rows,
      visible: filtered,
      date: cfg.dateFilter ? date : undefined,
      create: (input) => store.create(input),
      updateMany: (ids, fn) => store.updateMany(ids, fn),
      toast,
      role,
      share,
      go,
      alert: showAlert,
    });
    setPageForm(null);
  };
  const triggerPageAction = (a: PageActionDef<T>) => (a.form ? setPageForm(a) : runPageAction(a, {}));

  const runBulk = (b: BulkActionDef<T>, values: FormValues) => {
    b.run(rows.filter((r) => selected.includes(r.id)), values, { updateMany: (fn) => store.updateMany(selected, fn), toast, role });
    setBulkForm(null);
    setSelected([]);
  };

  // Always visible while the list scrolls: the page title row, date, view tabs, search and active filters.
  const top = (
    <View className="border-b border-slate-200/70 bg-[#f4f6fb] dark:bg-[#0F0C1C] pt-3">
      <View className="mb-2 flex-row items-center justify-between px-4">
        <Text className="flex-1 pr-3 text-[11px] text-slate-400 dark:text-[#8b879b]" numberOfLines={1}>
          {breadcrumb}
        </Text>
        {allowCreate ? <Button label={`Add ${cfg.entity}`} icon="plus" small onPress={() => (cfg.addHref ? go(cfg.addHref) : setForm({ mode: 'create' }))} /> : null}
      </View>

      {cfg.dateFilter ? <DateStepper value={date} onChange={(d) => { setDate(d); setLimit(PAGE); setSelected([]); }} allowAll={cfg.dateFilter.allowAll} /> : null}

      {cfg.views?.length ? (
        <SegmentedTabs
          tabs={cfg.views.map((v) => ({ key: v.key, label: v.label, count: scoped.filter(v.match).length }))}
          active={viewKey}
          onChange={(k) => {
            setViewKey(k);
            setLimit(PAGE);
          }}
        />
      ) : null}

      <View className="mb-2 flex-row items-center gap-2 px-4">
        <SearchField value={query} onChange={(v) => { setQuery(v); setLimit(PAGE); }} placeholder={cfg.searchPlaceholder ?? `Search ${cfg.entity.toLowerCase()}…`} />
        {cfg.filters?.length ? <ToolbarButton icon="sliders" badge={activeFilterCount} onPress={() => setShowFilters(true)} /> : null}
        {cfg.sorts?.length ? <ToolbarButton icon="bar-chart" onPress={() => setShowSort(true)} /> : null}
        <ToolbarButton icon="share" onPress={() => exportCsv(filtered)} />
      </View>

      <FilterChips
        chips={chips}
        onRemove={(key) => {
          const [fk, ...rest] = key.split('::');
          const val = rest.join('::');
          setFilters((f) => ({ ...f, [fk]: (f[fk] ?? []).filter((x) => x !== val) }));
        }}
        onClear={() => setFilters({})}
      />

    </View>
  );

  // Scrolls away with the list: page actions, any custom header, summary tiles and the record count.
  const header = (
    <View className="pt-3">
      {pageActionsVisible.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} className="mb-3">
          {pageActionsVisible.map((a) => (
            <Pressable key={a.key} onPress={() => triggerPageAction(a)} className="flex-row items-center rounded-xl border border-[#3D5EE1]/30 bg-[#E9EDFC] dark:bg-[#1d2450] px-3 py-2 active:opacity-80">
              <Feather name={a.icon} size={13} color="#3D5EE1" />
              <Text className="ml-1.5 text-xs font-bold text-[#3D5EE1] dark:text-[#7d95f5]">{a.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {cfg.header?.(scoped)}

      {cfg.stats?.length ? (
        <SummaryStrip items={cfg.stats.map((s) => ({ label: s.label, value: s.value(scoped), tone: s.tone, icon: s.icon }))} />
      ) : null}

      <Text className="mb-2 px-4 text-[11px] text-slate-400 dark:text-[#8b879b]">
        {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
        {selecting ? ` · ${selected.length} selected` : allowDelete || cfg.bulk?.length ? ' · long-press a card to select' : ''}
      </Text>
    </View>
  );

  const visibleActions = (r: T) => (api ? [] : cfg.actions ?? []).filter((a) => (a.manage === false || canManage) && (a.visible ? a.visible(r, role, user) : true));
  const formAction = actionForm ? actionForm.action : null;
  const formActionRow = actionForm ? rows.find((r) => r.id === actionForm.id) : undefined;

  return (
    <View className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]">
      {top}

      {api ? (
        <View className="px-4 py-2">
          {apiLoading ? (
            <Text className="text-xs text-slate-500">
              Loading records from server...
            </Text>
          ) : null}

          {apiError ? (
            <Text className="mb-2 text-xs text-red-600">
              {apiError}
            </Text>
          ) : null}

          <Button
            label="Refresh"
            variant="secondary"
            small
            onPress={() => setReloadKey((key) => key + 1)}
          />
        </View>
      ) : null}
      <FlatList
        data={shown}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <RecordCard
            cfg={cfg}
            row={item}
            selecting={selecting}
            selected={selected.includes(item.id)}
            onPress={() => (selecting ? toggleSelect(item.id) : setDetailId(item.id))}
            onLongPress={() => (!api && (allowDelete || (canManage && cfg.bulk?.length)) ? toggleSelect(item.id) : undefined)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title={rows.length ? 'No records match' : `No ${cfg.entity.toLowerCase()} records yet`}
            hint={rows.length ? 'Try clearing the search or filters.' : allowCreate ? `Tap “Add ${cfg.entity}” to create one.` : undefined}
          />
        }
        ListFooterComponent={
          filtered.length > shown.length ? (
            <View className="px-4 pb-4">
              <Button label={`Show more (${filtered.length - shown.length} left)`} variant="secondary" onPress={() => setLimit((l) => l + PAGE)} />
            </View>
          ) : undefined
        }
        contentContainerStyle={{ paddingBottom: selecting ? 120 : 40 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        windowSize={7}
      />

      {selecting ? (
        <View className="absolute bottom-4 left-4 right-4 flex-row items-center rounded-2xl bg-[#1b2240] px-3 py-2.5 shadow-lg shadow-black/30">
          <Pressable onPress={() => setSelected([])} hitSlop={8} className="mr-2 h-8 w-8 items-center justify-center">
            <Feather name="x" size={16} color="#fff" />
          </Pressable>
          <Text className="text-[#202C4B] dark:text-[#EFEFF2] flex-1 text-xs font-bold text-white">{selected.length} selected</Text>
          <Pressable onPress={() => setSelected(filtered.length === selected.length ? [] : filtered.map((r) => r.id))} className="ml-1 rounded-lg bg-white/15 px-2.5 py-1.5">
            <Text className="text-[#202C4B] dark:text-[#EFEFF2] text-[11px] font-bold text-white">{filtered.length === selected.length ? 'None' : 'All'}</Text>
          </Pressable>
          {(cfg.bulk ?? []).filter(() => canManage).map((b) => (
            <Pressable key={b.key} onPress={() => (b.form ? setBulkForm(b) : runBulk(b, {}))} className="ml-2 flex-row items-center rounded-lg bg-white/15 px-2.5 py-1.5">
              <Feather name={b.icon} size={12} color="#fff" />
              <Text className="text-[#202C4B] dark:text-[#EFEFF2] ml-1 text-[11px] font-bold text-white">{b.label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => exportCsv(rows.filter((r) => selected.includes(r.id)))} className="ml-2 flex-row items-center rounded-lg bg-white/15 px-2.5 py-1.5">
            <Feather name="share" size={12} color="#fff" />
            <Text className="text-[#202C4B] dark:text-[#EFEFF2] ml-1 text-[11px] font-bold text-white">Export</Text>
          </Pressable>
          {allowDelete ? (
            <Pressable onPress={() => confirmDelete(selected)} className="ml-2 flex-row items-center rounded-lg bg-red-500 px-2.5 py-1.5">
              <Feather name="trash-2" size={12} color="#fff" />
              <Text className="text-[#202C4B] dark:text-[#EFEFF2] ml-1 text-[11px] font-bold text-white">Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Detail sheet */}
      <Sheet visible={!!detail} title={detail ? cfg.title(detail) : ''} onClose={() => setDetailId(null)} tall>
        {detail ? (
          <View>
            <View className="mb-3 flex-row flex-wrap items-center gap-1.5">
              {cfg.status ? <Pill label={cfg.status(detail).label} tone={cfg.status(detail).tone} /> : null}
              {(cfg.badges?.(detail) ?? []).map((b, i) => (
                <Pill key={`${b.label}-${i}`} label={b.label} tone={b.tone} />
              ))}
            </View>

            {(cfg.detail ?? [{ title: 'Details', items: cfg.facts }]).map((section) => (
              <View key={section.title} className="mb-3">
                <Text className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#3D5EE1] dark:text-[#7d95f5]">{section.title}</Text>
                {section.items.map((it) => (
                  <KeyValue key={it.label} label={it.label} value={it.value(detail) as string | number | null | undefined} />
                ))}
              </View>
            ))}

            {!api ? cfg.extra?.(detail) : null}

            <View className="mt-2 gap-2.5 pb-2">
              {visibleActions(detail).map((a) => (
                <Button
                  key={a.key}
                  label={a.label}
                  icon={a.icon}
                  variant={a.tone === 'danger' ? 'danger' : 'secondary'}
                  onPress={() => triggerAction(a, detail)}
                />
              ))}
              {allowEdit && (cfg.editable ? cfg.editable(detail) : true) ? (
                <Button
                  label={`Edit ${cfg.entity}`}
                  icon="edit-2"
                  onPress={() => {
                    setDetailId(null);
                    if (cfg.editHref) go(cfg.editHref(detail));
                    else setForm({ mode: 'edit', id: detail.id });
                  }}
                />
              ) : null}
              {allowDelete ? <Button label={`Delete ${cfg.entity}`} icon="trash-2" variant="danger" onPress={() => confirmDelete([detail.id])} /> : null}
              {!canManage ? (
                <View className="flex-row items-center justify-center rounded-xl px-3 py-2" style={{ backgroundColor: TONES.neutral.bg }}>
                  <Feather name="eye" size={12} color={TONES.neutral.fg} />
                  <Text className="ml-1.5 text-[11px] font-semibold" style={{ color: TONES.neutral.fg }}>
                    View-only access for your role
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </Sheet>

      {/* Add / Edit */}
      <FormSheet
        visible={!!form}
        title={form?.mode === 'edit' ? `Edit ${cfg.entity}` : `Add ${cfg.entity}`}
        fields={cfg.form}
        initial={formInitial}
        isEdit={form?.mode === 'edit'}
        validate={(v) => cfg.validate?.(v, { existing: editing, rows }) ?? {}}
        onSubmit={save}
        onClose={() => setForm(null)}
      />

      {/* Action with input */}
      {formAction && formActionRow ? (
        <FormSheet
          visible
          title={formAction.form!.title}
          fields={formAction.form!.fields}
          initial={{ ...toFormValues(formAction.form!.fields), ...(formAction.form!.initial?.(formActionRow) ?? {}) }}
          submitLabel={formAction.form!.submitLabel ?? formAction.label}
          validate={(v) => formAction.form!.validate?.(fromFormValues(formAction.form!.fields, v), formActionRow) ?? {}}
          onSubmit={(v) => runAction(formAction, formActionRow, fromFormValues(formAction.form!.fields, v))}
          onClose={() => setActionForm(null)}
        />
      ) : null}

      {bulkForm ? (
        <FormSheet
          visible
          title={bulkForm.form!.title}
          fields={bulkForm.form!.fields}
          initial={toFormValues(bulkForm.form!.fields)}
          submitLabel={bulkForm.form!.submitLabel ?? bulkForm.label}
          validate={(v) => bulkForm.form!.validate?.(fromFormValues(bulkForm.form!.fields, v)) ?? {}}
          onSubmit={(v) => runBulk(bulkForm, fromFormValues(bulkForm.form!.fields, v))}
          onClose={() => setBulkForm(null)}
        />
      ) : null}

      {pageForm ? (
        <FormSheet
          visible
          title={pageForm.form!.title}
          fields={pageForm.form!.fields}
          initial={toFormValues(pageForm.form!.fields)}
          submitLabel={pageForm.form!.submitLabel ?? pageForm.label}
          validate={(v) => pageForm.form!.validate?.(fromFormValues(pageForm.form!.fields, v)) ?? {}}
          onSubmit={(v) => runPageAction(pageForm, fromFormValues(pageForm.form!.fields, v))}
          onClose={() => setPageForm(null)}
        />
      ) : null}

      {/* Filters */}
      <Sheet
        visible={showFilters}
        title="Filters"
        onClose={() => setShowFilters(false)}
        footer={
          <View className="flex-row gap-3">
            <Button label="Reset" variant="secondary" onPress={() => setFilters({})} style={{ flex: 1 }} />
            <Button label="Apply" onPress={() => { setShowFilters(false); setLimit(PAGE); }} style={{ flex: 1 }} />
          </View>
        }
      >
        {(cfg.filters ?? []).map((f) => (
          <View key={f.key} className="mb-4">
            <Text className="mb-2 text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2]">{f.label}</Text>
            <View className="flex-row flex-wrap gap-2">
              {optionList(f).map((o) => {
                const on = (filters[f.key] ?? []).includes(o.value);
                return (
                  <Pressable
                    key={o.value}
                    onPress={() =>
                      setFilters((prev) => {
                        const cur = prev[f.key] ?? [];
                        const next = on ? cur.filter((x) => x !== o.value) : f.single ? [o.value] : [...cur, o.value];
                        return { ...prev, [f.key]: next };
                      })
                    }
                    className={`rounded-full border px-3 py-1.5 ${on ? 'border-[#3D5EE1] bg-[#3D5EE1]' : 'border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022]'}`}
                  >
                    <Text className={`text-xs font-semibold ${on ? 'text-white' : 'text-slate-600 dark:text-[#B9B7C0]'}`}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </Sheet>

      {/* Sort */}
      <OptionSheet
        visible={showSort}
        title="Sort by"
        options={(cfg.sorts ?? []).map((s) => ({ label: s.label, value: s.key }))}
        selected={[sortKey]}
        onPick={(k) => {
          setSortKey(k);
          setShowSort(false);
        }}
        onClose={() => setShowSort(false)}
      />
    </View>
  );
}

