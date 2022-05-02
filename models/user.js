const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    myZip:{type:String,required:true},
    myLocation:String,
    phone:{type:String,required:true},
    preferredContact:{
        type:String,
        required:true
    },
    savedPosts:[{
        type:Schema.Types.ObjectId,
        ref:'Product'
    }],
    profilePhoto:{
        type:Object
    },
    isAdmin:{
        type:Boolean,
        default:false
    }

});
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User',UserSchema)