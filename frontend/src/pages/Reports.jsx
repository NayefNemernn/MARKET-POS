import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function Reports() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await api.get("/sales");
        setSales(res.data);
      } catch (err) {
        console.error("Failed to load sales", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  if (loading) {
    return <p className="p-6">Loading reports...</p>;
  }

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + sale.total,
    0
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Sales Reports
      </h1>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white shadow rounded p-4">
          <p className="text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold">{sales.length}</p>
        </div>

        <div className="bg-white shadow rounded p-4">
          <p className="text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* SALES TABLE */}
      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Items</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Payment</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale._id} className="border-t">
                <td className="p-3">
                  {new Date(sale.createdAt).toLocaleString()}
                </td>
                <td className="p-3">
                  {sale.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  )}
                </td>
                <td className="p-3 font-semibold">
                  ${sale.total.toFixed(2)}
                </td>
                <td className="p-3">
                  {sale.paymentMethod}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
