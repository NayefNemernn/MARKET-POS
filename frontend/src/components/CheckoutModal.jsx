import React, { useEffect, useRef, useState } from "react";
import { createSale } from "../api/sale.api";
import { createHoldSale, getHoldSaleNames } from "../api/holdSale.api";
import { useCart } from "../hooks/useCart";
import { useTranslation } from "../hooks/useTranslation";
import { useCurrency } from "../context/CurrencyContext";
import VoiceButton from "./common/VoiceButton";
import useOfflineSales from "../hooks/useOfflineSales";
import toast from "react-hot-toast";
import {
  X, Banknote, CreditCard, Clock, User, Phone,
  ChevronRight, Printer, CheckCircle2, ShoppingBag, ArrowLeftRight
} from "lucide-react";

function printReceipt(sale, { toLBP, formatLBP, formatUSD, exchangeRate, change }) {
  const win = window.open("", "_blank", "width=360,height=620");
  if (!win) { window.print(); return; }

  const itemRows = sale.items.map(i => `
    <tr>
      <td>${i.name}</td>
      <td style="text-align:center">${i.quantity}</td>
      <td style="text-align:right">$${(i.price * i.quantity).toFixed(2)}</td>
    </tr>
    <tr class="sub-row">
      <td colspan="3">$${i.price.toFixed(2)} each &nbsp;·&nbsp; ${parseInt(toLBP(i.price)).toLocaleString()} ل.ل</td>
    </tr>
  `).join("");

  const now = new Date();
  const methodLabel = { cash:"Cash", card:"Card", paylater:"Pay Later" }[sale.paymentMethod] || sale.paymentMethod;

  const changeRow = change > 0 ? `
    <tr class="change-row">
      <td>Change Given</td>
      <td></td>
      <td style="text-align:right">$${change.toFixed(2)}</td>
    </tr>
    <tr class="sub-row"><td colspan="3">${parseInt(toLBP(change)).toLocaleString()} ل.ل</td></tr>
  ` : "";

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Receipt</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Courier New',monospace; font-size:13px; color:#111; width:80mm; padding:6mm 3mm; }
  .store { text-align:center; margin-bottom:8px; }
  .store h1 { font-size:20px; font-weight:900; letter-spacing:2px; }
  .store p  { font-size:10px; color:#666; margin-top:2px; }
  hr { border:none; border-top:1px dashed #aaa; margin:8px 0; }
  table { width:100%; border-collapse:collapse; }
  thead th { font-size:10px; text-transform:uppercase; color:#999; padding-bottom:5px; font-weight:600; }
  thead th:nth-child(2) { text-align:center; }
  thead th:last-child  { text-align:right; }
  td { padding:3px 0; vertical-align:top; }
  .sub-row td { font-size:10px; color:#999; padding-bottom:5px; }
  .total-row td { font-weight:800; font-size:15px; padding-top:6px; }
  .lbp-row td { font-size:10px; color:#b45309; padding-bottom:6px; }
  .change-row td { color:#15803d; font-weight:700; padding-top:4px; }
  .method { margin-top:8px; display:flex; align-items:center; gap:6px; font-size:11px; }
  .badge { background:#f0fdf4; border:1px solid #86efac; color:#166534; border-radius:4px; padding:2px 8px; font-weight:700; font-size:11px; }
  .footer { text-align:center; font-size:10px; color:#999; margin-top:10px; }
  .id { text-align:center; font-size:9px; color:#ccc; margin-top:4px; }
  @media print { @page { size:80mm auto; margin:0; } body { padding:4mm 2mm; } }
</style></head><body>
  <div class="store">
    <h1>MARKET POS</h1>
    <p>Nemer's Market</p>
    <p>${now.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})} &nbsp;·&nbsp; ${now.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</p>
  </div>
  <hr/>
  <table>
    <thead><tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Price</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <hr/>
  <table><tbody>
    <tr class="total-row"><td>TOTAL</td><td></td><td style="text-align:right">$${sale.total.toFixed(2)}</td></tr>
    <tr class="lbp-row"><td colspan="3">${parseInt(toLBP(sale.total)).toLocaleString()} ل.ل &nbsp;·&nbsp; @ ${parseInt(exchangeRate).toLocaleString()} ل.ل/$1</td></tr>
    ${changeRow}
    <tr><td colspan="3" class="method">Payment: <span class="badge">${methodLabel}</span></td></tr>
  </tbody></table>
  <hr/>
  <p class="footer">★ Thank you for your business! ★</p>
  ${sale._id && !sale._id.startsWith("offline") ? `<p class="id">#${sale._id}</p>` : ""}
  <script>window.onload=()=>{window.print();window.close();}<\/script>
</body></html>`;

  win.document.write(html);
  win.document.close();
}

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
  const [amountCurrency, setAmountCurrency] = useState("usd");
  const amountRef = useRef(null);

  useEffect(() => {
    getHoldSaleNames().then(setNameSuggestions).catch(() => {});
  }, []);

  useEffect(() => {
    if (method === "cash") setTimeout(() => amountRef.current?.focus(), 100);
  }, [method]);

  useEffect(() => {
    const received = parseFloat(amount);
    if (!received) { setChange(0); return; }
    const receivedUSD = amountCurrency === "lbp" ? received / exchangeRate : received;
    setChange(Math.max(receivedUSD - total, 0));
  }, [amount, total, amountCurrency, exchangeRate]);

  const isNewCustomer = method === "later" && customerName && !nameSuggestions.includes(customerName);

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
          items: cart.map(i => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity })),
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
          items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity, subtotal: i.price * i.quantity })),
          total, paymentMethod: method, createdAt: new Date().toISOString(), offline: true,
        });
        clearCart();
      }
    } catch (err) {
      alert(err.response?.data?.message || t.checkoutFailed);
    } finally {
      setLoading(false);
    }
  };

  /* ── Receipt success screen ── */
  if (receipt) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#141414] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
          <div className="bg-green-600 px-6 py-8 text-center">
            <CheckCircle2 size={48} className="text-white mx-auto mb-3" strokeWidth={1.5}/>
            <h2 className="text-white text-xl font-bold">Sale Complete!</h2>
            <p className="text-green-200 text-sm mt-1">{new Date().toLocaleString()}</p>
          </div>
          {receipt.offline && (
            <div className="bg-yellow-500 text-black text-xs text-center font-semibold px-3 py-2">
              ⚠️ Offline Sale — will sync automatically when connected
            </div>
          )}
          <div className="px-6 py-4 space-y-2.5 max-h-60 overflow-y-auto">
            <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">
              <ShoppingBag size={12}/> Items
            </div>
            {receipt.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {item.name} <span className="text-gray-400">× {item.quantity}</span>
                </span>
                <span className="font-medium">{formatUSD(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-gray-200 dark:border-white/10 pt-3 flex justify-between font-bold text-base">
              <span>Total</span>
              <div className="text-right">
                <div>{formatUSD(receipt.total)}</div>
                <div className="text-xs font-normal text-amber-500">{formatLBP(toLBP(receipt.total))}</div>
              </div>
            </div>
            {change > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-semibold">
                <span>Change</span>
                <div className="text-right">
                  <div>{formatUSD(change)}</div>
                  <div className="text-xs font-normal">{formatLBP(toLBP(change))}</div>
                </div>
              </div>
            )}
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => printReceipt(receipt, { toLBP, formatLBP, formatUSD, exchangeRate, change })}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
            >
              <Printer size={16}/> Print
            </button>
            <button
              onClick={() => { setReceipt(null); close(); }}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-[#252525] transition"
            >
              {t.close || "Close"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Checkout form ── */
  const METHODS = [
    { id: "cash",  label: t.cash,     Icon: Banknote,   color: "green"  },
    { id: "card",  label: t.card,     Icon: CreditCard, color: "blue"   },
    { id: "later", label: t.payLater, Icon: Clock,      color: "purple" },
  ];
  const activeStyle = { green:"bg-green-600 text-white border-green-600", blue:"bg-blue-600 text-white border-blue-600", purple:"bg-purple-600 text-white border-purple-600" };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#141414] rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <h2 className="font-bold text-lg">{t.completePayment}</h2>
            <p className="text-xs text-gray-400">{cart.length} item{cart.length !== 1 ? "s" : ""} in cart</p>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1c1c1c] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#252525] transition">
            <X size={16}/>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {!navigator.onLine && (
            <div className="bg-yellow-500/15 border border-yellow-400/40 text-yellow-600 dark:text-yellow-400 text-sm rounded-xl px-4 py-2.5 text-center">
              ⚠️ Offline — sale will be saved locally and synced later
            </div>
          )}

          {/* Total card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-5">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full"/>
            <div className="absolute -right-2 bottom-0 w-20 h-20 bg-white/5 rounded-full"/>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-1">{t.totalAmount}</p>
            <p className="text-4xl font-black tracking-tight">{formatUSD(total)}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="bg-white/20 rounded-full px-2.5 py-0.5 text-xs font-medium">{formatLBP(toLBP(total))}</span>
              <span className="text-blue-300 text-xs">@ {parseInt(exchangeRate).toLocaleString()} ل.ل/$1</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{t.paymentMethod}</p>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(({ id, label, Icon, color }) => {
                const isActive = method === id;
                const disabled = id === "later" && !navigator.onLine;
                return (
                  <button key={id}
                    onClick={() => { if (disabled) { toast.error("Pay Later requires internet"); return; } setMethod(id); }}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-semibold text-sm transition
                      ${isActive ? activeStyle[color] : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20"}
                      ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <Icon size={20} strokeWidth={1.8}/>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pay Later fields */}
          {method === "later" && (
            <div className="space-y-3">
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input value={customerName}
                      onChange={e => { setCustomerName(e.target.value); setShowSuggestions(true); }}
                      placeholder={t.customerName}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] border-2 border-transparent focus:border-purple-400 outline-none text-sm transition"/>
                  </div>
                  <VoiceButton onResult={text => { setCustomerName(text); setShowSuggestions(false); }} color="purple"/>
                </div>
                {showSuggestions && customerName && (
                  <div className="absolute top-full mt-1 bg-white dark:bg-[#1c1c1c] w-full rounded-xl shadow-xl border border-gray-100 dark:border-white/10 max-h-40 overflow-y-auto z-10">
                    {nameSuggestions.filter(n => n.toLowerCase().includes(customerName.toLowerCase())).map(name => (
                      <button key={name} onClick={() => { setCustomerName(name); setShowSuggestions(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-sm flex items-center justify-between group">
                        {name} <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500"/>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isNewCustomer && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={t.phone}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] border-2 border-transparent focus:border-purple-400 outline-none text-sm transition"/>
                  </div>
                  <VoiceButton onResult={text => setPhone(text)} color="purple"/>
                </div>
              )}
            </div>
          )}

          {/* Cash section */}
          {method === "cash" && (
            <div className="space-y-4">
              {/* Currency toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Received in</span>
                <div className="flex bg-gray-100 dark:bg-[#1c1c1c] rounded-xl p-1 gap-1">
                  {[{id:"usd",label:"USD $",active:"bg-green-600"},{id:"lbp",label:"LBP ل.ل",active:"bg-amber-500"}].map(c => (
                    <button key={c.id} onClick={() => setAmountCurrency(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${amountCurrency === c.id ? c.active + " text-white shadow-sm" : "text-gray-500"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    {amountCurrency === "usd" ? "$" : "ل.ل"}
                  </span>
                  <input ref={amountRef} value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder={t.amountReceived} type="number"
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] border-2 border-transparent focus:border-green-400 outline-none text-lg font-bold transition"/>
                </div>
                <VoiceButton onResult={text => { const n = text.replace(/[^0-9.]/g,""); if(n) setAmount(n); }} color="green"/>
              </div>

              {/* Change */}
              <div className={`flex justify-between items-center rounded-xl px-4 py-3 transition-all ${
                change > 0 ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                           : "bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/5"}`}>
                <div className="flex items-center gap-2">
                  <ArrowLeftRight size={14} className={change > 0 ? "text-green-500" : "text-gray-400"}/>
                  <span className="text-sm font-medium">{t.change}</span>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-base ${change > 0 ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                    {formatUSD(change)}
                  </div>
                  {change > 0 && <div className="text-xs text-amber-500">{formatLBP(toLBP(change))}</div>}
                </div>
              </div>

              {/* Quick USD */}
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Quick USD</p>
                <div className="grid grid-cols-4 gap-2">
                  {[20,50,100].map(v => (
                    <button key={v} onClick={() => { setAmount(v); setAmountCurrency("usd"); }}
                      className="bg-gray-100 dark:bg-[#1c1c1c] hover:bg-gray-200 dark:hover:bg-[#252525] py-2.5 rounded-xl text-sm font-semibold transition">
                      ${v}
                    </button>
                  ))}
                  <button onClick={() => { setAmount(total); setAmountCurrency("usd"); }}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 py-2.5 rounded-xl text-xs font-semibold transition hover:bg-blue-100">
                    Exact
                  </button>
                </div>
              </div>

              {/* Quick LBP */}
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Quick LBP</p>
                <div className="grid grid-cols-3 gap-2">
                  {[500000,1000000,2000000].map(v => (
                    <button key={v} onClick={() => { setAmount(v); setAmountCurrency("lbp"); }}
                      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 py-2.5 rounded-xl text-xs font-semibold transition">
                      {(v/1000).toLocaleString()}K ل.ل
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Complete Sale — sticky bottom */}
        <div className="px-6 pb-6 pt-3 border-t border-gray-100 dark:border-white/5">
          <button onClick={completeSale} disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(22,163,74,0.35)]">
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                  Processing...
                </span>
              : t.completeSale
            }
          </button>
        </div>

      </div>
    </div>
  );
}