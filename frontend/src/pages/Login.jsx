import React, { useState, useEffect } from "react";
import { login as loginApi } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
import { FaUserTie, FaUser, FaUserShield } from "react-icons/fa";
import ThemeToggle from "../components/ThemeToggle";
export default function Login(){

const { login } = useAuth();

const users = [
{username:"Admin", icon:<FaUserShield/>},
{username:"Cashier1", icon:<FaUser/>},
{username:"abbas", icon:<FaUserTie/>}
];

const [selectedUser,setSelectedUser]=useState(null);
const [pin,setPin]=useState("");
const [error,setError]=useState("");



/* LOGIN */

const submitLogin = async ()=>{

if(!selectedUser) return;

try{

const data = await loginApi({
username:selectedUser,
password:pin
});

login(data);

window.location.reload();

}catch{

setError("Invalid PIN");
setPin("");

}

};


/* PIN */

const add=(n)=>{
if(pin.length >= 6) return;
setPin(pin+n);
};

const remove=()=>{
setPin(pin.slice(0,-1));
};


/* AUTO LOGIN */

useEffect(()=>{
if(pin.length === 6){
submitLogin();
}
},[pin]);


return(

<div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">

<div className="min-h-screen flex items-center justify-center bg-[#0b0b0b] dark:bg-[#0b0b0b]">

<ThemeToggle />

{/* login card */}

</div>
{/* PARTICLES */}

<Particles
className="absolute inset-0"
options={{
particles:{
number:{value:40},
color:{value:"#2563eb"},
links:{enable:true,color:"#2563eb",distance:120},
move:{enable:true,speed:0.8},
size:{value:2}
}
}}
/>


{/* 3D GLOW CARD */}

<motion.div
initial={{opacity:0, y:30}}
animate={{opacity:1, y:0}}
className="relative p-10 rounded-3xl w-[420px]
bg-[#151515]
shadow-[0_0_40px_rgba(59,130,246,0.2),
15px_15px_40px_#050505,
-15px_-15px_40px_#1f1f1f]"
>


{/* TITLE */}

<h1 className="text-3xl text-white font-bold text-center mb-2">
Market POS
</h1>

<p className="text-gray-400 text-sm text-center mb-8">
Secure Staff Login
</p>


{/* STAFF ICONS */}

<div className="flex justify-center gap-6 mb-8">

{users.map(u=>(

<motion.button
key={u.username}
whileHover={{scale:1.15}}
whileTap={{scale:0.95}}
onClick={()=>setSelectedUser(u.username)}
className={`flex flex-col items-center gap-1 ${
selectedUser===u.username ? "text-blue-500" : "text-gray-400"
}`}
>

<div className="text-2xl">

{u.icon}

</div>

<span className="text-xs">

{u.username}

</span>

</motion.button>

))}

</div>


{/* PIN DOTS */}

<div className="flex justify-center gap-2 mb-6">

{Array.from({length:6}).map((_,i)=>(

<div
key={i}
className={`w-3 h-3 rounded-full transition ${
pin.length>i
?"bg-blue-500"
:"bg-gray-600"
}`}
/>

))}

</div>


{/* ERROR */}

{error && (

<p className="text-red-400 text-center text-sm mb-4">

{error}

</p>

)}


{/* KEYPAD */}

<div className="grid grid-cols-3 gap-4">

{[1,2,3,4,5,6,7,8,9].map(n=>(

<motion.button
key={n}
whileHover={{
scale:1.05,
boxShadow:"0 0 15px rgba(59,130,246,0.4)"
}}
whileTap={{
scale:0.95,
boxShadow:"inset 5px 5px 10px #050505,inset -5px -5px 10px #1f1f1f"
}}
onClick={()=>add(n)}
className="py-4 rounded-xl text-xl font-semibold text-white
bg-[#151515]
shadow-[6px_6px_12px_#050505,-6px_-6px_12px_#1f1f1f]"
>

{n}

</motion.button>

))}


<motion.button
whileTap={{scale:0.95}}
onClick={()=>setPin("")}
className="text-red-400 font-bold"
>

C

</motion.button>


<motion.button
whileHover={{scale:1.05}}
whileTap={{scale:0.95}}
onClick={()=>add(0)}
className="py-4 rounded-xl text-xl font-semibold text-white
bg-[#151515]
shadow-[6px_6px_12px_#050505,-6px_-6px_12px_#1f1f1f]"
>

0

</motion.button>


<motion.button
whileTap={{scale:0.95}}
onClick={remove}
className="text-white"
>

⌫

</motion.button>

</div>


{/* FOOTER */}

<p className="text-center text-xs text-gray-500 mt-8">
Done by <span className="text-blue-500">Abbas El Nemer</span>
</p>


</motion.div>

</div>

);

}