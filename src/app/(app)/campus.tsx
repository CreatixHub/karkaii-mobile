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
  INITIAL_ASSETS,
  INITIAL_GATE_PASSES,
  INITIAL_ROUTES,
  INITIAL_VEHICLES,
} from '@/data/campusMock';
import type {
  AssetItem,
  GatePassItem,
  TransportRouteItem,
  VehicleItem,
} from '@/types/modules';

type CampusTab = 'routes' | 'vehicles' | 'assets' | 'gatepass';

export default function CampusScreen() {
  const [activeTab, setActiveTab] = useState<CampusTab>('routes');
  const [searchQuery, setSearchQuery] = useState('');

  // Local state for campus records
  const [routes] = useState<TransportRouteItem[]>(INITIAL_ROUTES);
  const [vehicles] = useState<VehicleItem[]>(INITIAL_VEHICLES);
  const [assets] = useState<AssetItem[]>(INITIAL_ASSETS);
  const [gatePasses, setGatePasses] = useState<GatePassItem[]>(INITIAL_GATE_PASSES);

  // Issue Gate Pass Modal
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [personType, setPersonType] = useState<GatePassItem['personType']>('Visitor');
  const [purpose, setPurpose] = useState('');
  const [hostName, setHostName] = useState('');

  const tabs = useMemo(
    () => [
      { id: 'routes', label: 'Transport Routes', badge: routes.length },
      { id: 'vehicles', label: 'Fleet Vehicles', badge: vehicles.length },
      { id: 'assets', label: 'Campus Assets', badge: assets.length },
      { id: 'gatepass', label: 'Gate Passes', badge: gatePasses.filter((g) => g.status !== 'Exited').length },
    ],
    [routes.length, vehicles.length, assets.length, gatePasses]
  );

  // Filtered queries
  const filteredRoutes = useMemo(() => {
    return routes.filter(
      (r) =>
        r.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.routeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.driverName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [routes, searchQuery]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(
      (v) =>
        v.registrationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vehicleType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vehicles, searchQuery]);

  const filteredAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assets, searchQuery]);

  const filteredGatePasses = useMemo(() => {
    return gatePasses.filter(
      (g) =>
        g.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.passNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.purpose.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [gatePasses, searchQuery]);

  // Actions
  const handleMarkPassExited = (id: string, name: string) => {
    setGatePasses(
      gatePasses.map((g) =>
        g.id === id ? { ...g, status: 'Exited', exitTime: 'Now' } : g
      )
    );
    Alert.alert('Gate Exit Recorded', `${name} has been checked out through Main Security Gate.`);
  };

  const handleIssueGatePass = () => {
    if (!visitorName.trim() || !purpose.trim()) {
      Alert.alert('Required Fields', 'Please enter visitor name and purpose.');
      return;
    }

    const newPass: GatePassItem = {
      id: `gp-${Date.now()}`,
      passNo: `GP-2026-${Math.floor(910 + Math.random() * 80)}`,
      personName: visitorName,
      personType,
      purpose,
      hostName: hostName || 'Principal Office',
      issueTime: 'Just Now',
      status: 'Active',
    };

    setGatePasses([newPass, ...gatePasses]);
    Alert.alert('Pass Issued', `Security gate pass ${newPass.passNo} generated.`);
    setVisitorName('');
    setPurpose('');
    setHostName('');
    setShowGatePassModal(false);
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Submodule Tab Bar */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId as CampusTab);
          setSearchQuery('');
        }}
      />

      {/* Action Header & Search */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2.5">
          <View>
            <Text className="text-base font-bold text-slate-900 capitalize">
              Campus Operations
            </Text>
            <Text className="text-xs text-slate-500">
              Transport logistics, vehicle fleet, campus inventory & visitor security
            </Text>
          </View>

          {activeTab === 'gatepass' && (
            <Pressable
              onPress={() => setShowGatePassModal(true)}
              className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-2 shadow-sm shadow-[#3D5EE1]/30"
            >
              <Feather name="plus" size={15} color="#ffffff" />
              <Text className="ml-1 text-xs font-bold text-white">Issue Pass</Text>
            </Pressable>
          )}
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${activeTab}…`}
        />
      </View>

      {/* Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-12"
      >
        {/* TRANSPORT ROUTES */}
        {activeTab === 'routes' && (
          <View className="gap-y-3">
            {filteredRoutes.map((rt) => (
              <View
                key={rt.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{rt.routeNumber}</Text>
                    <Text className="mt-0.5 text-base font-bold text-slate-900">
                      {rt.routeName}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      Vehicle: <Text className="font-semibold text-slate-800">{rt.assignedVehicle}</Text>
                    </Text>
                  </View>
                  <StatusBadge status={rt.status} />
                </View>

                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Start Point</Text>
                    <Text className="text-xs font-medium text-slate-800">{rt.startPoint}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Destination</Text>
                    <Text className="text-xs font-medium text-slate-800">{rt.endPoint}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Stops & Passengers</Text>
                    <Text className="text-xs font-bold text-slate-800">
                      {rt.pickupStopsCount} Stops · {rt.studentCount} Students
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <View className="flex-row items-center">
                    <Feather name="user" size={13} color="#64748b" />
                    <Text className="ml-1 text-xs text-slate-600">
                      Driver: {rt.driverName} ({rt.driverPhone})
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* FLEET VEHICLES */}
        {activeTab === 'vehicles' && (
          <View className="gap-y-3">
            {filteredVehicles.map((veh) => (
              <View
                key={veh.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">
                      {veh.registrationNo}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {veh.vehicleType} · Capacity: {veh.seatingCapacity} seats
                    </Text>
                  </View>
                  <StatusBadge status={veh.status} />
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center">
                    <View
                      className={`h-2.5 w-2.5 rounded-full mr-1.5 ${
                        veh.gpsStatus === 'Online' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                    <Text className="text-xs font-semibold text-slate-700">
                      GPS {veh.gpsStatus}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="zap" size={13} color="#64748b" />
                    <Text className="ml-1 text-xs font-semibold text-slate-700">
                      Fuel: {veh.fuelType}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-500">
                    Driver: <Text className="font-semibold text-slate-800">{veh.driver}</Text>
                  </Text>
                  <Text className="text-[11px] text-slate-400">
                    Ins. Expiry: {veh.insuranceExpiry}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* CAMPUS ASSETS */}
        {activeTab === 'assets' && (
          <View className="gap-y-3">
            {filteredAssets.map((ast) => (
              <View
                key={ast.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{ast.assetCode}</Text>
                    <Text className="mt-0.5 text-base font-bold text-slate-900">{ast.name}</Text>
                    <Text className="text-xs text-slate-500">{ast.category}</Text>
                  </View>
                  <View className="rounded-full bg-emerald-50 px-2.5 py-0.5 border border-emerald-200">
                    <Text className="text-[10px] font-bold text-emerald-700">{ast.condition}</Text>
                  </View>
                </View>

                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Location</Text>
                    <Text className="text-xs font-medium text-slate-800">{ast.location}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Custodian</Text>
                    <Text className="text-xs font-semibold text-slate-800">{ast.assignedTo}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Purchase Date</Text>
                    <Text className="text-xs text-slate-600">{ast.purchaseDate}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* GATE PASSES */}
        {activeTab === 'gatepass' && (
          <View className="gap-y-3">
            {filteredGatePasses.map((gp) => (
              <View
                key={gp.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{gp.passNo}</Text>
                    <Text className="mt-0.5 text-base font-bold text-slate-900">{gp.personName}</Text>
                    <Text className="text-xs text-slate-500">
                      Classification: <Text className="font-semibold text-slate-800">{gp.personType}</Text>
                    </Text>
                  </View>
                  <StatusBadge status={gp.status} />
                </View>

                <View className="mt-2.5 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-xs text-slate-500">Purpose of Visit / Pass</Text>
                  <Text className="mt-0.5 text-xs font-medium text-slate-800">{gp.purpose}</Text>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Host Department</Text>
                    <Text className="text-xs font-semibold text-slate-800">{gp.hostName}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Time Issued</Text>
                    <Text className="text-xs text-slate-700">{gp.issueTime}</Text>
                  </View>
                </View>

                {gp.status !== 'Exited' && (
                  <View className="mt-3 flex-row items-center justify-end border-t border-slate-100 pt-2.5">
                    <Pressable
                      onPress={() => handleMarkPassExited(gp.id, gp.personName)}
                      className="rounded-xl bg-slate-900 px-3.5 py-1.5"
                    >
                      <Text className="text-xs font-bold text-white">Record Exit</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Issue Gate Pass Modal */}
      <Modal
        visible={showGatePassModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGatePassModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">Issue Security Gate Pass</Text>
              <Pressable onPress={() => setShowGatePassModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Visitor / Person Name *</Text>
                <TextInput
                  value={visitorName}
                  onChangeText={setVisitorName}
                  placeholder="e.g. Dr. Gregory House"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Person Type</Text>
                <View className="flex-row gap-x-2">
                  {(['Visitor', 'Student', 'Staff', 'Vendor'] as GatePassItem['personType'][]).map(
                    (pt) => (
                      <Pressable
                        key={pt}
                        onPress={() => setPersonType(pt)}
                        className={`flex-1 items-center rounded-xl py-2 border ${
                          personType === pt
                            ? 'bg-[#3D5EE1] border-[#3D5EE1]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            personType === pt ? 'text-white' : 'text-slate-700'
                          }`}
                        >
                          {pt}
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Host / Meeting With</Text>
                <TextInput
                  value={hostName}
                  onChangeText={setHostName}
                  placeholder="e.g. Principal Office, IT Lab"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Purpose of Visit *</Text>
                <TextInput
                  value={purpose}
                  onChangeText={setPurpose}
                  placeholder="Official meeting, equipment delivery, etc."
                  multiline
                  numberOfLines={2}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>
            </View>

            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowGatePassModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleIssueGatePass}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Generate Pass</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
