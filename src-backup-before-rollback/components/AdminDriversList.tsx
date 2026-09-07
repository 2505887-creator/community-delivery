import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PendingDriver {
  id: string;
  name: string;
  phone: string;
  idNumber?: string;
  vehicleReg?: string;
  vehicleType?: string;
}

export default function AdminDriversList() {
  const { t } = useTranslation();

  const [pending, setPending] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    try {
      const response = await fetch('/api/drivers/pending', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setPending(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load pending drivers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const approve = async (id: string) => {
    try {
      const response = await fetch(
        `/api/drivers/${id}/approve`,
        {
          method: 'PATCH',
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (!data.success) {
        alert(data.error || 'Approval failed');
        return;
      }

      setPending((drivers) =>
        drivers.filter((driver) => driver.id !== id)
      );
    } catch (error) {
      console.error('Approval failed', error);
      alert('Approval failed');
    }
  };

  const reject = async (id: string) => {
    const reason =
      prompt('Reason for rejection?') || 'Not approved';

    try {
      const response = await fetch(
        `/api/drivers/${id}/reject`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        }
      );

      const data = await response.json();

      if (!data.success) {
        alert(data.error || 'Rejection failed');
        return;
      }

      setPending((drivers) =>
        drivers.filter((driver) => driver.id !== id)
      );
    } catch (error) {
      console.error('Rejection failed', error);
      alert('Rejection failed');
    }
  };

  if (loading) {
    return <div>{t('admin.pendingDrivers')}...</div>;
  }

  if (pending.length === 0) {
    return <div>{t('admin.noPendingDrivers')}</div>;
  }

  return (
    <div className="space-y-4">
      {pending.map((driver) => (
        <div
          key={driver.id}
          className="p-4 border rounded-xl"
        >
          <h4 className="font-bold">
            {driver.name} ({driver.phone})
          </h4>

          <p>ID: {driver.idNumber}</p>

          <p>
            Vehicle: {driver.vehicleReg} /{' '}
            {driver.vehicleType}
          </p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => approve(driver.id)}
              className="px-4 py-2 rounded-lg bg-green-600 text-white"
            >
              {t('admin.approve')}
            </button>

            <button
              onClick={() => reject(driver.id)}
              className="px-4 py-2 rounded-lg bg-red-600 text-white"
            >
              {t('admin.reject')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}