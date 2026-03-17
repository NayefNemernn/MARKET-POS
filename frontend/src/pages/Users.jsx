import React, { useEffect, useState } from "react";
import api from "../api/axios";
import RequireAdmin from "../components/RequireAdmin";
import { motion } from "framer-motion";

export default function Users(){

const [users,setUsers] = useState([]);
const [search,setSearch] = useState("");
const [loading,setLoading] = useState(true);
const [showForm,setShowForm] = useState(false);

const [form,setForm] = useState({
username:"",
password:"",
role:"cashier"
});

const fetchUsers = async()=>{

try{
const res = await api.get("/users");
setUsers(res.data);
}catch(err){
console.error(err);
}finally{
setLoading(false);
}

};

useEffect(()=>{
fetchUsers();
},[]);

const handleCreate = async(e)=>{

e.preventDefault();

await api.post("/users",form);

setForm({username:"",password:"",role:"cashier"});
setShowForm(false);

fetchUsers();

};

const toggleStatus = async(user)=>{

await api.patch(`/users/${user._id}`,{
active:!user.active
});

fetchUsers();

};

const filtered = users.filter(u =>
u.username.toLowerCase().includes(search.toLowerCase())
);

if(loading){
return (
<div className="p-6 text-gray-500 dark:text-gray-400">
Loading users...
</div>
);
}

return(

<RequireAdmin>

<div className="p-6 space-y-8">

{/* HEADER */}

<div className="flex justify-between items-center">

<div>

<h1 className="text-3xl font-bold flex items-center gap-2">
👤 Staff Management
</h1>

<p className="text-gray-500 dark:text-gray-400 text-sm">
Manage cashiers and administrators
</p>

</div>

<button
onClick={()=>setShowForm(!showForm)}
className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition"
>
+ Add User
</button>

</div>


{/* SEARCH */}

<input
placeholder="Search staff..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="
w-full px-4 py-3 rounded-xl
bg-white dark:bg-[#141414]
border border-gray-200 dark:border-gray-700
text-gray-700 dark:text-gray-200
focus:ring-2 focus:ring-blue-500
outline-none
"
/>


{/* CREATE USER */}

{showForm && (

<form
onSubmit={handleCreate}
className="
p-6 rounded-3xl
bg-white dark:bg-[#141414]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]

grid md:grid-cols-4 gap-4
"
>

<input
placeholder="Username"
className="
border border-gray-200 dark:border-gray-700
rounded-lg px-3 py-2
bg-transparent
text-gray-700 dark:text-gray-200
"
value={form.username}
onChange={(e)=>setForm({...form,username:e.target.value})}
required
/>

<input
type="password"
placeholder="Password"
className="
border border-gray-200 dark:border-gray-700
rounded-lg px-3 py-2
bg-transparent
text-gray-700 dark:text-gray-200
"
value={form.password}
onChange={(e)=>setForm({...form,password:e.target.value})}
required
/>

<select
className="
border border-gray-200 dark:border-gray-700
rounded-lg px-3 py-2
bg-transparent
text-gray-700 dark:text-gray-200
"
value={form.role}
onChange={(e)=>setForm({...form,role:e.target.value})}
>

<option value="cashier">Cashier</option>
<option value="admin">Admin</option>

</select>

<button
className="bg-green-600 text-white rounded-xl hover:bg-green-700"
>
Create
</button>

</form>

)}


{/* USERS GRID */}

<div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

{filtered.map(user => (

<motion.div
key={user._id}
initial={{opacity:0,y:10}}
animate={{opacity:1,y:0}}
whileHover={{scale:1.04}}
className="
p-6 rounded-3xl

bg-white dark:bg-[#141414]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]

space-y-4
"
>

{/* AVATAR */}

<div className="flex items-center gap-3">

<div className="
w-12 h-12 rounded-full
bg-blue-100 dark:bg-blue-900
flex items-center justify-center
font-bold text-lg
">

{user.username.charAt(0).toUpperCase()}

</div>

<div>

<p className="font-semibold text-gray-800 dark:text-gray-200">
{user.username}
</p>

<p className="text-sm text-gray-500 dark:text-gray-400">
{user.role}
</p>

</div>

</div>


{/* STATUS */}

<div className="flex justify-between items-center">

<span className={`px-3 py-1 rounded-full text-sm ${
user.active
? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
}`}>
{user.active ? "Active" : "Disabled"}
</span>


<button
onClick={()=>toggleStatus(user)}
className={`px-4 py-1 rounded text-white ${
user.active
? "bg-red-600 hover:bg-red-700"
: "bg-green-600 hover:bg-green-700"
}`}
>

{user.active ? "Disable" : "Enable"}

</button>

</div>

</motion.div>

))}

</div>

</div>

</RequireAdmin>

)

}