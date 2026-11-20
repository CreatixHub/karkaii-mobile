import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { repo } from '@/core/store/store';
import { useCollection } from '@/core/store/useCollection';
import { todayISO, formatTime } from '@/core/utils/date';
import type { DriverRecord, PickupPointRecord, StudentTransportRecord, TransportRouteRecord, VehicleRecord } from '@/data/seed/transport';
import { Button, Card, EmptyState, KeyValue, Pill, ProgressBar } from '@/ui/basics';
import { SwitchField } from '@/ui/Fields';
import { SegmentedTabs, SummaryStrip } from '@/ui/ListChrome';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import type { Tone } from '@/ui/tone';
import { TONES } from '@/ui/tone';
import { fleetAlerts, routeLabel, seatedOn, stopsOfRoute, tripOf, type FleetState, type TripState } from './transportLogic';

const stateTone: Record<FleetState, Tone> = { 'On Trip': 'success', Idle: 'neutral', Offline: 'danger', 'Out of Service': 'neutral' };
const alertTone = { Critical: 'danger', Warning: 'warning', Info: 'info' } as const;
const minutesNow = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
};

/** Fleet view: each bus with its trip, next stop and alerts. Positions are simulated (no GPS feed in this build). */
export function TrackingScreen({ breadcrumb }: { breadcrumb: string }) {
  const router = useRouter();
  const toast = useToast();
  const routes = useCollection<TransportRouteRecord>('transportRoutes');
  const vehicles = useCollection<VehicleRecord>('vehicles');
  const drivers = useCollection<DriverRecord>('drivers');
  const stops = useCollection<PickupPointRecord>('pickupPoints');
  const seats = useCollection<StudentTransportRecord>('studentTransport');
  const [demo, setDemo] = useState(true);
  const [now, setNow] = useState(minutesNow());
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(minutesNow()), 15000);
    return () => clearInterval(t);
  }, []);

  const fleet = useMemo(() => {
    return routes
      .filter((r) => r.status !== 'Archived' && r.vehicleId)
      .map((r) => {
        const vehicle = vehicles.find((v) => v.id === r.vehicleId);
        const trip = tripOf(r, vehicle, stops.filter((s) => s.routeId === r.id).sort((a, b) => a.order - b.order), now, demo);
        return { route: r, vehicle, driver: drivers.find((d) => d.id === r.driverId), trip };
      });
    // seats is read so counts refresh when students are assigned elsewhere
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes, vehicles, drivers, stops, seats, now, demo]);

  const trips = useMemo(() => new Map(fleet.map((f) => [f.route.id, f.trip] as [string, TripState])), [fleet]);
  const alerts = fleetAlerts(trips); // reads the live records; cheap, so no memo
  const shown = fleet.filter((f) => filter === 'all' || (filter === 'trip' ? f.trip.state === 'On Trip' : filter === 'idle' ? f.trip.state === 'Idle' : f.trip.state === 'Offline' || f.trip.state === 'Out of Service'));
  const open = fleet.find((f) => f.route.id === openId);
  const onTrip = fleet.filter((f) => f.trip.state === 'On Trip');

  const notify = (routeId: string) => {
    const f = fleet.find((x) => x.route.id === routeId);
    if (!f || f.trip.state !== 'On Trip') return;
    const list = stopsOfRoute(routeId).filter((s) => s.status === 'Active');
    const ahead = new Set((f.trip.kind === 'Morning Pickup' ? list.slice(f.trip.stopsCovered) : [...list].reverse().slice(f.trip.stopsCovered)).map((s) => s.id));
    const riders = seats.filter((a) => a.routeId === routeId && ahead.has(a.pickupPointId) && a.status === 'Assigned');
    riders.forEach((a) => repo<{ id: string }>('communications').create({ studentId: a.studentId, channel: 'SMS', subject: `${f.route.code} bus update`, summary: `${f.trip.kind === 'Morning Pickup' ? 'The morning bus' : 'The afternoon bus'} is on its way. Next stop: ${f.trip.nextStop} in about ${f.trip.etaMin} min.`, date: todayISO(), by: 'Transport Office', direction: 'Outgoing' } as never));
    toast(`${riders.length} guardian${riders.length === 1 ? '' : 's'} of upcoming stops notified (mock: nothing is sent)`, 'info');
  };

  return (
    <ScrollView className="flex-1 bg-[#f4f6fb]" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-4 pt-3">
        <Text className="mb-2 text-[11px] text-slate-400" numberOfLines={1}>{breadcrumb}</Text>
        <Card style={{ marginBottom: 12 }}>
          <SwitchField label="Demo positions" value={demo} onChange={setDemo} hint={demo ? 'Simulated: every running bus loops through a trip so you can see the screen working. There is no live GPS feed in this build.' : 'Simulated from the real morning and afternoon run times, so buses are idle outside those windows.'} />
        </Card>
      </View>

      <SummaryStrip items={[{ label: 'Vehicles tracked', value: fleet.length, tone: 'primary', icon: 'truck' }, { label: 'On trip', value: onTrip.length, tone: 'success', icon: 'navigation' }, { label: 'Idle', value: fleet.filter((f) => f.trip.state === 'Idle').length, tone: 'neutral', icon: 'pause' }, { label: 'Offline / out', value: fleet.filter((f) => f.trip.state === 'Offline' || f.trip.state === 'Out of Service').length, tone: 'danger', icon: 'wifi-off' }, { label: 'Students on board', value: onTrip.reduce((n, f) => n + seatedOn(f.route.id), 0), tone: 'info', icon: 'users' }, { label: 'Alerts', value: alerts.length, tone: alerts.length ? 'warning' : 'neutral', icon: 'alert-triangle' }]} />

      {alerts.length ? (
        <View className="mb-3 px-4">
          <Text className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#3D5EE1]">Alerts</Text>
          {alerts.slice(0, 6).map((a) => (
            <Pressable key={a.id} onPress={() => { const f = fleet.find((x) => x.vehicle?.id === a.vehicleId); if (f) setOpenId(f.route.id); }} className="mb-1.5 flex-row items-start rounded-xl border bg-white px-3 py-2" style={{ borderColor: TONES[alertTone[a.level]].border }}>
              <Feather name={a.level === 'Info' ? 'info' : 'alert-triangle'} size={14} color={TONES[alertTone[a.level]].fg} style={{ marginTop: 2 }} />
              <View className="ml-2 flex-1">
                <Text className="text-xs font-bold text-[#1b2240]">{a.title}</Text>
                <Text className="text-[11px] text-slate-500">{a.detail}</Text>
              </View>
            </Pressable>
          ))}
          {alerts.length > 6 ? <Text className="text-[11px] text-slate-400">+ {alerts.length - 6} more</Text> : null}
        </View>
      ) : null}

      <SegmentedTabs tabs={[{ key: 'all', label: 'All', count: fleet.length }, { key: 'trip', label: 'On trip', count: onTrip.length }, { key: 'idle', label: 'Idle' }, { key: 'off', label: 'Offline' }]} active={filter} onChange={setFilter} />

      <View className="gap-2 px-4">
        {shown.length === 0 ? <EmptyState icon="truck" title="No vehicles here" hint="Assign a vehicle to a route to see it on this screen." /> : null}
        {shown.map(({ route, vehicle, driver, trip }) => (
          <Pressable key={route.id} onPress={() => setOpenId(route.id)}>
            <Card>
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-extrabold text-[#1b2240]">{vehicle?.number ?? '—'}</Text>
                  <Text className="text-[11px] text-slate-500">{routeLabel(route)} · {driver?.name ?? 'No driver'}</Text>
                </View>
                <Pill label={trip.state} tone={stateTone[trip.state]} />
              </View>
              {trip.state === 'On Trip' ? (
                <>
                  <View className="mt-2"><ProgressBar value={trip.progress * 100} tone="success" /></View>
                  <Text className="mt-1.5 text-[11px] text-slate-500">{trip.kind} · stop {Math.min(trip.totalStops, trip.stopsCovered + 1)} of {trip.totalStops} · next {trip.nextStop} in {trip.etaMin} min · {trip.speedKmh} km/h{trip.delayMin ? ` · ${trip.delayMin} min late` : ''}</Text>
                </>
              ) : (
                <Text className="mt-1.5 text-[11px] text-slate-400">{trip.state === 'Offline' ? 'GPS device is not reporting.' : trip.state === 'Out of Service' ? 'Vehicle is out of service.' : 'Parked — no trip in progress.'}</Text>
              )}
              <Text className="mt-1 text-[10px] text-slate-400">{seatedOn(route.id)} students · fuel {vehicle?.fuelLevel ?? 0}%</Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <Sheet visible={!!open} title={open ? `${open.vehicle?.number} · ${open.route.code}` : ''} onClose={() => setOpenId(null)} tall>
        {open ? (
          <View>
            <View className="mb-3 flex-row flex-wrap gap-1.5">
              <Pill label={open.trip.state} tone={stateTone[open.trip.state]} />
              {open.trip.kind ? <Pill label={open.trip.kind} tone="info" /> : null}
              <Pill label={open.trip.mode === 'Demo' ? 'Demo position' : 'Per schedule'} tone="neutral" />
            </View>
            <KeyValue label="Route" value={routeLabel(open.route)} />
            <KeyValue label="Driver" value={open.driver ? `${open.driver.name} · ${open.driver.phone}` : 'None'} />
            <KeyValue label="Students" value={`${seatedOn(open.route.id)} on this route`} />
            <KeyValue label="Fuel / odometer" value={`${open.vehicle?.fuelLevel}% · ${open.vehicle?.odometerKm.toLocaleString('en-US')} km`} />
            <KeyValue label="GPS device" value={open.vehicle ? `${open.vehicle.gpsDevice} · ${open.vehicle.gpsOnline ? 'online' : 'offline'}` : undefined} />
            {open.trip.state === 'On Trip' ? <KeyValue label="Now" value={`${open.trip.speedKmh} km/h · next ${open.trip.nextStop} in ${open.trip.etaMin} min`} /> : null}
            <Text className="mb-1.5 mt-3 text-[11px] font-extrabold uppercase tracking-wide text-[#3D5EE1]">Stops</Text>
            {(() => {
              const list = stopsOfRoute(open.route.id).filter((s) => s.status === 'Active');
              const ordered = open.trip.kind === 'Afternoon Drop' ? [...list].reverse() : list;
              return ordered.map((s, i) => {
                const done = open.trip.state === 'On Trip' && i < open.trip.stopsCovered;
                const next = open.trip.state === 'On Trip' && i === open.trip.stopsCovered;
                const t = done ? TONES.success : next ? TONES.info : TONES.neutral;
                return (
                  <View key={s.id} className="flex-row">
                    <View className="mr-3 items-center">
                      <View style={{ backgroundColor: t.bg, borderColor: t.border }} className="h-5 w-5 items-center justify-center rounded-full border">
                        <Feather name={done ? 'check' : next ? 'navigation' : 'circle'} size={9} color={t.fg} />
                      </View>
                      {i < ordered.length - 1 ? <View className="my-0.5 w-px flex-1 bg-slate-200" /> : null}
                    </View>
                    <View className="flex-1 pb-2.5">
                      <Text className={`text-xs font-bold ${done ? 'text-slate-400' : 'text-[#1b2240]'}`}>{s.name}{next ? ' · next' : ''}</Text>
                      <Text className="text-[11px] text-slate-500">{formatTime(open.trip.kind === 'Afternoon Drop' ? s.drop : s.boarding)}</Text>
                    </View>
                  </View>
                );
              });
            })()}
            <View className="mt-2 gap-2.5">
              {open.driver ? <Button label="Call driver" icon="phone" variant="secondary" onPress={() => Linking.openURL(`tel:${open.driver!.phone.replace(/[^\d+]/g, '')}`).catch(() => toast('Could not open the dialler', 'error'))} /> : null}
              {open.trip.state === 'On Trip' ? <Button label="Notify guardians of upcoming stops" icon="bell" variant="secondary" onPress={() => notify(open.route.id)} /> : null}
              <Button label="Open route" icon="navigation" onPress={() => { setOpenId(null); router.push(`/campus/routes?q=${open.route.code}` as Href); }} />
            </View>
          </View>
        ) : null}
      </Sheet>
    </ScrollView>
  );
}

