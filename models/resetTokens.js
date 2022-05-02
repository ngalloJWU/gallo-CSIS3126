const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resetPassSchema = new Schema({
    email:String,
    username:String,
    dateInitiated:Number,
})

resetPassSchema.index( { "lastModifiedDate": 1 }, { expireAfterSeconds: 300 } )

const resetToken = mongoose.model('Reset',resetPassSchema);
module.exports=resetToken;