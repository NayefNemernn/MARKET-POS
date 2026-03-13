import { useEffect, useState } from "react";
import api from "../api/axios";

export default function RecentPayments() {

  const [payments, setPayments] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await api.get("/hold-sales/payments/recent");
    setPayments(res.data);
  };

  return (

    <div className="bg-white p-4 rounded shadow h-full">

      <h3 className="font-semibold mb-3">
        Recent Payments
      </h3>

      {payments.length === 0 && (
        <p className="text-gray-400 text-sm">
          No recent payments
        </p>
      )}

      {payments.map(p => (

        <div
          key={p._id}
          className="flex justify-between border-b py-2"
        >

          <div>

            <p className="font-medium">
              {p.customerName}
            </p>

            <p className="text-xs text-gray-400">
              {new Date(p.createdAt).toLocaleString()}
            </p>

          </div>

          <p className="text-green-600 font-semibold">
            +${p.amount.toFixed(2)}
          </p>

        </div>

      ))}

    </div>

  );
}