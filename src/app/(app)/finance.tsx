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
  INITIAL_FEE_GROUPS,
  INITIAL_FEE_STRUCTURES,
  INITIAL_INVOICES,
  INITIAL_RECEIPTS,
} from '@/data/financeMock';
import type {
  ExpenseItem,
  FeeGroupItem,
  FeeInvoiceItem,
  FeeReceiptItem,
  FeeStructureItem,
} from '@/types/modules';

type FinanceTab = 'invoices' | 'collect' | 'receipts' | 'structures' | 'groups' | 'expenses';

export default function FinanceScreen() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Local state for finance items
  const [invoices, setInvoices] = useState<FeeInvoiceItem[]>(INITIAL_INVOICES);
  const [receipts, setReceipts] = useState<FeeReceiptItem[]>(INITIAL_RECEIPTS);
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>(INITIAL_FEE_STRUCTURES);
  const [feeGroups] = useState<FeeGroupItem[]>(INITIAL_FEE_GROUPS);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);

  // Collect Fee Modal State
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoiceItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<FeeReceiptItem['paymentMode']>('Cash');

  // Add Expense / Structure Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseItem['category']>('Utilities');
  const [formAmount, setFormAmount] = useState('');
  const [formPayee, setFormPayee] = useState('');

  const tabs = useMemo(
    () => [
      { id: 'invoices', label: 'Invoices', badge: invoices.length },
      { id: 'collect', label: 'Collect Fees' },
      { id: 'receipts', label: 'Receipts', badge: receipts.length },
      { id: 'structures', label: 'Structures', badge: feeStructures.length },
      { id: 'groups', label: 'Fee Groups', badge: feeGroups.length },
      { id: 'expenses', label: 'Expenses', badge: expenses.length },
    ],
    [invoices.length, receipts.length, feeStructures.length, feeGroups.length, expenses.length]
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

  const filteredReceipts = useMemo(() => {
    return receipts.filter(
      (r) =>
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [receipts, searchQuery]);

  const filteredStructures = useMemo(() => {
    return feeStructures.filter(
      (fs) =>
        fs.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fs.feeType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [feeStructures, searchQuery]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(
      (exp) =>
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.paidTo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery]);

  // Handle Collecting Fee
  const handleOpenCollectModal = (inv: FeeInvoiceItem) => {
    setSelectedInvoice(inv);
    setPaymentAmount((inv.amount - inv.paidAmount).toString());
    setShowCollectModal(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedInvoice) return;
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    const newPaidAmount = selectedInvoice.paidAmount + amountNum;
    const newStatus: FeeInvoiceItem['status'] =
      newPaidAmount >= selectedInvoice.amount ? 'Paid' : 'Partially Paid';

    // Update invoice in state
    setInvoices(
      invoices.map((inv) =>
        inv.id === selectedInvoice.id
          ? { ...inv, paidAmount: newPaidAmount, status: newStatus }
          : inv
      )
    );

    // Create new receipt
    const newReceipt: FeeReceiptItem = {
      id: `rcp-${Date.now()}`,
      receiptNo: `RCP-2026-${Math.floor(600 + Math.random() * 400)}`,
      invoiceNo: selectedInvoice.invoiceNo,
      studentName: selectedInvoice.studentName,
      grade: selectedInvoice.grade,
      amountPaid: amountNum,
      paymentMode,
      paymentDate: 'Today',
      collectedBy: 'Arthur Pendelton (Bursar)',
    };
    setReceipts([newReceipt, ...receipts]);

    Alert.alert(
      'Payment Recorded',
      `Payment of $${amountNum.toLocaleString()} for ${selectedInvoice.studentName} recorded. Receipt #${newReceipt.receiptNo} generated.`
    );
    setShowCollectModal(false);
  };

  // Add Item Modal
  const handleSaveModalItem = () => {
    if (!formTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a title or payee.');
      return;
    }

    if (activeTab === 'expenses') {
      const newExp: ExpenseItem = {
        id: `exp-${Date.now()}`,
        voucherNo: `VCH-2026-${Math.floor(310 + Math.random() * 90)}`,
        category: formCategory,
        title: formTitle,
        amount: parseFloat(formAmount) || 500,
        date: 'Today',
        paidTo: formPayee || 'Service Provider',
        paymentMethod: 'Bank Transfer',
        status: 'Approved',
      };
      setExpenses([newExp, ...expenses]);
      Alert.alert('Expense Logged', `Voucher ${newExp.voucherNo} created for $${newExp.amount}.`);
    } else {
      const newStruct: FeeStructureItem = {
        id: `fs-${Date.now()}`,
        grade: formTitle,
        feeType: formPayee || 'Tuition & Activity Fee',
        term: 'Term 1',
        amount: parseFloat(formAmount) || 1200,
        dueDate: '30 Nov 2026',
      };
      setFeeStructures([...feeStructures, newStruct]);
      Alert.alert('Structure Saved', `Fee structure created for ${formTitle}.`);
    }

    setFormTitle('');
    setFormAmount('');
    setFormPayee('');
    setShowAddModal(false);
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId as FinanceTab);
          setSearchQuery('');
        }}
      />

      {/* Action Header & Financial KPI Strip */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2.5">
          <View>
            <Text className="text-base font-bold text-slate-900">
              Finance & Accounts
            </Text>
            <Text className="text-xs text-slate-500">
              Fee collection, invoices, receipts & operational expenses
            </Text>
          </View>

          <Pressable
            onPress={() => setShowAddModal(true)}
            className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-2 shadow-sm shadow-[#3D5EE1]/30"
          >
            <Feather name="plus" size={15} color="#ffffff" />
            <Text className="ml-1 text-xs font-bold text-white">
              {activeTab === 'expenses' ? 'Add Expense' : 'New Structure'}
            </Text>
          </Pressable>
        </View>

        {/* Quick KPI Strip */}
        <View className="flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100 mb-2.5">
          <View className="items-center flex-1">
            <Text className="text-[10px] text-slate-400">Total Billed</Text>
            <Text className="text-xs font-bold text-slate-900">${totalBilled.toLocaleString()}</Text>
          </View>
          <View className="h-6 w-px bg-slate-200" />
          <View className="items-center flex-1">
            <Text className="text-[10px] text-slate-400">Collected</Text>
            <Text className="text-xs font-bold text-emerald-600">${totalCollected.toLocaleString()}</Text>
          </View>
          <View className="h-6 w-px bg-slate-200" />
          <View className="items-center flex-1">
            <Text className="text-[10px] text-slate-400">Pending</Text>
            <Text className="text-xs font-bold text-amber-600">${totalPending.toLocaleString()}</Text>
          </View>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${activeTab}…`}
        />

        {/* Status Filter for Invoices */}
        {activeTab === 'invoices' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5">
            {['All', 'Paid', 'Partially Paid', 'Unpaid', 'Overdue'].map((status) => (
              <Pressable
                key={status}
                onPress={() => setStatusFilter(status)}
                className={`mr-2 rounded-xl px-3 py-1.5 ${
                  statusFilter === status
                    ? 'bg-[#3D5EE1]'
                    : 'bg-slate-100 border border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    statusFilter === status ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {status}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-14"
      >
        {/* INVOICES TAB */}
        {activeTab === 'invoices' && (
          <View className="gap-y-3">
            {filteredInvoices.map((inv) => {
              const pending = inv.amount - inv.paidAmount;
              return (
                <View
                  key={inv.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <Text className="text-xs font-bold text-[#3D5EE1]">{inv.invoiceNo}</Text>
                        <StatusBadge status={inv.status} />
                      </View>
                      <Text className="text-base font-bold text-slate-900">{inv.studentName}</Text>
                      <Text className="text-xs text-slate-500">
                        {inv.grade} · {inv.feeType}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-base font-bold text-slate-900">
                        ${inv.amount.toLocaleString()}
                      </Text>
                      <Text className="text-[11px] text-slate-400">Due: {inv.dueDate}</Text>
                    </View>
                  </View>

                  <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                    <Text className="text-xs text-slate-600">
                      Paid: <Text className="font-bold text-emerald-600">${inv.paidAmount.toLocaleString()}</Text>
                    </Text>
                    <Text className="text-xs text-slate-600">
                      Remaining:{' '}
                      <Text
                        className={`font-bold ${
                          pending > 0 ? 'text-rose-600' : 'text-slate-400'
                        }`}
                      >
                        ${pending.toLocaleString()}
                      </Text>
                    </Text>
                  </View>

                  {pending > 0 && (
                    <View className="mt-3 flex-row items-center justify-end border-t border-slate-100 pt-2.5">
                      <Pressable
                        onPress={() => handleOpenCollectModal(inv)}
                        className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3.5 py-1.5 shadow-sm shadow-[#3D5EE1]/20"
                      >
                        <Feather name="credit-card" size={13} color="#ffffff" />
                        <Text className="ml-1.5 text-xs font-bold text-white">Collect Payment</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* COLLECT FEES ACTION TAB */}
        {activeTab === 'collect' && (
          <View className="gap-y-3">
            <View className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
              <Text className="text-sm font-bold text-indigo-900">
                Direct Counter Fee Collection
              </Text>
              <Text className="text-xs text-indigo-700 mt-0.5">
                Select an outstanding student invoice below to accept fees and instantly issue an official receipt.
              </Text>
            </View>

            {invoices
              .filter((inv) => inv.status !== 'Paid')
              .map((inv) => (
                <View
                  key={inv.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-base font-bold text-slate-900">{inv.studentName}</Text>
                      <Text className="text-xs text-slate-500">
                        {inv.grade} · {inv.invoiceNo}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-slate-400">Balance Due</Text>
                      <Text className="text-base font-bold text-rose-600">
                        ${(inv.amount - inv.paidAmount).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                    <StatusBadge status={inv.status} />
                    <Pressable
                      onPress={() => handleOpenCollectModal(inv)}
                      className="rounded-xl bg-[#3D5EE1] px-4 py-2"
                    >
                      <Text className="text-xs font-bold text-white">Accept Fee</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* RECEIPTS TAB */}
        {activeTab === 'receipts' && (
          <View className="gap-y-3">
            {filteredReceipts.map((rcp) => (
              <View
                key={rcp.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View className="rounded-md bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                        <Text className="text-[10px] font-bold text-emerald-700">{rcp.paymentMode}</Text>
                      </View>
                      <Text className="text-xs font-bold text-[#3D5EE1]">{rcp.receiptNo}</Text>
                    </View>
                    <Text className="text-base font-bold text-slate-900">{rcp.studentName}</Text>
                    <Text className="text-xs text-slate-500">
                      {rcp.grade} · Ref: {rcp.invoiceNo}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-bold text-emerald-600">
                      +${rcp.amountPaid.toLocaleString()}
                    </Text>
                    <Text className="text-[11px] text-slate-400">{rcp.paymentDate}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">Cashier: {rcp.collectedBy}</Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Download Receipt', `Downloading official voucher for ${rcp.receiptNo}`)
                    }
                    className="flex-row items-center"
                  >
                    <Feather name="download" size={13} color="#3D5EE1" />
                    <Text className="ml-1 text-xs font-bold text-[#3D5EE1]">Receipt PDF</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* FEE STRUCTURES */}
        {activeTab === 'structures' && (
          <View className="gap-y-3">
            {filteredStructures.map((fs) => (
              <View
                key={fs.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">{fs.grade}</Text>
                    <Text className="text-xs text-slate-500">{fs.feeType}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-bold text-slate-900">${fs.amount}</Text>
                    <Text className="text-[11px] text-slate-400">{fs.term}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">Payment Deadline: {fs.dueDate}</Text>
                  <View className="rounded-md bg-slate-100 px-2 py-0.5">
                    <Text className="text-[11px] font-semibold text-slate-700">Official Rate</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* FEE GROUPS */}
        {activeTab === 'groups' && (
          <View className="gap-y-3">
            {feeGroups.map((fg) => (
              <View
                key={fg.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-bold text-slate-900">{fg.name}</Text>
                    <Text className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {fg.description}
                    </Text>
                  </View>
                  <Text className="text-base font-bold text-[#3D5EE1]">
                    ${fg.totalAnnualAmount.toLocaleString()}
                  </Text>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-600">
                    Includes <Text className="font-bold">{fg.feeTypesCount} Fee Components</Text>
                  </Text>
                  <View className="rounded-md bg-blue-50 px-2 py-1 border border-blue-200">
                    <Text className="text-[10px] font-bold text-[#3D5EE1]">Active Package</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* OPERATIONAL EXPENSES */}
        {activeTab === 'expenses' && (
          <View className="gap-y-3">
            {filteredExpenses.map((exp) => (
              <View
                key={exp.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View className="rounded-md bg-slate-100 px-2 py-0.5">
                        <Text className="text-[10px] font-semibold text-slate-700">{exp.category}</Text>
                      </View>
                      <StatusBadge status={exp.status} />
                    </View>
                    <Text className="text-base font-bold text-slate-900">{exp.title}</Text>
                    <Text className="text-xs text-slate-500">Payee: {exp.paidTo}</Text>
                  </View>
                  <Text className="text-base font-bold text-slate-900">
                    -${exp.amount.toLocaleString()}
                  </Text>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">
                    {exp.date} · via {exp.paymentMethod}
                  </Text>
                  <Text className="text-xs font-mono font-bold text-slate-600">{exp.voucherNo}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Collect Fee Modal */}
      <Modal
        visible={showCollectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCollectModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">
                Collect Fee Payment
              </Text>
              <Pressable onPress={() => setShowCollectModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            {selectedInvoice && (
              <View className="mt-3 rounded-xl bg-slate-50 p-3">
                <Text className="text-xs text-slate-500">Student & Invoice</Text>
                <Text className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedInvoice.studentName} ({selectedInvoice.grade})
                </Text>
                <Text className="text-xs text-slate-600 mt-0.5">
                  Invoice: {selectedInvoice.invoiceNo} · Due: ${(selectedInvoice.amount - selectedInvoice.paidAmount).toLocaleString()}
                </Text>
              </View>
            )}

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Amount to Collect ($) *</Text>
                <TextInput
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                  placeholder="e.g. 500"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-bold"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Payment Method</Text>
                <View className="flex-row flex-wrap gap-2">
                  {(['Cash', 'Card', 'Online / UPI', 'Bank Transfer'] as const).map((mode) => (
                    <Pressable
                      key={mode}
                      onPress={() => setPaymentMode(mode)}
                      className={`rounded-xl px-3 py-2 border ${
                        paymentMode === mode
                          ? 'bg-[#3D5EE1] border-[#3D5EE1]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          paymentMode === mode ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {mode}
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
                onPress={handleConfirmPayment}
                className="flex-1 items-center rounded-xl bg-emerald-600 py-3 shadow-md shadow-emerald-600/30"
              >
                <Text className="text-sm font-bold text-white">Record & Print Receipt</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Modal for Expense or Structure */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">
                {activeTab === 'expenses' ? 'Log Campus Expense' : 'Create Fee Structure'}
              </Text>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'expenses' ? 'Expense Title *' : 'Grade / Target *'}
                </Text>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="e.g. Science Lab Reagents / Grade VIII"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              {activeTab === 'expenses' && (
                <View>
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Expense Category</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {(['Utilities', 'Maintenance', 'Salaries', 'Stationery', 'Transportation'] as const).map(
                      (cat) => (
                        <Pressable
                          key={cat}
                          onPress={() => setFormCategory(cat)}
                          className={`rounded-lg px-2.5 py-1.5 border ${
                            formCategory === cat
                              ? 'bg-[#3D5EE1] border-[#3D5EE1]'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <Text
                            className={`text-[11px] font-bold ${
                              formCategory === cat ? 'text-white' : 'text-slate-700'
                            }`}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      )
                    )}
                  </View>
                </View>
              )}

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Amount ($) *</Text>
                <TextInput
                  value={formAmount}
                  onChangeText={setFormAmount}
                  keyboardType="numeric"
                  placeholder="e.g. 1250"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'expenses' ? 'Payee / Vendor Name' : 'Fee Type Description'}
                </Text>
                <TextInput
                  value={formPayee}
                  onChangeText={setFormPayee}
                  placeholder="e.g. Oxford Scientific Supplies / Term 1 Tuition"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
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
                onPress={handleSaveModalItem}
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
