import React, { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import RequireAdmin from "../components/RequireAdmin";
import { motion } from "framer-motion";

import {
 ResponsiveContainer,
 LineChart,
 Line,
 CartesianGrid,
 XAxis,
 YAxis,
 Tooltip,
 BarChart,
 Bar
} from "recharts";

export default function Reports(){

const [sales,setSales] = useState([]);
const [loading,setLoading] = useState(true);
const [mode,setMode] = useState("daily");

useEffect(()=>{

const load = async()=>{
 try{
  const res = await api.get("/sales");
  setSales(res.data);
 }catch(err){
  console.error(err);
 }finally{
  setLoading(false);
 }
};

load();

},[]);


/* =====================
 BASIC METRICS
===================== */

const totalRevenue = useMemo(()=>{
 return sales.reduce((sum,s)=>sum+s.total,0);
},[sales]);

const averageSale = useMemo(()=>{
 return sales.length ? totalRevenue / sales.length : 0;
},[sales,totalRevenue]);


/* =====================
 DAILY / MONTHLY CHART
===================== */

const chartData = useMemo(()=>{

const map = {};

sales.forEach(sale=>{

 const d = new Date(sale.createdAt);

 let key;

 if(mode==="daily"){
  key = d.toLocaleDateString();
 }else{
  key = `${d.getMonth()+1}/${d.getFullYear()}`;
 }

 if(!map[key]){
  map[key]={date:key,revenue:0};
 }

 map[key].revenue += sale.total;

});

return Object.values(map);

},[sales,mode]);


/* =====================
 TOP PRODUCTS
===================== */

const topProducts = useMemo(()=>{

const map = {};

sales.forEach(sale=>{

 sale.items.forEach(item=>{

  const name = item.name || "Unknown";

  if(!map[name]){
   map[name] = {name, qty:0};
  }

  map[name].qty += item.quantity;

 });

});

return Object.values(map)
.sort((a,b)=>b.qty-a.qty)
.slice(0,5);

},[sales]);


/* =====================
 HOURLY SALES
===================== */

const hourlySales = useMemo(()=>{

const map = {};

sales.forEach(sale=>{

 const hour = new Date(sale.createdAt).getHours();

 if(!map[hour]){
  map[hour] = {hour:`${hour}:00`, sales:0};
 }

 map[hour].sales += sale.total;

});

return Object.values(map);

},[sales]);


/* =====================
 PROFIT ANALYTICS
===================== */

const profitData = useMemo(()=>{

let revenue = 0;

sales.forEach(sale=>{
 sale.items.forEach(item=>{
  revenue += item.price * item.quantity;
 });
});

return {
 revenue,
 cost:0,
 profit:revenue
};

},[sales]);


/* =====================
 PAY LATER
===================== */

const payLaterStats = useMemo(()=>{

let credit = 0;

sales.forEach(sale=>{
 if(sale.paymentMethod === "paylater"){
  credit += sale.total;
 }
});

return {
 totalCredit:credit
};

},[sales]);


/* =====================
 LOADING
===================== */

if(loading){
 return(
  <div className="p-10 text-center text-gray-500">
   Loading Reports...
  </div>
 );
}


/* =====================
 UI
===================== */

return(

<RequireAdmin>

<div className="p-6 bg-gray-100 min-h-screen space-y-8">


{/* HEADER */}

<div className="flex justify-between items-center">

<div>

<h1 className="text-3xl font-bold">
📊 Sales Analytics
</h1>

<p className="text-gray-500">
Advanced POS sales dashboard
</p>

</div>


<div className="flex gap-2">

<button
onClick={()=>setMode("daily")}
className={`px-4 py-2 rounded ${
mode==="daily"
? "bg-blue-600 text-white"
: "bg-white"
}`}
>
Daily
</button>

<button
onClick={()=>setMode("monthly")}
className={`px-4 py-2 rounded ${
mode==="monthly"
? "bg-blue-600 text-white"
: "bg-white"
}`}
>
Monthly
</button>

</div>

</div>


{/* KPI */}

<div className="grid grid-cols-3 gap-6">

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="bg-white p-6 rounded-xl shadow"
>

<p className="text-gray-500">
Total Sales
</p>

<p className="text-3xl font-bold">
{sales.length}
</p>

</motion.div>


<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:0.1}}
className="bg-white p-6 rounded-xl shadow"
>

<p className="text-gray-500">
Revenue
</p>

<p className="text-3xl font-bold text-green-600">
${totalRevenue.toFixed(2)}
</p>

</motion.div>


<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:0.2}}
className="bg-white p-6 rounded-xl shadow"
>

<p className="text-gray-500">
Average Sale
</p>

<p className="text-3xl font-bold">
${averageSale.toFixed(2)}
</p>

</motion.div>

</div>


{/* REVENUE TREND */}

<div className="bg-white p-6 rounded-xl shadow">

<h2 className="text-xl font-semibold mb-4">
Revenue Trend
</h2>

<ResponsiveContainer width="100%" height={300}>

<LineChart data={chartData}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="date"/>

<YAxis/>

<Tooltip/>

<Line
type="monotone"
dataKey="revenue"
stroke="#3b82f6"
strokeWidth={3}
/>

</LineChart>

</ResponsiveContainer>

</div>


{/* PROFIT */}

<div className="grid grid-cols-3 gap-6">

<div className="bg-white p-6 rounded-xl shadow">

<p className="text-gray-500">
Revenue
</p>

<p className="text-2xl font-bold text-green-600">
${profitData.revenue.toFixed(2)}
</p>

</div>

<div className="bg-white p-6 rounded-xl shadow">

<p className="text-gray-500">
Cost
</p>

<p className="text-2xl font-bold text-red-500">
${profitData.cost.toFixed(2)}
</p>

</div>

<div className="bg-white p-6 rounded-xl shadow">

<p className="text-gray-500">
Profit
</p>

<p className="text-2xl font-bold text-indigo-600">
${profitData.profit.toFixed(2)}
</p>

</div>

</div>


{/* TOP PRODUCTS */}

<div className="bg-white p-6 rounded-xl shadow">

<h2 className="text-xl font-semibold mb-4">
Top Selling Products
</h2>

<ResponsiveContainer width="100%" height={250}>

<BarChart data={topProducts}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="name"/>

<YAxis/>

<Tooltip/>

<Bar dataKey="qty" fill="#6366f1"/>

</BarChart>

</ResponsiveContainer>

</div>


{/* HOURLY SALES */}

<div className="bg-white p-6 rounded-xl shadow">

<h2 className="text-xl font-semibold mb-4">
Hourly Sales Activity
</h2>

<ResponsiveContainer width="100%" height={250}>

<BarChart data={hourlySales}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="hour"/>

<YAxis/>

<Tooltip/>

<Bar dataKey="sales" fill="#f59e0b"/>

</BarChart>

</ResponsiveContainer>

</div>


{/* PAY LATER */}

<div className="bg-white p-6 rounded-xl shadow">

<h2 className="text-xl font-semibold mb-4">
Pay Later / Credit
</h2>

<p className="text-3xl font-bold text-red-600">
${payLaterStats.totalCredit.toFixed(2)}
</p>

</div>


{/* TRANSACTION TABLE */}

<div className="bg-white rounded-xl shadow overflow-hidden">

<div className="p-4 border-b">

<h2 className="text-xl font-semibold">
Transaction History
</h2>

</div>

<table className="w-full">

<thead className="bg-gray-50">

<tr>

<th className="p-4 text-left">Date</th>
<th className="p-4 text-center">Items</th>
<th className="p-4 text-right">Total</th>
<th className="p-4 text-center">Payment</th>

</tr>

</thead>

<tbody>

{sales.map(sale=>(

<tr
key={sale._id}
className="border-t hover:bg-gray-50"
>

<td className="p-4">
{new Date(sale.createdAt).toLocaleString()}
</td>

<td className="p-4 text-center">
{sale.items.reduce((s,i)=>s+i.quantity,0)}
</td>

<td className="p-4 text-right font-semibold">
${sale.total.toFixed(2)}
</td>

<td className="p-4 text-center">

<span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">

{sale.paymentMethod}

</span>

</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

</RequireAdmin>

);

}