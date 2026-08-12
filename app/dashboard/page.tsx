'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Sidebar } from '../../components/Sidebar';
import type { Shipment, Driver, CompanyProfile, Transaction } from '../../components/types';
import { recentShipments } from '../../components/data';
import { AnalyticsView, AuditLogsView, AuthView, BillingView, DashboardView, DriversView, MyTripsView, SettingsView, ShipmentsView, TripDetailsView } from '../../components/views/SectionViews';
import { supabase } from '../../lib/supabaseClient';

const NOTIF_KEY = 'bsfo-notifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: string;
  read: boolean;
}

export default function Page() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [organization, setOrganization] = useState<CompanyProfile | null>(null);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [localDevReady, setLocalDevReady] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [userRole, setUserRole] = useState<'company' | 'driver' | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'shipments' | 'drivers' | 'billing' | 'audit-logs' | 'settings' | 'business-analytics' | 'my-trips' | 'trip-details'>('dashboard');

  useEffect(() => {
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        await loadAuthenticatedContext(session.user.id);
      }

      setLocalDevReady(true);
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        await loadAuthenticatedContext(session.user.id);
      } else {
        setUser(null);
        setOrganization(null);
        setCurrentDriver(null);
        setShipments([]);
        setDrivers([]);
        setIsAuthenticated(false);
        setUserRole(null);
        setSelectedTripId(null);
      }
    });

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  const createNotification = (title: string, message: string, type: Notification['type'] = 'info') => {
    const nextNotification: Notification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications((current) => [nextNotification, ...current]);
  };

  const loadCompanyProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, logoUrl, user_id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    setOrganization(data);
    await fetchShipments(data.id);
    await fetchDrivers(data.id);
    await fetchTransactions(data.id);
    return data;
  };

  const loadDriverProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    setCurrentDriver(data);
    return data;
  };

  const loadAuthenticatedContext = async (userId: string) => {
    const driver = await loadDriverProfile(userId);
    if (driver) {
      setUserRole('driver');
      setOrganization(null);
      setDrivers([]);
      setActiveView('my-trips');
      await fetchDriverShipments(driver.id);
      return;
    }

    const company = await loadCompanyProfile(userId);
    if (company) {
      setUserRole('company');
      setSelectedTripId(null);
      setActiveView('dashboard');
      return;
    }

    setUserRole(null);
  };

  const fetchShipments = async (companyId: string) => {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return;
    }

    setShipments(data);
  };

  const fetchDriverShipments = async (driverId: string) => {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('driverId', driverId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return;
    }

    setShipments(data);
  };

  const fetchDrivers = async (companyId: string) => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error || !data) {
      return;
    }

    setDrivers(data);
  };

  const fetchTransactions = async (companyId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return;
    }

    setTransactions(data);
  };

  const handleAppendShipment = async (shipment: Shipment) => {
    const insertData = organization
      ? { ...shipment, company_id: organization.id }
      : shipment;

    const { data, error } = await supabase.from('shipments').insert(insertData).select().single();
    const savedShipment = data ?? shipment;
    setShipments((current) => [savedShipment, ...current]);
    createNotification('Ticket Uploaded', 'A new ticket upload has been synced through OCR.', 'success');
  };

  const handleCreateInvoiceDraft = async (shipment: Shipment) => {
    const companyId = shipment.company_id ?? organization?.id;
    if (!companyId) {
      return;
    }

    const amount = shipment.rate ?? (shipment.tonnage ? Number(shipment.tonnage) * 1250 : 9500);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        company_id: companyId,
        invoice_number: invoiceNumber,
        date: new Date().toISOString().slice(0, 10),
        customer: shipment.driver,
        amount,
        status: 'Pending',
        description: `Auto invoice for ${shipment.loadId}`,
      })
      .select()
      .single();

    if (error || !data) {
      return;
    }

    setTransactions((current) => [data, ...current]);
    createNotification('Invoice Draft Created', `Invoice ${invoiceNumber} generated for ${shipment.loadId}.`, 'success');
  };

  const handleUpdateShipment = async (updatedShipment: Shipment) => {
    setShipments((current) =>
      current.map((shipment) => (shipment.id === updatedShipment.id ? { ...shipment, ...updatedShipment } : shipment))
    );

    const existing = shipments.find((shipment) => shipment.id === updatedShipment.id || shipment.loadId === updatedShipment.loadId);
    const wasDelivered = existing?.status === 'Delivered' || !!existing?.deliveredAt;
    const isDelivered = updatedShipment.status === 'Delivered' || !!updatedShipment.deliveredAt;

    if (!wasDelivered && isDelivered) {
      await handleCreateInvoiceDraft(updatedShipment);
    }
  };

  const handleRegister = async (companyName: string, logoUrl: string, email: string, password: string) => {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !signUpData.user) {
      return false;
    }

    const userId = signUpData.user.id;
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({ user_id: userId, name: companyName, logoUrl })
      .select()
      .single();

    if (companyError || !companyData) {
      return false;
    }

    setUser(signUpData.user);
    setOrganization(companyData);
    setIsAuthenticated(true);
    setUserRole('company');
    setActiveView('dashboard');
    await fetchShipments(companyData.id);
    await fetchDrivers(companyData.id);
    await fetchTransactions(companyData.id);

    return true;
  };

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return false;
    }

    setUser(data.user);
    setIsAuthenticated(true);
    await loadAuthenticatedContext(data.user.id);
    return true;
  };

  const handleDriverAdd = async (driver: Driver) => {
    const insertData = organization ? { ...driver, company_id: organization.id } : driver;
    const { data, error } = await supabase.from('drivers').insert(insertData).select().single();
    const savedDriver = data ?? driver;
    setDrivers((current) => [savedDriver, ...current]);
    createNotification('New Driver Added', `Driver ${savedDriver.name} has been added to the roster.`, 'success');
  };

  const handleDriverStatusChange = async (driver: Driver, newStatus: string) => {
    if (driver.id) {
      await supabase.from('drivers').update({ status: newStatus }).eq('id', driver.id);
      setDrivers((current) =>
        current.map((item) => (item.id === driver.id ? { ...item, status: newStatus as Driver['status'] } : item))
      );
    }
    createNotification('Driver Status Updated', `${driver.name} is now ${newStatus}.`, 'info');
  };

  // Development bypass removed for production readiness

  const handleInvoiceGenerated = (invoiceNumber: string) => {
    createNotification('Invoice Generated', `Invoice ${invoiceNumber} was created and added to billing.`, 'success');
  };

  useEffect(() => {
    if (isAuthenticated && userRole === 'company') {
      setActiveView('dashboard');
    }
  }, [isAuthenticated, userRole]);

  const content = isAuthenticated ? (
    userRole === 'driver' ? (
      (() => {
        switch (activeView) {
          case 'trip-details':
            return (
              <TripDetailsView
                shipment={shipments.find((shipment) => shipment.id === selectedTripId) ?? null}
                onShipmentUpdated={handleUpdateShipment}
                onBack={() => setActiveView('my-trips')}
              />
            );
          case 'my-trips':
          default:
            return (
              <MyTripsView
                shipments={shipments}
                onSelectTrip={(tripId) => {
                  setSelectedTripId(tripId);
                  setActiveView('trip-details');
                }}
              />
            );
        }
      })()
    ) : (
      (() => {
        switch (activeView) {
          case 'shipments':
            return <ShipmentsView shipments={shipments} onShipmentUpdated={handleUpdateShipment} />;
          case 'drivers':
            return <DriversView drivers={drivers} onDriverAdd={handleDriverAdd} onDriverStatusChange={handleDriverStatusChange} />;
          case 'business-analytics':
            return <AnalyticsView shipments={shipments} transactions={transactions} />;
          case 'billing':
            return <BillingView transactions={transactions} onGenerateInvoice={handleInvoiceGenerated} />;
          case 'audit-logs':
            return <AuditLogsView />;
          case 'settings':
            return <SettingsView />;
          default:
            return (
              <DashboardView
                companyId={organization?.id}
                companyName={organization?.name}
                shipments={shipments}
                onAppendShipment={handleAppendShipment}
              />
            );
        }
      })()
    )
  ) : (
    <AuthView existingOrg={organization} onLogin={handleLogin} onRegister={handleRegister} />
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8 sm:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          companyName={organization?.name ?? currentDriver?.name}
          companyLogoUrl={organization?.logoUrl}
          isDriver={userRole === 'driver'}
        />

        <section className="space-y-10">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Operational Intelligence</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{organization?.name ?? 'BSFO - GDO GROUP'}</h1>
              <p className="mt-2 max-w-2xl text-slate-400">
                {organization?.name
                  ? `Logistics and automated tracking for ${organization.name} field operations.`
                  : 'Logistics and automated tracking for the energy industry, tailored for high-efficiency field operations.'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsBellOpen((open) => !open);
                    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
                  }}
                  className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-slate-800/80 bg-slate-900/70 text-slate-100 transition hover:bg-slate-900"
                >
                  <span className="text-2xl">🔔</span>
                  {notifications.some((notification) => !notification.read) && (
                    <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                      {notifications.filter((notification) => !notification.read).length}
                    </span>
                  )}
                </button>

                {isBellOpen && (
                  <div className="absolute right-0 mt-3 w-96 rounded-3xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl shadow-slate-950/40">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Notifications</p>
                      <button
                        type="button"
                        onClick={() => setIsBellOpen(false)}
                        className="text-slate-500 hover:text-white"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-2">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-slate-400">No notifications yet.</p>
                      ) : (
                        notifications.map((notification) => (
                          <div key={notification.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{notification.title}</p>
                                <p className="mt-1 text-sm text-slate-400">{notification.message}</p>
                              </div>
                              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{notification.timestamp}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 px-5 py-4 shadow-lg shadow-slate-950/40">
                <div className="flex items-center gap-3">
                  <span className="h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/30"></span>
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">System Status</p>
                    <p className="mt-1 text-sm font-medium text-slate-100">System Operational in Odessa, TX</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {content}
        </section>
      </div>
    </main>
  );
}
