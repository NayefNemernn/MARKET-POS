import { useEffect, useState } from "react";
import api from "../api/axios";

export default function CustomerPaymentsDrawer({ customer, close }) {

const [payments,setPayments] = useState([]);

useEffect(()=>{

load();

},[]);

const load = async()=>{

const res = await api.get(`/hold-sales/payments/customer/${customer}`);

setPayments(res.data);

};

return(

<div className="fixed right-0 top-0 h-full w-[350px] bg-white shadow-xl p-6">

<h2 className="text-xl font-semibold mb-4">
{customer} Payments
</h2>

{payments.map(p=>(
<div key={p._id} className="flex justify-between border-b py-2">

<div>

<p>{p.method}</p>

<p className="text-xs text-gray-400">
{new Date(p.createdAt).toLocaleString()}
</p>

</div>

<p className="text-green-600 font-semibold">
+${p.amount}
</p>

</div>
))}

<button
onClick={close}
className="mt-4 border w-full py-2 rounded"
>

Close

</button>

</div>

);

}