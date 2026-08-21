'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatCard } from '../StatCard';
import { RecentShipmentsTable } from '../RecentShipmentsTable';
import { stats, auditLogs as seedAuditLogs, transactions as seedTransactions } from '../data';
import type { AuditLog, Driver, Shipment, Transaction } from '../types';
import { supabase } from '../../lib/supabaseClient';

interface DashboardViewProps {
  companyId?: string;
  companyName?: string;
  shipments: Shipment[];
}

interface ShipmentsViewProps {
  shipments: Shipment[];
  onShipmentUpdated: (shipment: Shipment) => void;
}

interface MyTripsViewProps {
  shipments: Shipment[];
  onSelectTrip: (tripId: string) => void;
}

interface TripDetailsViewProps {
  shipment: Shipment | null;
  onShipmentUpdated: (shipment: Shipment) => void;
  onBack: () => void;
}

interface DriversViewProps {
  drivers: Driver[];
  onDriverAdd: (driver: Driver) => void;
  onDriverStatusChange: (driver: Driver, newStatus: Driver['status']) => void;
}

interface BillingViewProps {
  transactions?: Transaction[];
  onGenerateInvoice: (invoiceNumber: string) => void;
}

interface AnalyticsViewProps {
  shipments: Shipment[];
  transactions: Transaction[];
}

interface AuthViewProps {
  existingOrg: { name: string; logoUrl: string } | null;
  onLogin: (email: string, password: string) => Promise<boolean> | boolean;
  onRegister: (companyName: string, logoUrl: string, email: string, password: string) => Promise<boolean> | boolean;
}

export function DashboardView({ companyId, companyName, shipments }: DashboardViewProps) {
  const [inviteLink, setInviteLink] = useState<string>('');

  const generateInviteLink = () => {
    if (typeof window === 'undefined' || !companyId) {
      return;
    }

    const link = `${window.location.origin}/join-driver?company=${companyId}`;
    setInviteLink(link);
  };

  return (
    <div className="space-y-10">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Driver Onboarding</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Share Driver Access</h2>
            <p className="mt-3 text-slate-400">
              Generate an invite link to share with drivers so they can connect to {companyName ?? 'your company'}.
            </p>
          </div>

          <button
            type="button"
            onClick={generateInviteLink}
            className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Generate Invite Link
          </button>

          {inviteLink && (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Driver invite URL</p>
              <div className="mt-3 flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3">
                <span className="truncate text-sm text-slate-100">{inviteLink}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                  className="rounded-2xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <RecentShipmentsTable shipments={shipments} />
    </div>
  );
}

export function AnalyticsView({ shipments, transactions }: AnalyticsViewProps) {
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const deliveredShipments = shipments.filter((shipment) => shipment.status === 'Delivered');
  const totalShipments = shipments.length;
  const issueCount = shipments.filter((shipment) => Boolean(shipment.issueDescription)).length;
  const averageDeliveryTime = deliveredShipments.length
    ? deliveredShipments.reduce((sum, shipment) => {
        if (!shipment.createdAt || !shipment.deliveredAt) {
          return sum;
        }
        const created = new Date(shipment.createdAt).getTime();
        const delivered = new Date(shipment.deliveredAt).getTime();
        return sum + Math.max(0, delivered - created);
      }, 0) / deliveredShipments.length
    : 0;
  const averageDeliveryDays = Math.round(averageDeliveryTime / 1000 / 60 / 60 / 24) || 0;
  const deliverySuccessRate = totalShipments ? Math.round((deliveredShipments.length / totalShipments) * 100) : 0;

  return (
    <div className="space-y-10">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Revenue</p>
          <p className="mt-4 text-4xl font-semibold text-white">${totalRevenue.toLocaleString()}</p>
          <p className="mt-3 text-sm text-slate-400">Total invoice value across historical shipments.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Delivery Efficiency</p>
          <p className="mt-4 text-4xl font-semibold text-white">{averageDeliveryDays} days</p>
          <p className="mt-3 text-sm text-slate-400">Average time to deliver completed shipments.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Issue Rate</p>
          <p className="mt-4 text-4xl font-semibold text-white">{issueCount}</p>
          <p className="mt-3 text-sm text-slate-400">Shipments with reported issues.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Delivery Health</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Shipment Performance</h2>
            </div>
            <span className="rounded-full bg-slate-950/90 px-4 py-2 text-sm text-slate-300">
              {deliverySuccessRate}% Delivered
            </span>
          </div>

          <div className="mt-8 space-y-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
              <p className="text-sm text-slate-400">Total Shipments</p>
              <p className="mt-2 text-3xl font-semibold text-white">{totalShipments}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
              <p className="text-sm text-slate-400">Delivered Shipments</p>
              <p className="mt-2 text-3xl font-semibold text-white">{deliveredShipments.length}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Recent Issues</p>
            <h3 className="mt-3 text-xl font-semibold text-white">Problems by Shipment</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              {shipments
                .filter((shipment) => shipment.issueDescription)
                .slice(0, 4)
                .map((shipment) => (
                  <li key={shipment.id ?? shipment.loadId} className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="font-semibold text-white">{shipment.loadId}</p>
                    <p className="mt-1 text-slate-400 truncate">{shipment.issueDescription}</p>
                  </li>
                ))}
              {issueCount === 0 && <li className="text-slate-400">No issues reported yet.</li>}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Invoice Pipeline</p>
            <h3 className="mt-3 text-xl font-semibold text-white">Transaction Trends</h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                <p className="text-sm text-slate-400">Pending</p>
                <p className="mt-2 text-2xl font-semibold text-white">{transactions.filter((tx) => tx.status === 'Pending').length}</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                <p className="text-sm text-slate-400">Paid</p>
                <p className="mt-2 text-2xl font-semibold text-white">{transactions.filter((tx) => tx.status === 'Paid').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthView({ existingOrg, onLogin, onRegister }: AuthViewProps) {
  const [role, setRole] = useState<'company' | 'driver'>('company');
  const [mode, setMode] = useState<'login' | 'register'>(existingOrg ? 'login' : 'register');
  const [companyName, setCompanyName] = useState(existingOrg?.name ?? '');
  const [logoUrl, setLogoUrl] = useState(existingOrg?.logoUrl ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTermsAccepted(false);
    setError('');
  }, [role, mode]);

  const handleSubmit = async () => {
    setError('');

    if (role === 'driver' && mode === 'register') {
      setError('Driver accounts are created by a company invitation.');
      return;
    }

    if (mode === 'register' && !termsAccepted) {
      setError('You must accept the Terms & Conditions before registering.');
      return;
    }

    if (role === 'driver') {
      const success = await onLogin(email.trim(), password);
      if (!success) {
        setError('Invalid driver credentials.');
      }
      return;
    }

    if (mode === 'login') {
      const success = await onLogin(email.trim(), password);
      if (!success) {
        setError('Invalid company credentials.');
      }
      return;
    }

    if (!companyName.trim() || !logoUrl.trim() || !email.trim() || !password) {
      setError('Please complete all fields to register.');
      return;
    }

    const success = await onRegister(companyName.trim(), logoUrl.trim(), email.trim(), password);
    if (!success) {
      setError('Unable to register. Please verify your information and try again.');
    }
  };

  return (
    <section className="mx-auto max-w-3xl rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Choose Your Role</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Driver or Company Access</h1>
          <p className="mt-3 text-sm text-slate-400">
            {role === 'driver'
              ? 'Drivers can log in to view only their assigned trips and report delivery status.'
              : 'Companies can register or log in to manage fleet operations, billing, and drivers.'}
          </p>
        </div>
        <div className="flex gap-2 rounded-3xl bg-slate-950/90 p-2">
          <button
            type="button"
            onClick={() => setRole('company')}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${role === 'company' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
          >
            I am a Company
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('driver');
              setMode('login');
            }}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${role === 'driver' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
          >
            I am a Driver
          </button>
        </div>
      </div>

        <div className="flex gap-2 rounded-3xl bg-slate-950/90 p-2">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${mode === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
          >
            Login
          </button>
          {role === 'company' && (
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-2xl px-4 py-2 text-sm font-medium ${mode === 'register' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
            >
              Register
            </button>
          )}
        </div>

      <div className="mt-8 grid gap-6">
        {role === 'company' && mode === 'register' && (
          <>
            <label className="block text-sm font-medium text-slate-300">
              Business Name
              <input
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Your company name"
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Company Logo URL
              <input
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </label>
          </>
        )}

        <label className="block text-sm font-medium text-slate-300">
          {role === 'driver' ? 'Driver Email' : 'Admin Email'}
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={role === 'driver' ? 'driver@example.com' : 'admin@company.com'}
            className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
          />
        </label>

        <label className="block text-sm font-medium text-slate-300">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter a secure password"
            className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
          />
        </label>

        {mode === 'register' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
              <input
                id="terms-acceptance"
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="terms-acceptance" className="text-sm leading-6 text-slate-200">
                I agree to the Terms & Conditions and Release of Liability
              </label>
            </div>

            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-sm font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
            >
              Read terms
            </button>
          </div>
        )}

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={mode === 'register' && !termsAccepted}
          className={`rounded-2xl px-6 py-3 text-sm font-semibold text-slate-950 transition ${mode === 'register' && !termsAccepted ? 'cursor-not-allowed bg-slate-600 opacity-60' : 'bg-cyan-500 hover:bg-cyan-400'}`}
        >
          {role === 'driver' ? 'Driver Sign In' : mode === 'login' ? 'Company Sign In' : 'Register Company'}
        </button>

        {/* Quick local dev login removed for production */}
      </div>

      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-slate-950/50">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-white">Terms & Conditions</h2>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm leading-7 text-slate-300">
              <p>
                BSFO is provided on an as-is basis. The platform, its software, infrastructure, and related services are
                offered without warranties of any kind, whether express or implied, including warranties of
                merchantability, fitness for a particular purpose, availability, performance, or error-free operation.
              </p>

              <p className="mt-4">
                By using BSFO, users acknowledge and accept that software errors, system outages, operational delays,
                data inaccuracies, communication failures, and other disruptions may occur. In no event shall the
                platform, its creators, operators, affiliates, or contributors be liable for any direct, indirect,
                incidental, consequential, special, or punitive damages, including loss of revenue, delayed shipments,
                business interruption, equipment damage, or other losses arising from platform use or reliance on the
                service.
              </p>

              <p className="mt-4">
                Users release the platform and its creators from any liability related to software failures, delays,
                operational issues, damages, or losses connected with the use of BSFO, including claims resulting from
                missed deadlines, misrouting, inaccurate status updates, or service interruptions.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                I agree
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function ShipmentsView({ shipments, onShipmentUpdated }: ShipmentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'En route' | 'Verified' | 'Pending'>('All');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [podMessage, setPodMessage] = useState<string | null>(null);
  const [podError, setPodError] = useState<string | null>(null);

  const filteredShipments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return shipments.filter((shipment) => {
      const matchesQuery =
        shipment.driver.toLowerCase().includes(query) ||
        shipment.destination.toLowerCase().includes(query) ||
        shipment.loadId.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'All' || shipment.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [shipments, searchQuery, statusFilter]);
  const selectedShipment = selectedShipmentId
    ? shipments.find((shipment) => shipment.id === selectedShipmentId)
    : null;

  const handleFileInputChange = (file: File | null) => {
    setPodError(null);
    setPodMessage(null);
    setUploadFile(file);
  };

  const handleSelectShipment = (shipmentId: string) => {
    setSelectedShipmentId((current) => (current === shipmentId ? null : shipmentId));
    setUploadFile(null);
    setPodMessage(null);
    setPodError(null);
  };

  const handleUploadPOD = async () => {
    if (!selectedShipment || !uploadFile) {
      setPodError('Select a shipment and a photo to upload.');
      return;
    }

    if (!uploadFile.type.startsWith('image/')) {
      setPodError('Please upload a valid image file for proof of delivery.');
      return;
    }

    setIsUploading(true);
    setPodError(null);
    setPodMessage(null);

    const extension = uploadFile.name.split('.').pop() ?? 'jpg';
    const path = `pod-photos/${selectedShipment.loadId}-${Date.now()}.${extension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pod-photos')
      .upload(path, uploadFile, { upsert: true });

    if (uploadError || !uploadData) {
      setIsUploading(false);
      setPodError('Failed to upload proof of delivery. Please try again.');
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('pod-photos').getPublicUrl(path);
    const podUrl = publicUrlData.publicUrl;
    const deliveredAt = new Date().toISOString();

    if (selectedShipment.id) {
      const { data: updatedData, error: updateError } = await supabase
.from('shipments')
        .update({ status: 'Delivered', deliveredAt, podUrl })
        .eq('id', selectedShipment.id)
        .select()
        .single();

      if (updateError || !updatedData) {
        setIsUploading(false);
        setPodError('Unable to update shipment status.');
        return;
      }

      onShipmentUpdated(updatedData);
      setPodMessage('Proof of Delivery uploaded and shipment marked as Delivered.');
      setUploadFile(null);
      setIsUploading(false);
      return;
    }

    const updatedShipment = { ...selectedShipment, status: 'Delivered', deliveredAt, podUrl };
    onShipmentUpdated(updatedShipment);
    setPodMessage('Proof of Delivery uploaded and shipment marked as Delivered locally.');
    setUploadFile(null);
    setIsUploading(false);
  };
  return (
    <section className="space-y-8 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Shipments Operations</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Shipment Tracking</h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Filter shipments by driver, destination, or load ID and track current status across the fleet.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            <label className="block text-sm font-medium text-slate-300">Search</label>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search driver, destination, or load ID"
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
            />
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            <label className="block text-sm font-medium text-slate-300">Shipment Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'All' | 'En route' | 'Verified' | 'Pending')}
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
            >
              <option value="All">All Statuses</option>
              <option value="En route">En route</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 shadow-xl shadow-slate-950/10">
          <div className="border-b border-slate-800 bg-slate-900/95 px-6 py-5">
            <h3 className="text-lg font-semibold text-white">Filtered Shipments</h3>
            <p className="mt-1 text-sm text-slate-400">Showing {filteredShipments.length} shipments.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-900/95 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Load ID</th>
                  <th className="px-6 py-4 font-medium">Driver</th>
                  <th className="px-6 py-4 font-medium">Destination</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">ETA</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((shipment, index) => {
                  const shipmentKey = shipment.id ?? shipment.loadId;
                  const isSelected = selectedShipmentId === shipmentKey;
                  return (
                    <tr
                      key={shipmentKey}
                      onClick={() => handleSelectShipment(shipmentKey)}
                      className={`cursor-pointer border-t border-slate-800 transition ${
                        isSelected ? 'bg-slate-800' : index % 2 === 0 ? 'bg-slate-950/90' : 'bg-slate-900/80'
                      }`}
                    >
                      <td className="px-6 py-5 text-slate-100">{shipment.loadId}</td>
                      <td className="px-6 py-5 text-slate-200">{shipment.driver}</td>
                      <td className="px-6 py-5 text-slate-200">{shipment.destination}</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-slate-700">
                          {shipment.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-200">{shipment.eta}</td>
                    </tr>
                  );
                })}
                {filteredShipments.length === 0 && (
                  <tr className="border-t border-slate-800 bg-slate-950/90">
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                      No shipments match your search and filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Proof of Delivery</p>
            <h3 className="mt-3 text-lg font-semibold text-white">Capture Delivery Photo</h3>
            <p className="mt-2 text-sm text-slate-400">
              Select a shipment to attach a delivery photo. This will mark the shipment as Delivered and store the POD in Supabase.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {selectedShipment ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Selected Shipment</p>
                <p className="mt-2 text-sm text-slate-200">{selectedShipment.loadId}</p>
                <p className="text-sm text-slate-400">{selectedShipment.destination}</p>
                <p className="text-sm text-slate-400">Driver: {selectedShipment.driver}</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 text-sm text-slate-400">
                Select a shipment from the list to upload Proof of Delivery.
              </div>
            )}

            <label className="block rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-5 text-center text-sm text-slate-300 transition hover:border-cyan-500 hover:bg-slate-950/80">
              <span className="block">Capture or upload a delivery photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(event) => handleFileInputChange(event.target.files?.[0] ?? null)}
              />
            </label>

            <button
              type="button"
              onClick={handleUploadPOD}
              disabled={!selectedShipment || !uploadFile || isUploading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:bg-slate-700 hover:bg-cyan-400"
            >
              {isUploading ? 'Uploading POD...' : 'Upload Proof of Delivery'}
            </button>

            {podError && <p className="text-sm text-rose-400">{podError}</p>}
            {podMessage && <p className="text-sm text-emerald-300">{podMessage}</p>}

            {selectedShipment?.deliveredAt && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 text-sm text-slate-400">
                <p className="font-medium text-slate-200">Delivered</p>
                <p>{new Date(selectedShipment.deliveredAt).toLocaleString()}</p>
              </div>
            )}

            {selectedShipment?.podUrl && (
              <a
                href={selectedShipment.podUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:border-cyan-500 hover:text-cyan-100"
              >
                View Existing POD Photo
              </a>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export function MyTripsView({ shipments, onSelectTrip }: MyTripsViewProps) {
  return (
    <section className="space-y-8 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">My Trips</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Assigned Loads</h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Review your assigned trips and select a load to view details, start the route, or report an issue.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {shipments.length > 0 ? (
          shipments.map((shipment) => (
            <button
              key={shipment.id ?? shipment.loadId}
              type="button"
              onClick={() => onSelectTrip(shipment.id ?? shipment.loadId)}
              className="w-full text-left rounded-3xl border border-slate-800 bg-slate-950/90 p-6 transition hover:border-cyan-500"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Load</p>
                  <p className="mt-2 text-xl font-semibold text-white">{shipment.loadId}</p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-slate-700">
                  {shipment.status}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-400">
                <p>Destination: {shipment.destination}</p>
                <p>ETA: {shipment.eta}</p>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 text-center text-slate-400">
            No trips assigned yet. Check back when dispatch assigns your next load.
          </div>
        )}
      </div>
    </section>
  );
}

export function TripDetailsView({ shipment, onShipmentUpdated, onBack }: TripDetailsViewProps) {
  const [issueText, setIssueText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartTrip = async () => {
    if (!shipment) {
      return;
    }

    const updatedShipment = { ...shipment, status: 'In Transit' };

    if (shipment.id) {
      const { data, error: updateError } = await supabase
        .from('shipments')
        .select()
        .single();

      if (updateError || !data) {
        setError('Unable to start the trip. Please try again.');
        return;
      }

      onShipmentUpdated(data);
      setMessage('Trip started. Stay safe and keep the route updated.');
      return;
    }

    onShipmentUpdated(updatedShipment);
    setMessage('Trip started locally.');
  };

  const handleReportIssue = async () => {
    if (!shipment || !issueText.trim()) {
      setError('Please describe the issue before submitting.');
      return;
    }

    const updatedShipment = { ...shipment, status: 'Issue Reported', issueDescription: issueText.trim() };

    if (shipment.id) {
      const { data, error: updateError } = await supabase
        .from('shipments')
        .update({ status: 'Issue Reported', issueDescription: issueText.trim() })
        .eq('id', shipment.id)
        .select()
        .single();

      if (updateError || !data) {
        setError('Unable to submit the issue. Please try again.');
        return;
      }

      onShipmentUpdated(data);
      setMessage('Issue reported. Dispatch has been notified.');
      setIssueText('');
      setError(null);
      return;
    }

    onShipmentUpdated(updatedShipment);
    setMessage('Issue recorded locally.');
    setIssueText('');
    setError(null);
  };

  const handleFileChange = (file: File | null) => {
    setUploadFile(file);
    setError(null);
    setMessage(null);
  };

  const handleUploadPhoto = async () => {
    if (!shipment || !uploadFile) {
      setError('Choose a delivery photo before uploading.');
      return;
    }

    if (!uploadFile.type.startsWith('image/')) {
      setError('Only image files are allowed for delivery photos.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setMessage(null);

    const extension = uploadFile.name.split('.').pop() ?? 'jpg';
    const path = `pod-photos/${shipment.loadId}-${Date.now()}.${extension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pod-photos')
      .upload(path, uploadFile, { upsert: true });

    if (uploadError || !uploadData) {
      setIsUploading(false);
      setError('Failed to upload the delivery photo. Please try again.');
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('pod-photos').getPublicUrl(path);
    const podUrl = publicUrlData.publicUrl;
    const deliveredAt = new Date().toISOString();

    const updatedShipment = { ...shipment, status: 'Delivered', podUrl, deliveredAt };
    if (shipment.id) {
      const { data, error: updateError } = await supabase
        .from('shipments')
        .update({ status: 'Delivered', podUrl, deliveredAt })
        .eq('id', shipment.id)
        .select()
        .single();

      if (updateError || !data) {
        setIsUploading(false);
        setError('Unable to update delivery after photo upload.');
        return;
      }

      onShipmentUpdated(data);
      setMessage('Delivery photo uploaded and delivery confirmed.');
      setUploadFile(null);
      setIsUploading(false);
      return;
    }

    onShipmentUpdated(updatedShipment);
    setMessage('Delivery photo saved locally.');
    setUploadFile(null);
    setIsUploading(false);
  };

  return (
    <section className="space-y-8 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-white"
          >
            ← Back to My Trips
          </button>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Trip Details</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">{shipment?.loadId ?? 'No trip selected'}</h2>
          <p className="mt-3 max-w-2xl text-slate-400">Review route details, start the trip, report issues, and upload delivery proof.</p>
        </div>
      </div>

      {!shipment ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 text-center text-slate-400">
          Select a trip to view details and begin delivery.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Trip Summary</p>
              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                <div>
                  <p className="font-semibold text-white">Destination</p>
                  <p>{shipment.destination}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">ETA</p>
                  <p>{shipment.eta}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Assigned Driver</p>
                  <p>{shipment.driver}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Status</p>
                  <p>{shipment.status}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Issue Reporting</p>
              <textarea
                value={issueText}
                onChange={(event) => setIssueText(event.target.value)}
                placeholder="Describe any delay, damage, or delivery issue..."
                className="mt-4 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-4 text-sm text-slate-100 outline-none focus:border-cyan-500"
                rows={5}
              />
              <button
                type="button"
                onClick={handleReportIssue}
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Report an Issue
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Trip Actions</p>
              <div className="mt-4 space-y-4">
                <button
                  type="button"
                  onClick={handleStartTrip}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Start Trip
                </button>

                <label className="block rounded-3xl border border-slate-800 bg-slate-900 px-4 py-5 text-center text-sm text-slate-300 transition hover:border-cyan-500 hover:bg-slate-950/80">
                  <span className="block">Upload Delivery Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleUploadPhoto}
                  disabled={!uploadFile || isUploading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:bg-slate-700 hover:bg-emerald-400"
                >
                  {isUploading ? 'Uploading Photo...' : 'Upload Delivery Photo'}
                </button>
              </div>

              {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
              {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
            </div>

            {shipment.podUrl && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Proof of Delivery</p>
                <a
                  href={shipment.podUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:border-cyan-500 hover:text-cyan-100"
                >
                  View Delivery Photo
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export function DriversView({ drivers, onDriverAdd, onDriverStatusChange }: DriversViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Driver['status']>('All');
  const [newDriver, setNewDriver] = useState<Driver>({
    id: '',
    name: '',
    cdlNumber: '',
    assignedRig: '',
    phone: '',
    status: 'Active',
  });

  const filteredDrivers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return drivers.filter((driver) => {
      const matchesQuery =
        driver.name.toLowerCase().includes(query) ||
        driver.cdlNumber.toLowerCase().includes(query) ||
        driver.assignedRig.toLowerCase().includes(query) ||
        driver.phone.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'All' || driver.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [drivers, searchQuery, statusFilter]);

  const handleAddDriver = () => {
    if (!newDriver.name || !newDriver.cdlNumber || !newDriver.assignedRig || !newDriver.phone) {
      return;
    }

    const addedDriver: Driver = {
      ...newDriver,
      id: `d-${Date.now()}`,
    };

    onDriverAdd(addedDriver);

    setNewDriver({
      id: '',
      name: '',
      cdlNumber: '',
      assignedRig: '',
      phone: '',
      status: 'Active',
    });
  };

  return (
    <section className="space-y-8 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Drivers Management</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Driver Roster</h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Manage CDL drivers, assigned rigs, status, and contact details from a centralized operational view.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            <label className="block text-sm font-medium text-slate-300">Search</label>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
              placeholder="Search name, CDL, rig, phone"
            />
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            <label className="block text-sm font-medium text-slate-300">Filter Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'All' | Driver['status'])}
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Route">On Route</option>
              <option value="Off Duty">Off Duty</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 shadow-xl shadow-slate-950/10">
          <div className="border-b border-slate-800 bg-slate-900/95 px-6 py-5">
            <h3 className="text-lg font-semibold text-white">Driver Roster</h3>
            <p className="mt-1 text-sm text-slate-400">Review driver assignments and driver status in real time.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-900/95 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Driver Name</th>
                  <th className="px-6 py-4 font-medium">CDL License</th>
                  <th className="px-6 py-4 font-medium">Assigned Rig / Truck</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver, index) => (
                  <tr
                    key={driver.id}
                    className={`border-t border-slate-800 ${index % 2 === 0 ? 'bg-slate-950/90' : 'bg-slate-900/80'}`}
                  >
                    <td className="px-6 py-5 text-slate-100">{driver.name}</td>
                    <td className="px-6 py-5 text-slate-200">{driver.cdlNumber}</td>
                    <td className="px-6 py-5 text-slate-200">{driver.assignedRig}</td>
                    <td className="px-6 py-5 text-slate-200">{driver.phone}</td>
                    <td className="px-6 py-5">
                      <label className="sr-only">Driver Status</label>
                      <select
                        value={driver.status}
                        onChange={(event) => {
                          const updatedStatus = event.target.value as Driver['status'];
                          onDriverStatusChange(driver, updatedStatus);
                        }}
                        className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-200 outline-none focus:border-cyan-500"
                      >
                        <option value="Active">Active</option>
                        <option value="On Route">On Route</option>
                        <option value="Off Duty">Off Duty</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredDrivers.length === 0 && (
                  <tr className="border-t border-slate-800 bg-slate-950/90">
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                      No drivers match your search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
          <div>
            <h3 className="text-lg font-semibold text-white">Add New Driver</h3>
            <p className="mt-1 text-sm text-slate-400">Quickly add a new driver to the roster.</p>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-300">
              Driver Name
              <input
                value={newDriver.name}
                onChange={(event) => setNewDriver((current) => ({ ...current, name: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
                placeholder="e.g. Jordan Miles"
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              CDL License Number
              <input
                value={newDriver.cdlNumber}
                onChange={(event) => setNewDriver((current) => ({ ...current, cdlNumber: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
                placeholder="e.g. CDL-1432"
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Assigned Rig / Truck
              <input
                value={newDriver.assignedRig}
                onChange={(event) => setNewDriver((current) => ({ ...current, assignedRig: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
                placeholder="e.g. Rig 16 / Western Star"
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Phone Number
              <input
                value={newDriver.phone}
                onChange={(event) => setNewDriver((current) => ({ ...current, phone: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
                placeholder="e.g. (432) 555-0780"
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Status
              <select
                value={newDriver.status}
                onChange={(event) => setNewDriver((current) => ({ ...current, status: event.target.value as Driver['status'] }))}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
              >
                <option value="Active">Active</option>
                <option value="On Route">On Route</option>
                <option value="Off Duty">Off Duty</option>
              </select>
            </label>

            <button
              type="button"
              onClick={handleAddDriver}
              className="inline-flex w-full justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Add Driver
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BillingView({ transactions: transactionsProp, onGenerateInvoice }: BillingViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(transactionsProp ?? seedTransactions);

  useEffect(() => {
    if (transactionsProp) {
      setTransactions(transactionsProp);
    }
  }, [transactionsProp]);

  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const pendingInvoices = transactions.filter((tx) => tx.status === 'Pending').length;
  const paidCharges = transactions.filter((tx) => tx.status === 'Paid').reduce((sum, tx) => sum + tx.amount, 0);
  const overdueInvoices = transactions.filter((tx) => tx.status === 'Overdue').length;

  const statusClasses = {
    Paid: 'bg-emerald-400/15 text-emerald-200 ring-emerald-500/20',
    Pending: 'bg-amber-400/15 text-amber-200 ring-amber-500/20',
    Overdue: 'bg-rose-400/15 text-rose-200 ring-rose-500/20',
  } as const;

  const handleGenerateInvoice = () => {
    const nextInvoiceNumber = `INV-${2384 + transactions.length}`;
    setTransactions((current) => [
      {
        id: `t-${Date.now()}`,
        invoiceNumber: nextInvoiceNumber,
        date: new Date().toISOString().slice(0, 10),
        customer: 'Field Operations',
        amount: 9850,
        status: 'Pending',
        description: 'Generated invoice for new freight assignment.',
      },
      ...current,
    ]);

    onGenerateInvoice(nextInvoiceNumber);
  };

  return (
    <section className="space-y-8 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Financial Operations</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Billing & Payments</h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Review revenue performance, invoice status, and recent transaction history in a central billing dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateInvoice}
          className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Generate Invoice
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Total Revenue</p>
          <p className="mt-4 text-3xl font-semibold text-white">${totalRevenue.toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-400">Accumulated freight and service revenue.</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Pending Invoices</p>
          <p className="mt-4 text-3xl font-semibold text-white">{pendingInvoices}</p>
          <p className="mt-2 text-sm text-slate-400">Invoices awaiting payment.</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Paid Freight</p>
          <p className="mt-4 text-3xl font-semibold text-white">${paidCharges.toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-400">Payments collected for completed loads.</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Overdue</p>
          <p className="mt-4 text-3xl font-semibold text-white">{overdueInvoices}</p>
          <p className="mt-2 text-sm text-slate-400">Outstanding overdue invoices.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 shadow-xl shadow-slate-950/10">
        <div className="border-b border-slate-800 bg-slate-900/95 px-6 py-5">
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          <p className="mt-1 text-sm text-slate-400">Latest invoices and payment activity.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-900/95 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Invoice</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr
                  key={transaction.id}
                  className={`border-t border-slate-800 ${index % 2 === 0 ? 'bg-slate-950/90' : 'bg-slate-900/80'}`}
                >
                  <td className="px-6 py-5 text-slate-100">{transaction.invoiceNumber}</td>
                  <td className="px-6 py-5 text-slate-200">{transaction.date}</td>
                  <td className="px-6 py-5 text-slate-200">{transaction.customer}</td>
                  <td className="px-6 py-5 text-slate-200">${transaction.amount.toLocaleString()}</td>
                  <td className="px-6 py-5 text-slate-400">{transaction.description}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusClasses[transaction.status]}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function AuditLogsView() {
  const [logs] = useState<AuditLog[]>(seedAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AuditLog['status']>('All');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'System' | 'Dispatch' | 'Upload Agent' | 'User Admin'>('All');

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesQuery =
        log.timestamp.toLowerCase().includes(query) ||
        log.source.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.target.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
      const matchesSource = sourceFilter === 'All' || log.source === sourceFilter;
      return matchesQuery && matchesStatus && matchesSource;
    });
  }, [logs, searchQuery, statusFilter, sourceFilter]);

  const statusClasses = {
    Success: 'bg-emerald-400/15 text-emerald-200 ring-emerald-500/20',
    Warning: 'bg-amber-400/15 text-amber-200 ring-amber-500/20',
    Info: 'bg-sky-400/15 text-sky-200 ring-sky-500/20',
  } as const;

  return (
    <section className="space-y-8 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">System Activity</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Audit Logs</h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Track recent system events, ticket uploads, sync operations, driver changes, and login activity.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            <label className="block text-sm font-medium text-slate-300">Search Events</label>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
              placeholder="Search timestamp, source, action, details"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <label className="block text-sm font-medium text-slate-300">Filter Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'All' | AuditLog['status'])}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
              >
                <option value="All">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Warning">Warning</option>
                <option value="Info">Info</option>
              </select>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <label className="block text-sm font-medium text-slate-300">Filter Source</label>
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value as 'All' | 'System' | 'Dispatch' | 'Upload Agent' | 'User Admin')}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
              >
                <option value="All">All Sources</option>
                <option value="System">System</option>
                <option value="Dispatch">Dispatch</option>
                <option value="Upload Agent">Upload Agent</option>
                <option value="User Admin">User Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 shadow-xl shadow-slate-950/10">
        <div className="border-b border-slate-800 bg-slate-900/95 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <p className="mt-1 text-sm text-slate-400">Showing {filteredLogs.length} events from the audit trail.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-900/95 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Target</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr
                  key={log.id}
                  className={`border-t border-slate-800 ${index % 2 === 0 ? 'bg-slate-950/90' : 'bg-slate-900/80'}`}
                >
                  <td className="px-6 py-5 text-slate-200">{log.timestamp}</td>
                  <td className="px-6 py-5 text-slate-200">{log.source}</td>
                  <td className="px-6 py-5 text-slate-100">{log.action}</td>
                  <td className="px-6 py-5 text-slate-200">{log.target}</td>
                  <td className="px-6 py-5 text-slate-400 max-w-[320px] truncate">{log.details}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusClasses[log.status]}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr className="border-t border-slate-800 bg-slate-950/90">
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function SettingsView() {
  type Settings = {
    emailNotifications: boolean;
    timezone: string;
    integrationWebhook: string;
  };

  const STORAGE_KEY = 'bsfo-settings';
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    integrationWebhook: '',
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings(JSON.parse(raw));
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setMessage('Settings saved.');
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage('Unable to save settings.');
    }
  };

  const handleReset = () => {
    const defaults: Settings = {
      emailNotifications: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      integrationWebhook: '',
    };
    setSettings(defaults);
    localStorage.removeItem(STORAGE_KEY);
    setMessage('Settings reset to defaults.');
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <section className="space-y-8 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Platform Settings</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Settings & Integrations</h2>
          <p className="mt-2 text-sm text-slate-400">Manage notifications, integrations, and regional preferences.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Email Notifications</span>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings((s) => ({ ...s, emailNotifications: e.target.checked }))}
              className="h-5 w-5 rounded"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Timezone
            <input
              value={settings.timezone}
              onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
              placeholder="UTC"
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Integration Webhook URL
            <input
              value={settings.integrationWebhook}
              onChange={(e) => setSettings((s) => ({ ...s, integrationWebhook: e.target.value }))}
              placeholder="https://example.com/webhook"
              className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
            />
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Save Settings
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-100 hover:border-slate-500"
            >
              Reset
            </button>
          </div>

          {message && <p className="text-sm text-emerald-300">{message}</p>}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
            <p className="text-sm text-slate-400">About Settings</p>
            <p className="mt-2 text-sm text-slate-300">These settings are stored locally for this browser. Integrations configured here will be used by platform webhooks.</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
            <p className="text-sm text-slate-400">Security</p>
            <p className="mt-2 text-sm text-slate-300">For production, integrate these settings with your organization's admin panel and server-side storage.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
