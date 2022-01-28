//Model for creating Products
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema= new Schema({
    productTitle:String,
    productDescription:String,
    productPrice:Number,
})

module.exports=mongoose.model('Product',productSchema)