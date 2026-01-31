import React from "react";

export default function Receipt({ sale, onClose }) {
  if (!sale || !Array.isArray(sale.items)) return null;

  // ✅ SAFE TOTAL CALCULATION (online + offline)
  const total =
    typeof sale.total === "number"
      ? sale.total
      : sale.items.reduce(
          (sum, item) =>
            sum + (Number(item.price) || 0) * item.quantity,
          0
        );

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
        <div className="text-xs mb-3 space-y-1">
          <p>
            Date:{" "}
            {sale.createdAt
              ? new Date(sale.createdAt).toLocaleString()
              : new Date().toLocaleString()}
          </p>
          <p className="capitalize">
            Payment: {sale.paymentMethod || "cash"}
          </p>
        </div>

        <div className="border-t border-dashed my-2" />

        {/* ITEMS */}
        <div className="mb-3">
          {sale.items.map((item, index) => {
            const lineTotal =
              (Number(item.price) || 0) * item.quantity;

            return (
              <div
                key={item._id || `${item.productId}-${index}`}
                className="flex justify-between text-xs mb-1"
              >
                <span className="max-w-[70%] truncate">
                  {item.name || "Item"} × {item.quantity}
                </span>
                <span>
                  ${lineTotal.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="border-t border-dashed my-2" />

        {/* TOTAL */}
        <div className="flex justify-between font-bold text-base mb-4">
          <span>TOTAL</span>
          <span>${total.toFixed(2)}</span>
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
