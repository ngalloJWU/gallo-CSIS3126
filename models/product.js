//Model for creating Products
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema= new Schema({
    productTitle:String,
    productDescription:String,
    productPrice:String,
    category:String,
    lat:String,
    long:String,
    locationName:String,
    author:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    savedBy:Array,
    images:{type:Array,default:['tempProduct.jpg']}
},{timestamps: true});

productSchema.index({createdAt: 1},{expireAfterSeconds: 2592000})

module.exports=mongoose.model('Product',productSchema)
