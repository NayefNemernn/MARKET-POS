import React, { useEffect, useState, useRef } from "react";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../api/product.api";

import {
  getCategories,
  createCategory
} from "../api/category.api";

import toast from "react-hot-toast";
import JsBarcode from "jsbarcode";
import { useReactToPrint } from "react-to-print";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";

export default function Products(){
const [editingProduct,setEditingProduct] = useState(null);
const [products,setProducts] = useState([]);
const [categories,setCategories] = useState([]);
const [search,setSearch] = useState("");
const [barcode,setBarcode] = useState("");
const [editImage,setEditImage] = useState(null);
const [editPreview,setEditPreview] = useState("");

const [form,setForm] = useState({
name:"",
price:"",
stock:"",
category:""
});

const [image,setImage] = useState(null);
const [preview,setPreview] = useState("");

const [inventoryMode,setInventoryMode] = useState(false);

const labelRef = useRef();

/* LOAD DATA */

const load = async ()=>{
const p = await getAllProducts();
const c = await getCategories();
setProducts(p);
setCategories(c);
};

useEffect(()=>{ load(); },[]);


/* IMAGE COMPRESSION */

const compressImage = async(file)=>{

try{

const options = {
maxSizeMB:0.2,
maxWidthOrHeight:800,
useWebWorker:true
};

return await imageCompression(file,options);

}catch(err){
console.error(err);
return file;
}

};


/* DROP IMAGE */

const onDrop = async(files)=>{

const file = files[0];
if(!file) return;

const compressed = await compressImage(file);

setImage(compressed);
setPreview(URL.createObjectURL(compressed));

};

const {getRootProps,getInputProps} = useDropzone({ onDrop });


/* SEARCH */

const filtered = products.filter(p=>
p.name.toLowerCase().includes(search.toLowerCase()) ||
p.barcode.includes(search)
);


/* LOW STOCK */

const lowStock = products.filter(p=>p.stock <= 3);


/* BARCODE */

const generateBarcode = ()=>{

const code = Date.now().toString();
setBarcode(code);

setTimeout(()=>{
JsBarcode("#barcodePreview",code,{
format:"CODE128",
width:2,
height:40
});
},100);

};


/* INVENTORY SCANNER */

useEffect(()=>{

let buffer="";
let lastKeyTime=0;

const handleScanner=(e)=>{

if(!inventoryMode) return;

const now=Date.now();

if(now-lastKeyTime>100) buffer="";

lastKeyTime=now;

if(e.key==="Enter"){

const code=buffer.trim();
const product=products.find(p=>p.barcode===code);

if(!product){
toast.error("Product not found");
buffer="";
return;
}

updateProduct(product._id,{stock:product.stock+1});

setProducts(prev =>
prev.map(p =>
p._id===product._id
?{...p,stock:p.stock+1}
:p
)
);

toast.success(`${product.name} stock +1`);

buffer="";
return;

}

if(/^[0-9a-zA-Z]$/.test(e.key)){
buffer+=e.key;
}

};

window.addEventListener("keydown",handleScanner);
return ()=>window.removeEventListener("keydown",handleScanner);

},[inventoryMode,products]);


/* CREATE PRODUCT */

const handleCreate = async()=>{

if(!form.name || !barcode){
toast.error("Name and barcode required");
return;
}

let categoryId=null;

if(form.category){

const existing = categories.find(
c=>c.name.toLowerCase()===form.category.toLowerCase()
);

if(existing){
categoryId = existing._id;
}else{

const newCategory = await createCategory({
name:form.category
});

categoryId = newCategory._id;

toast.success("Category created");

}

}

const data = new FormData();

data.append("name",form.name);
data.append("barcode",barcode);
data.append("price",form.price || 0);
data.append("stock",form.stock || 0);
data.append("category",categoryId);

if(image) data.append("image",image);

await createProduct(data);

toast.success("Product created");

setForm({
name:"",
price:"",
stock:"",
category:""
});

setBarcode("");
setPreview("");
setImage(null);

load();

};


/* DELETE */

const remove = async(id)=>{

if(!window.confirm("Delete product?")) return;

await deleteProduct(id);

toast.success("Deleted");

load();

};


/* PRINT */

const handlePrint = useReactToPrint({
contentRef: labelRef
});


/* UI */

return(

<div className="p-6 space-y-6">


{/* TOP BAR */}

<div className="flex gap-4 items-center">

<input
placeholder="Search product..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border p-2 rounded w-64"
/>

<button
onClick={generateBarcode}
className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
>
Generate Barcode
</button>

<button
onClick={handlePrint}
className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-black transition"
>
Print Label
</button>

<button
onClick={()=>setInventoryMode(!inventoryMode)}
className={`px-4 py-2 rounded text-white ${
inventoryMode ? "bg-red-600" : "bg-indigo-600"
}`}
>
{inventoryMode ? "Stop Inventory Scan" : "Start Inventory Scan"}
</button>

</div>


{inventoryMode && (

<div className="bg-yellow-100 border border-yellow-400 p-3 rounded">
📦 Inventory Scan Mode Active — Scan products to increase stock
</div>

)}


/* DASHBOARD */

<div className="grid grid-cols-3 gap-4">

<div className="bg-white shadow rounded-xl p-4 hover:shadow-lg transition">
<p className="text-gray-500 text-sm">Total Products</p>
<h2 className="text-2xl font-bold">{products.length}</h2>
</div>

<div className="bg-yellow-100 rounded-xl p-4 hover:shadow-lg transition">
<p className="text-gray-600 text-sm">Low Stock</p>
<h2 className="text-2xl font-bold">{lowStock.length}</h2>
</div>

<div className="bg-green-100 rounded-xl p-4 hover:shadow-lg transition">
<p className="text-gray-600 text-sm">Categories</p>
<h2 className="text-2xl font-bold">{categories.length}</h2>
</div>

</div>


{/* PRODUCT FORM */}

<div className="bg-white rounded-xl shadow p-6 grid grid-cols-5 gap-4">

<input
placeholder="Product Name"
value={form.name}
onChange={(e)=>setForm({...form,name:e.target.value})}
className="border p-2 rounded"
/>

<input
placeholder="Price"
type="number"
value={form.price}
onChange={(e)=>setForm({...form,price:e.target.value})}
className="border p-2 rounded"
/>

<input
placeholder="Stock"
type="number"
value={form.stock}
onChange={(e)=>setForm({...form,stock:e.target.value})}
className="border p-2 rounded"
/>

<div>

<input
list="categories"
placeholder="Category"
value={form.category}
onChange={(e)=>setForm({...form,category:e.target.value})}
className="border p-2 rounded w-full"
/>

<datalist id="categories">
{categories.map(c=>(
<option key={c._id} value={c.name}/>
))}
</datalist>

</div>

<input
placeholder="Barcode"
value={barcode}
onChange={(e)=>setBarcode(e.target.value)}
className="border p-2 rounded"
/>

<button
onClick={handleCreate}
className="bg-green-600 text-white rounded-lg px-4 hover:bg-green-700 active:scale-95 transition"
>
Add Product
</button>

</div>


{/* IMAGE DROP */}

<div
{...getRootProps()}
className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition"
>

<input {...getInputProps()} />

<p className="text-gray-500">
Drag & drop product image
</p>

{preview && (
<img src={preview} className="h-32 mx-auto mt-4 rounded shadow"/>
)}

</div>


{/* BARCODE PREVIEW */}

<div className="bg-white rounded shadow p-4">
<svg id="barcodePreview"></svg>
</div>


{/* PRODUCT GRID */}

<div className="grid grid-cols-4 gap-6">

{filtered.map(p=>(

<div
key={p._id}
onClick={()=>{
  setEditingProduct(p);
  setEditPreview(p.image || "");
}}
className="bg-white rounded-xl shadow p-4 space-y-3 transform transition hover:-translate-y-1 hover:shadow-xl active:scale-95 cursor-pointer"
>

<div className="h-36 bg-gray-100 rounded overflow-hidden">

<img
src={p.image || "/placeholder.png"}
className="w-full h-full object-cover hover:scale-105 transition"
/>

</div>

<h3 className="font-semibold text-gray-700 truncate">
{p.name}
</h3>

<p className="text-xs text-gray-500">
Barcode: {p.barcode}
</p>

<p className="text-sm">
Stock:
<span className={`ml-2 font-bold ${p.stock<=3?"text-red-600":"text-green-600"}`}>
{p.stock}
</span>
</p>

<div className="flex justify-end">

<button
onClick={(e)=>{
  e.stopPropagation(); // prevents opening editor
  remove(p._id);
}}
className="text-red-500 text-sm hover:text-red-700"
>
Delete
</button>

</div>

</div>

))}

</div>

{/* SIDE PANEL EDITOR */}

<AnimatePresence>

{editingProduct && (

<motion.div
initial={{ opacity:0 }}
animate={{ opacity:1 }}
exit={{ opacity:0 }}
className="fixed inset-0 z-50 flex justify-end"
>

{/* BACKDROP */}

<div
onClick={()=>setEditingProduct(null)}
className="absolute inset-0 bg-black/40 backdrop-blur-sm"
/>


{/* PANEL */}

<motion.div
initial={{ x:450 }}
animate={{ x:0 }}
exit={{ x:450 }}
transition={{ type:"spring", stiffness:260, damping:25 }}
className="relative w-[460px] h-full bg-white shadow-2xl flex flex-col"
>


{/* HEADER */}

<div className="flex items-center justify-between p-6 border-b">

<h2 className="text-xl font-semibold">
Edit Product
</h2>

<button
onClick={()=>setEditingProduct(null)}
className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
>
✕
</button>

</div>



{/* CONTENT */}

<div className="flex-1 overflow-y-auto p-6 space-y-6">


{/* IMAGE */}

<div
className="group border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition"
onDragOver={(e)=>e.preventDefault()}
onDrop={(e)=>{

e.preventDefault();

const file = e.dataTransfer.files[0];

if(!file) return;

setEditImage(file);
setEditPreview(URL.createObjectURL(file));

}}
>

<img
src={editPreview || "/placeholder.png"}
className="h-36 mx-auto rounded-lg object-cover"
/>

<p className="text-sm text-gray-500 mt-2">
Drag image to replace
</p>

<input
type="file"
accept="image/*"
onChange={(e)=>{

const file = e.target.files[0];

if(!file) return;

setEditImage(file);
setEditPreview(URL.createObjectURL(file));

}}
className="hidden"
/>

</div>


{/* NAME */}

<div>

<label className="text-xs text-gray-500">
Product Name
</label>

<input
value={editingProduct.name}
onChange={(e)=>setEditingProduct({
...editingProduct,
name:e.target.value
})}
className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
/>

</div>


{/* PRICE */}

<div>

<label className="text-xs text-gray-500">
Price
</label>

<input
type="number"
value={editingProduct.price}
onChange={(e)=>setEditingProduct({
...editingProduct,
price:e.target.value
})}
className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400"
/>

</div>


{/* STOCK */}

<div>

<label className="text-xs text-gray-500">
Stock
</label>

<div className="flex gap-3 items-center mt-1">

<button
onClick={()=>setEditingProduct({
...editingProduct,
stock:Math.max(0,editingProduct.stock-1)
})}
className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200"
>
-
</button>

<input
type="number"
value={editingProduct.stock}
onChange={(e)=>setEditingProduct({
...editingProduct,
stock:e.target.value
})}
className="border rounded-lg px-3 py-2 w-full"
/>

<button
onClick={()=>setEditingProduct({
...editingProduct,
stock:Number(editingProduct.stock)+1
})}
className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200"
>
+
</button>

</div>

</div>


{/* BARCODE */}

<div>

<label className="text-xs text-gray-500">
Barcode
</label>

<div className="flex gap-3">

<input
value={editingProduct.barcode}
onChange={(e)=>setEditingProduct({
...editingProduct,
barcode:e.target.value
})}
className="border rounded-lg px-3 py-2 w-full"
/>

<button
onClick={()=>{

const newCode = Date.now().toString();

setEditingProduct({
...editingProduct,
barcode:newCode
});

}}
className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
>
Generate
</button>

</div>

</div>


{/* BARCODE PREVIEW */}

<div className="bg-gray-50 rounded-lg p-4 text-center">

<svg id="barcodeEdit"></svg>

<button
onClick={()=>window.print()}
className="mt-3 px-4 py-2 bg-gray-800 text-white rounded"
>
Print Label
</button>

</div>


{/* SALES STATS */}

<div className="bg-gray-50 rounded-lg p-4">

<p className="text-xs text-gray-500">
Sales Statistics
</p>

<p className="text-xl font-semibold mt-1">
{editingProduct.totalSold || 0} sold
</p>

<p className="text-sm text-gray-400">
Last 30 days
</p>

</div>


</div>


{/* FOOTER */}

<div className="p-6 border-t flex gap-3">

<button
onClick={()=>setEditingProduct(null)}
className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
>
Cancel
</button>

<button
onClick={async()=>{

const data = new FormData();

data.append("name",editingProduct.name);
data.append("price",editingProduct.price);
data.append("stock",editingProduct.stock);
data.append("barcode",editingProduct.barcode);

if(editImage){
data.append("image",editImage);
}

const updated = await updateProduct(editingProduct._id,data);

setProducts(prev =>
prev.map(p =>
p._id === updated._id ? updated : p
)
);

setEditingProduct(null);

toast.success("Product updated");

}}
className="flex-1 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
>
Save Changes
</button>

</div>

</motion.div>

</motion.div>

)}

</AnimatePresence>



{/* PRINT */}

<div className="hidden">

<div ref={labelRef}>

<svg id="barcodePreview"></svg>

<p>Product Label</p>

</div>

</div>


</div>

);

}