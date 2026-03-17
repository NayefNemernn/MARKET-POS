import { useEffect, useState } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";

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

<>
{/* BACKDROP */}

<div
onClick={close}
className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
/>


{/* DRAWER */}

<motion.div
initial={{x:400}}
animate={{x:0}}
exit={{x:400}}
transition={{type:"spring", stiffness:260, damping:25}}
className="
fixed right-0 top-0 h-full w-[380px] z-50

bg-white dark:bg-[#141414]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]

p-6 flex flex-col
"
>


{/* HEADER */}

<div className="flex justify-between items-center mb-6">

<h2 className="text-xl font-semibold">
{customer} Payments
</h2>

<button
onClick={close}
className="
w-8 h-8 flex items-center justify-center
rounded-full hover:bg-gray-100 dark:hover:bg-[#1c1c1c]
"
>
✕
</button>

</div>


{/* LIST */}

<div className="flex-1 overflow-y-auto space-y-3">

{payments.length === 0 && (

<p className="text-gray-400 text-sm">
No payments yet
</p>

)}


{payments.map(p=>(

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
{p.method}
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


{/* FOOTER */}

<button
onClick={close}
className="
mt-6 py-2 rounded-xl
bg-gray-100 dark:bg-[#1c1c1c]
hover:bg-gray-200 dark:hover:bg-[#2a2a2a]
transition
"
>

Close

</button>

</motion.div>

</>

);

}