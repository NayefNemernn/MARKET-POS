import { useState, useEffect } from "react";
import { useParams, useOutletContext, useNavigate, Link } from "react-router-dom";
import { submitOrder, customerUpdateMe } from "../api/index";
import { useCartStore, selectTotal } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { ArrowLeft, User, Phone, MapPin, FileText, Loader2, Navigation, Link2, CheckCircle2 } from "lucide-react";
import AuthModal from "../components/AuthModal";
import toast from "react-hot-toast";

// Try to extract lat/lng from a Google Maps URL
function parseMapsUrl(url) {
  if (!url) return null;
  // @lat,lng (place page, directions)
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  // ?q=lat,lng or &q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  // ll=lat,lng (older format)
  const llMatch = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
  return null;
}

export default function CheckoutPage() {
  const { slug }    = useParams();
  const { store }   = useOutletContext();
  const navigate    = useNavigate();
  const items       = useCartStore(s => s.items);
  const clearCart   = useCartStore(s => s.clearCart);
  const subtotal    = useCartStore(selectTotal);
  const deliveryFee = store?.deliveryFee || 0;
  const total       = subtotal + deliveryFee;
  const sym         = store?.currencySymbol || "$";

  const { customer, token, updateCustomer } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);

  const [form, setForm]         = useState({
    name:                customer?.name                || "",
    phone:               customer?.phone               || "",
    address:             customer?.address             || "",
    locationDescription: customer?.locationDescription || "",
    notes:               "",
    lat:                 customer?.lat  || null,
    lng:                 customer?.lng  || null,
  });
  const [mapsLink, setMapsLink]   = useState("");
  const [errors,   setErrors]     = useState({});
  const [loading,  setLoading]    = useState(false);
  const [locating, setLocating]   = useState(false);
  const [saveProfile, setSaveProfile] = useState(false);

  // When customer logs in mid-checkout, pre-fill
  useEffect(() => {
    if (customer) {
      setForm(f => ({
        ...f,
        name:                f.name  || customer.name  || "",
        phone:               f.phone || customer.phone || "",
        address:             f.address || customer.address || "",
        locationDescription: f.locationDescription || customer.locationDescription || "",
        lat:                 f.lat || customer.lat || null,
        lng:                 f.lng || customer.lng || null,
      }));
    }
  }, [customer]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  // GPS auto-detect
  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setForm(f => ({ ...f, address, lat, lng }));
          setErrors(e => ({ ...e, address: "" }));
          toast.success("Location detected");
        } catch {
          setForm(f => ({ ...f, lat, lng }));
          toast("Location saved but couldn't fetch address", { icon: "⚠️" });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        const msgs = {
          1: "Location permission denied.",
          2: "Location unavailable. Enter your address manually.",
          3: "Location request timed out.",
        };
        toast.error(msgs[err.code] || "Failed to get location");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // Google Maps link paste handler
  const handleMapsLinkChange = (val) => {
    setMapsLink(val);
    const coords = parseMapsUrl(val);
    if (coords) {
      setForm(f => ({ ...f, lat: coords.lat, lng: coords.lng }));
      toast.success("Coordinates extracted from link");
    } else if (val.trim()) {
      // Can't parse coords but save as description so driver can open it
      setForm(f => ({ ...f, lat: null, lng: null }));
    } else {
      setForm(f => ({ ...f, lat: null, lng: null }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required";
    if (!form.phone.trim())   e.phone   = "Phone is required";
    if (!form.address.trim()) e.address = "Delivery address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const locationDescription = form.locationDescription
        || (mapsLink && !form.lat ? mapsLink : "");

      const result = await submitOrder({
        slug,
        customerId: customer?._id,
        customer: {
          name:                form.name,
          phone:               form.phone,
          address:             form.address,
          locationDescription,
          lat:                 form.lat,
          lng:                 form.lng,
          notes:               form.notes,
        },
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      });

      // Save updated profile if customer is logged in and opted in
      if (customer && token && saveProfile) {
        try {
          const updated = await customerUpdateMe(slug, token, {
            name: form.name, phone: form.phone,
            address: form.address,
            locationDescription,
            lat: form.lat, lng: form.lng,
          });
          updateCustomer(updated.customer);
        } catch {}
      }

      clearCart();
      navigate(`/store/${slug}/order/${result.orderId}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <Link to={`/store/${slug}`} className="text-blue-600 hover:underline text-sm mt-2 block">← Shop now</Link>
      </div>
    );
  }

  const hasCoords = form.lat && form.lng;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-20">
      <Link to={`/store/${slug}/cart`} className="flex items-center gap-1 text-sm text-blue-600 mb-5 hover:underline">
        <ArrowLeft size={16} /> Back to cart
      </Link>

      <h1 className="text-xl font-bold text-gray-800 mb-5">Delivery Details</h1>

      {/* Auth banner */}
      {customer ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4">
          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-700">Logged in as <strong>{customer.name}</strong> — info pre-filled below</p>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-4">
          <p className="text-sm text-blue-700">Save your info for faster checkout next time</p>
          <button type="button" onClick={() => setShowAuth(true)}
            className="shrink-0 ml-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition">
            Login / Register
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
            <User size={14} /> Full Name
          </label>
          <input value={form.name} onChange={e => set("name", e.target.value)}
            placeholder="Your full name"
            className={`w-full px-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-400" : "border-gray-200"}`} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
            <Phone size={14} /> Phone Number
          </label>
          <input value={form.phone} onChange={e => set("phone", e.target.value)}
            placeholder="+1 234 567 890" type="tel"
            className={`w-full px-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-400" : "border-gray-200"}`} />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* Address + GPS button */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <MapPin size={14} /> Delivery Address
            </label>
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              {locating
                ? <><Loader2 size={12} className="animate-spin" /> Detecting...</>
                : <><Navigation size={12} /> Use my location</>
              }
            </button>
          </div>
          <textarea value={form.address} onChange={e => set("address", e.target.value)}
            placeholder="Street, building, floor..."
            rows={3}
            className={`w-full px-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.address ? "border-red-400" : "border-gray-200"}`} />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        {/* Google Maps link */}
        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
            <Link2 size={14} /> Google Maps Link <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            value={mapsLink}
            onChange={e => handleMapsLinkChange(e.target.value)}
            placeholder="Paste your Google Maps link here..."
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {hasCoords && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <span>📍</span> GPS saved: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
            </p>
          )}
          {mapsLink && !hasCoords && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Couldn't read coordinates from this link — the driver will still receive the link.
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Open Google Maps → long press your location → copy the link
          </p>
        </div>

        {/* Location description */}
        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
            <MapPin size={14} /> Location Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            value={form.locationDescription}
            onChange={e => set("locationDescription", e.target.value)}
            placeholder="e.g. Building 4, 2nd floor, Apt 201, near pharmacy..."
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
            <FileText size={14} /> Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="Any special instructions..."
            rows={2}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {/* Order summary */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
          <p className="font-semibold text-gray-700 text-sm mb-2">Order Summary ({items.length} item{items.length > 1 ? "s" : ""})</p>
          {items.map(i => (
            <div key={i.productId} className="flex justify-between text-sm text-gray-600">
              <span className="truncate mr-2">{i.name} × {i.quantity}</span>
              <span className="shrink-0">{sym}{(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-gray-600 border-t pt-2 mt-2">
              <span>Delivery fee</span>
              <span>{sym}{deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-800 border-t pt-2 mt-2">
            <span>Total</span>
            <span>{sym}{total.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-400 text-center pt-1">💵 Cash on delivery</p>
        </div>

        {/* Save profile option for logged-in users */}
        {customer && (
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveProfile}
              onChange={e => setSaveProfile(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-sm text-gray-600">Save updated info to my profile</span>
          </label>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-base">
          {loading ? <><Loader2 size={18} className="animate-spin" /> Placing order...</> : "Place Order 🚀"}
        </button>
      </form>

      {showAuth && <AuthModal slug={slug} onClose={() => setShowAuth(false)} />}
    </div>
  );
}
