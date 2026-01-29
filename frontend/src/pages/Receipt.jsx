import React from "react";

export default function Receipt({ sale, onClose }) {
  if (!sale || !sale.items) return null;

  return (
    <div className="print-receipt p-6 max-w-sm mx-auto text-sm print:text-xs">
        <button
  onClick={() => window.print()}
  className="mt-2 w-full bg-green-600 text-white py-2 rounded print:hidden"
>
  Print
</button>

      <h1 className="text-center text-xl font-bold mb-2">
        Market POS
      </h1>

      <p className="text-center mb-4">
        Thank you for your purchase
      </p>

      <div className="mb-4">
        <p>Date: {new Date(sale.createdAt).toLocaleString()}</p>
        <p>Payment: {sale.paymentMethod}</p>
      </div>

      <hr className="mb-2" />

      <ul className="mb-4">
        {sale.items.map((item) => (
          <li key={item._id} className="flex justify-between">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      <hr className="mb-2" />

      <div className="flex justify-between font-bold mb-4">
        <span>Total</span>
        <span>${sale.total.toFixed(2)}</span>
      </div>

      <button
        onClick={onClose}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded print:hidden"
      >
        Close
      </button>
    </div>
  );
}
