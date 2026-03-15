import { useState } from "react";
import api from "../api/axios";

export default function EditCustomerModal({ sale, close, reload }) {

  const [name, setName] = useState(sale.customerName);
  const [phone, setPhone] = useState(sale.phone || "");

  const save = async () => {

    await api.put(`/hold-sales/${sale._id}/customer`, {
      customerName: name,
      phone
    });

    reload();
    close();
  };

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white p-6 rounded-xl w-[380px] space-y-4">

        <h2 className="text-lg font-semibold">
          Edit Customer
        </h2>

        <input
          value={name}
          onChange={(e)=>setName(e.target.value)}
          placeholder="Customer Name"
          className="border w-full p-2 rounded"
        />

        <input
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
          placeholder="Phone Number"
          className="border w-full p-2 rounded"
        />

        <button
          onClick={save}
          className="bg-green-500 text-white w-full py-2 rounded"
        >
          Save
        </button>

        <button
          onClick={close}
          className="border w-full py-2 rounded"
        >
          Cancel
        </button>

      </div>

    </div>

  );
}