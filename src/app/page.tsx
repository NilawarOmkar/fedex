'use client';
import { useState } from 'react';

export default function Home() {
  const [trackingId, setTrackingId] = useState('');
  const [type, setType] = useState<'master' | 'single'>('master');
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');

  const fetchTrackingData = async () => {
    const endpoint = type === 'master' ? '/api/track' : '/api/track-single';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterTrackingNumber: trackingId.trim(),
        trackingNumber: trackingId.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Failed to fetch');

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRows([]);

    try {
      const data = await fetchTrackingData();

      const completeResults = data.output?.completeTrackResults || [];

      const temp: any[] = [];

      for (const result of completeResults) {
        const trackResults = result.trackResults || [];
        for (const track of trackResults) {
          const trackingNumber = track.trackingNumberInfo?.trackingNumber || 'N/A';
          const status = track.latestStatusDetail?.statusByLocale?.toLowerCase() || '';
          const isDelivered = status.includes('delivered');
          const description = track.latestStatusDetail?.description || '';
          const locationParts = [
            track.latestStatusDetail?.scanLocation?.city,
            track.latestStatusDetail?.scanLocation?.countryName,
          ].filter(Boolean);

          const location = isDelivered
            ? 'Delivered'
            : (locationParts.join(', ') || 'Unknown') + (description ? ` — ${description}` : '');


          temp.push({ trackingId: trackingNumber, location });
        }
      }

      setRows(temp);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching tracking data.');
    }
  };

  const handleDownload = async () => {
    try {
      const data = await fetchTrackingData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracking-${trackingId.trim() || 'result'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('Failed to download JSON: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <main className="p-6 max-w-full">
      <h2 className="text-xl font-semibold mb-4">Track FedEx Shipments</h2>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'master' | 'single')}
          className="p-2 border border-gray-300 rounded"
        >
          <option value="master">Master Tracking ID</option>
          <option value="single">Single Tracking ID</option>
        </select>

        <input
          type="text"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          required
          placeholder="Enter Tracking Number"
          className="flex-grow p-2 border border-gray-300 rounded"
        />

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Fetch
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Download JSON
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
                  className={`border p-2 ${row.trackingId === trackingId.trim() ? 'font-bold text-red-600' : ''
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
