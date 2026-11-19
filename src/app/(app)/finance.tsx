import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import {
  INITIAL_DUE_REPORTS,
  INITIAL_EXPENSES,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_FEE_ASSIGNMENTS,
  INITIAL_FEE_COLLECTIONS,
  INITIAL_FEE_GROUPS,
  INITIAL_FEE_STRUCTURES,
  INITIAL_FEE_TYPES,
  INITIAL_FINES,
  INITIAL_RECEIPTS,
  INITIAL_SCHOLARSHIPS,
} from '@/data/financeMock';
import type {
  DueReportItem,
  ExpenseCategoryItem,
  ExpenseItem,
  FeeAssignmentItem,
  FeeCollectionItem,
  FeeGroupItem,
  FeeReceiptItem,
  FeeStructureItem,
  FeeTypeItem,
  FineRuleItem,
  ScholarshipItem,
} from '@/types/modules';

type MainFinanceModule = 'fees' | 'accounts';
type FeesSubTab =
  | 'structure'
  | 'assign'
  | 'collect'
  | 'types'
  | 'groups'
  | 'fines'
  | 'scholarships'
  | 'due_reports'
  | 'receipts';

type AccountsSubTab = 'expenses' | 'categories';

export default function FinanceScreen() {
  // Top-level Navigation
  const [activeModule, setActiveModule] = useState<MainFinanceModule>('fees');
  const [feesSubTab, setFeesSubTab] = useState<FeesSubTab>('collect');
  const [accountsSubTab, setAccountsSubTab] = useState<AccountsSubTab>('expenses');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Local interactive state for all 11 pages
  const [structures, setStructures] = useState<FeeStructureItem[]>(INITIAL_FEE_STRUCTURES);
  const [assignments, setAssignments] = useState<FeeAssignmentItem[]>(INITIAL_FEE_ASSIGNMENTS);
  const [collections, setCollections] = useState<FeeCollectionItem[]>(INITIAL_FEE_COLLECTIONS);
  const [feeTypes, setFeeTypes] = useState<FeeTypeItem[]>(INITIAL_FEE_TYPES);
  const [feeGroups, setFeeGroups] = useState<FeeGroupItem[]>(INITIAL_FEE_GROUPS);
  const [fines, setFines] = useState<FineRuleItem[]>(INITIAL_FINES);
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>(INITIAL_SCHOLARSHIPS);
  const [dueReports] = useState<DueReportItem[]>(INITIAL_DUE_REPORTS);
  const [receipts, setReceipts] = useState<FeeReceiptItem[]>(INITIAL_RECEIPTS);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>(INITIAL_EXPENSE_CATEGORIES);

  // Modals state
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedCollectItem, setSelectedCollectItem] = useState<FeeCollectionItem | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMode, setCollectMode] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('UPI');

  const [showAddModal, setShowAddModal] = useState(false);
  const [formField1, setFormField1] = useState('');
  const [formField2, setFormField2] = useState('');
  const [formField3, setFormField3] = useState('');
  const [formField4, setFormField4] = useState('');
  const [formField5, setFormField5] = useState('');

  const resetForms = () => {
    setFormField1('');
    setFormField2('');
    setFormField3('');
    setFormField4('');
    setFormField5('');
  };

  // --- FILTERED QUERIES ---
  const filteredStructures = useMemo(() => {
    return structures.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.grade.toLowerCase().includes(q) ||
        s.feeType.toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      return true;
    });
  }, [structures, searchQuery, statusFilter]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        a.studentName.toLowerCase().includes(q) ||
        a.admissionNo.toLowerCase().includes(q) ||
        a.className.toLowerCase().includes(q) ||
        a.feeGroup.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      return true;
    });
  }, [assignments, searchQuery, statusFilter]);

  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.studentName.toLowerCase().includes(q) ||
        c.admissionNo.toLowerCase().includes(q) ||
        c.invoiceNo.toLowerCase().includes(q) ||
        c.className.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      return true;
    });
  }, [collections, searchQuery, statusFilter]);

  const filteredFeeTypes = useMemo(() => {
    return feeTypes.filter((ft) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        ft.name.toLowerCase().includes(q) ||
        ft.code.toLowerCase().includes(q) ||
        ft.feeGroup.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && ft.status !== statusFilter) return false;
      return true;
    });
  }, [feeTypes, searchQuery, statusFilter]);

  const filteredFeeGroups = useMemo(() => {
    return feeGroups.filter((fg) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        fg.name.toLowerCase().includes(q) ||
        (fg.code && fg.code.toLowerCase().includes(q)) ||
        fg.description.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && fg.status !== statusFilter) return false;
      return true;
    });
  }, [feeGroups, searchQuery, statusFilter]);

  const filteredFines = useMemo(() => {
    return fines.filter((fn) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        fn.studentName.toLowerCase().includes(q) ||
        fn.admissionNo.toLowerCase().includes(q) ||
        fn.fineId.toLowerCase().includes(q) ||
        fn.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && fn.status !== statusFilter) return false;
      return true;
    });
  }, [fines, searchQuery, statusFilter]);

  const filteredScholarships = useMemo(() => {
    return scholarships.filter((sc) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        sc.studentName.toLowerCase().includes(q) ||
        sc.scholarshipId.toLowerCase().includes(q) ||
        sc.name.toLowerCase().includes(q) ||
        sc.type.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && sc.status !== statusFilter) return false;
      return true;
    });
  }, [scholarships, searchQuery, statusFilter]);

  const filteredDueReports = useMemo(() => {
    return dueReports.filter((dr) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        dr.studentName.toLowerCase().includes(q) ||
        dr.admissionNo.toLowerCase().includes(q) ||
        dr.className.toLowerCase().includes(q) ||
        dr.feeCategory.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && dr.status !== statusFilter) return false;
      return true;
    });
  }, [dueReports, searchQuery, statusFilter]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        r.receiptNo.toLowerCase().includes(q) ||
        r.invoiceNo.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        (r.className && r.className.toLowerCase().includes(q))
      );
    });
  }, [receipts, searchQuery]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        exp.voucherNo.toLowerCase().includes(q) ||
        exp.title.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q) ||
        exp.paidTo.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && exp.status !== statusFilter) return false;
      return true;
    });
  }, [expenses, searchQuery, statusFilter]);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        cat.name.toLowerCase().includes(q) ||
        cat.code.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && cat.status !== statusFilter) return false;
      return true;
    });
  }, [categories, searchQuery, statusFilter]);

  // --- ACTIONS ---
  const handleOpenCollect = (item: FeeCollectionItem) => {
    setSelectedCollectItem(item);
    setCollectAmount(item.balance.toString());
    setShowCollectModal(true);
  };

  const handleConfirmCollect = () => {
    if (!selectedCollectItem) return;
    const paidVal = parseFloat(collectAmount);
    if (isNaN(paidVal) || paidVal <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid numeric payment amount.');
      return;
    }

    const newPaid = selectedCollectItem.paid + paidVal;
    const newBalance = Math.max(0, selectedCollectItem.total - selectedCollectItem.discount + selectedCollectItem.fine - newPaid);
    const newStatus: FeeCollectionItem['status'] = newBalance === 0 ? 'Paid' : 'Partially Paid';

    // Update Collections
    setCollections((prev) =>
      prev.map((c) =>
        c.id === selectedCollectItem.id
          ? {
              ...c,
              paid: newPaid,
              balance: newBalance,
              status: newStatus,
              method: collectMode,
              collectionDate: 'Today',
            }
          : c
      )
    );

    // Create New Receipt
    const newRcp: FeeReceiptItem = {
      id: `rcp-${Date.now()}`,
      receiptNo: `RCP-2026-${Math.floor(600 + Math.random() * 400)}`,
      invoiceNo: selectedCollectItem.invoiceNo,
      studentName: selectedCollectItem.studentName,
      className: `${selectedCollectItem.className} (${selectedCollectItem.section})`,
      amountPaid: paidVal,
      paymentMode: collectMode,
      paymentDate: 'Today',
      collectedBy: 'Arthur Pendelton',
      status: 'Verified',
    };
    setReceipts([newRcp, ...receipts]);

    setShowCollectModal(false);
    Alert.alert('Receipt Issued', `Payment of $${paidVal} recorded for ${selectedCollectItem.studentName}.`);
  };

  const handleCreateNewItem = () => {
    if (!formField1.trim()) {
      Alert.alert('Required Field', 'Please enter a name or title.');
      return;
    }

    if (activeModule === 'fees') {
      if (feesSubTab === 'structure') {
        const newStruct: FeeStructureItem = {
          id: `fs-${Date.now()}`,
          code: `FEE-2024-${Date.now().toString().slice(-3)}`,
          name: formField1,
          grade: formField2 || 'All Grades',
          feeType: formField3 || 'General Tuition',
          feeGroup: 'General Education',
          term: 'Term 1',
          amount: parseFloat(formField4) || 1200,
          frequency: 'Term-wise',
          dueDate: '30 Dec 2026',
          dueNote: 'Active cycle',
          lateFee: '$20',
          collected: '$0',
          pending: `$${formField4 || 1200}`,
          status: 'Active',
        };
        setStructures([newStruct, ...structures]);
        Alert.alert('Success', `Fee Structure "${formField1}" created.`);
      } else if (feesSubTab === 'types') {
        const newType: FeeTypeItem = {
          id: `ft-${Date.now()}`,
          name: formField1,
          code: formField2 || `FT-${Date.now().toString().slice(-2)}`,
          feeGroup: formField3 || 'General Fees',
          frequency: 'Term',
          description: formField4 || 'Standard academic fee category.',
          amount: parseFloat(formField5) || 500,
          status: 'Active',
        };
        setFeeTypes([newType, ...feeTypes]);
        Alert.alert('Success', `Fee Type "${formField1}" registered.`);
      } else if (feesSubTab === 'groups') {
        const newGroup: FeeGroupItem = {
          id: `fg-${Date.now()}`,
          name: formField1,
          code: `GRP-${Date.now().toString().slice(-3)}`,
          description: formField2 || 'Consolidated academic cohort fee bundle.',
          feeTypesCount: 3,
          totalAnnualAmount: parseFloat(formField3) || 3500,
          status: 'Active',
        };
        setFeeGroups([newGroup, ...feeGroups]);
        Alert.alert('Success', `Fee Group "${formField1}" created.`);
      } else if (feesSubTab === 'fines') {
        const newFine: FineRuleItem = {
          id: `fn-${Date.now()}`,
          fineId: `FIN-2024-${Date.now().toString().slice(-3)}`,
          studentName: formField1,
          admissionNo: formField2 || 'AD202499',
          rollNo: '50',
          className: formField3 || 'Grade X',
          section: 'A',
          category: formField4 || 'Late Submission',
          amount: parseFloat(formField5) || 20,
          dueDate: 'Next Week',
          status: 'Unpaid',
          guardian: 'Parent Contact',
          contact: '+1 4587 200',
        };
        setFines([newFine, ...fines]);
        Alert.alert('Success', `Fine logged for ${formField1}.`);
      } else if (feesSubTab === 'scholarships') {
        const newSch: ScholarshipItem = {
          id: `sc-${Date.now()}`,
          scholarshipId: `SCH-2024-${Date.now().toString().slice(-2)}`,
          studentName: formField1,
          admissionNo: formField2 || 'AD202488',
          className: formField3 || 'Grade X',
          name: formField4 || 'Merit Scholarship',
          type: 'Academic Merit',
          coverage: formField5 || '50% Concession',
          amount: 600,
          academicYear: '2024/2025',
          status: 'Approved',
          sponsor: 'Karkkai Trust',
        };
        setScholarships([newSch, ...scholarships]);
        Alert.alert('Success', `Scholarship award registered for ${formField1}.`);
      }
    } else {
      if (accountsSubTab === 'expenses') {
        const newExp: ExpenseItem = {
          id: `exp-${Date.now()}`,
          voucherNo: `VCH-2026-${Math.floor(310 + Math.random() * 90)}`,
          title: formField1,
          category: formField2 || 'Utilities',
          amount: parseFloat(formField3) || 500,
          date: 'Today',
          paidTo: formField4 || 'Vendor Services',
          paymentMethod: 'Bank Transfer',
          status: 'Pending',
          description: formField5 || 'Institutional campus expenditure voucher.',
        };
        setExpenses([newExp, ...expenses]);
        Alert.alert('Success', `Expense voucher "${formField1}" recorded.`);
      } else {
        const newCat: ExpenseCategoryItem = {
          id: `cat-${Date.now()}`,
          name: formField1,
          code: formField2 || 'CAT-NEW',
          parent: 'Administration',
          description: formField3 || 'Departmental operating expenses.',
          budget: parseFloat(formField4) || 5000,
          spent: 0,
          count: 0,
          status: 'Active',
        };
        setCategories([newCat, ...categories]);
        Alert.alert('Success', `Expense category "${formField1}" added.`);
      }
    }

    resetForms();
    setShowAddModal(false);
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Top Main Module Selector */}
      <View className="bg-white border-b border-slate-200">
        <View className="flex-row items-center px-4 pt-3 pb-2 gap-x-2">
          {[
            {
              id: 'fees',
              title: 'Fees Management (Pages 32–34)',
              icon: 'credit-card',
              badge: collections.length + structures.length + receipts.length,
            },
            {
              id: 'accounts',
              title: 'Accounts & Expenses (Pages 34–35)',
              icon: 'pie-chart',
              badge: expenses.length + categories.length,
            },
          ].map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <Pressable
                key={mod.id}
                onPress={() => {
                  setActiveModule(mod.id as MainFinanceModule);
                  setSearchQuery('');
                  setStatusFilter('All');
                }}
                className={`flex-1 flex-row items-center justify-center rounded-xl py-2 px-2 ${
                  isActive ? 'bg-[#3D5EE1]' : 'bg-slate-50 border border-slate-200/80'
                }`}
              >
                <Feather
                  name={mod.icon as any}
                  size={14}
                  color={isActive ? '#ffffff' : '#64748b'}
                />
                <Text
                  numberOfLines={1}
                  className={`ml-1.5 text-xs font-bold ${
                    isActive ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {mod.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Secondary Sub-Tabs */}
        <View className="px-3 pb-2.5 pt-1 border-t border-slate-100 flex-row items-center justify-between">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {activeModule === 'fees' && (
              <View className="flex-row gap-x-2">
                {[
                  { id: 'collect', label: 'Fee Collection (P33)', count: collections.length },
                  { id: 'structure', label: 'Fee Structure (P32)', count: structures.length },
                  { id: 'assign', label: 'Fees Assign (P32)', count: assignments.length },
                  { id: 'receipts', label: 'Receipts (P34)', count: receipts.length },
                  { id: 'due_reports', label: 'Due Reports (P34)', count: dueReports.length },
                  { id: 'types', label: 'Fee Types (P33)', count: feeTypes.length },
                  { id: 'groups', label: 'Fee Groups (P33)', count: feeGroups.length },
                  { id: 'fines', label: 'Fine Mgmt (P33)', count: fines.length },
                  { id: 'scholarships', label: 'Scholarships (P34)', count: scholarships.length },
                ].map((st) => (
                  <Pressable
                    key={st.id}
                    onPress={() => {
                      setFeesSubTab(st.id as FeesSubTab);
                      setStatusFilter('All');
                    }}
                    className={`rounded-lg px-3 py-1.5 ${
                      feesSubTab === st.id
                        ? 'bg-blue-50 border border-[#3D5EE1]'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        feesSubTab === st.id ? 'text-[#3D5EE1]' : 'text-slate-600'
                      }`}
                    >
                      {st.label} ({st.count})
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {activeModule === 'accounts' && (
              <View className="flex-row gap-x-2">
                {[
                  { id: 'expenses', label: 'Expense Vouchers (Page 34)', count: expenses.length },
                  { id: 'categories', label: 'Expense Categories (Page 35)', count: categories.length },
                ].map((st) => (
                  <Pressable
                    key={st.id}
                    onPress={() => {
                      setAccountsSubTab(st.id as AccountsSubTab);
                      setStatusFilter('All');
                    }}
                    className={`rounded-lg px-3 py-1.5 ${
                      accountsSubTab === st.id
                        ? 'bg-blue-50 border border-[#3D5EE1]'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        accountsSubTab === st.id ? 'text-[#3D5EE1]' : 'text-slate-600'
                      }`}
                    >
                      {st.label} ({st.count})
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Quick Create Action */}
          <Pressable
            onPress={() => {
              resetForms();
              setShowAddModal(true);
            }}
            className="ml-2 flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-1.5 shadow-sm shadow-[#3D5EE1]/30"
          >
            <Feather name="plus" size={14} color="#ffffff" />
            <Text className="ml-1 text-xs font-bold text-white">Add</Text>
          </Pressable>
        </View>

        {/* Search Bar & Saved View Pills */}
        <View className="px-3 pb-3">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search in ${activeModule === 'fees' ? feesSubTab : accountsSubTab}…`}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
            {[
              'All',
              'Active',
              'Paid',
              'Partially Paid',
              'Pending',
              'Overdue',
              'Critical',
              'Approved',
            ].map((flt) => (
              <Pressable
                key={flt}
                onPress={() => setStatusFilter(flt)}
                className={`mr-1.5 rounded-full px-2.5 py-1 ${
                  statusFilter === flt
                    ? 'bg-slate-900'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    statusFilter === flt ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {flt}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-16"
      >
        {/* ================================================================= */}
        {/* 1. FEE STRUCTURE (Page 35, §10.1.1) */}
        {/* ================================================================= */}
        {activeModule === 'fees' && feesSubTab === 'structure' && (
          <View className="gap-y-3">
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Active Schemes</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{structures.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Billed</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">$287.9K</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Collected</Text>
                <Text className="text-lg font-bold text-[#3D5EE1] mt-0.5">86%</Text>
              </View>
            </View>

            {filteredStructures.map((fs) => (
              <View
                key={fs.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{fs.code}</Text>
                      <View className="rounded-md bg-slate-100 px-1.5 py-0.5">
                        <Text className="text-[10px] font-semibold text-slate-600">{fs.grade}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900">{fs.name || fs.feeType}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      Group: <Text className="font-semibold text-slate-700">{fs.feeGroup}</Text>
                    </Text>
                  </View>
                  <StatusBadge status={fs.status} />
                </View>

                {/* Amount & Cadence Metrics */}
                <View className="mt-3 rounded-xl bg-slate-50 p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Base Fee Amount</Text>
                    <Text className="text-base font-bold text-slate-900">${fs.amount}</Text>
                  </View>
                  <View className="flex-row items-center justify-between mt-1 text-xs">
                    <Text className="text-xs text-slate-500">Due Schedule</Text>
                    <Text className="text-xs font-semibold text-slate-800">
                      {fs.dueDate} ({fs.dueNote || fs.frequency})
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between mt-1 text-xs">
                    <Text className="text-xs text-slate-500">Late Fine Rule</Text>
                    <Text className="text-xs font-semibold text-rose-600">{fs.lateFee || '$25'}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">
                    Collected: {fs.collected || '$45K'} · Pending: {fs.pending || '$10K'}
                  </Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        'Fee Structure Details',
                        `Grade: ${fs.grade}\nFee: ${fs.name}\nAmount: $${fs.amount}\nDue: ${fs.dueDate}`
                      )
                    }
                    className="rounded-lg bg-blue-50 px-2.5 py-1 border border-blue-200"
                  >
                    <Text className="text-[11px] font-bold text-[#3D5EE1]">Details</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 2. FEES ASSIGN (Page 36, §10.1.2) */}
        {/* ================================================================= */}
        {activeModule === 'fees' && feesSubTab === 'assign' && (
          <View className="gap-y-3">
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Assigned</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{assignments.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Paid In Full</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  {assignments.filter((a) => a.status === 'Paid').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Overdue / Pend</Text>
                <Text className="text-lg font-bold text-rose-600 mt-0.5">
                  {assignments.filter((a) => a.status === 'Overdue' || a.status === 'Pending').length}
                </Text>
              </View>
            </View>

            {filteredAssignments.map((asg) => (
              <View
                key={asg.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{asg.admissionNo}</Text>
                      <View className="rounded-md bg-slate-100 px-1.5 py-0.5">
                        <Text className="text-[10px] font-semibold text-slate-600">
                          {asg.className} - {asg.section}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{asg.studentName}</Text>
                    <Text className="text-xs text-slate-500">{asg.feeGroup} · {asg.feeType}</Text>
                  </View>
                  <StatusBadge status={asg.status} />
                </View>

                {/* Ledger metrics */}
                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View>
                    <Text className="text-[11px] text-slate-500">Gross Total</Text>
                    <Text className="text-xs font-bold text-slate-800">${asg.total}</Text>
                  </View>
                  <View>
                    <Text className="text-[11px] text-slate-500">Discount</Text>
                    <Text className="text-xs font-semibold text-emerald-600">-${asg.discount}</Text>
                  </View>
                  <View>
                    <Text className="text-[11px] text-slate-500">Paid Amount</Text>
                    <Text className="text-xs font-bold text-blue-700">${asg.paid}</Text>
                  </View>
                  <View>
                    <Text className="text-[11px] text-slate-500">Net Due</Text>
                    <Text className="text-sm font-black text-rose-600">${asg.balance}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">Due: {asg.dueDate}</Text>
                  {asg.balance > 0 ? (
                    <Pressable
                      onPress={() => {
                        // find matching collection or trigger collect
                        setCollections((prev) =>
                          prev.map((c) =>
                            c.admissionNo === asg.admissionNo
                              ? { ...c, paid: c.total - c.discount, balance: 0, status: 'Paid' }
                              : c
                          )
                        );
                        setAssignments((prev) =>
                          prev.map((a) =>
                            a.id === asg.id ? { ...a, paid: a.total - a.discount, balance: 0, status: 'Paid' } : a
                          )
                        );
                        Alert.alert('Payment Recorded', `Full dues cleared for ${asg.studentName}.`);
                      }}
                      className="rounded-lg bg-emerald-600 px-3 py-1"
                    >
                      <Text className="text-[11px] font-bold text-white">Clear Balance</Text>
                    </Pressable>
                  ) : (
                    <View className="rounded-lg bg-slate-100 px-2 py-0.5">
                      <Text className="text-[10px] font-semibold text-slate-500">Fully Settled</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 3. FEE COLLECTION (Page 37, §10.1.3) */}
        {/* ================================================================= */}
        {activeModule === 'fees' && feesSubTab === 'collect' && (
          <View className="gap-y-3">
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Billed</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">
                  ${collections.reduce((sum, c) => sum + c.total, 0)}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Collected</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  ${collections.reduce((sum, c) => sum + c.paid, 0)}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Outstanding</Text>
                <Text className="text-lg font-bold text-rose-600 mt-0.5">
                  ${collections.reduce((sum, c) => sum + c.balance, 0)}
                </Text>
              </View>
            </View>

            {filteredCollections.map((col) => (
              <View
                key={col.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{col.invoiceNo}</Text>
                      <View className="rounded-md bg-slate-100 px-1.5 py-0.5">
                        <Text className="text-[10px] font-semibold text-slate-600">{col.admissionNo}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{col.studentName}</Text>
                    <Text className="text-xs text-slate-500">
                      {col.className} ({col.section}) · {col.feeType}
                    </Text>
                  </View>
                  <StatusBadge status={col.status} />
                </View>

                {/* Financial breakdown */}
                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between text-xs">
                    <Text className="text-xs text-slate-500">Total Billed</Text>
                    <Text className="text-xs font-bold text-slate-800">${col.total}</Text>
                  </View>
                  {col.fine > 0 && (
                    <View className="flex-row items-center justify-between text-xs mt-1">
                      <Text className="text-xs text-rose-500">Late Fee Fine</Text>
                      <Text className="text-xs font-bold text-rose-600">+${col.fine}</Text>
                    </View>
                  )}
                  {col.discount > 0 && (
                    <View className="flex-row items-center justify-between text-xs mt-1">
                      <Text className="text-xs text-emerald-600">Concession Discount</Text>
                      <Text className="text-xs font-bold text-emerald-600">-${col.discount}</Text>
                    </View>
                  )}
                  <View className="flex-row items-center justify-between text-xs mt-1 border-t border-slate-200/60 pt-1">
                    <Text className="text-xs font-bold text-slate-700">Net Paid: ${col.paid}</Text>
                    <Text className="text-sm font-black text-rose-600">Balance: ${col.balance}</Text>
                  </View>
                </View>

                {/* Actions & Payment Method */}
                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">
                    {col.method ? `Paid via ${col.method} on ${col.collectionDate}` : `Due by ${col.dueDate}`}
                  </Text>
                  {col.balance > 0 ? (
                    <Pressable
                      onPress={() => handleOpenCollect(col)}
                      className="flex-row items-center rounded-lg bg-[#3D5EE1] px-3 py-1.5"
                    >
                      <Feather name="dollar-sign" size={13} color="#ffffff" />
                      <Text className="ml-1 text-xs font-bold text-white">Collect Fee</Text>
                    </Pressable>
                  ) : (
                    <View className="rounded-lg bg-emerald-50 px-2.5 py-1 border border-emerald-200">
                      <Text className="text-[11px] font-bold text-emerald-700">Receipt Generated</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 4. FEE TYPES (Page 38, §10.1.4) */}
        {/* ================================================================= */}
        {activeModule === 'fees' && feesSubTab === 'types' && (
          <View className="gap-y-3">
            {filteredFeeTypes.map((ft) => (
              <View
                key={ft.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{ft.code}</Text>
                      <View className="rounded-md bg-purple-50 px-2 py-0.5 border border-purple-200">
                        <Text className="text-[10px] font-bold text-purple-700">{ft.frequency}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{ft.name}</Text>
                    <Text className="text-xs text-slate-500">Group: {ft.feeGroup}</Text>
                  </View>
                  <StatusBadge status={ft.status} />
                </View>
                <Text className="mt-2 text-xs text-slate-600 leading-relaxed italic">
                  &ldquo;{ft.description}&rdquo;
                </Text>
                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">Standard Tier Fee</Text>
                  <Text className="text-base font-black text-slate-900">${ft.amount}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 5. FEE GROUPS (Page 39, §10.1.5) */}
        {/* ================================================================= */}
        {activeModule === 'fees' && feesSubTab === 'groups' && (
          <View className="gap-y-3">
            {filteredFeeGroups.map((fg) => (
              <View
                key={fg.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{fg.code || 'GROUP'}</Text>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{fg.name}</Text>
                  </View>
                  <StatusBadge status={fg.status || 'Active'} />
                </View>
                <Text className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {fg.description}
                </Text>
                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <View className="rounded-md bg-blue-50 px-2 py-0.5 border border-blue-200">
                    <Text className="text-xs font-bold text-[#3D5EE1]">
                      {fg.feeTypesCount} Fee Types Included
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-slate-800">
                    ${fg.totalAnnualAmount} / Year
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 6. FINE MANAGEMENT (Page 40, §10.1.6) */}
        {/* ================================================================= */}
        {activeModule === 'fees' && feesSubTab === 'fines' && (
          <View className="gap-y-3">
            {filteredFines.map((fn) => (
              <View
                key={fn.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{fn.fineId}</Text>
                      <View className="rounded-md bg-rose-50 px-2 py-0.5 border border-rose-200">
                        <Text className="text-[10px] font-bold text-rose-700">{fn.category}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{fn.studentName}</Text>
                    <Text className="text-xs text-slate-500">
                      {fn.className} ({fn.section}) · Roll #{fn.rollNo}
                    </Text>
                  </View>
                  <StatusBadge status={fn.status} />
                </View>
                {fn.remarks && (
                  <View className="mt-2.5 rounded-xl bg-slate-50 p-2.5">
                    <Text className="text-xs text-slate-600 italic">&ldquo;{fn.remarks}&rdquo;</Text>
                  </View>
                )}
                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">
                    Due: {fn.dueDate} · {fn.guardian} ({fn.contact})
                  </Text>
                  <Text className="text-base font-black text-rose-600">${fn.amount}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 7. SCHOLARSHIPS (Page 41, §10.1.7) */}
        {/* ================================================================= */}
        {activeModule === 'fees' && feesSubTab === 'scholarships' && (
          <View className="gap-y-3">
            {filteredScholarships.map((sc) => (
              <View
                key={sc.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{sc.scholarshipId}</Text>
                      <View className="rounded-md bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                        <Text className="text-[10px] font-bold text-emerald-700">{sc.type}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{sc.name}</Text>
                    <Text className="text-xs text-slate-500">
                      Scholar: <Text className="font-semibold text-slate-800">{sc.studentName}</Text> ({sc.className})
                    </Text>
                  </View>
                  <StatusBadge status={sc.status} />
                </View>
                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-xs font-semibold text-slate-700">{sc.coverage}</Text>
                  <Text className="text-sm font-bold text-emerald-700">Grant: ${sc.amount}</Text>
                </View>
                {sc.notes && (
                  <Text className="mt-2 text-xs text-slate-600 italic">&ldquo;{sc.notes}&rdquo;</Text>
                )}
                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">Sponsor: {sc.sponsor}</Text>
                  <Text className="text-[11px] font-semibold text-slate-600">Year {sc.academicYear}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 8. DUE REPORTS (Page 42, §10.1.8) */}
        {/* ================================================================= */}
        {activeModule === 'fees' && feesSubTab === 'due_reports' && (
          <View className="gap-y-3">
            {filteredDueReports.map((dr) => (
              <View
                key={dr.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{dr.admissionNo}</Text>
                      <View className="rounded-md bg-rose-50 px-2 py-0.5 border border-rose-200">
                        <Text className="text-[10px] font-bold text-rose-700">
                          {dr.overdueDays > 0 ? `${dr.overdueDays} Days Overdue` : 'Due Soon'}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{dr.studentName}</Text>
                    <Text className="text-xs text-slate-500">{dr.className} ({dr.section}) · {dr.feeCategory}</Text>
                  </View>
                  <StatusBadge status={dr.status} />
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View>
                    <Text className="text-[11px] text-slate-500">Billed</Text>
                    <Text className="text-xs font-semibold text-slate-700">${dr.billed}</Text>
                  </View>
                  <View>
                    <Text className="text-[11px] text-slate-500">Paid</Text>
                    <Text className="text-xs font-semibold text-emerald-600">${dr.paid}</Text>
                  </View>
                  <View>
                    <Text className="text-[11px] text-slate-500">Outstanding Due</Text>
                    <Text className="text-base font-black text-rose-600">${dr.dueAmount}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">
                    Parent: {dr.guardianName} ({dr.guardianPhone})
                  </Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        'Send Due Notice',
                        `Automated SMS reminder dispatched to ${dr.guardianName} for $${dr.dueAmount}.`
                      )
                    }
                    className="flex-row items-center rounded-lg bg-rose-50 px-2.5 py-1 border border-rose-200"
                  >
                    <Feather name="bell" size={12} color="#e11d48" />
                    <Text className="ml-1 text-[11px] font-bold text-rose-700">Remind</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 9. RECEIPTS (Page 43, §10.1.9) */}
        {/* ================================================================= */}
        {activeModule === 'fees' && feesSubTab === 'receipts' && (
          <View className="gap-y-3">
            {filteredReceipts.map((rcp) => (
              <View
                key={rcp.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{rcp.receiptNo}</Text>
                      <View className="rounded-md bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                        <Text className="text-[10px] font-bold text-emerald-700">{rcp.paymentMode}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{rcp.studentName}</Text>
                    <Text className="text-xs text-slate-500">
                      Ref: {rcp.invoiceNo} · Class: {rcp.className || rcp.grade}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-black text-emerald-600">${rcp.amountPaid}</Text>
                    <Text className="text-[10px] font-semibold text-slate-400">Paid in Full</Text>
                  </View>
                </View>
                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">
                    Collected by {rcp.collectedBy} on {rcp.paymentDate}
                  </Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        'Official Fee Receipt',
                        `Receipt No: ${rcp.receiptNo}\nStudent: ${rcp.studentName}\nAmount: $${rcp.amountPaid}\nMode: ${rcp.paymentMode}\nDate: ${rcp.paymentDate}`
                      )
                    }
                    className="flex-row items-center rounded-lg bg-blue-50 px-2.5 py-1 border border-blue-200"
                  >
                    <Feather name="printer" size={12} color="#3D5EE1" />
                    <Text className="ml-1 text-[11px] font-bold text-[#3D5EE1]">Print PDF</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 10. EXPENSES (Page 44, §10.2.1) */}
        {/* ================================================================= */}
        {activeModule === 'accounts' && accountsSubTab === 'expenses' && (
          <View className="gap-y-3">
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Vouchers</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{expenses.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Spend</Text>
                <Text className="text-lg font-bold text-rose-600 mt-0.5">
                  ${expenses.reduce((sum, e) => sum + e.amount, 0)}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Approved</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  {expenses.filter((e) => e.status === 'Approved').length}
                </Text>
              </View>
            </View>

            {filteredExpenses.map((exp) => (
              <View
                key={exp.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{exp.voucherNo}</Text>
                      <View className="rounded-md bg-slate-100 px-1.5 py-0.5">
                        <Text className="text-[10px] font-semibold text-slate-600">{exp.category}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{exp.title}</Text>
                    <Text className="text-xs text-slate-500">Paid to: {exp.paidTo}</Text>
                  </View>
                  <StatusBadge status={exp.status} />
                </View>
                {exp.description && (
                  <Text className="mt-2 text-xs text-slate-600 leading-relaxed italic">
                    &ldquo;{exp.description}&rdquo;
                  </Text>
                )}
                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">
                    {exp.date} via {exp.paymentMethod}
                  </Text>
                  <Text className="text-base font-black text-slate-900">${exp.amount}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 11. EXPENSE CATEGORIES (Page 45, §10.2.2) */}
        {/* ================================================================= */}
        {activeModule === 'accounts' && accountsSubTab === 'categories' && (
          <View className="gap-y-3">
            {filteredCategories.map((cat) => {
              const util = Math.round((cat.spent / cat.budget) * 100);
              return (
                <View
                  key={cat.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-xs font-bold text-[#3D5EE1]">{cat.code}</Text>
                        <View className="rounded-md bg-slate-100 px-1.5 py-0.5">
                          <Text className="text-[10px] font-semibold text-slate-600">
                            {cat.parent || 'Campus'}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-base font-bold text-slate-900 mt-0.5">{cat.name}</Text>
                    </View>
                    <StatusBadge status={cat.status} />
                  </View>
                  <Text className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {cat.description}
                  </Text>

                  {/* Budget Utilization Meter */}
                  <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                    <View className="flex-row items-center justify-between text-xs mb-1">
                      <Text className="text-xs text-slate-500">Budget Spent: ${cat.spent}</Text>
                      <Text className="text-xs font-bold text-slate-800">
                        ${cat.budget} Allocated ({util}%)
                      </Text>
                    </View>
                    <View className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <View
                        className="h-full rounded-full bg-[#3D5EE1]"
                        style={{ width: `${Math.min(util, 100)}%` }}
                      />
                    </View>
                  </View>

                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                    <Text className="text-[11px] text-slate-400">Total Vouchers Logged</Text>
                    <Text className="text-xs font-bold text-indigo-700">{cat.count} Claims Filed</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ================================================================= */}
      {/* MODAL 1: COLLECT FEE PAYMENT DRAWER */}
      {/* ================================================================= */}
      <Modal
        visible={showCollectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCollectModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <View>
                <Text className="text-base font-bold text-slate-900">Fee Payment Drawer</Text>
                <Text className="text-xs text-slate-500">{selectedCollectItem?.studentName}</Text>
              </View>
              <Pressable onPress={() => setShowCollectModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View className="flex-row gap-2">
                <View className="flex-1 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-[11px] text-slate-500">Invoice</Text>
                  <Text className="text-xs font-bold text-slate-800 mt-0.5">
                    {selectedCollectItem?.invoiceNo}
                  </Text>
                </View>
                <View className="flex-1 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-[11px] text-slate-500">Total Due</Text>
                  <Text className="text-sm font-bold text-rose-600 mt-0.5">
                    ${selectedCollectItem?.balance}
                  </Text>
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Collection Amount ($)</Text>
                <TextInput
                  value={collectAmount}
                  onChangeText={setCollectAmount}
                  keyboardType="numeric"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base font-bold text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Payment Method</Text>
                <View className="flex-row gap-2">
                  {(['UPI', 'Cash', 'Card', 'Bank Transfer'] as const).map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setCollectMode(m)}
                      className={`flex-1 items-center rounded-xl py-2 ${
                        collectMode === m
                          ? 'bg-[#3D5EE1]'
                          : 'bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          collectMode === m ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowCollectModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmCollect}
                className="flex-1 items-center rounded-xl bg-emerald-600 py-3 shadow-md shadow-emerald-600/30"
              >
                <Text className="text-sm font-bold text-white">Issue Receipt</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 2: ADD ITEM (FEE STRUCTURE / EXPENSE / TYPE) */}
      {/* ================================================================= */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900 capitalize">
                New {activeModule === 'fees' ? feesSubTab.replace('_', ' ') : accountsSubTab} Record
              </Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Title / Name *</Text>
                <TextInput
                  value={formField1}
                  onChangeText={setFormField1}
                  placeholder="e.g. Science Lab Fee, Office Stationery"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Code / Category</Text>
                  <TextInput
                    value={formField2}
                    onChangeText={setFormField2}
                    placeholder="e.g. LAB-01, Utilities"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Amount ($)</Text>
                  <TextInput
                    value={formField3}
                    onChangeText={setFormField3}
                    placeholder="1000"
                    keyboardType="numeric"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Applicable / Payee / Group</Text>
                <TextInput
                  value={formField4}
                  onChangeText={setFormField4}
                  placeholder="e.g. Grade X, Oxford Press, STEM Group"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Description / Notes</Text>
                <TextInput
                  value={formField5}
                  onChangeText={setFormField5}
                  placeholder="Additional institutional remarks..."
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
            </View>

            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateNewItem}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Record</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
