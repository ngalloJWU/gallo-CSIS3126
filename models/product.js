//Model for creating Products
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema= new Schema({
    productTitle:String,
    productDescription:String,
    productPrice:String,
    category:String,
    expireAt:{
         type:Date,
         expires:Date.now()+1
     },
    created: {type:Date, default:Date.now()},
    image:{type:String,default:'tempProduct.jpg'}
})

module.exports=mongoose.model('Product',productSchema)
