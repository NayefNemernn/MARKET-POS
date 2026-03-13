import { useEffect, useState } from "react";
import { getAllProducts } from "../api/product.api";
import { getCategories } from "../api/category.api";
import { useCart } from "../hooks/useCart";
import CheckoutModal from "../components/CheckoutModal";
import { useAuth } from "../context/AuthContext";

export default function POS({ setPage }) {

const [products,setProducts] = useState([]);
const [categories,setCategories] = useState([]);
const [selectedCategory,setSelectedCategory] = useState("all");
const [search,setSearch] = useState("");
const [openCheckout,setOpenCheckout] = useState(false);

const {cart,addToCart,increase,decrease,total,clearCart} = useCart();
const {user,logout} = useAuth();

useEffect(()=>{

load();

},[]);

useEffect(()=>{

const handleEsc = (e)=>{

if(e.key === "Escape"){
clearCart();
}

};

window.addEventListener("keydown",handleEsc);

return ()=> window.removeEventListener("keydown",handleEsc);

},[]);

const load = async ()=>{

const p = await getAllProducts();
const c = await getCategories();

setProducts(p);
setCategories(c);

};

const filteredProducts = products.filter(p=>{

const matchCategory =
selectedCategory === "all" ||
p.category?._id === selectedCategory;

const matchSearch =
p.name.toLowerCase().includes(search.toLowerCase()) ||
(p.barcode && p.barcode.includes(search));

return matchCategory && matchSearch;

});

return(

<div className="flex h-screen bg-gray-100">

{/* LEFT SIDE */}

<div className="flex-1 flex flex-col overflow-hidden">

{/* HEADER */}

<div className="p-6 pb-2 flex justify-between items-center">

<div>

<h1 className="text-2xl font-semibold">
Point of Sale
</h1>

<p className="text-gray-400 text-sm">
Ready to serve customers
</p>

</div>

<div className="flex items-center gap-3">

<span className="text-sm text-gray-500">
{user?.username}
</span>

<button
onClick={()=>setPage("dashboard")}
className="px-4 py-2 bg-gray-800 text-white rounded-lg"
>

Dashboard

</button>

<button
onClick={logout}
className="px-4 py-2 bg-red-500 text-white rounded-lg"
>

Logout

</button>

</div>

</div>

{/* SEARCH */}

<div className="px-6 pb-4">

<input
value={search}
onChange={(e)=>setSearch(e.target.value)}
placeholder="Search products or scan barcode..."
className="w-full border rounded-lg px-4 py-3"
/>

</div>

{/* CATEGORIES */}

<div className="px-6 flex gap-3 overflow-x-auto pb-4">

<button
onClick={()=>setSelectedCategory("all")}
className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm"
>

All

</button>

{categories.map(c=>(
<button
key={c._id}
onClick={()=>setSelectedCategory(c._id)}
className="px-4 py-2 bg-white rounded-full border text-sm"
>

{c.name}

</button>
))}

</div>

{/* PRODUCTS */}

<div className="flex-1 overflow-y-auto px-6 pb-6">

<div className="grid grid-cols-4 gap-5">

{filteredProducts.map(p=>{

const qty =
cart.find(i=>i.productId === p._id)?.quantity || 0;

const outOfStock = p.stock === 0;

return(

<div
key={p._id}
onClick={()=> !outOfStock && addToCart(p)}
className={`relative bg-white rounded-xl shadow-sm flex flex-col transition
${outOfStock
? "opacity-60 cursor-not-allowed"
: "hover:shadow-md cursor-pointer"
}`}
>

{outOfStock && (

<div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">

Out of Stock

</div>

)}

<div className="h-36 flex items-center justify-center bg-gray-50 rounded-t-xl text-3xl">

📦

</div>

<div className="p-3">

<p className="text-sm font-medium">
{p.name}
</p>

<p className="text-gray-500 text-xs">
${p.price}
</p>

<p className="text-gray-400 text-xs">
Stock: {p.stock}
</p>

</div>

<div
className="px-3 pb-3 flex justify-between items-center"
onClick={(e)=>e.stopPropagation()}
>

<div className="flex gap-2 items-center">

<button
disabled={outOfStock}
onClick={()=>decrease(p._id)}
className="w-6 h-6 bg-gray-200 rounded"
>

-

</button>

<span className="text-sm font-semibold">
{qty}
</span>

<button
disabled={outOfStock}
onClick={()=>increase(p._id)}
className="w-6 h-6 bg-gray-200 rounded"
>

+

</button>

</div>

<span className="text-sm font-semibold">

${(p.price * qty).toFixed(2)}

</span>

</div>

</div>

);

})}

</div>

</div>

</div>

{/* CART PANEL */}

<div className="w-[360px] bg-white shadow-xl flex flex-col h-screen sticky top-0">

<div className="p-4 border-b flex justify-between">

<h2 className="font-semibold">

Current Order

</h2>

<span className="text-xs bg-gray-200 px-2 py-1 rounded">

{cart.length} items

</span>

</div>

{/* CART ITEMS */}

<div className="flex-1 overflow-y-auto p-4 space-y-3">

{cart.map(item=>(
<div
key={item.productId}
className="flex justify-between"
>

<div>

<p className="text-sm font-medium">

{item.name}

</p>

<p className="text-xs text-gray-400">

${item.price} each

</p>

</div>

<div className="flex items-center gap-2">

<button onClick={()=>decrease(item.productId)}>
-
</button>

<span>

{item.quantity}

</span>

<button onClick={()=>increase(item.productId)}>
+
</button>

<p className="font-semibold">

${(item.price * item.quantity).toFixed(2)}

</p>

</div>

</div>
))}

</div>

{/* TOTAL */}

<div className="p-4 border-t">

<div className="flex justify-between mb-4">

<span className="font-semibold">
Total
</span>

<span className="font-bold text-lg">

${total.toFixed(2)}

</span>

</div>

<button
onClick={()=>setOpenCheckout(true)}
className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold"
>

Checkout

</button>

</div>

</div>

{/* CHECKOUT MODAL */}

{openCheckout && (

<CheckoutModal
cart={cart}
total={total}
close={()=>setOpenCheckout(false)}
/>

)}

</div>

);

}