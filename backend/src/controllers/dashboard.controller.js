import Sale from "../models/Sale.js";
import Product from "../models/Product.js";

/* ================= DASHBOARD ================= */

export const getDashboardStats = async (req, res) => {

try {

/* TODAY SALES */

const start = new Date();
start.setHours(0,0,0,0);

const today = await Sale.aggregate([
{ $match: { createdAt: { $gte: start } } },
{
$group:{
_id:null,
todaySales:{ $sum:"$total" },
count:{ $sum:1 }
}
}
]);

/* TOTAL PRODUCTS */

const totalProducts = await Product.countDocuments();

/* LOW STOCK */

const lowStockProducts = await Product.find({ stock:{ $lte:5 } })
.select("name stock")
.limit(5);

const lowStock = lowStockProducts.length;

/* RECENT SALES */

const recentSales = await Sale.find()
.sort({ createdAt:-1 })
.limit(5)
.select("total customerName");

/* SALES CHART (last 7 days) */

const lastWeek = new Date();
lastWeek.setDate(lastWeek.getDate()-7);

const salesChart = await Sale.aggregate([

{ $match:{ createdAt:{ $gte:lastWeek } } },

{
$group:{
_id:{ $dayOfMonth:"$createdAt" },
sales:{ $sum:"$total" }
}
},

{ $sort:{ _id:1 } }

]);

/* TOP PRODUCTS */

const topProducts = await Sale.aggregate([

{ $unwind:"$items" },

{
$group:{
_id:"$items.productId",
sold:{ $sum:"$items.quantity" },
name:{ $first:"$items.name" }
}
},

{ $sort:{ sold:-1 } },

{ $limit:5 }

]);

res.json({

todaySales: today[0]?.todaySales || 0,
totalProducts,
lowStock,
lowStockProducts,
recentSales,

salesChart: salesChart.map(s=>({
day:s._id,
sales:s.sales
})),

topProducts: topProducts.map(p=>({
_id:p._id,
name:p.name,
sold:p.sold
}))

});

} catch(err){

res.status(500).json({ message: err.message });

}

};