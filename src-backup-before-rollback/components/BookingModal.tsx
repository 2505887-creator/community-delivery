import { useState, FormEvent } from 'react';
import { X, ShieldCheck, AlertCircle, Clock, Calendar, Check, Zap, MapPin } from 'lucide-react';
import { VerifiedPro } from '../types';

interface BookingModalProps {
  pro: VerifiedPro;
  tenantAddress: string;
  onClose: () => void;
  onConfirmBooking: (bookingData: {
    issueDescription: string;
    urgency: 'normal' | 'emergency';
    scheduledFor?: string;
    notes: string;
    subtotal: number;
    total: number;
    paymentMethod: 'card' | 'apple_pay' | 'cash';
  }) => void;
}

export default function BookingModal({
  pro,
  tenantAddress,
  onClose,
  onConfirmBooking
}: BookingModalProps) {
  if (!pro) return null;

  const [issueDescription, setIssueDescription] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'emergency'>('normal');
  const [bookingTimeType, setBookingTimeType] = useState<'asap' | 'schedule'>('asap');
  const [selectedDate, setSelectedDate] = useState('Tomorrow, 10:00 AM');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'cash'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Financial calculations
  const baseRate = pro.hourlyRate;
  const emergencySurcharge = urgency === 'emergency' ? 20.00 : 0.00;
  const subtotal = baseRate + emergencySurcharge;
  const platformFee = 4.50;
  const tax = Number((subtotal * 0.08875).toFixed(2));
  const total = Number((subtotal + platformFee + tax).toFixed(2));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!issueDescription.trim()) return;

    setIsSubmitting(true);
    onConfirmBooking({
      issueDescription,
      urgency,
      scheduledFor: bookingTimeType === 'asap' ? 'ASAP (Immediate Dispatch)' : selectedDate,
      notes,
      subtotal,
      total,
      paymentMethod
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        id="booking-modal-content"
        className="relative bg-white w-full max-w-lg rounded-xl shadow-xl border border-slate-200 overflow-hidden my-6 transition-all"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <img
              src={pro.avatar}
              alt={pro.name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-lg object-cover border border-slate-200 shadow-xs"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-bold text-slate-900 text-base">{pro.name}</h3>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-slate-500 font-medium">{pro.title}</p>
            </div>
          </div>

          <button
            id="close-booking-modal-btn"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          
          {/* Urgency Dispatch Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Dispatch Priority
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="urgency-normal-btn"
                onClick={() => setUrgency('normal')}
                className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  urgency === 'normal'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Standard Dispatch</span>
              </button>

              <button
                type="button"
                id="urgency-emergency-btn"
                onClick={() => setUrgency('emergency')}
                className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  urgency === 'emergency'
                    ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-xs ring-1 ring-rose-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-rose-600" />
                <span>Emergency (+$20)</span>
              </button>
            </div>
          </div>

          {/* Issue Description */}
          <div>
            <label htmlFor="issue-description-input" className="block text-xs font-bold text-slate-700 mb-1">
              What needs repair or service? <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="issue-description-input"
              rows={3}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="e.g., Kitchen sink drain is leaking water into the cabinet below. Valve appears stuck."
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs text-slate-800 placeholder-slate-400 resize-none outline-hidden"
            />
          </div>

          {/* Service Timing */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Appointment Timing
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                id="timing-asap-btn"
                onClick={() => setBookingTimeType('asap')}
                className={`p-2 rounded-lg border text-xs font-semibold text-center cursor-pointer transition-colors ${
                  bookingTimeType === 'asap'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Immediate ASAP (~{pro.responseTimeMin}m)
              </button>
              <button
                type="button"
                id="timing-schedule-btn"
                onClick={() => setBookingTimeType('schedule')}
                className={`p-2 rounded-lg border text-xs font-semibold text-center cursor-pointer transition-colors ${
                  bookingTimeType === 'schedule'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Schedule Slot
              </button>
            </div>

            {bookingTimeType === 'schedule' && (
              <select
                id="booking-time-select"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white"
              >
                <option value="Today, 3:00 PM - 5:00 PM">Today, 3:00 PM - 5:00 PM</option>
                <option value="Today, 6:00 PM - 8:00 PM">Today, 6:00 PM - 8:00 PM</option>
                <option value="Tomorrow, 9:00 AM - 11:00 AM">Tomorrow, 9:00 AM - 11:00 AM</option>
                <option value="Tomorrow, 2:00 PM - 4:00 PM">Tomorrow, 2:00 PM - 4:00 PM</option>
                <option value="Saturday Morning, 10:00 AM">Saturday Morning, 10:00 AM</option>
              </select>
            )}
          </div>

          {/* Location & Access Notes */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center space-x-2 text-slate-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{tenantAddress}</span>
            </div>
            <input
              type="text"
              id="booking-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Apartment buzzer code, elevator instructions, pet warning..."
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-700 placeholder-slate-400 outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Transparent Cost Breakdown */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>First Hour Diagnostic / Labor ({pro.name})</span>
              <span>${baseRate.toFixed(2)}</span>
            </div>
            {urgency === 'emergency' && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Emergency 24/7 Priority Surcharge</span>
                <span>+${emergencySurcharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Platform Insurance &amp; Guarantee</span>
              <span>${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Estimated NY State Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
              <span>Estimated Booking Total</span>
              <span className="text-blue-600">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {(['card', 'apple_pay', 'cash'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  id={`payment-method-${method}`}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-semibold text-center capitalize cursor-pointer transition-colors ${
                    paymentMethod === method
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {method.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-1">
            <button
              type="submit"
              id="confirm-dispatch-booking-btn"
              disabled={isSubmitting || !issueDescription.trim()}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Dispatching verified pro...</span>
              ) : (
                <>
                  <span>Dispatch &amp; Confirm Booking (${total.toFixed(2)})</span>
                  <Check className="w-3.5 h-3.5" />
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-500 mt-1.5">
              Guaranteed satisfaction &bull; Free cancellation until pro is en route
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}
