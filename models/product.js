//Model for creating Products
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
    url:String,
    filename:String
})

imageSchema.virtual('thumb').get(function(){
    return this.url.replace('/upload','/upload/c_fill,w_200,h_200')
})

imageSchema.virtual('showThumb').get(function(){
    return this.url.replace('/upload','/upload/c_fill,w_500,h_500')
})
const productSchema= new Schema({
    productTitle:String,
    productDescription:String,
    productPrice:Number,
    category:String,
    zip:String,
    lat:String,
    long:String,
    locationName:String,
    author:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    savedBy:Array,
    images:[imageSchema]
},{timestamps: true});

productSchema.index({createdAt: 1},{expireAfterSeconds: 2592000})

module.exports=mongoose.model('Product',productSchema)
