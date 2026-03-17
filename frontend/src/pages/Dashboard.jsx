import { useEffect, useState } from "react";
import { getDashboardStats } from "../api/dashboard.api";
import { motion } from "framer-motion";
import {
LineChart,
Line,
CartesianGrid,
XAxis,
YAxis,
Tooltip,
ResponsiveContainer
} from "recharts";

import { useDashboardTranslation } from "../hooks/useDashboardTranslation";

export default function Dashboard() {

const t = useDashboardTranslation();

const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);

const [salesMode,setSalesMode] = useState("today");

const [showSales, setShowSales] = useState(true);
const [showTop, setShowTop] = useState(true);
const [showLow, setShowLow] = useState(true);
const [showReceipts, setShowReceipts] = useState(true);

const salesValue =
salesMode === "today"
? stats?.todaySales
: stats?.weekSales;


/* LOAD DASHBOARD */

useEffect(()=>{

const load = async()=>{

try{

const data = await getDashboardStats();
setStats(data);

}catch(err){

console.error(err);

} finally {

setLoading(false);

}

};

load();

},[]);


/* LOADING */

if(loading){

return(
<div className="p-6 animate-pulse text-gray-500">
{t.loading}
</div>
);

}


/* UI */

return(

<div className="space-y-10 p-6">

{/* HEADER */}

<div>

<h1 className="text-3xl font-bold">
{t.title}
</h1>

<p className="text-gray-500 dark:text-gray-400">
{t.subtitle}
</p>

</div>


{/* SALES MODE SWITCH */}

<div className="flex gap-2">

<button
onClick={()=>setSalesMode("today")}
className={`
px-4 py-2 rounded-xl text-sm transition
${salesMode==="today"
? "bg-blue-600 text-white"
: "bg-gray-200 dark:bg-[#1c1c1c]"}
`}
>
{t.today}
</button>

<button
onClick={()=>setSalesMode("week")}
className={`
px-4 py-2 rounded-xl text-sm transition
${salesMode==="week"
? "bg-blue-600 text-white"
: "bg-gray-200 dark:bg-[#1c1c1c]"}
`}
>
{t.week}
</button>

</div>


{/* KPI CARDS */}

<div className="grid grid-cols-1 md:grid-cols-4 gap-6">

<KpiCard
title={salesMode==="today" ? t.todaySales : t.weekSales}
value={
<motion.span
key={salesValue}
initial={{opacity:0,y:10}}
animate={{opacity:1,y:0}}
>
${Number(salesValue || 0).toFixed(2)}
</motion.span>
}
/>

<KpiCard
title={t.products}
value={stats?.totalProducts ?? 0}
/>

<KpiCard
title={t.lowStock}
value={stats?.lowStock ?? 0}
danger
/>

<KpiCard
title={t.customers}
value={stats?.customers ?? 0}
/>

</div>


{/* TOGGLES */}

<div className="flex flex-wrap gap-3">

<Toggle label={t.salesChart} state={showSales} set={setShowSales}/>
<Toggle label={t.topProducts} state={showTop} set={setShowTop}/>
<Toggle label={t.lowStock} state={showLow} set={setShowLow}/>
<Toggle label={t.receipts} state={showReceipts} set={setShowReceipts}/>

</div>


{/* SALES CHART */}

{showSales && (

<AnimatedCard title={t.salesWeek}>

<ResponsiveContainer width="100%" height={300}>

<LineChart data={stats?.salesChart || []}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="day"/>

<YAxis/>

<Tooltip/>

<Line
type="monotone"
dataKey="sales"
stroke="#3b82f6"
strokeWidth={3}
/>

</LineChart>

</ResponsiveContainer>

</AnimatedCard>

)}


{/* GRID */}

<div className="grid md:grid-cols-3 gap-6">


{/* TOP PRODUCTS */}

{showTop && (

<AnimatedCard title={t.topProducts}>

{stats?.topProducts?.map(p=>(

<div
key={p._id}
className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
>

<span>{p.name}</span>
<span className="font-semibold">{p.sold}</span>

</div>

))}

</AnimatedCard>

)}


{/* LOW STOCK */}

{showLow && (

<AnimatedCard title={t.lowStockProducts}>

{stats?.lowStockProducts?.map(p=>(

<div
key={p._id}
className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
>

<span>{p.name}</span>
<span className="text-red-500">{p.stock}</span>

</div>

))}

</AnimatedCard>

)}


{/* RECENT RECEIPTS */}

{showReceipts && (

<AnimatedCard title={t.recentReceipts}>

{stats?.recentSales?.map(r=>(

<div
key={r._id}
className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
>

<span>{r.customerName || t.walkIn}</span>

<span className="font-semibold">
${r.total}
</span>

</div>

))}

</AnimatedCard>

)}

</div>

</div>

);

}


/* KPI CARD */

function KpiCard({title,value,danger}){

return(

<motion.div
whileHover={{scale:1.05}}
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

<p className={`text-2xl font-bold mt-2 ${danger?"text-red-500":""}`}>
{value}
</p>

</motion.div>

);

}


/* ANALYTICS CARD */

function AnimatedCard({title,children}){

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

<h3 className="font-semibold mb-4">
{title}
</h3>

{children}

</motion.div>

);

}


/* TOGGLE */

function Toggle({label,state,set}){

return(

<button
onClick={()=>set(!state)}
className={`
px-4 py-2 rounded-xl text-sm transition
${state
? "bg-blue-600 text-white"
: "bg-gray-200 dark:bg-[#1c1c1c]"}
`}
>

{label}

</button>

);

}