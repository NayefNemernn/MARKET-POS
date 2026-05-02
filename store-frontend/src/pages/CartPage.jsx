import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react";
import { Link, useParams, useOutletContext, useNavigate } from "react-router-dom";
import { useCartStore, selectTotal } from "../store/cartStore";

export default function CartPage() {
  const { slug }       = useParams();
  const { store }      = useOutletContext();
  const navigate       = useNavigate();
  const items          = useCartStore(s => s.items);
  const updateQty      = useCartStore(s => s.updateQty);
  const removeItem     = useCartStore(s => s.removeItem);
  const subtotal       = useCartStore(selectTotal);
  const deliveryFee    = store?.deliveryFee || 0;
  const total          = subtotal + deliveryFee;
  const sym            = store?.currencySymbol || "$";
  const minOrder       = store?.minimumOrder   || 0;
  const belowMin       = minOrder > 0 && subtotal < minOrder;

  if (items.length === 0) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
      <Link to={`/store/${slug}`} className="text-blue-600 hover:underline text-sm">
        ← Browse products
      </Link>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link to={`/store/${slug}`} className="flex items-center gap-1 text-sm text-blue-600 mb-5 hover:underline">
        <ArrowLeft size={16} /> Continue shopping
      </Link>

      <h1 className="text-xl font-bold text-gray-800 mb-4">Your Cart</h1>

      <div className="space-y-3 mb-6">
        {items.map(item => (
          <div key={item.productId} className="bg-white rounded-2xl border p-3 flex items-center gap-3">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={24} className="text-blue-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-sm leading-tight truncate">{item.name}</p>
              <p className="text-blue-600 font-bold text-sm mt-0.5">{sym}{item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
                <Minus size={14} />
              </button>
              <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
              <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
                className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition">
                <Plus size={14} />
              </button>
              <button onClick={() => removeItem(item.productId)}
                className="ml-1 w-7 h-7 rounded-full text-red-400 hover:bg-red-50 flex items-center justify-center transition">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border p-4 space-y-2 mb-6">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>{sym}{subtotal.toFixed(2)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery fee</span>
            <span>{sym}{deliveryFee.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t pt-2 flex justify-between font-bold text-gray-800">
          <span>Total</span>
          <span>{sym}{total.toFixed(2)}</span>
        </div>
      </div>

      {belowMin && (
        <p className="text-red-500 text-sm text-center mb-3">
          Minimum order is {sym}{minOrder}
        </p>
      )}

      <button
        onClick={() => navigate(`/store/${slug}/checkout`)}
        disabled={belowMin}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all text-base"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
