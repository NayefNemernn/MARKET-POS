import React from "react";

export default function Receipt({ sale, onClose }) {
  if (!sale || !sale.items) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 print:bg-white">
      <div className="bg-white w-full max-w-sm shadow-lg p-6 font-mono text-sm print:shadow-none print:p-0">
        {/* ACTION BUTTONS */}
        <div className="flex gap-2 mb-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            🖨 Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>

        {/* HEADER */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold tracking-wide">
            MARKET POS
          </h1>
          <p className="text-xs mt-1">
            Thank you for your purchase
          </p>
        </div>

        {/* INFO */}
        <div className="text-xs mb-3">
          <p>
            Date:{" "}
            {new Date(sale.createdAt).toLocaleString()}
          </p>
          <p className="capitalize">
            Payment: {sale.paymentMethod}
          </p>
        </div>

        <div className="border-t border-dashed my-2" />

        {/* ITEMS */}
        <div className="mb-3">
          {sale.items.map((item) => (
            <div
              key={item._id}
              className="flex justify-between text-xs mb-1"
            >
              <span className="max-w-[70%] truncate">
                {item.name} × {item.quantity}
              </span>
              <span>
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed my-2" />

        {/* TOTAL */}
        <div className="flex justify-between font-bold text-base mb-4">
          <span>TOTAL</span>
          <span>${sale.total.toFixed(2)}</span>
        </div>

        {/* FOOTER */}
        <div className="text-center text-xs mt-4">
          <p>--------------------------</p>
          <p>Powered by Market POS</p>
          <p>Have a nice day 🙂</p>
        </div>
      </div>
    </div>
  );
}
