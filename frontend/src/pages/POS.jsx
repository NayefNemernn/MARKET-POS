import { useEffect, useState, useMemo } from "react";
import { getAllProducts } from "../api/product.api";
import { getCategories } from "../api/category.api";
import { useCart } from "../hooks/useCart";
import CheckoutModal from "../components/CheckoutModal";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import toast from "react-hot-toast";


export default function POS({ setPage }) {

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [openCheckout, setOpenCheckout] = useState(false);

    const { cart, addToCart, increase, decrease, total, clearCart } = useCart();
    const { user, logout } = useAuth();
    const { t } = useTranslation();

    useEffect(() => { load(); }, []);

    const load = async () => {
        const p = await getAllProducts();
        const c = await getCategories();
        setProducts(p);
        setCategories(c);
    };

    const barcodeMap = useMemo(() => {

        const map = {};
        products.forEach(p => {
            if (p.barcode) map[p.barcode.toString()] = p;
        });

        return map;

    }, [products]);

    const addProductSafe = (product) => {

        if (!product) {
            toast.error(t.productNotFound);
            return;
        }

        if (product.stock === 0) {
            toast.error(t.outOfStock);
            return;
        }

        addToCart(product);

    };

    const handleSearchEnter = (e) => {

        if (e.key === "Enter") {

            const code = search.trim();
            const product = barcodeMap[code];

            addProductSafe(product);
            setSearch("");

        }

    };

    useEffect(() => {

        let buffer = "";
        let lastKeyTime = 0;

        const handleScanner = (e) => {

            const now = Date.now();

            if (now - lastKeyTime > 100) buffer = "";

            lastKeyTime = now;

            if (e.key === "Enter") {

                const code = buffer.trim();
                const product = barcodeMap[code];

                if (product) addProductSafe(product);

                buffer = "";
                return;

            }

            if (/^[0-9a-zA-Z]$/.test(e.key)) buffer += e.key;

        };

        window.addEventListener("keydown", handleScanner);
        return () => window.removeEventListener("keydown", handleScanner);

    }, [barcodeMap]);

    useEffect(() => {

        const handleEsc = (e) => {

            if (e.key === "Escape") {
                clearCart();
                toast(t.cartCleared);
            }

        };

        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);

    }, []);

    const filteredProducts = products.filter(p => {

        const matchCategory =
            selectedCategory === "all" ||
            p.category?._id === selectedCategory;

        const matchSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode && p.barcode.includes(search));

        return matchCategory && matchSearch;

    });

    return (

        <div className="flex h-[calc(95vh-64px)] bg-gray-100 dark:bg-[#0b0b0b] text-gray-900 dark:text-white">

            {/* LEFT */}

<div className="flex-1 flex flex-col overflow-hidden space-y-4 px-6">

{/* HEADER */}

<div
className="
p-6 flex justify-between items-center

rounded-3xl

bg-gray-100 dark:bg-[#141414]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
"
>

<div>

<h1 className="text-2xl font-semibold">
{t.pos}
</h1>

<p className="text-gray-500 dark:text-gray-400 text-sm">
{t.ready}
</p>

</div>


<div className="flex items-center gap-3">

<span className="text-sm text-gray-500 dark:text-gray-400">
{user?.username}
</span>

<button
onClick={() => setPage("dashboard")}
className="
px-4 py-2 rounded-xl

bg-gray-100 dark:bg-[#1c1c1c]

shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff]
dark:shadow-[5px_5px_10px_#050505,-5px_-5px_10px_#1f1f1f]

hover:scale-[1.03]
transition
"
>
{t.dashboard}
</button>

<button
onClick={logout}
className="
px-4 py-2 rounded-xl
bg-red-600 hover:bg-red-700
text-white
transition
"
>
{t.logout}
</button>

</div>

</div>


{/* SEARCH */}

<div
className="
p-4 rounded-3xl

bg-gray-100 dark:bg-[#141414]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
"
>

<input
autoFocus
value={search}
onChange={(e)=>setSearch(e.target.value)}
onKeyDown={handleSearchEnter}
placeholder={t.search}
className="
w-full px-5 py-4 rounded-xl outline-none

bg-gray-100 dark:bg-[#0f0f0f]

shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]
"
/>

</div>


{/* CATEGORIES */}

<div
className="
p-4 rounded-3xl flex gap-3 overflow-x-auto

bg-gray-100 dark:bg-[#141414]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
"
>

<button
onClick={()=>setSelectedCategory("all")}
className={`
px-5 py-2 rounded-xl text-sm transition

${selectedCategory==="all"
? "bg-blue-600 text-white"
: `

bg-gray-100 dark:bg-[#1c1c1c]

shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff]
dark:shadow-[5px_5px_10px_#050505,-5px_-5px_10px_#1f1f1f]

`}
`}
>
{t.all}
</button>


{categories.map(c=>(
<button
key={c._id}
onClick={()=>setSelectedCategory(c._id)}
className={`
px-5 py-2 rounded-xl text-sm transition

${selectedCategory===c._id
? "bg-blue-600 text-white"
: `

bg-gray-100 dark:bg-[#1c1c1c]

shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff]
dark:shadow-[5px_5px_10px_#050505,-5px_-5px_10px_#1f1f1f]

`}
`}
>
{c.name}
</button>
))}

</div>                {/* PRODUCTS */}

                <div className="flex-1 overflow-y-auto px-6 pb-32">

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">

                        {filteredProducts.map(p => {

                            const qty = cart.find(i => i.productId === p._id)?.quantity || 0;
                            const outOfStock = p.stock === 0;

                            return (

                                <div
                                    key={p._id}
                                    onClick={() => addProductSafe(p)}
                                    className={`
relative flex flex-col

rounded-3xl
p-3

bg-gray-100 dark:bg-[#141414]

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]

transition
${!outOfStock && "hover:scale-[1.03] cursor-pointer"}
${outOfStock && "opacity-40"}
`}
                                >

                                    {/* OUT OF STOCK */}

                                    {outOfStock && (
                                        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                            {t.out}
                                        </div>
                                    )}

                                    {/* IMAGE */}

                                    <div
                                        className="
                                                    h-32
                                                    rounded-2xl
                                                    bg-gray-200 dark:bg-[#0f0f0f]

                                                    flex items-center justify-center
                                                    overflow-hidden
                                                    "
                                    >

                                        <img
                                            src={p.image || "/placeholder.png"}
                                            className="
  w-full
  h-full
  object-cover
  "
                                        />

                                    </div>


                                    {/* PRODUCT INFO */}

                                    <div className="mt-3 px-1">

                                        <p className="text-sm font-semibold truncate">
                                            {p.name}
                                        </p>

                                        <p className="text-xs text-blue-500 font-semibold">
                                            ${p.price}
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            {t.stock}: {p.stock}
                                        </p>

                                    </div>


                                    {/* CART CONTROLS */}

                                    <div
                                        className="mt-3 flex justify-between items-center"
                                        onClick={(e) => e.stopPropagation()}
                                    >

                                        <div className="flex gap-2 items-center">

                                            <button
                                                disabled={outOfStock}
                                                onClick={() => decrease(p._id)}
                                                className="
w-7 h-7 rounded-full

bg-gray-200 dark:bg-[#1c1c1c]

flex items-center justify-center
"
                                            >
                                                -
                                            </button>

                                            <span className="text-sm">
                                                {qty}
                                            </span>

                                            <button
                                                disabled={outOfStock}
                                                onClick={() => increase(p._id)}
                                                className="
w-7 h-7 rounded-full

bg-gray-200 dark:bg-[#1c1c1c]

flex items-center justify-center
"
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

            {/* CART */}

            <div
className="
w-[360px]
flex flex-col
h-full

bg-gray-100 dark:bg-[#141414]

rounded-l-3xl

shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
"
>

{/* HEADER */}

<div className="p-4 flex justify-between items-center">

<h2 className="font-semibold">
{t.currentOrder}
</h2>

<span
className="
text-xs px-3 py-1 rounded-full

bg-gray-100 dark:bg-[#1c1c1c]

shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff]
dark:shadow-[5px_5px_10px_#050505,-5px_-5px_10px_#1f1f1f]
"
>
{cart.length}
</span>

</div>


{/* CART ITEMS */}

<div className="flex-1 overflow-y-auto p-4 space-y-4">

{cart.length === 0 && (

<p className="text-center text-gray-500 mt-10">
{t.cartEmpty}
</p>

)}


{cart.map(item => (

<div
key={item.productId}
className="
flex justify-between items-center
rounded-2xl px-4 py-3

bg-gray-100 dark:bg-[#1c1c1c]

shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]
"
>

{/* PRODUCT INFO */}

<div>

<p className="text-sm font-semibold">
{item.name}
</p>

<p className="text-xs text-gray-500">
${item.price}
</p>

</div>


{/* CONTROLS */}

<div className="flex items-center gap-3">

<button
onClick={()=>decrease(item.productId)}
className="
w-7 h-7 rounded-full

bg-gray-100 dark:bg-[#141414]

shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff]
dark:shadow-[5px_5px_10px_#050505,-5px_-5px_10px_#1f1f1f]

flex items-center justify-center
"
>
-
</button>

<span className="text-sm">
{item.quantity}
</span>

<button
onClick={()=>increase(item.productId)}
className="
w-7 h-7 rounded-full

bg-gray-100 dark:bg-[#141414]

shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff]
dark:shadow-[5px_5px_10px_#050505,-5px_-5px_10px_#1f1f1f]

flex items-center justify-center
"
>
+
</button>

<p className="w-16 text-right font-semibold">
${(item.price * item.quantity).toFixed(2)}
</p>

</div>

</div>

))}

</div>


{/* FOOTER */}

<div className="p-4 space-y-4">

<div className="flex justify-between">

<span>{t.total}</span>

<span className="font-bold">
${total.toFixed(2)}
</span>

</div>

<button
onClick={()=>setOpenCheckout(true)}
className="
w-full py-3 rounded-full

bg-green-600 hover:bg-green-700

text-white font-semibold

transition
"
>
{t.checkout}
</button>

</div>

</div>

            {openCheckout && (
                <CheckoutModal cart={cart} total={total} close={() => setOpenCheckout(false)} />
            )}

        </div>

    );
}