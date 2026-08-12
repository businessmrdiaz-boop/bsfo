import type { Shipment, Stat, TicketType, Driver, AuditLog, Transaction } from './types';

export const stats: Stat[] = [
  {
    label: 'Trucks on Route',
    value: '28',
    metric: 'Active rigs en route',
    accent: 'border-cyan-500',
  },
  {
    label: 'Verified Tickets Today',
    value: '114',
    metric: 'Confirmed loads processed',
    accent: 'border-amber-500',
  },
  {
    label: 'Critical Alerts',
    value: '3',
    metric: 'High-priority issues',
    accent: 'border-rose-500',
  },
];

export const ticketTypes: TicketType[] = [
  { name: 'Water', status: 'Queued' },
  { name: 'Sand', status: 'Scanning' },
  { name: 'Hot Shot', status: 'Ready' },
];

export const recentShipments: Shipment[] = [
  { status: 'En route', loadId: 'LD-1003', driver: 'Isaac Reed', destination: 'Odessa Terminal', eta: '00:45 hrs' },
  { status: 'Pending', loadId: 'LD-1007', driver: 'Alyssa Chen', destination: 'Midland Yard', eta: '01:10 hrs' },
  { status: 'Verified', loadId: 'LD-1014', driver: 'Rico Sanchez', destination: 'Permian West', eta: '02:30 hrs' },
  { status: 'En route', loadId: 'LD-1020', driver: 'Tara Brooks', destination: 'Gulf Storage', eta: '03:15 hrs' },
];

export const drivers: Driver[] = [
  {
    id: 'd1',
    name: 'Isaac Reed',
    cdlNumber: 'CDL-4821',
    assignedRig: 'Rig 14 / Freightliner',
    phone: '(432) 555-0118',
    status: 'Active',
  },
  {
    id: 'd2',
    name: 'Alyssa Chen',
    cdlNumber: 'CDL-3177',
    assignedRig: 'Rig 02 / Peterbilt',
    phone: '(432) 555-0244',
    status: 'On Route',
  },
  {
    id: 'd3',
    name: 'Rico Sanchez',
    cdlNumber: 'CDL-9503',
    assignedRig: 'Rig 09 / Kenworth',
    phone: '(432) 555-0382',
    status: 'Off Duty',
  },
  {
    id: 'd4',
    name: 'Tara Brooks',
    cdlNumber: 'CDL-6648',
    assignedRig: 'Rig 21 / Volvo',
    phone: '(432) 555-0467',
    status: 'Active',
  },
];

export const transactions: Transaction[] = [
  {
    id: 't1',
    invoiceNumber: 'INV-2381',
    date: '2026-08-09',
    customer: 'Deepwell Logistics',
    amount: 12480,
    status: 'Paid',
    description: 'Freight charge for Rig 14 delivery.',
  },
  {
    id: 't2',
    invoiceNumber: 'INV-2382',
    date: '2026-08-09',
    customer: 'Permian Fuel Co.',
    amount: 8600,
    status: 'Pending',
    description: 'Pending billing for pump truck load.',
  },
  {
    id: 't3',
    invoiceNumber: 'INV-2383',
    date: '2026-08-08',
    customer: 'Odessa Operators',
    amount: 15200,
    status: 'Overdue',
    description: 'Overdue invoice for load ID LD-1003.',
  },
  {
    id: 't4',
    invoiceNumber: 'INV-2384',
    date: '2026-08-07',
    customer: 'Midland Dispatch',
    amount: 10950,
    status: 'Paid',
    description: 'Paid freight charge for verified shipments.',
  },
];

export const auditLogs: AuditLog[] = [
  {
    id: 'a1',
    timestamp: '2026-08-10 09:12:04',
    source: 'System',
    action: 'Database Sync',
    target: 'Primary Warehouse',
    details: 'Completed nightly sync with central inventory database.',
    status: 'Success',
  },
  {
    id: 'a2',
    timestamp: '2026-08-10 09:03:57',
    source: 'Dispatch',
    action: 'Driver Update',
    target: 'Alyssa Chen',
    details: 'Assigned new route and updated rig assignment to Rig 02.',
    status: 'Info',
  },
  {
    id: 'a3',
    timestamp: '2026-08-10 08:44:21',
    source: 'Upload Agent',
    action: 'Ticket Upload',
    target: 'Load #3491',
    details: 'Uploaded 14 tickets from Odessa terminal scanner.',
    status: 'Success',
  },
  {
    id: 'a4',
    timestamp: '2026-08-10 08:22:01',
    source: 'User Admin',
    action: 'System Login',
    target: 'Operator J. Mills',
    details: 'Successful authentication via multi-factor login.',
    status: 'Success',
  },
  {
    id: 'a5',
    timestamp: '2026-08-10 07:56:18',
    source: 'System',
    action: 'Database Sync',
    target: 'Dispatch Records',
    details: 'Detected delayed sync with vendor endpoint, retry scheduled.',
    status: 'Warning',
  },
];
