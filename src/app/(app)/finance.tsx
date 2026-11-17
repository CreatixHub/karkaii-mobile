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
import TabNavigation from '@/components/common/TabNavigation';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import {
  INITIAL_EXPENSES,
  INITIAL_FEE_STRUCTURES,
  INITIAL_INVOICES,
} from '@/data/financeMock';
import type {
  ExpenseItem,
  FeeInvoiceItem,
  FeeStructureItem,
} from '@/types/modules';

type FinanceTab = 'invoices' | 'structures' | 'expenses';

export default function FinanceScreen() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Local state for finance items
  const [invoices, setInvoices] = useState<FeeInvoiceItem[]>(INITIAL_INVOICES);
  const [feeStructures] = useState<FeeStructureItem[]>(INITIAL_FEE_STRUCTURES);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);

  // Add Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseItem['category']>('Utilities');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePayee, setExpensePayee] = useState('');

  const tabs = useMemo(
    () => [
      { id: 'invoices', label: 'Fee Invoices', badge: invoices.length },
      { id: 'structures', label: 'Fee Structures', badge: feeStructures.length },
      { id: 'expenses', label: 'Expenses', badge: expenses.length },
    ],
    [invoices.length, feeStructures.length, expenses.length]
  );

  // Financial KPI totals
  const totalBilled = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.amount, 0),
    [invoices]
  );
  const totalCollected = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
    [invoices]
  );
  const totalPending = totalBilled - totalCollected;

  // Filtered queries
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.grade.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const filteredStructures = useMemo(() => {
    return feeStructures.filter(
      (fs) =>
        fs.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fs.feeType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [feeStructures, searchQuery]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(
      (e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.paidTo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery]);

  // Actions
  const handleMarkAsPaid = (invoice: FeeInvoiceItem) => {
    Alert.alert(
      'Collect Payment',
      `Record full payment of $${invoice.amount} for ${invoice.studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Payment',
          onPress: () => {
            setInvoices(
              invoices.map((inv) =>
                inv.id === invoice.id
                  ? { ...inv, paidAmount: inv.amount, status: 'Paid' }
                  : inv
              )
            );
            Alert.alert('Payment Recorded', `Invoice ${invoice.invoiceNo} is now marked as Paid.`);
          },
        },
      ]
    );
  };

  const handleAddExpense = () => {
    if (!expenseTitle.trim() || !expenseAmount.trim()) {
      Alert.alert('Required Fields', 'Please enter expense title and amount.');
      return;
    }

    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      voucherNo: `VCH-2026-${Math.floor(400 + Math.random() * 400)}`,
      category: expenseCategory,
      title: expenseTitle,
      amount: parseFloat(expenseAmount) || 0,
      date: '17 Nov 2026',
      paidTo: expensePayee || 'Vendor Services',
      paymentMethod: 'Bank Transfer',
      status: 'Approved',
    };

    setExpenses([newExp, ...expenses]);
    Alert.alert('Voucher Created', `Expense voucher ${newExp.voucherNo} recorded.`);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpensePayee('');
    setShowExpenseModal(false);
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Submodule Tab Bar */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId as FinanceTab);
          setSearchQuery('');
          setStatusFilter('All');
        }}
      />

      {/* Action Header & Search */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2.5">
          <View>
            <Text className="text-base font-bold text-slate-900 capitalize">
              Finance & Accounts
            </Text>
            <Text className="text-xs text-slate-500">
              Fee collection, invoicing, fee structures & operational expenses
            </Text>
          </View>

          {activeTab === 'expenses' && (
            <Pressable
              onPress={() => setShowExpenseModal(true)}
              className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-2 shadow-sm shadow-[#3D5EE1]/30"
            >
              <Feather name="plus" size={15} color="#ffffff" />
              <Text className="ml-1 text-xs font-bold text-white">Add Expense</Text>
            </Pressable>
          )}
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${activeTab} by title or number…`}
        />

        {/* Filter Pills for Invoices */}
        {activeTab === 'invoices' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5">
            {['All', 'Paid', 'Partially Paid', 'Unpaid', 'Overdue'].map((pill) => (
              <Pressable
                key={pill}
                onPress={() => setStatusFilter(pill)}
                className={`mr-2 rounded-full px-3 py-1 ${
                  statusFilter === pill
                    ? 'bg-slate-900'
                    : 'bg-slate-100 border border-slate-200'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    statusFilter === pill ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {pill}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-12"
      >
        {/* KPI OVERVIEW WIDGET */}
        <View className="mb-4 flex-row gap-x-2">
          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3">
            <Text className="text-[10px] font-medium text-slate-400">Total Invoiced</Text>
            <Text className="mt-1 text-base font-extrabold text-slate-900">
              ${(totalBilled / 1000).toFixed(1)}k
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3">
            <Text className="text-[10px] font-medium text-slate-400">Collected</Text>
            <Text className="mt-1 text-base font-extrabold text-emerald-600">
              ${(totalCollected / 1000).toFixed(1)}k
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3">
            <Text className="text-[10px] font-medium text-slate-400">Outstanding</Text>
            <Text className="mt-1 text-base font-extrabold text-amber-600">
              ${(totalPending / 1000).toFixed(1)}k
            </Text>
          </View>
        </View>

        {/* INVOICES TAB */}
        {activeTab === 'invoices' && (
          <View className="gap-y-3">
            {filteredInvoices.map((inv) => (
              <View
                key={inv.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{inv.invoiceNo}</Text>
                    <Text className="mt-0.5 text-base font-bold text-slate-900">
                      {inv.studentName}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {inv.grade} · {inv.feeType}
                    </Text>
                  </View>
                  <StatusBadge status={inv.status} />
                </View>

                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Total Billed</Text>
                    <Text className="text-xs font-bold text-slate-900">${inv.amount}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Paid Amount</Text>
                    <Text className="text-xs font-bold text-emerald-600">${inv.paidAmount}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Due Date</Text>
                    <Text className="text-xs font-medium text-slate-700">{inv.dueDate}</Text>
                  </View>
                </View>

                {inv.status !== 'Paid' && (
                  <View className="mt-3 flex-row items-center justify-end gap-x-2 border-t border-slate-100 pt-2.5">
                    <Pressable
                      onPress={() => handleMarkAsPaid(inv)}
                      className="rounded-xl bg-[#3D5EE1] px-3.5 py-1.5 shadow-sm shadow-[#3D5EE1]/30"
                    >
                      <Text className="text-xs font-bold text-white">Collect Fee</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* FEE STRUCTURES TAB */}
        {activeTab === 'structures' && (
          <View className="gap-y-3">
            {filteredStructures.map((fs) => (
              <View
                key={fs.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">{fs.grade}</Text>
                    <Text className="text-xs text-slate-500">{fs.feeType}</Text>
                  </View>
                  <View className="rounded-xl bg-indigo-50 px-2.5 py-1 border border-indigo-200">
                    <Text className="text-sm font-extrabold text-indigo-700">${fs.amount}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-500">
                    Frequency: <Text className="font-semibold text-slate-800">{fs.term}</Text>
                  </Text>
                  <Text className="text-xs text-slate-500">
                    Due: <Text className="font-semibold text-slate-800">{fs.dueDate}</Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* EXPENSES TAB */}
        {activeTab === 'expenses' && (
          <View className="gap-y-3">
            {filteredExpenses.map((exp) => (
              <View
                key={exp.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-bold text-slate-400">{exp.voucherNo}</Text>
                    <Text className="mt-0.5 text-sm font-bold text-slate-900">{exp.title}</Text>
                    <Text className="text-xs text-slate-500">
                      Paid to: <Text className="font-medium text-slate-800">{exp.paidTo}</Text>
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-extrabold text-red-600">-${exp.amount}</Text>
                    <StatusBadge status={exp.status} />
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center">
                    <Feather name="tag" size={13} color="#64748b" />
                    <Text className="ml-1.5 text-xs text-slate-600">{exp.category}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="credit-card" size={13} color="#64748b" />
                    <Text className="ml-1.5 text-xs text-slate-600">{exp.paymentMethod}</Text>
                  </View>
                  <Text className="text-[11px] text-slate-400">{exp.date}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={showExpenseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">Record Expense Voucher</Text>
              <Pressable onPress={() => setShowExpenseModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Expense Title *</Text>
                <TextInput
                  value={expenseTitle}
                  onChangeText={setExpenseTitle}
                  placeholder="e.g. Science Lab Chemical Reagents"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Category</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {(['Utilities', 'Maintenance', 'Salaries', 'Stationery', 'Transportation'] as ExpenseItem['category'][]).map(
                    (cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setExpenseCategory(cat)}
                        className={`rounded-lg px-2.5 py-1.5 border ${
                          expenseCategory === cat
                            ? 'bg-[#3D5EE1] border-[#3D5EE1]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            expenseCategory === cat ? 'text-white' : 'text-slate-700'
                          }`}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Amount ($) *</Text>
                <TextInput
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                  keyboardType="numeric"
                  placeholder="e.g. 850"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Paid To / Vendor</Text>
                <TextInput
                  value={expensePayee}
                  onChangeText={setExpensePayee}
                  placeholder="Vendor or Company Name"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>
            </View>

            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowExpenseModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddExpense}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Voucher</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
