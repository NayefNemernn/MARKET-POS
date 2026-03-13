import { useState } from "react";
import api from "../api/axios";
import ReceiptPreview from "./ReceiptPreview";

export default function ReceivePaymentModal({ sale, close, reload }) {

    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("cash");

const [showReceipt, setShowReceipt] = useState(false);
    const percent = (p) => {
        const value = (sale.balance * p) / 100;
        setAmount(value.toFixed(2));
    };

    const pay = async () => {

await api.post(`/hold-sales/${sale._id}/pay`,{
amount:Number(amount),
method
});

setShowReceipt(true);

reload();

};

const printReceipt = () => {

  const content = document.getElementById("receipt").innerHTML;

  const win = window.open("", "", "width=400,height=600");

  win.document.write(`
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body{
            font-family: Arial;
            padding:20px;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);

  win.document.close();
  win.print();
};

    return (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

            <div className="bg-white p-6 rounded-xl w-[380px] space-y-4">

                <h2 className="text-lg font-semibold">
                    Receive Payment
                </h2>

                <div className="bg-orange-500 text-white p-4 rounded text-center">

                    <p>Outstanding Balance</p>

                    <h2 className="text-3xl font-bold">
                        ${sale.balance.toFixed(2)}
                    </h2>

                </div>

                <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="border w-full p-2 rounded"
                />

                <div className="grid grid-cols-3 gap-2">

                    <button onClick={() => percent(25)} className="border py-1 rounded">
                        25%
                    </button>

                    <button onClick={() => percent(50)} className="border py-1 rounded">
                        50%
                    </button>

                    <button onClick={() => percent(100)} className="border py-1 rounded">
                        100%
                    </button>

                </div>

                <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="border w-full p-2 rounded"
                >

                    <option value="cash">Cash</option>
                    <option value="card">Card</option>

                </select>

                <button
                    onClick={pay}
                    className="bg-green-500 text-white w-full py-2 rounded"
                >

                    Record Payment

                </button>

                <button
                    onClick={close}
                    className="border w-full py-2 rounded"
                >

                    Cancel

                </button>
                {showReceipt && (

  <div className="border rounded p-3 mt-4">

    <ReceiptPreview
      sale={sale}
      amount={Number(amount)}
    />

    <button
      onClick={printReceipt}
      className="mt-4 bg-gray-900 text-white w-full py-2 rounded"
    >
      Print Receipt
    </button>

  </div>

)}

            </div>

        </div>

    );
}