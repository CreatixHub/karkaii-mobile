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
  INITIAL_ALLOCATIONS,
  INITIAL_ASSETS,
  INITIAL_BOOKS,
  INITIAL_CAFETERIA_MENU,
  INITIAL_DRIVERS,
  INITIAL_FLEET_TRACKING,
  INITIAL_GATE_PASSES,
  INITIAL_HOSTEL_ROOMS,
  INITIAL_MAINTENANCE,
  INITIAL_PICKUP_POINTS,
  INITIAL_ROUTES,
  INITIAL_ROUTE_SCHEDULES,
  INITIAL_STOCK,
  INITIAL_STUDENT_TRANSPORT_ASSIGNMENTS,
  INITIAL_VEHICLES,
  INITIAL_VEHICLE_ASSIGNMENTS,
} from '@/data/campusMock';
import type {
  AssetAllocationItem,
  AssetItem,
  AssetMaintenanceItem,
  CafeteriaMenuItem,
  DriverItem,
  FleetTrackingItem,
  GatePassItem,
  HostelRoomItem,
  LibraryBookItem,
  PickupPointItem,
  RouteScheduleItem,
  StockItem,
  StudentTransportAssignmentItem,
  TransportRouteItem,
  VehicleAssignmentItem,
  VehicleItem,
} from '@/types/modules';

type CampusSection = 'transport' | 'assets' | 'gatepass' | 'facilities';

type TransportTab =
  | 'routes'
  | 'pickup'
  | 'vehicles'
  | 'drivers'
  | 'assign_vehicle'
  | 'assign_students'
  | 'gps'
  | 'schedules';

type AssetTab = 'assets' | 'allocation' | 'maintenance' | 'stock';

type FacilityTab = 'library' | 'hostel' | 'cafeteria';

export default function CampusScreen() {
  const [section, setSection] = useState<CampusSection>('transport');
  const [transportTab, setTransportTab] = useState<TransportTab>('routes');
  const [assetTab, setAssetTab] = useState<AssetTab>('assets');
  const [facilityTab, setFacilityTab] = useState<FacilityTab>('library');
  const [searchQuery, setSearchQuery] = useState('');

  // Local state for 13 Primary Submodules
  const [routes, setRoutes] = useState<TransportRouteItem[]>(INITIAL_ROUTES);
  const [pickupPoints, setPickupPoints] = useState<PickupPointItem[]>(INITIAL_PICKUP_POINTS);
  const [vehicles, setVehicles] = useState<VehicleItem[]>(INITIAL_VEHICLES);
  const [drivers, setDrivers] = useState<DriverItem[]>(INITIAL_DRIVERS);
  const [vehicleAssignments, setVehicleAssignments] = useState<VehicleAssignmentItem[]>(INITIAL_VEHICLE_ASSIGNMENTS);
  const [studentAssignments, setStudentAssignments] = useState<StudentTransportAssignmentItem[]>(INITIAL_STUDENT_TRANSPORT_ASSIGNMENTS);
  const [fleet] = useState<FleetTrackingItem[]>(INITIAL_FLEET_TRACKING);
  const [selectedGpsVehicleId, setSelectedGpsVehicleId] = useState<string>(INITIAL_FLEET_TRACKING[0].id);
  const [schedules, setRouteSchedules] = useState<RouteScheduleItem[]>(INITIAL_ROUTE_SCHEDULES);

  const [assets, setAssets] = useState<AssetItem[]>(INITIAL_ASSETS);
  const [allocations, setAllocations] = useState<AssetAllocationItem[]>(INITIAL_ALLOCATIONS);
  const [maintenance, setMaintenance] = useState<AssetMaintenanceItem[]>(INITIAL_MAINTENANCE);
  const [stock, setStock] = useState<StockItem[]>(INITIAL_STOCK);

  const [gatePasses, setGatePasses] = useState<GatePassItem[]>(INITIAL_GATE_PASSES);

  // Supporting Facilities
  const [books] = useState<LibraryBookItem[]>(INITIAL_BOOKS);
  const [hostelRooms] = useState<HostelRoomItem[]>(INITIAL_HOSTEL_ROOMS);
  const [cafeteriaMenu, setCafeteriaMenu] = useState<CafeteriaMenuItem[]>(INITIAL_CAFETERIA_MENU);

  // Generic modal creation states
  const [showAddModal, setShowAddModal] = useState(false);
  const [f1, setF1] = useState('');
  const [f2, setF2] = useState('');
  const [f3, setF3] = useState('');
  const [f4, setF4] = useState('');
  const [f5, setF5] = useState('');

  // Selected GPS Vehicle
  const activeGpsVehicle = useMemo(() => {
    return fleet.find((v) => v.id === selectedGpsVehicleId) || fleet[0];
  }, [fleet, selectedGpsVehicleId]);

  // Section Tab Navigation Tabs
  const transportTabs = useMemo(
    () => [
      { id: 'routes', label: 'Routes', badge: routes.length },
      { id: 'pickup', label: 'Pickup Points', badge: pickupPoints.length },
      { id: 'vehicles', label: 'Vehicles', badge: vehicles.length },
      { id: 'drivers', label: 'Drivers', badge: drivers.length },
      { id: 'assign_vehicle', label: 'Assign Vehicle', badge: vehicleAssignments.length },
      { id: 'assign_students', label: 'Assign Students', badge: studentAssignments.length },
      { id: 'gps', label: 'GPS Tracking', badge: fleet.filter((f) => f.gps === 'Online').length },
      { id: 'schedules', label: 'Schedules', badge: schedules.length },
    ],
    [routes.length, pickupPoints.length, vehicles.length, drivers.length, vehicleAssignments.length, studentAssignments.length, fleet, schedules.length]
  );

  const assetTabs = useMemo(
    () => [
      { id: 'assets', label: 'Asset Register', badge: assets.length },
      { id: 'allocation', label: 'Allocations', badge: allocations.length },
      { id: 'maintenance', label: 'Maintenance', badge: maintenance.length },
      { id: 'stock', label: 'Stock Inventory', badge: stock.length },
    ],
    [assets.length, allocations.length, maintenance.length, stock.length]
  );

  const facilityTabs = useMemo(
    () => [
      { id: 'library', label: 'Library Books', badge: books.length },
      { id: 'hostel', label: 'Hostel Rooms', badge: hostelRooms.length },
      { id: 'cafeteria', label: 'Cafeteria Menu', badge: cafeteriaMenu.length },
    ],
    [books.length, hostelRooms.length, cafeteriaMenu.length]
  );

  // Filtered queries
  const filteredRoutes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return routes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.driver.toLowerCase().includes(q)
    );
  }, [routes, searchQuery]);

  const filteredPickups = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return pickupPoints.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.route.toLowerCase().includes(q)
    );
  }, [pickupPoints, searchQuery]);

  const filteredVehicles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.registrationNo.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.driver.toLowerCase().includes(q)
    );
  }, [vehicles, searchQuery]);

  const filteredDrivers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.licenseNo.toLowerCase().includes(q)
    );
  }, [drivers, searchQuery]);

  const filteredVehicleAssignments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return vehicleAssignments.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.vehicle.toLowerCase().includes(q) ||
        a.driver.toLowerCase().includes(q) ||
        a.routeName.toLowerCase().includes(q)
    );
  }, [vehicleAssignments, searchQuery]);

  const filteredStudentAssignments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return studentAssignments.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.routeName.toLowerCase().includes(q)
    );
  }, [studentAssignments, searchQuery]);

  const filteredSchedules = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return schedules.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.corridor.toLowerCase().includes(q)
    );
  }, [schedules, searchQuery]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.assetCode.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q)
    );
  }, [assets, searchQuery]);

  const filteredAllocations = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allocations.filter(
      (a) =>
        a.allocationCode.toLowerCase().includes(q) ||
        a.assetName.toLowerCase().includes(q) ||
        a.assigneeName.toLowerCase().includes(q)
    );
  }, [allocations, searchQuery]);

  const filteredMaintenance = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return maintenance.filter(
      (m) =>
        m.serviceCode.toLowerCase().includes(q) ||
        m.assetName.toLowerCase().includes(q) ||
        m.technician.toLowerCase().includes(q) ||
        m.vendor.toLowerCase().includes(q)
    );
  }, [maintenance, searchQuery]);

  const filteredStock = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return stock.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.itemCode.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [stock, searchQuery]);

  const filteredGatePasses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return gatePasses.filter(
      (g) =>
        g.passNo.toLowerCase().includes(q) ||
        g.holder.toLowerCase().includes(q) ||
        g.purpose.toLowerCase().includes(q) ||
        g.passType.toLowerCase().includes(q)
    );
  }, [gatePasses, searchQuery]);

  // Modals Submit Handler
  const handleCreateSubmit = () => {
    if (section === 'transport') {
      if (transportTab === 'routes') {
        const newRoute: TransportRouteItem = {
          id: `rt-${Date.now()}`,
          code: f1.toUpperCase() || `RT-0${routes.length + 1}`,
          name: f2 || 'New Express Corridor',
          distanceKm: parseFloat(f3) || 15.0,
          boardingPoint: f4 || 'Campus Main Gate',
          destination: 'Central Campus',
          vehicle: 'KA-01-XX-9999',
          vehicleType: 'School Bus (54)',
          driver: f5 || 'Standby Driver',
          driverPhone: '+91 98450 00000',
          shift: 'Morning',
          duration: '45 min',
          pickup: '06:45 AM',
          drop: '07:30 AM',
          stops: 8,
          students: 35,
          fee: 650,
          status: 'Active',
        };
        setRoutes([newRoute, ...routes]);
        Alert.alert('Route Created', `${newRoute.code} - ${newRoute.name} registered.`);
      } else if (transportTab === 'pickup') {
        const newPP: PickupPointItem = {
          id: `pp-${Date.now()}`,
          code: f1.toUpperCase() || `PP-0${pickupPoints.length + 1}`,
          name: f2 || 'New Pickup Stop',
          route: 'RT-N01 · North Campus Express',
          area: f3 || 'Central City',
          zone: 'Main Zone',
          address: f4 || 'Main Cross Junction',
          landmark: 'Circle Landmark',
          boarding: '07:00 AM',
          drop: '04:15 PM',
          distance: 12.0,
          vehicle: 'KA-01-AB-1234',
          driver: 'Rajesh Kumar',
          driverPhone: '+91 98450 12345',
          students: 10,
          fee: parseFloat(f5) || 600,
          status: 'Active',
        };
        setPickupPoints([newPP, ...pickupPoints]);
        Alert.alert('Pickup Point Added', `${newPP.code} - ${newPP.name} is now active.`);
      } else if (transportTab === 'vehicles') {
        const newV: VehicleItem = {
          id: `veh-${Date.now()}`,
          number: f1.toUpperCase() || 'KA-01-NEW-1111',
          registrationNo: f1.toUpperCase() || 'KA-01-NEW-1111',
          model: f2 || 'School Bus Pro 54S',
          type: 'School Bus',
          vehicleType: 'School Bus',
          route: 'Unassigned',
          driver: f3 || 'Unassigned',
          fuel: 'Diesel',
          seats: parseInt(f4, 10) || 54,
          mfgYear: 2025,
          insuranceExpiry: '31 Dec 2027',
          status: 'Active',
        };
        setVehicles([newV, ...vehicles]);
        Alert.alert('Vehicle Added', `${newV.registrationNo} registered to fleet.`);
      } else if (transportTab === 'drivers') {
        const newD: DriverItem = {
          id: `drv-${Date.now()}`,
          code: `DRV-${1000 + drivers.length + 1}`,
          name: f1 || 'Driver Name',
          phone: f2 || '+91 98450 00000',
          email: `${(f1 || 'driver').toLowerCase().replace(' ', '.')}@karkaii-campus.org`,
          licenseNo: f3.toUpperCase() || 'DL-042024009988',
          licenseType: 'Heavy (HMV)',
          issued: '01 Jan 2020',
          expires: '01 Jan 2030',
          verification: 'Verified',
          vehicle: 'Unassigned',
          route: 'Standby Fleet',
          experience: parseInt(f4, 10) || 5,
          emergency: '+91 98450 99999',
          status: 'Active',
        };
        setDrivers([newD, ...drivers]);
        Alert.alert('Driver Enrolled', `${newD.code} - ${newD.name} enrolled.`);
      } else if (transportTab === 'assign_vehicle') {
        const newAsg: VehicleAssignmentItem = {
          id: `asg-${Date.now()}`,
          code: `ASG-2026-00${vehicleAssignments.length + 1}`,
          vehicle: f1 || 'KA-01-AB-1234',
          vehicleKind: 'School Bus (54)',
          vehicleModel: 'Standard Bus',
          driver: f2 || 'Rajesh Kumar',
          driverCode: 'DRV-1001',
          routeCode: f3 || 'RT-N01',
          routeName: 'North Campus Express',
          routeType: 'Morning & Evening',
          capacity: 54,
          students: 45,
          morning: '06:45 – 07:30 AM',
          evening: '03:45 – 04:30 PM',
          academicYear: '2026–2027',
          status: 'Active',
        };
        setVehicleAssignments([newAsg, ...vehicleAssignments]);
        Alert.alert('Vehicle Assigned', `${newAsg.vehicle} paired with route.`);
      } else if (transportTab === 'assign_students') {
        const newSA: StudentTransportAssignmentItem = {
          id: `sta-${Date.now()}`,
          name: f1 || 'Student Name',
          roll: 'Roll 106',
          admissionNo: f2 || 'ADM-2026-099',
          className: f3 || 'Grade X-A',
          routeCode: f4 || 'RT-N01',
          routeName: 'North Campus Express',
          vehicle: 'KA-01-AB-1234',
          driver: 'Rajesh Kumar',
          pickupPoint: 'PP-N101 · Green Valley Junction',
          dropPoint: 'PP-N101 · Green Valley Junction',
          seatNo: `Seat ${studentAssignments.length + 1}`,
          fee: '$650 / Term',
          feeNote: 'Payment recorded',
          feeState: 'Paid in full',
          academicYear: '2026–2027',
          status: 'Assigned',
        };
        setStudentAssignments([newSA, ...studentAssignments]);
        Alert.alert('Student Transport Assigned', `${newSA.name} assigned to ${newSA.routeCode}.`);
      } else if (transportTab === 'schedules') {
        const newSch: RouteScheduleItem = {
          id: `sch-${Date.now()}`,
          code: f1.toUpperCase() || `RT-0${schedules.length + 1}`,
          name: f2 || 'New Route Schedule',
          routeType: 'Morning & Evening',
          vehicle: 'KA-01-AB-1234 (54 Seater)',
          driver: 'Rajesh Kumar',
          morningTime: f3 || '06:45 AM',
          morningStop: f4 || 'Origin Junction',
          eveningTime: '03:45 PM',
          eveningStop: 'Central Campus',
          stops: 8,
          capacity: 54,
          students: 42,
          corridor: f5 || 'Main City Corridor',
          academicYear: '2026–2027',
          status: 'Active',
        };
        setRouteSchedules([newSch, ...schedules]);
        Alert.alert('Schedule Created', `${newSch.code} route schedule registered.`);
      }
    } else if (section === 'assets') {
      if (assetTab === 'assets') {
        const newAst: AssetItem = {
          id: `ast-${Date.now()}`,
          assetCode: `AST-2026-00${assets.length + 1}`,
          name: f1 || 'New Asset Item',
          model: f2 || 'Standard Model',
          units: parseInt(f3, 10) || 1,
          serial: `SN-${Date.now().toString().slice(-6)}`,
          category: 'IT Equipment',
          department: f4 || 'Science & IT',
          holderLabel: 'Campus Inventory',
          location: f5 || 'Main Block',
          spot: 'Store 1',
          purchaseDate: '01 Apr 2026',
          purchaseValue: 1200,
          condition: 'Excellent',
          status: 'Available',
        };
        setAssets([newAst, ...assets]);
        Alert.alert('Asset Registered', `${newAst.assetCode} - ${newAst.name} recorded.`);
      } else if (assetTab === 'allocation') {
        const newAlc: AssetAllocationItem = {
          id: `alc-${Date.now()}`,
          allocationCode: `ALC-2026-00${allocations.length + 1}`,
          assetId: 'ast-1',
          assetName: f1 || 'Asset Equipment',
          category: 'IT Equipment',
          assigneeName: f2 || 'Staff / Faculty',
          assigneeType: 'Staff',
          reference: f3 || 'Department Lab',
          allocatedOn: 'Today',
          returnDue: f4 || '30 Dec 2026',
          condition: 'Excellent',
          location: f5 || 'Room 101',
          status: 'Active',
        };
        setAllocations([newAlc, ...allocations]);
        Alert.alert('Allocation Complete', `${newAlc.assetName} checked out to ${newAlc.assigneeName}.`);
      } else if (assetTab === 'maintenance') {
        const newSrv: AssetMaintenanceItem = {
          id: `srv-${Date.now()}`,
          serviceCode: `SRV-2026-00${maintenance.length + 1}`,
          assetId: 'ast-1',
          assetName: f1 || 'Asset Item',
          category: 'Office Equipment',
          serviceType: 'Preventive Maintenance',
          technician: f2 || 'Certified Field Engineer',
          vendor: f3 || 'Vendor Support Hub',
          scheduledDate: f4 || 'Today',
          cost: parseFloat(f5) || 500,
          status: 'Scheduled',
          notes: 'Maintenance ticket created.',
        };
        setMaintenance([newSrv, ...maintenance]);
        Alert.alert('Maintenance Logged', `Ticket ${newSrv.serviceCode} registered.`);
      } else if (assetTab === 'stock') {
        const newStk: StockItem = {
          id: `stk-${Date.now()}`,
          itemCode: `STK-2026-00${stock.length + 1}`,
          name: f1 || 'Consumable Item',
          category: 'Stationery',
          packSize: f2 || 'Box of 10',
          unit: 'units',
          warehouse: 'Central Store',
          location: f3 || 'Rack A1',
          supplier: f4 || 'Office Depot',
          inStock: parseInt(f5, 10) || 50,
          minLevel: 20,
          unitPrice: 15.0,
          status: 'In Stock',
        };
        setStock([newStk, ...stock]);
        Alert.alert('Stock Item Added', `${newStk.itemCode} - ${newStk.name} added to inventory.`);
      }
    } else if (section === 'gatepass') {
      const newGP: GatePassItem = {
        id: `gp-${Date.now()}`,
        passNo: `GP-2026-00${gatePasses.length + 1}`,
        passType: 'Visitor Pass',
        holder: f1 || 'Visitor Name',
        personType: 'Visitor',
        contact: f2 || '+91 98450 00000',
        idProof: 'Government ID',
        idNumber: '•••• 1234',
        purpose: f3 || 'Campus Meeting',
        hostName: f4 || 'Administration Office',
        issueTime: '10:00 AM',
        expectedExitTime: f5 || '12:00 PM',
        gate: 'Gate 1 (Main Porch)',
        status: 'Active',
      };
      setGatePasses([newGP, ...gatePasses]);
      Alert.alert('Gate Pass Issued', `Pass ${newGP.passNo} generated for ${newGP.holder}.`);
    }

    setShowAddModal(false);
    setF1('');
    setF2('');
    setF3('');
    setF4('');
    setF5('');
  };

  // 1-tap Gate Pass status update
  const handleToggleGatePass = (id: string) => {
    setGatePasses((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const nextStatus = g.status === 'Active' ? 'Exited' : g.status === 'Exited' ? 'Returned' : 'Active';
          Alert.alert('Gate Pass Updated', `Pass ${g.passNo} marked as ${nextStatus}.`);
          return { ...g, status: nextStatus, exitTime: nextStatus === 'Exited' ? '12:30 PM' : g.exitTime };
        }
        return g;
      })
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Top Module Navigation Switcher */}
      <View className="bg-white border-b border-slate-200 pt-3 pb-2 px-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-xl font-bold text-slate-800">Campus Operations</Text>
            <Text className="text-xs text-slate-500">Fleet, Assets, Security & Facilities ERP</Text>
          </View>
          <Pressable
            onPress={() => {
              setF1('');
              setF2('');
              setF3('');
              setF4('');
              setF5('');
              setShowAddModal(true);
            }}
            className="flex-row items-center bg-indigo-600 px-3 py-2 rounded-lg active:bg-indigo-700"
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text className="text-xs font-semibold text-white ml-1.5">Add Record</Text>
          </Pressable>
        </View>

        {/* 4 Main Module Selector Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-2">
          <Pressable
            onPress={() => setSection('transport')}
            className={`px-3.5 py-1.5 rounded-full flex-row items-center mr-2 border ${
              section === 'transport'
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-300'
            }`}
          >
            <Feather name="truck" size={13} color={section === 'transport' ? '#fff' : '#64748b'} />
            <Text
              className={`text-xs font-semibold ml-1.5 ${
                section === 'transport' ? 'text-white' : 'text-slate-600'
              }`}
            >
              Transport (8)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSection('assets')}
            className={`px-3.5 py-1.5 rounded-full flex-row items-center mr-2 border ${
              section === 'assets'
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-300'
            }`}
          >
            <Feather name="box" size={13} color={section === 'assets' ? '#fff' : '#64748b'} />
            <Text
              className={`text-xs font-semibold ml-1.5 ${
                section === 'assets' ? 'text-white' : 'text-slate-600'
              }`}
            >
              Assets (4)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSection('gatepass')}
            className={`px-3.5 py-1.5 rounded-full flex-row items-center mr-2 border ${
              section === 'gatepass'
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-300'
            }`}
          >
            <Feather name="shield" size={13} color={section === 'gatepass' ? '#fff' : '#64748b'} />
            <Text
              className={`text-xs font-semibold ml-1.5 ${
                section === 'gatepass' ? 'text-white' : 'text-slate-600'
              }`}
            >
              Gate Pass
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSection('facilities')}
            className={`px-3.5 py-1.5 rounded-full flex-row items-center mr-2 border ${
              section === 'facilities'
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-300'
            }`}
          >
            <Feather name="home" size={13} color={section === 'facilities' ? '#fff' : '#64748b'} />
            <Text
              className={`text-xs font-semibold ml-1.5 ${
                section === 'facilities' ? 'text-white' : 'text-slate-600'
              }`}
            >
              Facilities
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Sub-Tabs Navigation for active module */}
      {section === 'transport' && (
        <TabNavigation
          tabs={transportTabs}
          activeTab={transportTab}
          onSelectTab={(tabId: string) => setTransportTab(tabId as TransportTab)}
        />
      )}

      {section === 'assets' && (
        <TabNavigation
          tabs={assetTabs}
          activeTab={assetTab}
          onSelectTab={(tabId: string) => setAssetTab(tabId as AssetTab)}
        />
      )}

      {section === 'facilities' && (
        <TabNavigation
          tabs={facilityTabs}
          activeTab={facilityTab}
          onSelectTab={(tabId: string) => setFacilityTab(tabId as FacilityTab)}
        />
      )}

      {/* Search Header for all views except GPS */}
      {!(section === 'transport' && transportTab === 'gps') && (
        <View className="px-4 py-2 bg-white border-b border-slate-200">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              section === 'transport'
                ? 'Search routes, pickup stops, vehicles, drivers...'
                : section === 'assets'
                ? 'Search assets, allocations, service tickets, stock...'
                : section === 'gatepass'
                ? 'Search pass number, visitor name, purpose...'
                : 'Search library, hostel, cafeteria...'
            }
          />
        </View>
      )}

      <ScrollView className="flex-1 px-4 py-3" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ========================================================================= */}
        {/* SECTION 1: TRANSPORT MODULE (Pages 46–53) */}
        {/* ========================================================================= */}

        {/* 1. ROUTES (Page 46, §11.1.1) */}
        {section === 'transport' && transportTab === 'routes' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Transport Routes ({filteredRoutes.length})
            </Text>
            {filteredRoutes.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mr-2">
                      <Text className="text-xs font-bold text-indigo-700">{item.code}</Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{item.name}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <View className="bg-slate-50 rounded-lg p-2.5 mb-2.5 border border-slate-100">
                  <View className="flex-row items-center justify-between text-xs mb-1">
                    <Text className="text-xs text-slate-500">Boarding Origin:</Text>
                    <Text className="text-xs font-semibold text-slate-700">{item.boardingPoint}</Text>
                  </View>
                  <View className="flex-row items-center justify-between text-xs">
                    <Text className="text-xs text-slate-500">Destination:</Text>
                    <Text className="text-xs font-semibold text-slate-700">{item.destination}</Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap justify-between pt-1 border-t border-slate-100 text-xs">
                  <View className="flex-row items-center mr-3 mb-1">
                    <Feather name="truck" size={13} color="#6366f1" />
                    <Text className="text-xs text-slate-600 ml-1">{item.vehicle}</Text>
                  </View>
                  <View className="flex-row items-center mr-3 mb-1">
                    <Feather name="user" size={13} color="#059669" />
                    <Text className="text-xs text-slate-600 ml-1">{item.driver}</Text>
                  </View>
                  <View className="flex-row items-center mr-3 mb-1">
                    <Feather name="users" size={13} color="#0284c7" />
                    <Text className="text-xs text-slate-600 ml-1">{item.students} students</Text>
                  </View>
                  <View className="flex-row items-center mb-1">
                    <Feather name="navigation" size={13} color="#d97706" />
                    <Text className="text-xs text-slate-600 ml-1">{item.distanceKm} km ({item.stops} stops)</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 2. PICKUP POINTS (Page 47, §11.1.2) */}
        {section === 'transport' && transportTab === 'pickup' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Pickup & Boarding Points ({filteredPickups.length})
            </Text>
            {filteredPickups.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <View className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mr-2">
                      <Text className="text-xs font-bold text-emerald-700">{item.code}</Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{item.name}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text className="text-xs text-indigo-600 font-medium mb-2">{item.route}</Text>

                <View className="bg-slate-50 p-2.5 rounded-lg mb-2 border border-slate-100">
                  <Text className="text-xs text-slate-700 font-medium">{item.address}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">Landmark: {item.landmark}</Text>
                </View>

                <View className="flex-row justify-between pt-1 border-t border-slate-100">
                  <View className="flex-row items-center">
                    <Feather name="clock" size={12} color="#64748b" />
                    <Text className="text-xs text-slate-600 ml-1">Board: {item.boarding} | Drop: {item.drop}</Text>
                  </View>
                  <Text className="text-xs font-bold text-slate-700">${item.fee}/mo</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 3. FLEET VEHICLES (Page 48, §11.1.3) */}
        {section === 'transport' && transportTab === 'vehicles' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Campus Fleet Vehicles ({filteredVehicles.length})
            </Text>
            {filteredVehicles.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center">
                    <View className="bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mr-2">
                      <Text className="text-xs font-bold text-blue-700">{item.registrationNo}</Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{item.model}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text className="text-xs text-slate-500 mb-2">Assigned Route: {item.route}</Text>

                <View className="flex-row flex-wrap justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                  <View className="w-1/2 mb-1">
                    <Text className="text-[10px] text-slate-400 uppercase">Driver in charge</Text>
                    <Text className="text-xs font-semibold text-slate-700">{item.driver}</Text>
                  </View>
                  <View className="w-1/2 mb-1">
                    <Text className="text-[10px] text-slate-400 uppercase">Capacity & Fuel</Text>
                    <Text className="text-xs font-semibold text-slate-700">{item.seats} Seats · {item.fuel}</Text>
                  </View>
                  <View className="w-1/2">
                    <Text className="text-[10px] text-slate-400 uppercase">Insurance Expiry</Text>
                    <Text className="text-xs text-slate-700">{item.insuranceExpiry}</Text>
                  </View>
                  <View className="w-1/2">
                    <Text className="text-[10px] text-slate-400 uppercase">Next Service Due</Text>
                    <Text className="text-xs text-slate-700">{item.nextService || '—'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 4. DRIVERS (Page 49, §11.1.4) */}
        {section === 'transport' && transportTab === 'drivers' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Staff Drivers ({filteredDrivers.length})
            </Text>
            {filteredDrivers.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <View className="bg-purple-50 px-2 py-0.5 rounded border border-purple-100 mr-2">
                      <Text className="text-xs font-bold text-purple-700">{item.code}</Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{item.name}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs text-slate-500">Licence: {item.licenseNo} ({item.licenseType})</Text>
                  <View className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                    <Text className="text-[10px] font-semibold text-emerald-700">{item.verification}</Text>
                  </View>
                </View>

                <View className="bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2">
                  <Text className="text-xs text-slate-700 font-medium">Route: {item.route}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">Vehicle: {item.vehicle} · Experience: {item.experience} yrs</Text>
                </View>

                <View className="flex-row justify-between pt-1 border-t border-slate-100 text-xs">
                  <Text className="text-xs text-slate-600 font-medium">{item.phone}</Text>
                  <Text className="text-xs text-slate-400">Emergency: {item.emergency}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 5. ASSIGN VEHICLE (Page 50, §11.1.5) */}
        {section === 'transport' && transportTab === 'assign_vehicle' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Vehicle & Route Allocations ({filteredVehicleAssignments.length})
            </Text>
            {filteredVehicleAssignments.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <View className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mr-2">
                      <Text className="text-xs font-bold text-indigo-700">{item.code}</Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{item.vehicle}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text className="text-xs font-medium text-slate-700 mb-1">
                  Route: {item.routeCode} · {item.routeName}
                </Text>

                <View className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-slate-500">Driver in charge:</Text>
                    <Text className="text-xs font-semibold text-slate-700">{item.driver} ({item.driverCode})</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-slate-500">Student Occupancy:</Text>
                    <Text className="text-xs font-semibold text-indigo-600">{item.students} / {item.capacity} seats</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Shift Timings:</Text>
                    <Text className="text-xs text-slate-700 font-medium">M: {item.morning} | E: {item.evening}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 6. ASSIGN STUDENTS (Page 51, §11.1.6) */}
        {section === 'transport' && transportTab === 'assign_students' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Student Transport Subscriptions ({filteredStudentAssignments.length})
            </Text>
            {filteredStudentAssignments.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <View className="bg-slate-100 px-2 py-0.5 rounded mr-2">
                      <Text className="text-xs font-bold text-slate-700">{item.roll}</Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{item.name}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text className="text-xs text-slate-500 mb-2">{item.admissionNo} · {item.className}</Text>

                <View className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                  <Text className="text-xs text-indigo-700 font-semibold">{item.routeCode} · {item.routeName}</Text>
                  <Text className="text-xs text-slate-600 mt-0.5">Pickup: {item.pickupPoint}</Text>
                  <Text className="text-xs text-slate-600 mt-0.5">Seat Allocation: {item.seatNo} (Bus {item.vehicle})</Text>
                </View>

                <View className="flex-row justify-between items-center pt-1 border-t border-slate-100">
                  <Text className="text-xs font-bold text-slate-800">{item.fee}</Text>
                  <View
                    className={`px-2 py-0.5 rounded ${
                      item.feeState === 'Paid in full'
                        ? 'bg-emerald-50 border border-emerald-200'
                        : item.feeState === 'Overdue'
                        ? 'bg-rose-50 border border-rose-200'
                        : 'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        item.feeState === 'Paid in full'
                          ? 'text-emerald-700'
                          : item.feeState === 'Overdue'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {item.feeState}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 7. GPS TRACKING (Page 52, §11.1.7) */}
        {section === 'transport' && transportTab === 'gps' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Live Fleet Telemetry & GPS Tracking
            </Text>

            {/* Vehicle Selector Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3">
              {fleet.map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => setSelectedGpsVehicleId(v.id)}
                  className={`mr-2 px-3 py-2 rounded-xl border flex-row items-center ${
                    v.id === activeGpsVehicle.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Feather
                    name="map-pin"
                    size={14}
                    color={v.id === activeGpsVehicle.id ? '#fff' : '#64748b'}
                  />
                  <View className="ml-1.5">
                    <Text
                      className={`text-xs font-bold ${
                        v.id === activeGpsVehicle.id ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      {v.name}
                    </Text>
                    <Text
                      className={`text-[10px] ${
                        v.id === activeGpsVehicle.id ? 'text-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      {v.state}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            {/* Live Telemetry Card */}
            <View className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="text-base font-bold text-slate-800">
                    {activeGpsVehicle.name} · {activeGpsVehicle.registration}
                  </Text>
                  <Text className="text-xs text-indigo-600 font-medium">{activeGpsVehicle.route}</Text>
                </View>
                <View
                  className={`px-2 py-0.5 rounded-full flex-row items-center ${
                    activeGpsVehicle.gps === 'Online' ? 'bg-emerald-50' : 'bg-slate-100'
                  }`}
                >
                  <View
                    className={`w-2 h-2 rounded-full mr-1 ${
                      activeGpsVehicle.gps === 'Online' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  <Text
                    className={`text-[10px] font-bold ${
                      activeGpsVehicle.gps === 'Online' ? 'text-emerald-700' : 'text-slate-600'
                    }`}
                  >
                    GPS {activeGpsVehicle.gps}
                  </Text>
                </View>
              </View>

              {/* Gauge Metrics */}
              <View className="flex-row justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                <View className="items-center flex-1">
                  <Text className="text-[10px] text-slate-400 uppercase">Speed</Text>
                  <Text className="text-base font-bold text-indigo-600">{activeGpsVehicle.speed} km/h</Text>
                </View>
                <View className="items-center flex-1 border-x border-slate-200">
                  <Text className="text-[10px] text-slate-400 uppercase">On Board</Text>
                  <Text className="text-base font-bold text-slate-800">{activeGpsVehicle.students} Students</Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-[10px] text-slate-400 uppercase">Fuel Level</Text>
                  <Text className="text-base font-bold text-emerald-600">{activeGpsVehicle.fuel}%</Text>
                </View>
              </View>

              {/* Location details */}
              <View className="mb-3">
                <View className="flex-row items-start mb-1.5">
                  <Feather name="crosshair" size={14} color="#6366f1" style={{ marginTop: 2 }} />
                  <View className="ml-2 flex-1">
                    <Text className="text-xs text-slate-500">Current Position:</Text>
                    <Text className="text-xs font-semibold text-slate-800">{activeGpsVehicle.location}</Text>
                  </View>
                </View>
                <View className="flex-row items-start">
                  <Feather name="clock" size={14} color="#059669" style={{ marginTop: 2 }} />
                  <View className="ml-2 flex-1">
                    <Text className="text-xs text-slate-500">Next Destination & ETA:</Text>
                    <Text className="text-xs font-semibold text-emerald-700">
                      {activeGpsVehicle.nextStop} ({activeGpsVehicle.nextStopEta})
                    </Text>
                  </View>
                </View>
              </View>

              {/* Upcoming Route Stops Timeline */}
              {activeGpsVehicle.upcomingStops.length > 0 && (
                <View className="pt-2 border-t border-slate-100">
                  <Text className="text-[11px] font-bold text-slate-600 uppercase mb-2">Upcoming En Route Stops</Text>
                  {activeGpsVehicle.upcomingStops.map((stop, idx) => (
                    <View key={idx} className="flex-row items-center justify-between py-1 border-b border-slate-50">
                      <View className="flex-row items-center">
                        <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                        <Text className="text-xs text-slate-700">{stop.name}</Text>
                      </View>
                      <Text className="text-xs font-semibold text-indigo-600">{stop.eta}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* 8. ROUTE SCHEDULING (Page 53, §11.1.8) */}
        {section === 'transport' && transportTab === 'schedules' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Route Schedules ({filteredSchedules.length})
            </Text>
            {filteredSchedules.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <View className="bg-amber-50 px-2 py-0.5 rounded border border-amber-100 mr-2">
                      <Text className="text-xs font-bold text-amber-700">{item.code}</Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{item.name}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text className="text-xs font-medium text-slate-500 mb-2">Corridor: {item.corridor}</Text>

                <View className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-slate-500">Morning Pickup:</Text>
                    <Text className="text-xs font-semibold text-slate-700">{item.morningTime} ({item.morningStop})</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-slate-500">Evening Drop:</Text>
                    <Text className="text-xs font-semibold text-slate-700">{item.eveningTime} ({item.eveningStop})</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Fleet Allocation:</Text>
                    <Text className="text-xs text-slate-700 font-medium">{item.vehicle}</Text>
                  </View>
                </View>

                <View className="flex-row justify-between pt-1 border-t border-slate-100 text-xs">
                  <Text className="text-xs text-slate-600">{item.stops} Stops Total</Text>
                  <Text className="text-xs font-bold text-indigo-700">{item.students} Enrolled</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: ASSETS MODULE (Pages 54–57) */}
        {/* ========================================================================= */}

        {/* 9. ASSET REGISTER (Page 54, §11.2.1) */}
        {section === 'assets' && assetTab === 'assets' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Campus Assets Register ({filteredAssets.length})
            </Text>
            {filteredAssets.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <View className="bg-teal-50 px-2 py-0.5 rounded border border-teal-100 mr-2">
                      <Text className="text-xs font-bold text-teal-700">{item.assetCode}</Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{item.name}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text className="text-xs text-slate-500 mb-2">
                  Category: {item.category} · Dept: {item.department} ({item.units} units)
                </Text>

                <View className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-slate-500">Holder / In Charge:</Text>
                    <Text className="text-xs font-semibold text-slate-700">{item.holderLabel}</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-slate-500">Location & Spot:</Text>
                    <Text className="text-xs text-slate-700 font-medium">{item.location} ({item.spot})</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Purchase Value:</Text>
                    <Text className="text-xs font-bold text-slate-800">${item.purchaseValue} ({item.purchaseDate})</Text>
                  </View>
                </View>

                <View className="flex-row justify-between pt-1 border-t border-slate-100">
                  <Text className="text-xs text-slate-500">Condition Rating:</Text>
                  <Text className="text-xs font-semibold text-emerald-700">{item.condition}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 10. ASSET ALLOCATION (Page 55, §11.2.2) */}
        {section === 'assets' && assetTab === 'allocation' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Asset Allocations & Custody ({filteredAllocations.length})
            </Text>
            {filteredAllocations.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <View className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mr-2">
                      <Text className="text-xs font-bold text-indigo-700">{item.allocationCode}</Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{item.assetName}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text className="text-xs text-slate-500 mb-2">Assignee: {item.assigneeName} ({item.assigneeType})</Text>

                <View className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-slate-500">Reference:</Text>
                    <Text className="text-xs font-medium text-slate-700">{item.reference}</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-slate-500">Location:</Text>
                    <Text className="text-xs text-slate-700">{item.location}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Checkout / Return Due:</Text>
                    <Text className="text-xs font-semibold text-indigo-600">{item.allocatedOn} → {item.returnDue}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 11. ASSET MAINTENANCE (Page 56, §11.2.3) */}
        {section === 'assets' && assetTab === 'maintenance' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Maintenance Tickets & Service Logs ({filteredMaintenance.length})
            </Text>
            {filteredMaintenance.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <View className="bg-orange-50 px-2 py-0.5 rounded border border-orange-100 mr-2">
                      <Text className="text-xs font-bold text-orange-700">{item.serviceCode}</Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{item.assetName}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text className="text-xs text-indigo-600 font-semibold mb-2">
                  Type: {item.serviceType} · Category: {item.category}
                </Text>

                <View className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                  <Text className="text-xs text-slate-700 font-medium">Technician: {item.technician}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">Vendor: {item.vendor}</Text>
                  <Text className="text-xs text-slate-600 italic mt-1">&ldquo;{item.notes}&rdquo;</Text>
                </View>

                <View className="flex-row justify-between pt-1 border-t border-slate-100">
                  <Text className="text-xs text-slate-500">Scheduled: {item.scheduledDate}</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {item.cost ? `$${item.cost}` : 'Warranty / In-house'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 12. STOCK MANAGEMENT (Page 57, §11.2.4) */}
        {section === 'assets' && assetTab === 'stock' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Campus Stock Inventory ({filteredStock.length})
            </Text>
            {filteredStock.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <View className="bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100 mr-2">
                      <Text className="text-xs font-bold text-cyan-700">{item.itemCode}</Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{item.name}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text className="text-xs text-slate-500 mb-2">
                  {item.category} · Pack: {item.packSize}
                </Text>

                <View className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-slate-500">Warehouse Location:</Text>
                    <Text className="text-xs font-medium text-slate-700">{item.warehouse} ({item.location})</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-slate-500">Supplier Vendor:</Text>
                    <Text className="text-xs text-slate-700">{item.supplier}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500">Stock Count vs Min Alert:</Text>
                    <Text className="text-xs font-bold text-slate-800">
                      {item.inStock} {item.unit} (Min: {item.minLevel})
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between pt-1 border-t border-slate-100">
                  <Text className="text-xs text-slate-500">Unit Cost:</Text>
                  <Text className="text-xs font-bold text-indigo-700">${item.unitPrice} / {item.unit}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: GATE PASS MODULE (Page 58, §11.3) */}
        {/* ========================================================================= */}
        {section === 'gatepass' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Gate Passes & Campus Security ({filteredGatePasses.length})
            </Text>
            {filteredGatePasses.map((item) => (
              <View key={item.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <View className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mr-2">
                      <Text className="text-xs font-bold text-indigo-700">{item.passNo}</Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-800">{item.holder}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs text-indigo-600 font-semibold">{item.passType} ({item.personType})</Text>
                  <Text className="text-xs text-slate-500">{item.contact}</Text>
                </View>

                <View className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2.5">
                  <Text className="text-xs text-slate-700 font-medium">Purpose: {item.purpose}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">Host / Destination: {item.hostName}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    Check-in: {item.issueTime} | Expected Exit: {item.expectedExitTime || '—'}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5">Gate: {item.gate}</Text>
                </View>

                {/* 1-tap Status Action Button */}
                <Pressable
                  onPress={() => handleToggleGatePass(item.id)}
                  className="bg-indigo-50 border border-indigo-200 py-2 rounded-lg items-center active:bg-indigo-100"
                >
                  <Text className="text-xs font-bold text-indigo-700">
                    {item.status === 'Active' ? 'Mark Exited at Gate' : item.status === 'Exited' ? 'Mark Returned' : 'Reactivate Pass'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: SUPPORTING FACILITIES (Library, Hostel, Cafeteria) */}
        {/* ========================================================================= */}
        {section === 'facilities' && facilityTab === 'library' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Library Catalog ({books.length})
            </Text>
            {books.map((b) => (
              <View key={b.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm font-bold text-slate-800 flex-1 mr-2">{b.title}</Text>
                  <StatusBadge status={b.status} />
                </View>
                <Text className="text-xs text-slate-500 mb-2">{b.author} · {b.category}</Text>
                <View className="flex-row justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <Text className="text-xs text-slate-600">Rack: {b.rackNumber}</Text>
                  <Text className="text-xs font-bold text-indigo-600">
                    {b.availableCopies} of {b.totalCopies} Available
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {section === 'facilities' && facilityTab === 'hostel' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Hostel Rooms ({hostelRooms.length})
            </Text>
            {hostelRooms.map((h) => (
              <View key={h.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm font-bold text-slate-800">{h.hostelName}</Text>
                  <StatusBadge status={h.status} />
                </View>
                <Text className="text-xs text-slate-500 mb-2">
                  Room: {h.roomNumber} ({h.floor}) · {h.roomType}
                </Text>
                <View className="flex-row justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <Text className="text-xs text-slate-600">Occupancy: {h.occupied} / {h.capacity}</Text>
                  <Text className="text-xs font-bold text-slate-800">${h.feePerTerm}/Term</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {section === 'facilities' && facilityTab === 'cafeteria' && (
          <View>
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Cafeteria Daily Menu ({cafeteriaMenu.length})
            </Text>
            {cafeteriaMenu.map((c) => (
              <View key={c.id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm font-bold text-slate-800">{c.itemName}</Text>
                  <Text className="text-sm font-bold text-emerald-600">${c.price.toFixed(2)}</Text>
                </View>
                <Text className="text-xs text-slate-500 mb-2">
                  {c.category} · {c.calories} kcal · {c.isVeg ? 'Vegetarian' : 'Non-Veg'}
                </Text>
                <Pressable
                  onPress={() => {
                    setCafeteriaMenu((prev) =>
                      prev.map((item) =>
                        item.id === c.id ? { ...item, isAvailable: !item.isAvailable } : item
                      )
                    );
                  }}
                  className={`py-1.5 rounded items-center ${
                    c.isAvailable ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-100'
                  }`}
                >
                  <Text className={`text-xs font-bold ${c.isAvailable ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {c.isAvailable ? 'In Stock / Ready to Order' : 'Sold Out'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Generic Modal for Adding Records across Submodules */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 border-t border-slate-200 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-slate-800">
                Add Record ({section.toUpperCase()} - {section === 'transport' ? transportTab : section === 'assets' ? assetTab : 'Gate Pass'})
              </Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="space-y-3">
              <View>
                <Text className="text-xs font-medium text-slate-600 mb-1">
                  {section === 'transport'
                    ? transportTab === 'routes'
                      ? 'Route Code (e.g. RT-N06)'
                      : transportTab === 'pickup'
                      ? 'Pickup Code (e.g. PP-N104)'
                      : transportTab === 'vehicles'
                      ? 'Registration Plate No'
                      : transportTab === 'drivers'
                      ? 'Driver Full Name'
                      : transportTab === 'assign_vehicle'
                      ? 'Vehicle Number'
                      : transportTab === 'assign_students'
                      ? 'Student Full Name'
                      : 'Schedule Code (e.g. RT-06)'
                    : section === 'assets'
                    ? assetTab === 'assets'
                      ? 'Asset Name'
                      : assetTab === 'allocation'
                      ? 'Asset Name to Allocate'
                      : assetTab === 'maintenance'
                      ? 'Asset Name for Service'
                      : 'Stock Item Name'
                    : 'Visitor / Pass Holder Name'}
                </Text>
                <TextInput
                  value={f1}
                  onChangeText={setF1}
                  placeholder="Enter value"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800"
                />
              </View>

              <View>
                <Text className="text-xs font-medium text-slate-600 mb-1">
                  {section === 'transport'
                    ? transportTab === 'routes'
                      ? 'Route Name'
                      : transportTab === 'pickup'
                      ? 'Pickup Stop Name'
                      : transportTab === 'vehicles'
                      ? 'Model / Make'
                      : transportTab === 'drivers'
                      ? 'Phone Number'
                      : transportTab === 'assign_vehicle'
                      ? 'Driver Name'
                      : transportTab === 'assign_students'
                      ? 'Admission No'
                      : 'Schedule Name'
                    : section === 'assets'
                    ? assetTab === 'assets'
                      ? 'Model / Spec'
                      : assetTab === 'allocation'
                      ? 'Assignee Staff / Teacher Name'
                      : assetTab === 'maintenance'
                      ? 'Technician / Engineer'
                      : 'Packaging Size (e.g. Box of 10)'
                    : 'Phone / Contact'}
                </Text>
                <TextInput
                  value={f2}
                  onChangeText={setF2}
                  placeholder="Enter details"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800"
                />
              </View>

              <View>
                <Text className="text-xs font-medium text-slate-600 mb-1">
                  {section === 'transport'
                    ? transportTab === 'routes'
                      ? 'Distance in Km'
                      : transportTab === 'pickup'
                      ? 'Area / Zone'
                      : transportTab === 'vehicles'
                      ? 'Driver Assigned'
                      : transportTab === 'drivers'
                      ? 'Driving License No'
                      : transportTab === 'assign_vehicle'
                      ? 'Route Code'
                      : transportTab === 'assign_students'
                      ? 'Class & Section (e.g. Grade X-A)'
                      : 'Morning Pickup Time (e.g. 06:45 AM)'
                    : section === 'assets'
                    ? assetTab === 'assets'
                      ? 'Units Quantity'
                      : assetTab === 'allocation'
                      ? 'Department / Role Reference'
                      : assetTab === 'maintenance'
                      ? 'Service Vendor Name'
                      : 'Warehouse Rack / Location'
                    : 'Purpose of Visit'}
                </Text>
                <TextInput
                  value={f3}
                  onChangeText={setF3}
                  placeholder="Enter information"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800"
                />
              </View>

              <View>
                <Text className="text-xs font-medium text-slate-600 mb-1">
                  {section === 'transport'
                    ? transportTab === 'routes'
                      ? 'Boarding Origin Point'
                      : transportTab === 'pickup'
                      ? 'Address'
                      : transportTab === 'vehicles'
                      ? 'Seating Capacity'
                      : transportTab === 'drivers'
                      ? 'Years of Experience'
                      : transportTab === 'assign_vehicle'
                      ? 'Shift Timings'
                      : transportTab === 'assign_students'
                      ? 'Route Code (e.g. RT-N01)'
                      : 'Origin Stop'
                    : section === 'assets'
                    ? assetTab === 'assets'
                      ? 'Department (e.g. Science & IT)'
                      : assetTab === 'allocation'
                      ? 'Return Due Date'
                      : assetTab === 'maintenance'
                      ? 'Scheduled Date'
                      : 'Supplier Name'
                    : 'Host / Approver Staff Name'}
                </Text>
                <TextInput
                  value={f4}
                  onChangeText={setF4}
                  placeholder="Enter details"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800"
                />
              </View>

              <View>
                <Text className="text-xs font-medium text-slate-600 mb-1">
                  {section === 'transport'
                    ? transportTab === 'routes'
                      ? 'Driver Name'
                    : transportTab === 'pickup'
                    ? 'Monthly Fee ($)'
                    : transportTab === 'schedules'
                    ? 'Corridor Name'
                    : 'Additional Notes'
                  : section === 'assets'
                  ? assetTab === 'assets'
                    ? 'Location / Room Spot'
                    : assetTab === 'maintenance'
                    ? 'Estimated Service Cost ($)'
                    : 'Initial Stock Quantity'
                  : 'Expected Exit Time (e.g. 12:00 PM)'}
                </Text>
                <TextInput
                  value={f5}
                  onChangeText={setF5}
                  placeholder="Enter details"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800"
                />
              </View>

              <Pressable
                onPress={handleCreateSubmit}
                className="bg-indigo-600 py-3 rounded-xl items-center mt-3 active:bg-indigo-700"
              >
                <Text className="text-sm font-bold text-white">Save & Register</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
