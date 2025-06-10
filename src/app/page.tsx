'use client';
import { useState } from 'react';

export default function Home() {
  const [masterId, setMasterId] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRows([]);

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterTrackingNumber: masterId.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch');

      const completeResults = data.output?.completeTrackResults || [];
      const temp: any[] = [];

      for (const result of completeResults) {
        const trackResults = result.trackResults || [];
        for (const track of trackResults) {
          const trackingId = track.trackingNumberInfo?.trackingNumber || 'N/A';
          const status = track.latestStatusDetail?.statusByLocale?.toLowerCase() || '';
          const scanLoc = track.latestStatusDetail?.scanLocation;
          
          const location = status.includes('delivered')
            ? 'Delivered'
            : scanLoc
            ? `${scanLoc.city || 'Unknown'}, ${scanLoc.countryName || 'Unknown'}`
            : 'Unknown';
      
          temp.push({ trackingId, location });
        }
      }    

      setRows(temp);
    } catch (err: any) {
      console.error(err);
      setError('Error fetching tracking data.');
    }
  };

  return (
    <main className="p-6 max-w-full">
      <h2 className="text-xl font-semibold mb-4">Enter Master Tracking ID</h2>
      <form onSubmit={handleSubmit} className="flex gap-4 mb-6">
        <input
          type="text"
          value={masterId}
          onChange={(e) => setMasterId(e.target.value)}
          required
          placeholder="Enter Master Tracking Number"
          className="flex-grow p-2 border border-gray-300 rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Fetch
        </button>
      </form>

      {error && <p className="text-red-500">{error}</p>}

      {rows.length > 0 && (
        <table className="w-full border border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">#</th>
              <th className="border p-2">Tracking ID</th>
              <th className="border p-2">Latest Location / Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="border p-2">{idx + 1}</td>
                <td
                  className={`border p-2 ${
                    row.trackingId === masterId.trim() ? 'font-bold text-red-600' : ''
                  }`}
                >
                  {row.trackingId}
                </td>
                <td className="border p-2">{row.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
