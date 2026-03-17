import { useEffect, useState } from "react";
import api from "../api/axios";

import ReceivePaymentModal from "../components/ReceivePaymentModal";
import RecentPayments from "../components/RecentPayments";
import Avatar from "../components/Avatar";
import EditCustomerModal from "../components/EditCustomerModal";
import CustomerPaymentsDrawer from "../components/CustomerPaymentsDrawer";

import { motion } from "framer-motion";

import { usePayLaterTranslation } from "../hooks/usePayLaterTranslation";

export default function PayLater() {

const t = usePayLaterTranslation();

const [sales,setSales] = useState([]);
const [search,setSearch] = useState("");

const [selected,setSelected] = useState(null);
const [editCustomer,setEditCustomer] = useState(null);
const [drawerCustomer,setDrawerCustomer] = useState(null);

const [editingLimit,setEditingLimit] = useState(null);
const [newLimit,setNewLimit] = useState("");

useEffect(()=>{ load(); },[]);

const load = async()=>{
const res = await api.get("/hold-sales");
setSales(res.data);
};

const filtered = sales.filter(s =>
s.customerName.toLowerCase().includes(search.toLowerCase())
);

const totalOutstanding = filtered.reduce(
(sum,s)=>sum+s.balance,
0
);


/* UPDATE CREDIT LIMIT */

const updateLimit = async(id)=>{

await api.patch(`/hold-sales/${id}/limit`,{
creditLimit:Number(newLimit)
});

setEditingLimit(null);
load();

};


/* ======================
UI
====================== */

return(

<div className="p-6 grid grid-cols-12 gap-6 bg-gray-100 dark:bg-[#0f0f0f] min-h-screen">


{/* LEFT SIDE */}

<div className="col-span-9 space-y-6">


{/* HEADER */}

<div>

<h1 className="text-3xl font-bold">
{t.title}
</h1>

<p className="text-gray-500 dark:text-gray-400 text-sm">
{t.subtitle}
</p>

</div>


{/* SUMMARY */}

<div className="grid grid-cols-3 gap-6">

<KpiCard
title={t.accountsDebt}
value={filtered.length}
/>

<KpiCard
title={t.totalOutstanding}
value={`$${totalOutstanding.toFixed(2)}`}
color="text-orange-600"
/>

<KpiCard
title={t.paymentsMonth}
value={filtered.length}
/>

</div>


{/* SEARCH */}

<Card>

<input
placeholder={t.searchCustomers}
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="
w-full px-4 py-3 rounded-xl
bg-gray-50 dark:bg-[#1c1c1c]
border border-gray-200 dark:border-gray-700
text-gray-700 dark:text-gray-200
focus:ring-2 focus:ring-blue-500
outline-none
"
/>

</Card>


{/* TABLE */}

<Card>

<table className="w-full">

<thead className="bg-gray-50 dark:bg-[#1c1c1c]">

<tr>

<th className="px-6 py-3 text-left">{t.customer}</th>
<th className="px-6 py-3 text-left">{t.creditLimit}</th>
<th className="px-6 py-3 text-left">{t.debt}</th>
<th className="px-6 py-3 text-left">{t.available}</th>
<th className="px-6 py-3 text-left">{t.actions}</th>

</tr>

</thead>


<tbody>

{filtered.map(s=>{

const limit = s.creditLimit || 500;
const available = limit - s.balance;

return(

<tr
key={s._id}
className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
>


{/* CUSTOMER */}

<td className="px-6 py-4 flex items-center gap-3">

<button
onClick={(e)=>{
e.stopPropagation();
setEditCustomer(s);
}}
className="hover:scale-105 transition"
>

<Avatar name={s.customerName} className="cursor-pointer"/>

</button>


<button
onClick={()=>setDrawerCustomer(s)}
className="text-left"
>

<p className="font-medium">
{s.customerName}
</p>

{s.phone && (

<p className="text-xs text-gray-400">
{s.phone}
</p>

)}

</button>

</td>


{/* CREDIT LIMIT */}

<td className="px-6 py-4">

{editingLimit === s._id ? (

<div className="flex gap-2">

<input
type="number"
value={newLimit}
onChange={(e)=>setNewLimit(e.target.value)}
className="
border border-gray-300 dark:border-gray-700
rounded px-2 py-1 w-24
bg-transparent
"
/>

<button
onClick={()=>updateLimit(s._id)}
className="bg-green-600 text-white px-2 rounded"
>
{t.save}
</button>

</div>

):( 

<button
onClick={()=>{
setEditingLimit(s._id);
setNewLimit(limit);
}}
className="hover:underline"
>

${limit.toFixed(2)}

</button>

)}

</td>


{/* BALANCE */}

<td className="px-6 py-4 text-orange-500 font-semibold">
${s.balance.toFixed(2)}
</td>


{/* AVAILABLE */}

<td className="px-6 py-4 text-green-600">
${available.toFixed(2)}
</td>


{/* ACTIONS */}

<td className="px-6 py-4 flex gap-2">

<button
onClick={()=>setSelected(s)}
className="
bg-green-100 dark:bg-green-900
text-green-700 dark:text-green-300
px-3 py-1 rounded hover:bg-green-200
"
>

{t.receivePayment}

</button>

</td>

</tr>

)

})}

</tbody>

</table>

</Card>

</div>


{/* RIGHT PANEL */}

<div className="col-span-3">

<RecentPayments/>

</div>


{/* MODALS */}

{selected && (

<ReceivePaymentModal
sale={selected}
close={()=>setSelected(null)}
reload={load}
/>

)}


{editCustomer && (

<EditCustomerModal
sale={editCustomer}
close={()=>setEditCustomer(null)}
reload={load}
/>

)}


{drawerCustomer && (

<CustomerPaymentsDrawer
customer={drawerCustomer}
close={()=>setDrawerCustomer(null)}
reload={load}
/>

)}

</div>

);

}


/* KPI CARD */

function KpiCard({title,value,color}){

return(

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="
p-6 rounded-3xl
bg-white dark:bg-[#141414]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
"
>

<p className="text-gray-500 dark:text-gray-400 text-sm">
{title}
</p>

<p className={`text-2xl font-bold mt-2 ${color || ""}`}>
{value}
</p>

</motion.div>

);

}


/* CARD */

function Card({children}){

return(

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="
p-6 rounded-3xl
bg-white dark:bg-[#141414]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
"
>

{children}

</motion.div>

);

}