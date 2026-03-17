import { useEffect, useState } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";

export default function RecentPayments() {

const [payments,setPayments] = useState([]);
const [filter,setFilter] = useState("");

useEffect(()=>{
load();
},[]);

const load = async()=>{
const res = await api.get("/hold-sales/payments/recent");
setPayments(res.data);
};

const customers = [
...new Set(payments.map(p => p.customerName))
];

const filtered = filter
? payments.filter(p => p.customerName === filter)
: payments;

return(

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="
p-6 h-full rounded-3xl
bg-white dark:bg-[#141414]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
"
>

{/* HEADER */}

<div className="flex justify-between items-center mb-4">

<h3 className="font-semibold text-lg">
Recent Payments
</h3>

<select
value={filter}
onChange={(e)=>setFilter(e.target.value)}
className="
text-sm px-3 py-1 rounded-lg
bg-gray-50 dark:bg-[#1c1c1c]
border border-gray-200 dark:border-gray-700
"
>

<option value="">
All Customers
</option>

{customers.map(name=>(
<option key={name} value={name}>
{name}
</option>
))}

</select>

</div>


{/* EMPTY */}

{filtered.length === 0 && (

<p className="text-gray-400 text-sm">
No recent payments
</p>

)}


{/* LIST */}

<div className="space-y-3">

{filtered.map(p => (

<div
key={p._id}
className="
flex justify-between items-center
border-b border-gray-200 dark:border-gray-700
pb-3
"
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

</motion.div>

);

}