import { useEffect, useState } from "react";
import RequireAdmin from "../components/RequireAdmin";
import Receipt from "./Receipt";


import {
  getHoldSales,
  deleteHoldSale
} from "../api/holdSale.api";
import { createSale } from "../api/sale.api";

export default function PayLater() {
  const [sales, setSales] = useState([]);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =====================
     LOAD HOLD SALES
  ===================== */
  const load = async () => {
    try {
      const data = await getHoldSales();
      setSales(data);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    load();
  }, []);

  /* =====================
     CHECKOUT PAY LATER
  ===================== */
  const handleCheckout = async (sale) => {
    // create real sale
    const res = await createSale({
      items: sale.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity
      })),
      paymentMethod: "cash"
    });

    // remove hold sale
    await deleteHoldSale(sale._id);

    setReceipt(res.sale);
    setSelected(null);
    load();
  };

  if (loading) {
    return (
      <RequireAdmin>
        <div className="p-6">Loading Pay Later receipts…</div>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">
          🕒 Pay Later Receipts
        </h1>

        {/* TABLE */}
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-center">Total</th>
                <th className="p-3 text-center">Date</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {sales.map(sale => (
                <tr key={sale._id} className="border-t">
                  <td
                    className="p-3 text-blue-600 cursor-pointer underline"
                    onClick={() => setSelected(sale)}
                  >
                    {sale.customerName}
                  </td>

                  <td className="p-3 text-center">
                    ${sale.total.toFixed(2)}
                  </td>

                  <td className="p-3 text-center">
                    {new Date(sale.createdAt).toLocaleString()}
                  </td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleCheckout(sale)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Checkout
                    </button>
                  </td>
                </tr>
              ))}

              {sales.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="p-6 text-center text-gray-400"
                  >
                    No pending receipts
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* DETAILS MODAL */}
        {selected && (
          <Modal onClose={() => setSelected(null)}>
            <h2 className="text-xl font-bold mb-4">
              {selected.customerName}
            </h2>

            {selected.items.map((i, idx) => (
              <div
                key={idx}
                className="flex justify-between text-sm mb-1"
              >
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>
                  ${(i.price * i.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            <hr className="my-3" />

            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${selected.total.toFixed(2)}</span>
            </div>
          </Modal>
        )}

        {/* RECEIPT AFTER CHECKOUT */}
        {receipt && (
          <Receipt
            sale={receipt}
            onClose={() => setReceipt(null)}
          />
        )}
      </div>
    </RequireAdmin>
  );
}

/* =====================
   MODAL COMPONENT
===================== */
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        {children}
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-200 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
