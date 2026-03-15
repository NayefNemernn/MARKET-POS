import Product from "../models/Product.js";
import Category from "../models/Category.js";
import supabase from "../config/supabase.js";
import { v4 as uuid } from "uuid";

/* =========================
   GET ALL PRODUCTS
========================= */

export const getAllProducts = async (req,res)=>{

const products = await Product.find()
.populate("category","name")
.sort({createdAt:-1});

res.json(products);

};


/* =========================
   GET PRODUCT BY BARCODE
========================= */

export const getProductByBarcode = async (req,res)=>{

const product = await Product.findOne({
barcode:req.params.barcode
}).populate("category","name");

if(!product){
return res.status(404).json({message:"Product not found"});
}

res.json(product);

};


/* =========================
   CREATE PRODUCT
========================= */

export const createProduct = async (req,res)=>{

try{
  console.log("BODY:", req.body);
console.log("FILE:", req.file);

const { name, barcode, price, stock, category } = req.body;

let imageUrl = "";

if(req.file){

const fileName = `${uuid()}.jpg`;

const { error } = await supabase.storage
.from("products")
.upload(fileName, req.file.buffer,{
contentType:req.file.mimetype
});

if(error) throw error;

imageUrl =
`${process.env.SUPABASE_URL}/storage/v1/object/public/products/${fileName}`;

}

const product = await Product.create({
name,
barcode,
price,
stock,
category,
image:imageUrl
});

res.status(201).json(product);

}catch(err){

res.status(500).json({message:err.message});

}

};


/* =========================
   UPDATE PRODUCT
========================= */

export const updateProduct = async (req,res)=>{

try{

const updateData = {...req.body};

if(req.file){

const fileName = `products/${uuid()}`;

const { error } = await supabase.storage
.from("products")
.upload(fileName, req.file.buffer,{
contentType:req.file.mimetype
});

if(error) throw error;

updateData.image =
`${process.env.SUPABASE_URL}/storage/v1/object/public/products/${fileName}`;

}

const product = await Product.findByIdAndUpdate(
req.params.id,
updateData,
{ new:true }
).populate("category","name");

res.json(product);

}catch(err){

res.status(500).json({message:err.message});

}

};


/* =========================
   DELETE PRODUCT
========================= */

export const deleteProduct = async (req,res)=>{

await Product.findByIdAndDelete(req.params.id);

res.json({message:"Product deleted"});

};