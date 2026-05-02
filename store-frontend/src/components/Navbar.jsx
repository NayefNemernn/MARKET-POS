import { ShoppingCart, Store } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useCartStore, selectItemCount } from "../store/cartStore";

export default function Navbar({ store }) {
  const { slug } = useParams();
  const count    = useCartStore(selectItemCount);

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={`/store/${slug}`} className="flex items-center gap-2">
          {store?.logo ? (
            <img src={store.logo} alt={store.name} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <Store size={28} className="text-blue-600" />
          )}
          <span className="font-bold text-lg text-gray-800">{store?.name || "Store"}</span>
        </Link>

        <Link to={`/store/${slug}/cart`} className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <ShoppingCart size={24} className="text-gray-700" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
