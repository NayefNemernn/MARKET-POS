import { useState } from "react";
import api from "../api/axios";
import ReceiptPreview from "./ReceiptPreview";
import { motion } from "framer-motion";

export default function ReceivePaymentModal({ sale, close, reload }) {

const [amount,setAmount] = useState("");
const [method,setMethod] = useState("cash");
const [showReceipt,setShowReceipt] = useState(false);

const percent = (p)=>{
const value = (sale.balance * p) / 100;
setAmount(value.toFixed(2));
};

const pay = async()=>{

await api.post(`/hold-sales/${sale._id}/pay`,{
amount:Number(amount),
method
});

setShowReceipt(true);

reload();

};

const printReceipt = ()=>{

const content = document.getElementById("receipt").innerHTML;

const win = window.open("", "", "width=400,height=600");

win.document.write(`
<html>
<head>
<title>Receipt</title>
<style>
body{
font-family:Arial;
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

return(

<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

<motion.div
initial={{scale:0.9,opacity:0}}
animate={{scale:1,opacity:1}}
className="
w-[380px] p-6 space-y-4 rounded-3xl

bg-white dark:bg-[#141414]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
"
>

<h2 className="text-lg font-semibold">
Receive Payment
</h2>


{/* BALANCE */}

<div className="bg-orange-500 text-white p-4 rounded-xl text-center">

<p>Outstanding Balance</p>

<h2 className="text-3xl font-bold">
${sale.balance.toFixed(2)}
</h2>

</div>


{/* AMOUNT */}

<input
value={amount}
onChange={(e)=>setAmount(e.target.value)}
className="
w-full px-3 py-2 rounded-xl
bg-gray-50 dark:bg-[#1c1c1c]
border border-gray-200 dark:border-gray-700
outline-none focus:ring-2 focus:ring-green-500
"
/>


{/* QUICK PERCENT */}

<div className="grid grid-cols-3 gap-2">

<button
onClick={()=>percent(25)}
className="
bg-gray-100 dark:bg-[#1c1c1c]
hover:bg-gray-200 dark:hover:bg-[#2a2a2a]
rounded-lg py-1 transition
"
>
25%
</button>

<button
onClick={()=>percent(50)}
className="
bg-gray-100 dark:bg-[#1c1c1c]
hover:bg-gray-200 dark:hover:bg-[#2a2a2a]
rounded-lg py-1 transition
"
>
50%
</button>

<button
onClick={()=>percent(100)}
className="
bg-gray-100 dark:bg-[#1c1c1c]
hover:bg-gray-200 dark:hover:bg-[#2a2a2a]
rounded-lg py-1 transition
"
>
100%
</button>

</div>


{/* METHOD */}

<select
value={method}
onChange={(e)=>setMethod(e.target.value)}
className="
w-full px-3 py-2 rounded-xl
bg-gray-50 dark:bg-[#1c1c1c]
border border-gray-200 dark:border-gray-700
"
>

<option value="cash">💵 Cash</option>
<option value="card">💳 Card</option>

</select>


{/* ACTION */}

<button
onClick={pay}
className="
bg-green-600 hover:bg-green-700
text-white w-full py-2 rounded-xl transition
"
>
Record Payment
</button>


<button
onClick={close}
className="
w-full py-2 rounded-xl
bg-gray-100 dark:bg-[#1c1c1c]
hover:bg-gray-200 dark:hover:bg-[#2a2a2a]
transition
"
>
Cancel
</button>


{/* RECEIPT */}

{showReceipt && (

<div className="
border border-gray-200 dark:border-gray-700
rounded-xl p-3 mt-4
">

<ReceiptPreview
sale={sale}
amount={Number(amount)}
/>

<button
onClick={printReceipt}
className="
mt-4 bg-gray-900 text-white
w-full py-2 rounded-xl
"
>
Print Receipt
</button>

</div>

)}

</motion.div>

</div>

);

}