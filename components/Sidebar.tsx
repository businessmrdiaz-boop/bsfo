type NavItem = {
  label: string;
  value:
    | 'dashboard'
    | 'shipments'
    | 'drivers'
    | 'billing'
    | 'business-analytics'
    | 'audit-logs'
    | 'settings'
    | 'my-trips'
    | 'trip-details';
};

const companyNavItems: NavItem[] = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Shipments', value: 'shipments' },
  { label: 'Drivers', value: 'drivers' },
  { label: 'Billing', value: 'billing' },
  { label: 'Business Analytics', value: 'business-analytics' },
  { label: 'Audit Logs', value: 'audit-logs' },
  { label: 'Settings', value: 'settings' },
];

const driverNavItems: NavItem[] = [
  { label: 'My Trips', value: 'my-trips' },
  { label: 'Trip Details', value: 'trip-details' },
];

interface SidebarProps {
  activeView: NavItem['value'];
  onNavigate: (view: NavItem['value']) => void;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  isDriver?: boolean;
}

export function Sidebar({ activeView, onNavigate, companyName, companyLogoUrl, isDriver }: SidebarProps) {
  const items = isDriver ? driverNavItems : companyNavItems;
  return (
    <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:block">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          {companyLogoUrl ? (
            <img src={companyLogoUrl} alt="Company Logo" className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
              {companyName ? companyName.charAt(0).toUpperCase() : 'B'}
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{companyName ?? 'BSFO Platform'}</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{isDriver ? 'Driver Portal' : 'Command Center'}</h2>
          </div>
        </div>
        <p className="mt-6 text-sm leading-6 text-slate-600">
          {isDriver
            ? 'Your assigned trips and delivery status updates.'
            : companyName
              ? `Centralized operations control for ${companyName}.`
              : 'Centralized logistics control for field operations, drivers, and ticket verification.'}
        </p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigate(item.value)}
            className={`block w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
              activeView === item.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
