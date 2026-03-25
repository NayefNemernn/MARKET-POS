import React, { useEffect, useState } from "react";
import { createSale } from "../api/sale.api";
import { createHoldSale, getHoldSaleNames } from "../api/holdSale.api";
import { useCart } from "../hooks/useCart";
import Receipt from "../pages/Receipt";
import { useTranslation } from "../hooks/useTranslation";
import { useCurrency } from "../context/CurrencyContext";
import VoiceButton from "./common/VoiceButton";
import useOfflineSales from "../hooks/useOfflineSales";
import toast from "react-hot-toast";

export default function CheckoutModal({ cart, total, close }) {
  const { clearCart } = useCart();
  const { t } = useTranslation();
  const { saveOffline } = useOfflineSales();
  const { toLBP, formatLBP, formatUSD, exchangeRate } = useCurrency();

  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [change, setChange] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  // Which currency the cashier is entering the received amount in
  const [amountCurrency, setAmountCurrency] = useState("usd"); // "usd" | "lbp"

  useEffect(() => {
    getHoldSaleNames().then(setNameSuggestions).catch(() => {});
  }, []);

  useEffect(() => {
    const received = parseFloat(amount);
    if (!received) { setChange(0); return; }
    // Convert received amount to USD for change calculation
    const receivedUSD = amountCurrency === "lbp"
      ? received / exchangeRate
      : received;
    setChange(Math.max(receivedUSD - total, 0));
  }, [amount, total, amountCurrency, exchangeRate]);

  const isNewCustomer =
    method === "later" && customerName && !nameSuggestions.includes(customerName);

  const completeSale = async () => {
    if (cart.length === 0) { alert(t.cartEmpty); return; }
    setLoading(true);

    try {
      if (method === "later") {
        if (!customerName.trim()) { alert(t.enterCustomerName); return; }
        if (!navigator.onLine) { toast.error("Pay Later requires an internet connection"); return; }

        await createHoldSale({
          customerName,
          phone: isNewCustomer ? phone : "",
          items: cart.map(i => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          total,
        });

        clearCart();
        close();
        return;
      }

      const payload = {
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: method,
      };

      if (navigator.onLine) {
        const res = await createSale(payload);
        setReceipt(res.sale);
        clearCart();
      } else {
        await saveOffline(payload);
        toast.success("📴 Sale saved — will sync when connected");
        setReceipt({
          _id: "offline-" + Date.now(),
          items: cart.map(i => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            subtotal: i.price * i.quantity,
          })),
          total,
          paymentMethod: method,
          createdAt: new Date().toISOString(),
          offline: true,
        });
        clearCart();
      }

    } catch (err) {
      alert(err.response?.data?.message || t.checkoutFailed);
    } finally {
      setLoading(false);
    }
  };

  // ── Receipt screen ──
  if (receipt) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50">
        <div className="bg-gray-100 dark:bg-[#141414] rounded-3xl p-6 w-[360px] shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff] dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]">
          {receipt.offline && (
            <div className="bg-yellow-500 text-black text-xs text-center font-semibold rounded-lg px-3 py-1 mb-3">
              ⚠️ Offline Sale — will sync automatically when connected
            </div>
          )}
          <Receipt sale={receipt} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl"
            >
              {t.print}
            </button>
            <button
              onClick={() => { setReceipt(null); close(); }}
              className="flex-1 bg-gray-200 dark:bg-[#1c1c1c] py-2 rounded-xl"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Checkout form ──
  const lbpTotal = formatLBP(toLBP(total));
  const changeInLBP = formatLBP(toLBP(change));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50">
      <div className="
        w-[440px] bg-gray-100 dark:bg-[#141414] rounded-3xl p-6
        shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
        dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
        max-h-[90vh] overflow-y-auto
      ">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-lg">{t.completePayment}</h2>
          <button onClick={close}>✕</button>
        </div>

        {/* Offline warning */}
        {!navigator.onLine && (
          <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-600 dark:text-yellow-400 text-sm rounded-xl px-4 py-2 mb-4 text-center">
            ⚠️ Offline — sale will be saved locally and synced later
          </div>
        )}

        {/* Total — Dual Currency */}
        <div className="bg-blue-600 text-white rounded-2xl p-5 text-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.6)]">
          <p className="text-blue-200 text-sm mb-1">{t.totalAmount}</p>
          <p className="text-3xl font-bold">{formatUSD(total)}</p>
          <p className="text-blue-200 text-sm mt-1 font-medium">{lbpTotal}</p>
          <p className="text-blue-300 text-xs mt-0.5">
            @ {parseInt(exchangeRate).toLocaleString()} ل.ل per $1
          </p>
        </div>

        {/* Payment methods */}
        <p className="text-sm text-gray-500 mb-2">{t.paymentMethod}</p>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setMethod("cash")}
            className={`flex-1 py-3 rounded-xl ${method === "cash" ? "bg-green-600 text-white" : "bg-gray-200 dark:bg-[#1c1c1c]"}`}
          >
            {t.cash}
          </button>
          <button
            onClick={() => setMethod("card")}
            className={`flex-1 py-3 rounded-xl ${method === "card" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-[#1c1c1c]"}`}
          >
            {t.card}
          </button>
          <button
            onClick={() => {
              if (!navigator.onLine) { toast.error("Pay Later requires internet"); return; }
              setMethod("later");
            }}
            className={`flex-1 py-3 rounded-xl transition ${method === "later" ? "bg-purple-600 text-white" : "bg-gray-200 dark:bg-[#1c1c1c]"} ${!navigator.onLine ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {t.payLater}
          </button>
        </div>

        {/* Customer name (Pay Later) */}
        {method === "later" && (
          <div className="relative mb-3">
            <div className="flex items-center gap-2">
              <input
                value={customerName}
                onChange={(e) => { setCustomerName(e.target.value); setShowSuggestions(true); }}
                placeholder={t.customerName}
                className="flex-1 bg-gray-200 dark:bg-[#1c1c1c] rounded-lg px-3 py-2 outline-none"
              />
              <VoiceButton onResult={(text) => { setCustomerName(text); setShowSuggestions(false); }} />
            </div>
            {showSuggestions && customerName && (
              <div className="absolute bg-white dark:bg-[#1c1c1c] w-full rounded shadow max-h-40 overflow-y-auto z-10">
                {nameSuggestions
                  .filter(n => n.toLowerCase().includes(customerName.toLowerCase()))
                  .map(name => (
                    <div
                      key={name}
                      onClick={() => { setCustomerName(name); setShowSuggestions(false); }}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer"
                    >
                      {name}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Phone (new customer) */}
        {isNewCustomer && (
          <div className="flex items-center gap-2 mb-4">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phone}
              className="flex-1 bg-gray-200 dark:bg-[#1c1c1c] rounded-lg px-3 py-2 outline-none"
            />
            <VoiceButton onResult={(text) => setPhone(text)} />
          </div>
        )}

        {/* Cash inputs */}
        {method === "cash" && (
          <>
            {/* Currency selector for amount received */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500">Received in:</span>
              <button
                onClick={() => setAmountCurrency("usd")}
                className={`px-3 py-1 rounded-lg text-sm transition ${amountCurrency === "usd" ? "bg-green-600 text-white" : "bg-gray-200 dark:bg-[#1c1c1c]"}`}
              >
                USD $
              </button>
              <button
                onClick={() => setAmountCurrency("lbp")}
                className={`px-3 py-1 rounded-lg text-sm transition ${amountCurrency === "lbp" ? "bg-amber-500 text-white" : "bg-gray-200 dark:bg-[#1c1c1c]"}`}
              >
                LBP ل.ل
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                  {amountCurrency === "usd" ? "$" : "ل.ل"}
                </span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t.amountReceived}
                  type="number"
                  className="w-full bg-gray-200 dark:bg-[#1c1c1c] rounded-lg pl-8 pr-3 py-2 outline-none"
                />
              </div>
              <VoiceButton onResult={(text) => {
                const num = text.replace(/[^0-9.]/g, "");
                if (num) setAmount(num);
              }} />
            </div>

            {/* Change display */}
            <div className="flex justify-between bg-green-100 dark:bg-green-900/30 rounded-lg px-4 py-3 mb-3">
              <span>{t.change}</span>
              <div className="text-right">
                <div className="font-semibold text-green-600">{formatUSD(change)}</div>
                <div className="text-xs text-amber-500">{changeInLBP}</div>
              </div>
            </div>

            {/* Quick amount buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[20, 50, 100].map(v => (
                <button
                  key={v}
                  onClick={() => { setAmount(v); setAmountCurrency("usd"); }}
                  className="bg-gray-200 dark:bg-[#1c1c1c] py-2 rounded-lg text-sm"
                >
                  ${v}
                </button>
              ))}
              <button
                onClick={() => { setAmount(total); setAmountCurrency("usd"); }}
                className="bg-gray-200 dark:bg-[#1c1c1c] py-2 rounded-lg text-sm"
              >
                {t.exact}
              </button>
            </div>

            {/* Quick LBP buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[500000, 1000000, 2000000].map(v => (
                <button
                  key={v}
                  onClick={() => { setAmount(v); setAmountCurrency("lbp"); }}
                  className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 py-2 rounded-lg text-xs text-amber-700 dark:text-amber-400"
                >
                  {(v / 1000)}K ل.ل
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={completeSale}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 py-3 rounded-xl font-semibold text-white transition"
        >
          {loading ? "Processing..." : t.completeSale}
        </button>

      </div>
    </div>
  );
}