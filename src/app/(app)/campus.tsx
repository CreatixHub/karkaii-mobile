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
  INITIAL_BOOKS,
  INITIAL_CAFETERIA_MENU,
  INITIAL_GATE_PASSES,
  INITIAL_HOSTEL_ROOMS,
  INITIAL_ROUTES,
  INITIAL_VEHICLES,
} from '@/data/campusMock';
import type {
  AssetItem,
  CafeteriaMenuItem,
  GatePassItem,
  HostelRoomItem,
  LibraryBookItem,
  TransportRouteItem,
  VehicleItem,
} from '@/types/modules';

type CampusTab = 'routes' | 'vehicles' | 'assets' | 'gatepass' | 'library' | 'hostel' | 'cafeteria';

export default function CampusScreen() {
  const [activeTab, setActiveTab] = useState<CampusTab>('routes');
  const [searchQuery, setSearchQuery] = useState('');

  // Local state for campus records
  const [routes, setRoutes] = useState<TransportRouteItem[]>(INITIAL_ROUTES);
  const [vehicles] = useState<VehicleItem[]>(INITIAL_VEHICLES);
  const [assets, setAssets] = useState<AssetItem[]>(INITIAL_ASSETS);
  const [gatePasses, setGatePasses] = useState<GatePassItem[]>(INITIAL_GATE_PASSES);
  const [books, setBooks] = useState<LibraryBookItem[]>(INITIAL_BOOKS);
  const [hostelRooms] = useState<HostelRoomItem[]>(INITIAL_HOSTEL_ROOMS);
  const [cafeteriaMenu, setCafeteriaMenu] = useState<CafeteriaMenuItem[]>(INITIAL_CAFETERIA_MENU);

  // Generic Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formField1, setFormField1] = useState('');
  const [formField2, setFormField2] = useState('');
  const [formField3, setFormField3] = useState('');
  const [formField4, setFormField4] = useState('');

  const tabs = useMemo(
    () => [
      { id: 'routes', label: 'Transport Routes', badge: routes.length },
      { id: 'vehicles', label: 'Fleet Vehicles', badge: vehicles.length },
      { id: 'library', label: 'Library Books', badge: books.length },
      { id: 'hostel', label: 'Hostel Rooms', badge: hostelRooms.length },
      { id: 'cafeteria', label: 'Cafeteria Menu', badge: cafeteriaMenu.length },
      { id: 'assets', label: 'Campus Assets', badge: assets.length },
      { id: 'gatepass', label: 'Gate Passes', badge: gatePasses.filter((g) => g.status !== 'Exited').length },
    ],
    [routes.length, vehicles.length, books.length, hostelRooms.length, cafeteriaMenu.length, assets.length, gatePasses]
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

  const filteredBooks = useMemo(() => {
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.isbn.includes(searchQuery) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);

  const filteredHostelRooms = useMemo(() => {
    return hostelRooms.filter(
      (h) =>
        h.hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.roomType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [hostelRooms, searchQuery]);

  const filteredCafeteria = useMemo(() => {
    return cafeteriaMenu.filter(
      (c) =>
        c.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cafeteriaMenu, searchQuery]);

  // Actions
  const handleMarkPassExited = (id: string, name: string) => {
    setGatePasses(
      gatePasses.map((g) =>
        g.id === id ? { ...g, status: 'Exited', exitTime: 'Now' } : g
      )
    );
    Alert.alert('Exit Recorded', `${name} marked as exited campus premises.`);
  };

  const handleToggleBookIssue = (id: string) => {
    setBooks(
      books.map((b) => {
        if (b.id !== id) return b;
        if (b.availableCopies > 0) {
          const newAvail = b.availableCopies - 1;
          return {
            ...b,
            availableCopies: newAvail,
            status: newAvail === 0 ? 'Checked Out' : newAvail <= 3 ? 'Low Stock' : 'Available',
          };
        } else {
          return {
            ...b,
            availableCopies: b.availableCopies + 1,
            status: 'Available',
          };
        }
      })
    );
    Alert.alert('Library Inventory Updated', 'Book circulation transaction recorded.');
  };

  const handleToggleCafeteriaItem = (id: string) => {
    setCafeteriaMenu(
      cafeteriaMenu.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  const handleSaveModalItem = () => {
    if (!formField1.trim()) {
      Alert.alert('Required Field', 'Please enter a name or identifier.');
      return;
    }

    if (activeTab === 'gatepass') {
      const newGp: GatePassItem = {
        id: `gp-${Date.now()}`,
        passNo: `GP-2026-${Math.floor(100 + Math.random() * 900)}`,
        personName: formField1,
        personType: 'Visitor',
        purpose: formField2 || 'General Campus Visit',
        hostName: formField3 || 'Campus Administration',
        issueTime: 'Just now',
        status: 'Active',
      };
      setGatePasses([newGp, ...gatePasses]);
      Alert.alert('Gate Pass Issued', `Pass issued for ${formField1}.`);
    } else if (activeTab === 'library') {
      const newBook: LibraryBookItem = {
        id: `bk-${Date.now()}`,
        isbn: formField2 || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        title: formField1,
        author: formField3 || 'Unknown Author',
        category: formField4 || 'General Fiction',
        totalCopies: 5,
        availableCopies: 5,
        rackNumber: 'Rack LIB-01',
        status: 'Available',
      };
      setBooks([newBook, ...books]);
      Alert.alert('Book Added', `"${formField1}" added to school catalog.`);
    } else if (activeTab === 'assets') {
      const newAsset: AssetItem = {
        id: `ast-${Date.now()}`,
        assetCode: `AST-GEN-${Math.floor(1000 + Math.random() * 9000)}`,
        name: formField1,
        category: 'IT Equipment',
        location: formField2 || 'Main Building',
        assignedTo: formField3 || 'Facilities Team',
        purchaseDate: 'Today',
        condition: 'Excellent',
      };
      setAssets([newAsset, ...assets]);
      Alert.alert('Asset Registered', `${formField1} logged in campus assets.`);
    } else if (activeTab === 'routes') {
      const newRoute: TransportRouteItem = {
        id: `rt-${Date.now()}`,
        routeNumber: `Route ${Math.floor(104 + Math.random() * 50)}`,
        routeName: formField1,
        startPoint: formField2 || 'City Center',
        endPoint: 'Oxford Campus Main Gate',
        pickupStopsCount: 8,
        assignedVehicle: formField3 || 'Bus #09',
        driverName: 'Robert Vance',
        driverPhone: '+1 555-4011',
        studentCount: 30,
        status: 'Idle',
      };
      setRoutes([...routes, newRoute]);
      Alert.alert('Route Created', `Transport route ${formField1} configured.`);
    } else if (activeTab === 'cafeteria') {
      const newMenu: CafeteriaMenuItem = {
        id: `caf-${Date.now()}`,
        itemName: formField1,
        category: 'Snacks',
        price: parseFloat(formField2) || 4.5,
        calories: parseInt(formField3) || 250,
        isVeg: true,
        isAvailable: true,
      };
      setCafeteriaMenu([newMenu, ...cafeteriaMenu]);
      Alert.alert('Menu Item Added', `${formField1} added to today's menu.`);
    }

    setFormField1('');
    setFormField2('');
    setFormField3('');
    setFormField4('');
    setShowAddModal(false);
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Tab Navigation */}
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
            <Text className="text-base font-bold text-slate-900">
              Campus Operations
            </Text>
            <Text className="text-xs text-slate-500">
              Transport fleet, library, hostel, cafeteria & gate security
            </Text>
          </View>

          <Pressable
            onPress={() => setShowAddModal(true)}
            className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-2 shadow-sm shadow-[#3D5EE1]/30"
          >
            <Feather name="plus" size={15} color="#ffffff" />
            <Text className="ml-1 text-xs font-bold text-white">
              {activeTab === 'gatepass' ? 'Issue Pass' : 'Add Item'}
            </Text>
          </Pressable>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${activeTab}…`}
        />
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-14"
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
                    <View className="flex-row items-center gap-2 mb-1">
                      <View className="rounded-lg bg-blue-50 px-2 py-0.5 border border-blue-200">
                        <Text className="text-xs font-bold text-[#3D5EE1]">{rt.routeNumber}</Text>
                      </View>
                      <StatusBadge status={rt.status} />
                    </View>
                    <Text className="text-sm font-bold text-slate-900">{rt.routeName}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="map-pin" size={13} color="#0ca678" />
                    <Text className="ml-1 text-xs font-semibold text-slate-700">
                      {rt.pickupStopsCount} Stops
                    </Text>
                  </View>
                </View>

                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Route Waypoints</Text>
                    <Text className="text-xs font-semibold text-slate-800">
                      {rt.startPoint} → {rt.endPoint}
                    </Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Assigned Fleet</Text>
                    <Text className="text-xs font-bold text-slate-800">{rt.assignedVehicle}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <View className="flex-row items-center">
                    <Feather name="user" size={13} color="#64748b" />
                    <Text className="ml-1 text-xs text-slate-600">
                      {rt.driverName} ({rt.driverPhone})
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="users" size={13} color="#3D5EE1" />
                    <Text className="ml-1 text-xs font-bold text-[#3D5EE1]">
                      {rt.studentCount} Students
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
                    <Text className="text-base font-bold text-slate-900">{veh.registrationNo}</Text>
                    <Text className="text-xs text-slate-500">
                      {veh.vehicleType} · {veh.fuelType} Fuel
                    </Text>
                  </View>
                  <StatusBadge status={veh.status} />
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center">
                    <Feather name="user-check" size={13} color="#64748b" />
                    <Text className="ml-1.5 text-xs text-slate-700">Driver: {veh.driver}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View
                      className={`h-2 w-2 rounded-full mr-1.5 ${
                        veh.gpsStatus === 'Online' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <Text className="text-xs font-semibold text-slate-700">GPS {veh.gpsStatus}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-500">
                    Seating: <Text className="font-bold text-slate-800">{veh.seatingCapacity} Seats</Text>
                  </Text>
                  <Text className="text-[11px] text-slate-400">Ins. Expiry: {veh.insuranceExpiry}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* LIBRARY BOOKS */}
        {activeTab === 'library' && (
          <View className="gap-y-3">
            {filteredBooks.map((bk) => (
              <View
                key={bk.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-[11px] font-bold text-[#3D5EE1]">{bk.isbn}</Text>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{bk.title}</Text>
                    <Text className="text-xs text-slate-500">By {bk.author}</Text>
                  </View>
                  <StatusBadge status={bk.status} />
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center">
                    <Feather name="bookmark" size={13} color="#64748b" />
                    <Text className="ml-1.5 text-xs text-slate-700">{bk.category}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="layers" size={13} color="#64748b" />
                    <Text className="ml-1.5 text-xs font-bold text-slate-800">{bk.rackNumber}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-600">
                    Copies:{' '}
                    <Text className="font-bold text-emerald-600">{bk.availableCopies} available</Text> /{' '}
                    {bk.totalCopies} total
                  </Text>
                  <Pressable
                    onPress={() => handleToggleBookIssue(bk.id)}
                    className="rounded-lg bg-[#3D5EE1]/10 px-3 py-1.5 border border-[#3D5EE1]/20"
                  >
                    <Text className="text-xs font-bold text-[#3D5EE1]">
                      {bk.availableCopies > 0 ? 'Issue Book' : 'Return Book'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* HOSTEL ROOMS */}
        {activeTab === 'hostel' && (
          <View className="gap-y-3">
            {filteredHostelRooms.map((hr) => {
              const occupancy = Math.round((hr.occupied / hr.capacity) * 100);
              return (
                <View
                  key={hr.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-900">
                        Room {hr.roomNumber} ({hr.floor})
                      </Text>
                      <Text className="text-xs text-slate-500">{hr.hostelName}</Text>
                    </View>
                    <StatusBadge status={hr.status} />
                  </View>

                  <View className="mt-3">
                    <View className="flex-row items-center justify-between text-xs mb-1">
                      <Text className="text-xs text-slate-500">Bed Occupancy</Text>
                      <Text className="text-xs font-bold text-slate-800">
                        {hr.occupied} / {hr.capacity} ({occupancy}%)
                      </Text>
                    </View>
                    <View className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <View
                        className={`h-full rounded-full ${
                          occupancy === 100 ? 'bg-rose-500' : 'bg-[#3D5EE1]'
                        }`}
                        style={{ width: `${occupancy}%` }}
                      />
                    </View>
                  </View>

                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                    <View className="rounded-md bg-slate-100 px-2 py-0.5">
                      <Text className="text-[11px] font-semibold text-slate-700">{hr.roomType}</Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-900">
                      ${hr.feePerTerm} <Text className="text-[10px] text-slate-400 font-normal">/ Term</Text>
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* CAFETERIA MENU */}
        {activeTab === 'cafeteria' && (
          <View className="gap-y-3">
            {filteredCafeteria.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View
                        className={`rounded px-1.5 py-0.5 border ${
                          item.isVeg
                            ? 'bg-emerald-50 border-emerald-300'
                            : 'bg-rose-50 border-rose-300'
                        }`}
                      >
                        <Text
                          className={`text-[9px] font-bold ${
                            item.isVeg ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {item.isVeg ? 'VEG' : 'NON-VEG'}
                        </Text>
                      </View>
                      <View className="rounded-md bg-slate-100 px-2 py-0.5">
                        <Text className="text-[10px] font-semibold text-slate-600">{item.category}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900">{item.itemName}</Text>
                    <Text className="text-xs text-slate-400 mt-0.5">{item.calories} kCal</Text>
                  </View>
                  <Text className="text-base font-bold text-[#3D5EE1]">
                    ${item.price.toFixed(2)}
                  </Text>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <View className="flex-row items-center">
                    <View
                      className={`h-2 w-2 rounded-full mr-1.5 ${
                        item.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                    <Text className="text-xs font-semibold text-slate-700">
                      {item.isAvailable ? 'In Stock (Today)' : 'Sold Out'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleToggleCafeteriaItem(item.id)}
                    className="rounded-lg bg-slate-100 px-2.5 py-1"
                  >
                    <Text className="text-xs font-semibold text-slate-700">
                      {item.isAvailable ? 'Mark Sold Out' : 'Restock'}
                    </Text>
                  </Pressable>
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
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{ast.assetCode}</Text>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{ast.name}</Text>
                    <Text className="text-xs text-slate-500">{ast.category}</Text>
                  </View>
                  <StatusBadge status={ast.condition} />
                </View>

                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Location</Text>
                    <Text className="text-xs font-bold text-slate-800">{ast.location}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Custodian</Text>
                    <Text className="text-xs text-slate-700">{ast.assignedTo}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">Purchased: {ast.purchaseDate}</Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        'Audit Asset',
                        `Physical inspection verification logged for ${ast.assetCode}.`
                      )
                    }
                    className="rounded-lg bg-slate-100 px-2.5 py-1"
                  >
                    <Text className="text-xs font-semibold text-[#3D5EE1]">Audit Check</Text>
                  </Pressable>
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
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View className="rounded-md bg-purple-50 px-2 py-0.5 border border-purple-200">
                        <Text className="text-[10px] font-bold text-purple-700">{gp.personType}</Text>
                      </View>
                      <StatusBadge status={gp.status} />
                    </View>
                    <Text className="text-base font-bold text-slate-900">{gp.personName}</Text>
                    <Text className="text-xs text-slate-500">Pass: {gp.passNo}</Text>
                  </View>
                  <Text className="text-[11px] text-slate-400">{gp.issueTime}</Text>
                </View>

                <View className="mt-2.5 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-xs text-slate-500">Purpose</Text>
                  <Text className="text-xs font-semibold text-slate-800 mt-0.5">{gp.purpose}</Text>
                  <Text className="text-[11px] text-slate-400 mt-1">Host: {gp.hostName}</Text>
                </View>

                {gp.status !== 'Exited' && (
                  <View className="mt-3 flex-row items-center justify-end border-t border-slate-100 pt-2.5">
                    <Pressable
                      onPress={() => handleMarkPassExited(gp.id, gp.personName)}
                      className="flex-row items-center rounded-xl bg-[#DC2626] px-3 py-1.5"
                    >
                      <Feather name="log-out" size={13} color="#ffffff" />
                      <Text className="ml-1 text-xs font-bold text-white">Record Exit</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add / Issue Modal */}
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
                New {activeTab === 'gatepass' ? 'Gate Pass' : activeTab === 'library' ? 'Book' : activeTab === 'cafeteria' ? 'Menu Item' : activeTab === 'routes' ? 'Route' : 'Asset'}
              </Text>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'gatepass' ? 'Visitor / Person Name *' : activeTab === 'library' ? 'Book Title *' : activeTab === 'cafeteria' ? 'Item Name *' : 'Name / Title *'}
                </Text>
                <TextInput
                  value={formField1}
                  onChangeText={setFormField1}
                  placeholder="e.g. John Doe / Quantum Mechanics / Route 105"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'gatepass' ? 'Purpose of Visit' : activeTab === 'library' ? 'ISBN / Code' : activeTab === 'cafeteria' ? 'Price ($)' : 'Location / Stops'}
                </Text>
                <TextInput
                  value={formField2}
                  onChangeText={setFormField2}
                  placeholder="e.g. Campus Visit, 978-0131103627, 4.50"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'gatepass' ? 'Host / Department' : activeTab === 'library' ? 'Author' : activeTab === 'cafeteria' ? 'Calories (kCal)' : 'Assigned To / Vehicle'}
                </Text>
                <TextInput
                  value={formField3}
                  onChangeText={setFormField3}
                  placeholder="e.g. Principal Office, Jane Austen, Bus #04"
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
