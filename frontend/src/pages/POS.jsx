<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { useEffect, useState, useMemo } from "react";
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
import { getAllProducts } from "../api/product.api";
import { getCategories } from "../api/category.api";
import { useCart } from "../hooks/useCart";
import CheckoutModal from "../components/CheckoutModal";
import { useAuth } from "../context/AuthContext";
<<<<<<< HEAD

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
=======
import toast from "react-hot-toast";

export default function POS({ setPage }) {

const [products, setProducts] = useState([]);
const [categories, setCategories] = useState([]);
const [selectedCategory, setSelectedCategory] = useState("all");
const [search, setSearch] = useState("");
const [openCheckout, setOpenCheckout] = useState(false);

const { cart, addToCart, increase, decrease, total, clearCart } = useCart();
const { user, logout } = useAuth();


/* ================= LOAD DATA ================= */

useEffect(()=>{
load();
},[]);

const load = async () => {
const p = await getAllProducts();
const c = await getCategories();
setProducts(p);
setCategories(c);
};


/* ================= BARCODE MAP ================= */

const barcodeMap = useMemo(()=>{

const map = {};

products.forEach(p=>{
if(p.barcode){
map[p.barcode.toString()] = p;
}
});

return map;

},[products]);


/* ================= SAFE ADD PRODUCT ================= */

const addProductSafe = (product)=>{

if(!product){
toast.error("Product not found");
return;
}

if(product.stock === 0){
toast.error("Product out of stock");
return;
}

addToCart(product);

};


/* ================= ENTER BARCODE ================= */

const handleSearchEnter = (e)=>{

if(e.key === "Enter"){

const code = search.trim();
const product = barcodeMap[code];

addProductSafe(product);

setSearch("");

>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
}

};

<<<<<<< HEAD
window.addEventListener("keydown",handleEsc);

=======

/* ================= GLOBAL SCANNER ================= */

useEffect(()=>{

let buffer = "";
let lastKeyTime = 0;

const beep = new Audio("/beep.mp3");

const handleScanner = (e)=>{

const now = Date.now();

if(now - lastKeyTime > 100){
buffer = "";
}

lastKeyTime = now;

if(e.key === "Enter"){

const code = buffer.trim();
const product = barcodeMap[code];

if(product){
addProductSafe(product);
beep.play().catch(()=>{});
}

buffer = "";
return;

}

if(/^[0-9a-zA-Z]$/.test(e.key)){
buffer += e.key;
}

};

window.addEventListener("keydown",handleScanner);

return ()=> window.removeEventListener("keydown",handleScanner);

},[barcodeMap]);


/* ================= ESC CLEAR CART ================= */

useEffect(()=>{

const handleEsc = (e)=>{
if(e.key === "Escape"){
clearCart();
toast("Cart cleared");
}
};

window.addEventListener("keydown",handleEsc);
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
return ()=> window.removeEventListener("keydown",handleEsc);

},[]);

<<<<<<< HEAD
const load = async ()=>{

const p = await getAllProducts();
const c = await getCategories();

setProducts(p);
setCategories(c);

};
=======

/* ================= FILTER PRODUCTS ================= */
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb

const filteredProducts = products.filter(p=>{

const matchCategory =
selectedCategory === "all" ||
p.category?._id === selectedCategory;

const matchSearch =
p.name.toLowerCase().includes(search.toLowerCase()) ||
(p.barcode && p.barcode.includes(search));

return matchCategory && matchSearch;

});

<<<<<<< HEAD
return(

<div className="flex h-screen bg-gray-100">
=======

/* ================= UI ================= */

return(

<div className="flex h-screen bg-gray-100 overflow-hidden">

>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb

{/* LEFT SIDE */}

<div className="flex-1 flex flex-col overflow-hidden">

<<<<<<< HEAD
=======

>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
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
<<<<<<< HEAD

Dashboard

=======
Dashboard
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
</button>

<button
onClick={logout}
className="px-4 py-2 bg-red-500 text-white rounded-lg"
>
<<<<<<< HEAD

Logout

=======
Logout
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
</button>

</div>

</div>

<<<<<<< HEAD
=======

>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
{/* SEARCH */}

<div className="px-6 pb-4">

<input
<<<<<<< HEAD
value={search}
onChange={(e)=>setSearch(e.target.value)}
=======
autoFocus
value={search}
onChange={(e)=>setSearch(e.target.value)}
onKeyDown={handleSearchEnter}
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
placeholder="Search products or scan barcode..."
className="w-full border rounded-lg px-4 py-3"
/>

</div>

<<<<<<< HEAD
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
=======

{/* CATEGORIES */}

<div className="px-6 flex gap-3 overflow-x-auto pb-4 pt-3">

<button
onClick={()=>setSelectedCategory("all")}
className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
flex items-center gap-2 whitespace-nowrap
${selectedCategory === "all"
? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-105"
: "bg-white border hover:bg-blue-50 hover:border-blue-400 hover:scale-105 active:scale-95"}
`}
>
All
</button>

{categories.map(c=>(

<button
key={c._id}
onClick={()=>setSelectedCategory(c._id)}
className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
flex items-center gap-2 whitespace-nowrap
${selectedCategory === c._id
? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-105"
: "bg-white border hover:bg-blue-50 hover:border-blue-400 hover:scale-105 active:scale-95"}
`}
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
>

{c.name}

</button>
<<<<<<< HEAD
=======

>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
))}

</div>

<<<<<<< HEAD
{/* PRODUCTS */}

<div className="flex-1 overflow-y-auto px-6 pb-6">
=======

{/* PRODUCTS */}

<div className="flex-1 overflow-y-auto px-6 pb-24">
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb

<div className="grid grid-cols-4 gap-5">

{filteredProducts.map(p=>{

const qty =
<<<<<<< HEAD
cart.find(i=>i.productId === p._id)?.quantity || 0;
=======
cart.find(i => i.productId === p._id)?.quantity || 0;
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb

const outOfStock = p.stock === 0;

return(

<div
key={p._id}
<<<<<<< HEAD
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

=======
onClick={()=>addProductSafe(p)}
className={`relative bg-white rounded-xl shadow-sm flex flex-col transition
${outOfStock
? "opacity-60 cursor-not-allowed"
: "hover:shadow-md cursor-pointer"}
`}
>

{outOfStock && (
<div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
Out of Stock
</div>
)}

<div className="h-36 bg-gray-50 rounded-t-xl overflow-hidden">
  <img
    src={p.image || "/placeholder.png"}
    onError={(e)=>{e.target.src="/placeholder.png"}}
    className="w-full h-full object-cover"
  />
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
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
<<<<<<< HEAD

-

=======
-
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
</button>

<span className="text-sm font-semibold">
{qty}
</span>

<button
disabled={outOfStock}
onClick={()=>increase(p._id)}
className="w-6 h-6 bg-gray-200 rounded"
>
<<<<<<< HEAD

+

=======
+
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
</button>

</div>

<span className="text-sm font-semibold">
<<<<<<< HEAD

${(p.price * qty).toFixed(2)}

=======
${(p.price * qty).toFixed(2)}
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
</span>

</div>

</div>

);

})}

</div>

</div>

</div>

<<<<<<< HEAD
{/* CART PANEL */}

<div className="w-[360px] bg-white shadow-xl flex flex-col h-screen sticky top-0">

<div className="p-4 border-b flex justify-between">

<h2 className="font-semibold">

Current Order

</h2>

<span className="text-xs bg-gray-200 px-2 py-1 rounded">

{cart.length} items

=======

{/* CART PANEL */}

<div className="w-[360px] bg-white flex flex-col h-screen shadow-2xl border-l rounded-l-3xl overflow-hidden">


<div className="p-4 border-b flex justify-between items-center bg-gray-50">

<h2 className="font-semibold text-gray-700">
Current Order
</h2>

<span className="text-xs bg-gray-200 px-3 py-1 rounded-full">
{cart.length} items
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
</span>

</div>

<<<<<<< HEAD
{/* CART ITEMS */}

<div className="flex-1 overflow-y-auto p-4 space-y-3">

{cart.map(item=>(
<div
key={item.productId}
className="flex justify-between"
=======

<div className="flex-1 overflow-y-auto p-4 space-y-4">

{cart.length === 0 && (
<p className="text-sm text-gray-400 text-center mt-10">
Cart is empty
</p>
)}

{cart.map(item=>(

<div
key={item.productId}
className="flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2 hover:bg-gray-100 transition"
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
>

<div>

<<<<<<< HEAD
<p className="text-sm font-medium">

{item.name}

</p>

<p className="text-xs text-gray-400">

${item.price} each

=======
<p className="text-sm font-semibold">
{item.name}
</p>

<p className="text-xs text-gray-400">
${item.price} each
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
</p>

</div>

<<<<<<< HEAD
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

=======
<div className="flex items-center gap-3">

<button
onClick={()=>decrease(item.productId)}
className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 transition"
>
-
</button>

<span className="text-sm font-semibold w-5 text-center">
{item.quantity}
</span>

<button
onClick={()=>increase(item.productId)}
className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 transition"
>
+
</button>

<p className="font-semibold w-16 text-right">
${(item.price * item.quantity).toFixed(2)}
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
</p>

</div>

</div>
<<<<<<< HEAD
=======

>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
))}

</div>

<<<<<<< HEAD
{/* TOTAL */}

<div className="p-4 border-t">

<div className="flex justify-between mb-4">

<span className="font-semibold">
=======

<div className="p-4 border-t bg-gray-50">

<div className="flex justify-between mb-4">

<span className="font-semibold text-gray-600">
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
Total
</span>

<span className="font-bold text-lg">
<<<<<<< HEAD

${total.toFixed(2)}

=======
${total.toFixed(2)}
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
</span>

</div>

<button
onClick={()=>setOpenCheckout(true)}
<<<<<<< HEAD
className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold"
>

Checkout

=======
className="w-full bg-green-600 hover:bg-green-700 active:scale-95 transition text-white py-3 rounded-xl font-semibold shadow-md"
>
Checkout
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
</button>

</div>

</div>

<<<<<<< HEAD
{/* CHECKOUT MODAL */}
=======
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb

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