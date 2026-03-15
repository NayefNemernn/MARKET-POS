import React, { useEffect, useState } from "react";
import { createSale } from "../api/sale.api";
import { createHoldSale, getHoldSaleNames } from "../api/holdSale.api";
import { useCart } from "../hooks/useCart";
import Receipt from "../pages/Receipt";

export default function CheckoutModal({ cart, total, close }) {

    const { clearCart } = useCart();

    const [method, setMethod] = useState("cash");
    const [amount, setAmount] = useState("");
    const [change, setChange] = useState(0);

    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");

    const [nameSuggestions, setNameSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [receipt, setReceipt] = useState(null);

    useEffect(() => {

        getHoldSaleNames().then(setNameSuggestions);

    }, []);

    useEffect(() => {

        const received = parseFloat(amount);

        if (!received) {
            setChange(0);
            return;
        }

        const diff = received - total;
        setChange(diff > 0 ? diff : 0);

    }, [amount, total]);

    /* DETECT NEW CUSTOMER */

    const isNewCustomer =
        method === "later" &&
        customerName &&
        !nameSuggestions.includes(customerName);

    /* COMPLETE SALE */

    const completeSale = async () => {

        try {

            if (cart.length === 0) {
                alert("Cart is empty");
                return;
            }

            /* PAY LATER */

            if (method === "later") {

                if (!customerName.trim()) {
                    alert("Enter customer name");
                    return;
                }

                await createHoldSale({

                    customerName,
                    phone: isNewCustomer ? phone : "",

                    items: cart.map(i => ({
                        productId: i.productId,
                        name: i.name,
                        price: i.price,
                        quantity: i.quantity
                    })),

                    total

                });

                clearCart();
                close();
                return;

            }

            /* NORMAL SALE */

            const payload = {

                items: cart.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity
                })),

                paymentMethod: method

            };

            const res = await createSale(payload);

            setReceipt(res.sale);

            clearCart();

        } catch (err) {

            alert(err.response?.data?.message || "Checkout failed");

        }

    };

    /* RECEIPT PREVIEW */

    if (receipt) {

        return (

            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

                <div className="bg-white rounded-xl shadow-xl p-6 w-[360px]">

                    <Receipt sale={receipt} />

                    <div className="flex gap-3 mt-4">

                        <button
                            onClick={() => window.print()}
                            className="flex-1 bg-green-600 text-white py-2 rounded"
                        >

                            Print

                        </button>

                        <button
                            onClick={() => { setReceipt(null); close(); }}
                            className="flex-1 border py-2 rounded"
                        >

                            Close

                        </button>

                    </div>

                </div>

            </div>

        )

    }

    return (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-xl w-[420px] p-6 shadow-xl">

                <div className="flex justify-between mb-6">

                    <h2 className="font-semibold text-lg">
                        Complete Payment
                    </h2>

                    <button onClick={close}>✕</button>

                </div>

                <div className="bg-blue-700 text-white rounded-xl p-6 text-center mb-6">

                    <p>Total Amount</p>

                    <p className="text-3xl font-bold">
                        ${total.toFixed(2)}
                    </p>

                </div>

                {/* PAYMENT METHODS */}

                <p className="text-sm mb-2">Payment Method</p>

                <div className="flex gap-3 mb-4">

                    <button
                        onClick={() => setMethod("cash")}
                        className={`flex-1 border rounded-lg py-3 ${method === "cash" ? "border-green-500 bg-green-50" : ""}`}
                    >

                        Cash

                    </button>

                    <button
                        onClick={() => setMethod("card")}
                        className={`flex-1 border rounded-lg py-3 ${method === "card" ? "border-green-500 bg-green-50" : ""}`}
                    >

                        Card

                    </button>

                    <button
                        onClick={() => setMethod("later")}
                        className={`flex-1 border rounded-lg py-3 ${method === "later" ? "border-green-500 bg-green-50" : ""}`}
                    >

                        Pay Later

                    </button>

                </div>

                {/* CUSTOMER NAME */}

                {method === "later" && (

                    <div className="relative mb-3">

                        <input
                            value={customerName}
                            onChange={(e) => {
                                setCustomerName(e.target.value);
                                setShowSuggestions(true);
                            }}
                            placeholder="Customer name"
                            className="w-full border rounded-lg px-3 py-2"
                        />

                        {showSuggestions && customerName && (

                            <div className="absolute bg-white border w-full rounded shadow max-h-40 overflow-y-auto">

                                {nameSuggestions
                                    .filter(n => n.toLowerCase().includes(customerName.toLowerCase()))
                                    .map(name => (
                                        <div
                                            key={name}
                                            onClick={() => {
                                                setCustomerName(name);
                                                setShowSuggestions(false);
                                            }}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                        >

                                            {name}

                                        </div>
                                    ))}

                            </div>

                        )}

                    </div>

                )}

                {/* PHONE INPUT FOR NEW CUSTOMER */}

                {isNewCustomer && (

                    <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone number"
                        className="w-full border rounded-lg px-3 py-2 mb-4"
                    />

                )}

                {/* CASH INPUT */}

                {method === "cash" && (

                    <>

                        <input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount received"
                            className="w-full border rounded-lg px-3 py-2 mb-3"
                        />

                        <div className="flex justify-between bg-green-50 text-green-700 rounded-lg px-4 py-3 mb-3">

                            <span>Change</span>
                            <span>${change.toFixed(2)}</span>

                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-4">

                            <button onClick={() => setAmount(20)} className="border py-2">$20</button>
                            <button onClick={() => setAmount(50)} className="border py-2">$50</button>
                            <button onClick={() => setAmount(100)} className="border py-2">$100</button>
                            <button onClick={() => setAmount(total)} className="border py-2">Exact</button>

                        </div>

                    </>

                )}

                <button
                    onClick={completeSale}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold"
                >

                    Complete Sale

                </button>

            </div>

        </div>

    );

}