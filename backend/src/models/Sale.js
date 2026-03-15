import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
<<<<<<< HEAD
  {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        name: String,
        price: Number,
        quantity: {
          type: Number,
          required: true
        },
        subtotal: Number
      }
    ],
    total: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card"],
      default: "cash"
    }
  },
  { timestamps: true }
=======
{
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      name: String,
      price: Number,
      quantity: {
        type: Number,
        required: true
      },
      subtotal: Number
    }
  ],

  total: {
    type: Number,
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ["cash", "card", "paylater"],
    default: "cash"
  },

  paid: {
    type: Boolean,
    default: true
  }

},
{ timestamps: true }
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
);

const Sale = mongoose.model("Sale", saleSchema);

<<<<<<< HEAD
export default Sale;
=======
export default Sale;
>>>>>>> 51ad7f39c1de03ce9bd7493a4477a21ad3670ddb
