import React, { useEffect, useState } from "react";
import { createSale } from "../api/sale.api";
import { createHoldSale, getHoldSaleNames } from "../api/holdSale.api";
import { useCart } from "../hooks/useCart";
import Receipt from "../pages/Receipt";
import { useTranslation } from "../hooks/useTranslation";

export default function CheckoutModal({ cart, total, close }) {

const { clearCart } = useCart();
const { t } = useTranslation();

const [method,setMethod] = useState("cash");
const [amount,setAmount] = useState("");
const [change,setChange] = useState(0);

const [customerName,setCustomerName] = useState("");
const [phone,setPhone] = useState("");

const [nameSuggestions,setNameSuggestions] = useState([]);
const [showSuggestions,setShowSuggestions] = useState(false);

const [receipt,setReceipt] = useState(null);

useEffect(()=>{
getHoldSaleNames().then(setNameSuggestions);
},[]);

useEffect(()=>{

const received=parseFloat(amount);

if(!received){
setChange(0);
return;
}

const diff=received-total;
setChange(diff>0?diff:0);

},[amount,total]);

const isNewCustomer=
method==="later" &&
customerName &&
!nameSuggestions.includes(customerName);

const completeSale=async()=>{

try{

if(cart.length===0){
alert(t.cartEmpty);
return;
}

/* PAY LATER */

if(method==="later"){

if(!customerName.trim()){
alert(t.enterCustomerName);
return;
}

await createHoldSale({

customerName,
phone:isNewCustomer?phone:"",

items:cart.map(i=>({
productId:i.productId,
name:i.name,
price:i.price,
quantity:i.quantity
})),

total

});

clearCart();
close();
return;

}

/* NORMAL SALE */

const payload={

items:cart.map(i=>({
productId:i.productId,
quantity:i.quantity
})),

paymentMethod:method

};

const res=await createSale(payload);

setReceipt(res.sale);
clearCart();

}catch(err){

alert(err.response?.data?.message||t.checkoutFailed);

}

};

/* RECEIPT */

if(receipt){

return(

<div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50">

<div className="
bg-gray-100 dark:bg-[#141414]
rounded-3xl p-6 w-[360px]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
">

<Receipt sale={receipt}/>

<div className="flex gap-3 mt-4">

<button
onClick={()=>window.print()}
className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl"
>
{t.print}
</button>

<button
onClick={()=>{setReceipt(null);close();}}
className="flex-1 bg-gray-200 dark:bg-[#1c1c1c] py-2 rounded-xl"
>
{t.close}
</button>

</div>

</div>

</div>

)

}

return(

<div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50">

<div className="
w-[420px]
bg-gray-100 dark:bg-[#141414]
rounded-3xl p-6

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
">

{/* HEADER */}

<div className="flex justify-between items-center mb-6">

<h2 className="font-semibold text-lg">
{t.completePayment}
</h2>

<button onClick={close}>✕</button>

</div>

{/* TOTAL */}

<div className="
bg-blue-600 text-white
rounded-2xl p-6 text-center mb-6
shadow-[0_0_20px_rgba(59,130,246,0.6)]
">

<p className="text-blue-200 text-sm">
{t.totalAmount}
</p>

<p className="text-3xl font-bold">
${total.toFixed(2)}
</p>

</div>

{/* PAYMENT METHODS */}

<p className="text-sm text-gray-500 mb-2">
{t.paymentMethod}
</p>

<div className="flex gap-3 mb-4">

<button
onClick={()=>setMethod("cash")}
className={`flex-1 py-3 rounded-xl
${method==="cash"
?"bg-green-600 text-white"
:"bg-gray-200 dark:bg-[#1c1c1c]"}`}
>
{t.cash}
</button>

<button
onClick={()=>setMethod("card")}
className={`flex-1 py-3 rounded-xl
${method==="card"
?"bg-blue-600 text-white"
:"bg-gray-200 dark:bg-[#1c1c1c]"}`}
>
{t.card}
</button>

<button
onClick={()=>setMethod("later")}
className={`flex-1 py-3 rounded-xl
${method==="later"
?"bg-purple-600 text-white"
:"bg-gray-200 dark:bg-[#1c1c1c]"}`}
>
{t.payLater}
</button>

</div>

{/* CUSTOMER NAME */}

{method==="later" && (

<div className="relative mb-3">

<input
value={customerName}
onChange={(e)=>{
setCustomerName(e.target.value);
setShowSuggestions(true);
}}
placeholder={t.customerName}
className="w-full bg-gray-200 dark:bg-[#1c1c1c] rounded-lg px-3 py-2 outline-none"
/>

{showSuggestions && customerName && (

<div className="absolute bg-white dark:bg-[#1c1c1c] w-full rounded shadow max-h-40 overflow-y-auto">

{nameSuggestions
.filter(n=>n.toLowerCase().includes(customerName.toLowerCase()))
.map(name=>(
<div
key={name}
onClick={()=>{
setCustomerName(name);
setShowSuggestions(false);
}}
className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer"
>
{name}
</div>
))}

</div>

)}

</div>

)}

{/* PHONE */}

{isNewCustomer && (

<input
value={phone}
onChange={(e)=>setPhone(e.target.value)}
placeholder={t.phone}
className="w-full bg-gray-200 dark:bg-[#1c1c1c] rounded-lg px-3 py-2 mb-4 outline-none"
/>

)}

{/* CASH */}

{method==="cash" && (

<>

<input
value={amount}
onChange={(e)=>setAmount(e.target.value)}
placeholder={t.amountReceived}
className="w-full bg-gray-200 dark:bg-[#1c1c1c] rounded-lg px-3 py-2 mb-3 outline-none"
/>

<div className="flex justify-between bg-green-100 dark:bg-green-900/30 rounded-lg px-4 py-3 mb-3">

<span>{t.change}</span>
<span>${change.toFixed(2)}</span>

</div>

{/* QUICK CASH */}

<div className="grid grid-cols-4 gap-2 mb-4">

<button onClick={()=>setAmount(20)} className="bg-gray-200 dark:bg-[#1c1c1c] py-2 rounded-lg">$20</button>

<button onClick={()=>setAmount(50)} className="bg-gray-200 dark:bg-[#1c1c1c] py-2 rounded-lg">$50</button>

<button onClick={()=>setAmount(100)} className="bg-gray-200 dark:bg-[#1c1c1c] py-2 rounded-lg">$100</button>

<button onClick={()=>setAmount(total)} className="bg-gray-200 dark:bg-[#1c1c1c] py-2 rounded-lg">
{t.exact}
</button>

</div>

</>

)}

<button
onClick={completeSale}
className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-semibold text-white"
>
{t.completeSale}
</button>

</div>

</div>

);

}