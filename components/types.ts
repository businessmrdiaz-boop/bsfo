export interface Stat {
  label: string;
  value: string;
  metric: string;
  accent: string;
}

export interface TicketType {
  name: string;
  status: string;
}

export interface Shipment {
  id?: string;
  company_id?: string;
  driverId?: string;
  status: string;
  loadId: string;
  driver: string;
  destination: string;
  eta: string;
  confirmationCode?: string;
  rig?: string;
  materialType?: string;
  tonnage?: string;
  rate?: number;
  issueDescription?: string;
  createdAt?: string;
  deliveredAt?: string;
  podUrl?: string;
}

export interface Driver {
  id: string;
  company_id?: string;
  user_id?: string;
  email?: string;
  name: string;
  cdlNumber: string;
  assignedRig: string;
  phone: string;
  status: 'Active' | 'On Route' | 'Off Duty';
}

export interface CompanyProfile {
  id: string;
  user_id: string;
  name: string;
  logoUrl: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string;
  customer: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  description: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  target: string;
  details: string;
  status: 'Success' | 'Warning' | 'Info';
}
