import express from "express";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", protect, isAdmin, async (req, res) => {

try {

/* TODAY RANGE */

const start = new Date();
start.setHours(0,0,0,0);

const end = new Date();
end.setHours(23,59,59,999);

/* TODAY SALES */

const salesToday = await Sale.find({
createdAt:{ $gte:start, $lte:end }
});

const todaySales = salesToday.reduce((sum,s)=>sum+s.total,0);


/* WEEK SALES */

const startWeek = new Date();
startWeek.setDate(startWeek.getDate() - 7);

const salesWeek = await Sale.find({
createdAt:{ $gte:startWeek }
});

const weekSales = salesWeek.reduce((sum,s)=>sum+s.total,0);


/* TOTAL PRODUCTS */

const totalProducts = await Product.countDocuments();

/* LOW STOCK */

const lowStockProducts = await Product.find({
stock:{ $lte:5 }
}).select("name stock");

const lowStock = lowStockProducts.length;


/* RECENT SALES */

const recentSales = await Sale.find()
.sort({ createdAt:-1 })
.limit(5)
.select("total customerName createdAt");


/* SALES CHART (LAST 7 DAYS) */

const lastWeek = new Date();
lastWeek.setDate(lastWeek.getDate()-7);

const salesChartRaw = await Sale.aggregate([

{ $match:{ createdAt:{ $gte:lastWeek } } },

{
$group:{
_id:{ $dayOfMonth:"$createdAt" },
sales:{ $sum:"$total" }
}
},

{ $sort:{ _id:1 } }

]);

const salesChart = salesChartRaw.map(s=>({
day:s._id,
sales:s.sales
}));


/* TOP PRODUCTS */

const topProductsRaw = await Sale.aggregate([

{ $unwind:"$items" },

{
$group:{
_id:"$items.productId",
name:{ $first:"$items.name" },
sold:{ $sum:"$items.quantity" }
}
},

{ $sort:{ sold:-1 } },

{ $limit:5 }

]);

const topProducts = topProductsRaw.map(p=>({
_id:p._id,
name:p.name,
sold:p.sold
}));


res.json({

todaySales,
weekSales,        // ⭐ NEW FIELD
totalProducts,
lowStock,

salesChart,
topProducts,
lowStockProducts,
recentSales

});

} catch(err){

res.status(500).json({ message:"Dashboard data failed" });

}

});

export default router;