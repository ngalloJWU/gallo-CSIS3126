const mongoose = require('mongoose');
const Schema = mongoose.Schema;

categorySchema = new Schema({
    categoryName:String
})

module.exports=mongoose.model('Category',categorySchema)