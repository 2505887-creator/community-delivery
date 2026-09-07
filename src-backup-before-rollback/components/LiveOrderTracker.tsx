import { useState, useEffect, FormEvent } from 'react';
import { 
  X, Phone, MessageSquare, ShieldCheck, MapPin, CheckCircle2, Clock, 
  Send, AlertCircle, ChevronRight, Truck, Wrench, RefreshCw, Star 
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import InteractiveMap from './InteractiveMap';

interface LiveOrderTrackerProps {
  order: Order;
  onClose: () => void;
  onSendMessage: (orderId: string, text: string) => void;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => void;
}

export default function LiveOrderTracker({
  order,
  onClose,
  onSendMessage,
  onUpdateStatus
}: LiveOrderTrackerProps) {
  const [chatInput, setChatInput] = useState('');
  const [isSimulatingMovement, setIsSimulatingMovement] = useState(false);

  const steps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: 'pending', label: 'Requested', desc: 'Matching verified partner' },
    { key: 'assigned', label: 'Partner Assigned', desc: order.providerName || order.driverName || 'Confirmed' },
    { key: 'en_route', label: 'En Route', desc: `ETA ~${order.estimatedArrivalMin} mins` },
    { key: 'arrived', label: 'Arrived at Building', desc: 'At entrance / lobby' },
    { key: 'in_progress', label: 'In Progress', desc: 'Service / delivery active' },
    { key: 'completed', label: 'Completed', desc: 'Job finished & verified' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);

  const handleSendChat = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(order.id, chatInput);
    setChatInput('');
  };

  const handleAdvanceStatus = () => {
    const sequence: OrderStatus[] = ['pending', 'assigned', 'en_route', 'arrived', 'in_progress', 'completed'];
    const idx = sequence.indexOf(order.status);
    if (idx < sequence.length - 1) {
      onUpdateStatus(order.id, sequence[idx + 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div 
        id="live-order-tracker-modal"
        className="relative bg-white w-full max-w-4xl rounded-xl shadow-xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              {order.type === 'service' ? <Wrench className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white">{order.title}</h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full">
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Order ID: #{order.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Demo Simulator Button */}
            {order.status !== 'completed' && (
              <button
                id="simulate-order-step-btn"
                onClick={handleAdvanceStatus}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 text-xs font-semibold cursor-pointer transition-colors"
                title="Test state transition for demo"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Simulate Next Step</span>
              </button>
            )}

            <button
              id="close-tracker-btn"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content (Split Layout: Map + Status Left, Pro Profile & Live Chat Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column: Interactive Map & Step Pipeline */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Interactive Live Route Map */}
            <InteractiveMap
              tenantLocation={order.tenantLocation}
              originLocation={order.originLocation}
              currentLocation={order.currentLocation}
              type={order.type}
              status={order.status}
              providerName={order.providerName}
              driverName={order.driverName}
              etaMin={order.estimatedArrivalMin}
            />

            {/* Step Pipeline */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Live Dispatch Milestones
              </h4>
              
              <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {steps.map((step, idx) => {
                  const isDone = currentStepIndex > idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.key} className="relative flex items-start space-x-2.5">
                      <div className={`absolute -left-5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-white border-blue-600 ring-2 ring-blue-100'
                          : 'bg-white border-slate-300'
                      }`}>
                        {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isCurrent ? 'text-blue-600' : isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-full animate-pulse">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Simulation button */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 sm:hidden">
                <button
                  onClick={handleAdvanceStatus}
                  className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Simulate Next Step</span>
                </button>
              </div>
            </div>

            {/* Order Receipt Details */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between items-center font-bold text-slate-800">
                <span>Payment Summary ({order.paymentMethod.replace('_', ' ').toUpperCase()})</span>
                <span className="text-blue-600 font-bold">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Service / Items Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Courier Delivery Fee</span>
                  <span>${order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Platform Service &amp; Taxes</span>
                <span>${(order.serviceFee + order.tax).toFixed(2)}</span>
              </div>
              {order.notes && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-slate-600 text-[10px]">
                  <strong>Tenant Notes:</strong> {order.notes}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Assigned Partner Card & In-App Direct Chat */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            
            {/* Assigned Partner Profile Card */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {order.type === 'service' ? 'Assigned Verified Pro' : 'Assigned Uber Courier'}
              </span>

              <div className="flex items-center space-x-2.5">
                <img
                  src={order.providerAvatar || order.driverAvatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=300'}
                  alt={order.providerName || order.driverName || 'Partner'}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-lg object-cover border border-slate-200 shadow-xs shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="font-bold text-xs text-slate-900 truncate">
                      {order.providerName || order.driverName || 'LocalPro Dispatch'}
                    </h4>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  </div>
                  {order.driverVehicle && (
                    <p className="text-[11px] text-slate-600 font-medium truncate">
                      {order.driverVehicle}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500">
                    Verified ID &bull; 4.95 Rating &bull; Certified Partner
                  </p>
                </div>

                <a
                  href={`tel:${order.providerPhone || order.driverPhone || '+15551234567'}`}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer"
                  title="Direct Phone Call"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                </a>
              </div>
            </div>

            {/* Real-time In-App Chat Component */}
            <div className="flex-1 flex flex-col bg-slate-50 rounded-lg border border-slate-200 overflow-hidden min-h-[260px]">
              <div className="p-2.5 bg-white border-b border-slate-200 flex items-center space-x-2 text-xs font-bold text-slate-800">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Live Direct Messaging</span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-2.5 overflow-y-auto space-y-2 max-h-[220px]">
                {order.messages.map((msg) => {
                  const isTenant = msg.sender === 'tenant';
                  const isSystem = msg.sender === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center my-1">
                        <span className="text-[9px] bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded-full font-medium">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isTenant ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs shadow-2xs ${
                          isTenant
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        <p className="leading-relaxed text-[11px]">{msg.text}</p>
                      </div>
                      <span className="text-[8px] text-slate-400 mt-0.5 px-1">
                        {msg.senderName} &bull; {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChat} className="p-2 bg-white border-t border-slate-200 flex items-center space-x-1.5">
                <input
                  type="text"
                  id="order-chat-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send instructions, gate codes..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-hidden"
                />
                <button
                  type="submit"
                  id="send-chat-btn"
                  disabled={!chatInput.trim()}
                  className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
