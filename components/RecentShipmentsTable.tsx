import type { Shipment } from './types';

interface RecentShipmentsTableProps {
  shipments: Shipment[];
}

export function RecentShipmentsTable({ shipments }: RecentShipmentsTableProps) {
  return (
    <section className="mt-10 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Tracking Table</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Recent Shipments / Trucks</h3>
        </div>
        <p className="text-sm text-slate-400 max-w-xl">
          Live status tracking for key assets, drivers, and estimated arrival windows across the Odessa energy corridor.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-900/95 text-slate-400">
            <tr>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Driver</th>
              <th className="px-6 py-4 font-medium">Destination</th>
              <th className="px-6 py-4 font-medium">ETA</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment, index) => (
              <tr
                key={`${shipment.driver}-${index}`}
                className={`border-t border-slate-800 ${index % 2 === 0 ? 'bg-slate-950/90' : 'bg-slate-900/80'}`}
              >
                <td className="px-6 py-5">
                  <span className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-slate-700">
                    {shipment.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-slate-100">{shipment.driver}</td>
                <td className="px-6 py-5 text-slate-200">{shipment.destination}</td>
                <td className="px-6 py-5 text-slate-200">{shipment.eta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
