import { X, Trash2, ShoppingBag, Truck, Check, MapPin } from 'lucide-react';
import { StoreItem, LocalStore } from '../types';

interface CartItemEntry {
  item: StoreItem;
  store: LocalStore;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemEntry[];
  onAddToCart: (item: StoreItem, store: LocalStore) => void;
  onRemoveFromCart: (itemId: string) => void;
  onClearCart: () => void;
  tenantAddress: string;
  onCheckout: (checkoutData: {
    items: { itemId: string; name: string; price: number; quantity: number }[];
    store: LocalStore;
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    tax: number;
    total: number;
    notes: string;
    paymentMethod: 'card' | 'apple_pay' | 'cash';
  }) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  tenantAddress,
  onCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const activeStore = cartItems.length > 0 ? cartItems[0].store : null;

  const subtotal = cartItems.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );

  const deliveryFee = activeStore ? activeStore.deliveryFee : 2.99;
  const serviceFee = 2.00;
  const tax = Number((subtotal * 0.08875).toFixed(2));
  const total = Number((subtotal + deliveryFee + serviceFee + tax).toFixed(2));

  const handleCheckoutClick = () => {
    if (!activeStore || cartItems.length === 0) return;

    onCheckout({
      items: cartItems.map((c) => ({
        itemId: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
      })),
      store: activeStore,
      subtotal,
      deliveryFee,
      serviceFee,
      tax,
      total,
      notes: 'Please buzz Apt 14C or leave at doorman desk.',
      paymentMethod: 'apple_pay',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div 
        id="cart-drawer-panel"
        className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-slate-200"
      >
        {/* Drawer Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Your Basket</h3>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
              {cartItems.reduce((acc, c) => acc + c.quantity, 0)} items
            </span>
          </div>

          <button
            id="close-cart-drawer-btn"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Store Identifier */}
        {activeStore && (
          <div className="px-3.5 py-2 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between text-xs">
            <span className="font-medium text-blue-950 truncate text-[11px]">
              Store: <strong className="font-bold">{activeStore.name}</strong>
            </span>
            <button
              onClick={onClearCart}
              className="text-rose-600 hover:text-rose-700 font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-2.5 h-2.5" />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">Basket is empty</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Scroll through local supermarkets and pharmacies to add fresh groceries or medical supplies.
              </p>
            </div>
          ) : (
            cartItems.map(({ item, store, quantity }) => (
              <div
                key={item.id}
                className="flex items-center space-x-2.5 pb-2.5 border-b border-slate-100 last:border-b-0"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    ${item.price.toFixed(2)} &bull; {item.unit}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <button
                      onClick={() => onRemoveFromCart(item.id)}
                      className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-slate-800 min-w-[14px] text-center">{quantity}</span>
                    <button
                      onClick={() => onAddToCart(item, store)}
                      className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900">
                    ${(item.price * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary & Checkout Footer */}
        {cartItems.length > 0 && (
          <div className="p-3.5 border-t border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="truncate">Deliver: {tenantAddress}</span>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <Truck className="w-3 h-3 mr-1 text-blue-600" />
                  Courier Delivery Fee
                </span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Platform Packaging Fee</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Estimated Sales Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-xs">
                <span>Total Due</span>
                <span className="text-blue-600 font-bold">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              id="confirm-checkout-btn"
              onClick={handleCheckoutClick}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>Dispatch Uber Courier (${total.toFixed(2)})</span>
              <Check className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] text-center text-slate-400">
              Delivery in ~{activeStore?.deliveryEstimateMin || 20} mins &bull; Live GPS tracking
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
