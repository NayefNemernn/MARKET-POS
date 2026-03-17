import React, { useEffect, useState } from "react";
import api from "../api/axios";
import RequireAdmin from "../components/RequireAdmin";
import { motion } from "framer-motion";
import { useCategoriesTranslation } from "../hooks/useCategoriesTranslation";

export default function Categories() {

const [categories,setCategories] = useState([]);
const [name,setName] = useState("");
const [search,setSearch] = useState("");
const [loading,setLoading] = useState(true);
const [error,setError] = useState("");

const t = useCategoriesTranslation();

const fetchCategories = async () => {

try{

const res = await api.get("/categories");
setCategories(Array.isArray(res.data) ? res.data : []);

}catch(err){

console.error(err);
setError(t.loadFailed);

}finally{

setLoading(false);

}

};

useEffect(()=>{
fetchCategories();
},[]);

const handleAdd = async(e)=>{
e.preventDefault();

if(!name.trim()) return;

try{

await api.post("/categories",{ name });

setName("");
fetchCategories();

}catch(err){

setError(err.response?.data?.message || t.createFailed);

}

};

const handleDelete = async(id)=>{

if(!window.confirm(t.deleteConfirm)) return;

try{

await api.delete(`/categories/${id}`);

setCategories(prev =>
prev.filter(c=>c._id !== id)
);

}catch{

alert(t.deleteFailed);

}

};

const filtered = categories.filter(c =>
c.name.toLowerCase().includes(search.toLowerCase())
);

if(loading){
return (
<div className="p-6 text-gray-500 dark:text-gray-400 animate-pulse">
{t.loading}
</div>
);
}

return(

<RequireAdmin>

<div className="p-6 space-y-8">

{/* HEADER */}

<div className="flex items-center justify-between">

<h1 className="text-3xl font-bold">
{t.title}
</h1>

<p className="text-gray-500 dark:text-gray-400">
{categories.length} {t.total}
</p>

</div>

{/* SEARCH */}

<input
placeholder={t.search}
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="
w-full px-4 py-3 rounded-xl
bg-white dark:bg-[#141414]
border border-gray-200 dark:border-gray-700
focus:ring-2 focus:ring-blue-500
outline-none
"
/>

{/* ADD CATEGORY */}

<form
onSubmit={handleAdd}
className="flex gap-3"
>

<input
value={name}
onChange={(e)=>setName(e.target.value)}
placeholder={t.newCategory}
className="
flex-1 px-4 py-3 rounded-xl
bg-white dark:bg-[#141414]
border border-gray-200 dark:border-gray-700
focus:ring-2 focus:ring-blue-500
outline-none
"
/>

<button
className="
px-6 rounded-xl
bg-blue-600 text-white
hover:bg-blue-700
active:scale-95
transition
"
>
{t.add}
</button>

</form>

{error && (
<p className="text-red-500">{error}</p>
)}

{/* CATEGORY GRID */}

<div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">

{filtered.map(cat => (

<motion.div
key={cat._id}
initial={{opacity:0,y:15}}
animate={{opacity:1,y:0}}
whileHover={{scale:1.04}}
className="
p-6 rounded-3xl
bg-white dark:bg-[#141414]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]

flex justify-between items-center
"
>

<span className="font-medium text-lg">
{cat.name}
</span>

<button
onClick={()=>handleDelete(cat._id)}
className="text-red-500 text-sm hover:text-red-600"
>
{t.delete}
</button>

</motion.div>

))}

</div>

</div>

</RequireAdmin>

);

}