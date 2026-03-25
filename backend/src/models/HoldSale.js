import mongoose from "mongoose";

const holdSaleSchema = new mongoose.Schema(
{
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true
},
customerName: String,
phone: String,

creditLimit:{
type:Number,
default:500
},

items:[
{
productId: mongoose.Schema.Types.ObjectId,
name:String,
price:Number,
quantity:Number
}
],

total:Number,
paid:{
type:Number,
default:0
},

balance:Number,

payments:[
{
amount:Number,
method:String,
notes:String,
date:{
type:Date,
default:Date.now
}
}
]

},
{timestamps:true}
);

export default mongoose.model("HoldSale",holdSaleSchema);