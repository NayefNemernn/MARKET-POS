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

import { useReportsTranslation } from "../hooks/useReportsTranslation";

export default function Reports(){

const t = useReportsTranslation();

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

  const name = item.name || t.unknown;

  if(!map[name]){
   map[name] = {name, qty:0};
  }

  map[name].qty += item.quantity;

 });

});

return Object.values(map)
.sort((a,b)=>b.qty-a.qty)
.slice(0,5);

},[sales,t]);


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


if(loading){
 return(
  <div className="p-10 text-center text-gray-500 dark:text-gray-400">
   {t.loading}
  </div>
 );
}

return(

<RequireAdmin>

<div className="p-6 min-h-screen space-y-8 bg-gray-100 dark:bg-[#0f0f0f]">


{/* HEADER */}

<div className="flex justify-between items-center">

<div>

<h1 className="text-3xl font-bold">
📊 {t.title}
</h1>

<p className="text-gray-500 dark:text-gray-400">
{t.subtitle}
</p>

</div>


<div className="flex gap-2">

<button
onClick={()=>setMode("daily")}
className={`px-4 py-2 rounded-xl transition ${
mode==="daily"
? "bg-blue-600 text-white"
: "bg-white dark:bg-[#141414] text-gray-700 dark:text-gray-200"
}`}
>
{t.daily}
</button>

<button
onClick={()=>setMode("monthly")}
className={`px-4 py-2 rounded-xl transition ${
mode==="monthly"
? "bg-blue-600 text-white"
: "bg-white dark:bg-[#141414] text-gray-700 dark:text-gray-200"
}`}
>
{t.monthly}
</button>

</div>

</div>


{/* KPI */}

<div className="grid grid-cols-3 gap-6">

<KpiCard title={t.totalSales} value={sales.length}/>

<KpiCard
title={t.revenue}
value={<span className="text-green-600">${totalRevenue.toFixed(2)}</span>}
/>

<KpiCard
title={t.averageSale}
value={`$${averageSale.toFixed(2)}`}
/>

</div>


<Card title={t.revenueTrend}>
<ResponsiveContainer width="100%" height={300}>
<LineChart data={chartData}>
<CartesianGrid strokeDasharray="3 3"/>
<XAxis dataKey="date"/>
<YAxis/>
<Tooltip/>
<Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3}/>
</LineChart>
</ResponsiveContainer>
</Card>


<Card title={t.topProducts}>
<ResponsiveContainer width="100%" height={250}>
<BarChart data={topProducts}>
<CartesianGrid strokeDasharray="3 3"/>
<XAxis dataKey="name"/>
<YAxis/>
<Tooltip/>
<Bar dataKey="qty" fill="#6366f1"/>
</BarChart>
</ResponsiveContainer>
</Card>


<Card title={t.hourlySales}>
<ResponsiveContainer width="100%" height={250}>
<BarChart data={hourlySales}>
<CartesianGrid strokeDasharray="3 3"/>
<XAxis dataKey="hour"/>
<YAxis/>
<Tooltip/>
<Bar dataKey="sales" fill="#f59e0b"/>
</BarChart>
</ResponsiveContainer>
</Card>


<Card title={t.payLater}>
<p className="text-3xl font-bold text-red-600">
${payLaterStats.totalCredit.toFixed(2)}
</p>
</Card>


<div className="
rounded-3xl
bg-white dark:bg-[#141414]
shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
overflow-hidden
">

<div className="p-6 border-b border-gray-200 dark:border-gray-700">
<h2 className="text-xl font-semibold">
{t.transactionHistory}
</h2>
</div>

<table className="w-full">

<thead className="bg-gray-50 dark:bg-[#1c1c1c]">

<tr>
<th className="p-4 text-left">{t.date}</th>
<th className="p-4 text-center">{t.items}</th>
<th className="p-4 text-right">{t.total}</th>
<th className="p-4 text-center">{t.payment}</th>
</tr>

</thead>

<tbody>

{sales.map(sale=>(

<tr
key={sale._id}
className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
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

<span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
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


/* KPI CARD */

function KpiCard({title,value}){

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

<p className="text-2xl font-bold mt-2">
{value}
</p>

</motion.div>

);

}


/* ANALYTICS CARD */

function Card({title,children}){

return(

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="
p-6 rounded-3xl
bg-white dark:bg-[#141414]
shadow-[10px_10px_25px_#d1d5db,-10px_-10px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
"
>

<h3 className="font-semibold mb-4">
{title}
</h3>

{children}

</motion.div>

);
}