import React, { useEffect, useState } from "react";
import api from "../api/axios";
import RequireAdmin from "../components/RequireAdmin";

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
    return (
      <div className="p-10 text-center text-gray-500 text-lg">
        Loading sales reports…
      </div>
    );
  }

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + sale.total,
    0
  );

  const averageSale =
    sales.length > 0 ? totalRevenue / sales.length : 0;

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              📊 Sales Reports
            </h1>
            <p className="text-gray-500 mt-1">
              Overview of all completed transactions
            </p>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">Total Sales</p>
              <p className="text-3xl font-bold mt-2">
                {sales.length}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">Average Sale</p>
              <p className="text-3xl font-bold mt-2">
                ${averageSale.toFixed(2)}
              </p>
            </div>
          </div>

          {/* SALES TABLE */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">
                Transaction History
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-center">Items</th>
                    <th className="p-4 text-right">Total</th>
                    <th className="p-4 text-center">Payment</th>
                  </tr>
                </thead>

                <tbody>
                  {sales.map((sale) => (
                    <tr
                      key={sale._id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-4">
                        {new Date(
                          sale.createdAt
                        ).toLocaleString()}
                      </td>

                      <td className="p-4 text-center">
                        {sale.items.reduce(
                          (sum, item) =>
                            sum + item.quantity,
                          0
                        )}
                      </td>

                      <td className="p-4 text-right font-semibold">
                        ${sale.total.toFixed(2)}
                      </td>

                      <td className="p-4 text-center capitalize">
                        <span className="inline-block px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                          {sale.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {sales.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-6 text-center text-gray-400"
                      >
                        No sales recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </RequireAdmin>
  );
}
