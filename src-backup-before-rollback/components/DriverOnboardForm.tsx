import React, { useState } from 'react';
import { normalizeKenyaPhoneClient } from '../utils/phone';
import { useTranslation } from 'react-i18next';

export default function DriverOnboardForm() {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [vehicleType, setVehicleType] = useState('motorbike');
  const [payoutMethod, setPayoutMethod] = useState('mpesa');
  const [payoutInfo, setPayoutInfo] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalized = normalizeKenyaPhoneClient(phone);

      if (!normalized) {
        alert(t('messages.invalidPhone'));
        setLoading(false);
        return;
      }

      const fd = new FormData();

      fd.append('name', name);
      fd.append('phone', normalized);
      fd.append('idNumber', idNumber);
      fd.append('vehicleReg', vehicleReg);
      fd.append('vehicleType', vehicleType);
      fd.append('payoutMethod', payoutMethod);
      fd.append('payoutInfo', payoutInfo || '');

      if (idFile) {
        fd.append('idDocument', idFile);
      }

      if (vehicleFile) {
        fd.append('vehicleDoc', vehicleFile);
      }

      const res = await fetch('/api/drivers/apply', {
        method: 'POST',
        credentials: 'include',
        body: fd
      });

      const data = await res.json();

      if (data.success) {
        alert(t('messages.apply_success'));

        setName('');
        setPhone('');
        setIdNumber('');
        setVehicleReg('');
        setVehicleType('motorbike');
        setPayoutMethod('mpesa');
        setPayoutInfo('');
        setIdFile(null);
        setVehicleFile(null);
      } else {
        alert(data.error || t('messages.applyFailed'));
      }
    } catch (err) {
      console.error('Driver application failed', err);
      alert(t('messages.applyFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg">
      <h3 className="text-lg font-bold">
        {t('driver.apply')}
      </h3>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('auth.name')}
        required
        className="w-full rounded-xl border border-slate-200 p-3"
      />

      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t('auth.phone')}
        required
        className="w-full rounded-xl border border-slate-200 p-3"
      />

      <input
        value={idNumber}
        onChange={(e) => setIdNumber(e.target.value)}
        placeholder={t('driver.idNumber')}
        required
        className="w-full rounded-xl border border-slate-200 p-3"
      />

      <input
        value={vehicleReg}
        onChange={(e) => setVehicleReg(e.target.value)}
        placeholder={t('driver.vehicleReg')}
        required
        className="w-full rounded-xl border border-slate-200 p-3"
      />

      <select
        value={vehicleType}
        onChange={(e) => setVehicleType(e.target.value)}
        className="w-full rounded-xl border border-slate-200 p-3"
      >
        <option value="motorbike">Motorbike</option>
        <option value="car">Car</option>
      </select>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t('driver.idDocument')}
        </label>

        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) =>
            setIdFile(e.target.files?.[0] || null)
          }
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t('driver.vehicleDocument')}
        </label>

        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) =>
            setVehicleFile(e.target.files?.[0] || null)
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t('driver.payoutMethod')}
        </label>

        <select
          value={payoutMethod}
          onChange={(e) => setPayoutMethod(e.target.value)}
          className="w-full rounded-xl border border-slate-200 p-3"
        >
          <option value="mpesa">M-Pesa</option>
          <option value="bank">Bank</option>
          <option value="cash">Cash</option>
        </select>

        <input
          value={payoutInfo}
          onChange={(e) => setPayoutInfo(e.target.value)}
          placeholder={t('driver.payoutInfo')}
          className="w-full rounded-xl border border-slate-200 p-3 mt-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white font-semibold disabled:opacity-50"
      >
        {loading
          ? t('driver.submitting')
          : t('driver.submit')}
      </button>
    </form>
  );
}