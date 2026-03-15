import { useEffect, useState } from "react";
import api from "../api/axios";
import ReceivePaymentModal from "../components/ReceivePaymentModal";
import RecentPayments from "../components/RecentPayments";
import Avatar from "../components/Avatar";
import EditCustomerModal from "../components/EditCustomerModal";

export default function PayLater() {

  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);

  useEffect(() => {

    load();

  }, []);

  const load = async () => {

    const res = await api.get("/hold-sales");

    setSales(res.data);

  };

  const filtered = sales.filter(s =>
    s.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = filtered.reduce(
    (sum, s) => sum + s.balance,
    0
  );

  return (

    <div className="p-6 grid grid-cols-4 gap-6">

      {/* LEFT SIDE */}

      <div className="col-span-3 space-y-6">

        {/* PAGE HEADER */}

        <div>

          <h1 className="text-2xl font-bold">
            Pay Later Accounts
          </h1>

          <p className="text-gray-500 text-sm">
            Manage customer credit and payments
          </p>

        </div>

        {/* SUMMARY CARDS */}

        <div className="grid grid-cols-3 gap-4">

          <div className="bg-white rounded-xl p-4 shadow flex items-center gap-4">

            <div className="bg-purple-100 p-3 rounded-full">
              👤
            </div>

            <div>

              <p className="text-gray-500 text-sm">
                Accounts with Debt
              </p>

              <h2 className="text-xl font-semibold">
                {filtered.length}
              </h2>

            </div>

          </div>

          <div className="bg-white rounded-xl p-4 shadow flex items-center gap-4">

            <div className="bg-yellow-100 p-3 rounded-full">
              $
            </div>

            <div>

              <p className="text-gray-500 text-sm">
                Total Outstanding
              </p>

              <h2 className="text-xl font-semibold">
                ${totalOutstanding.toFixed(2)}
              </h2>

            </div>

          </div>

          <div className="bg-white rounded-xl p-4 shadow flex items-center gap-4">

            <div className="bg-green-100 p-3 rounded-full">
              ✓
            </div>

            <div>

              <p className="text-gray-500 text-sm">
                Payments This Month
              </p>

              <h2 className="text-xl font-semibold">
                {filtered.length}
              </h2>

            </div>

          </div>

        </div>

        {/* SEARCH */}

        <div className="bg-white rounded-xl shadow p-4">

          <input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded w-full p-2"
          />

        </div>

        {/* TABLE */}

        <div className="bg-white rounded-xl shadow">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 border-b">

              <tr>

                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Credit Limit</th>
                <th className="px-6 py-3 text-left">Current Debt</th>
                <th className="px-6 py-3 text-left">Available</th>
                <th className="px-6 py-3 text-left">Actions</th>

              </tr>

            </thead>

            <tbody>

              {filtered.map(s => (

                <tr
                  key={s._id}
                  className="border-t hover:bg-gray-50"
                >

                  <td className="px-6 py-4 flex items-center gap-3">

                    <button
                      onClick={() => setEditCustomer(s)}
                      className="flex items-center gap-3"
                    >

                      <Avatar name={s.customerName} />

                      <div>

                        <p className="font-medium hover:underline">
                          {s.customerName}
                        </p>

                        {s.phone && (

                          <p className="text-xs text-gray-400">
                            {s.phone}
                          </p>

                        )}

                      </div>

                    </button>

                  </td>

                  <td className="px-6 py-4">
                    ${(s.creditLimit || 500).toFixed(2)}
                  </td>

                  <td className="px-6 py-4 text-orange-500 font-medium">
                    ${s.balance.toFixed(2)}
                  </td>

                  <td className="px-6 py-4 text-green-600">
                    ${((s.creditLimit || 500) - s.balance).toFixed(2)}
                  </td>

                  <td className="px-6 py-4">

                    <button
                      onClick={() => setSelected(s)}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded"
                    >

                      Receive Payment

                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* RIGHT SIDE */}

      <div className="space-y-6">

        <RecentPayments />

      </div>

      {/* RECEIVE PAYMENT MODAL */}

      {selected && (

        <ReceivePaymentModal
          sale={selected}
          close={() => setSelected(null)}
          reload={load}
        />

      )}

      {/* EDIT CUSTOMER */}

      {editCustomer && (

        <EditCustomerModal
          sale={editCustomer}
          close={() => setEditCustomer(null)}
          reload={load}
        />

      )}

    </div>

  );

}