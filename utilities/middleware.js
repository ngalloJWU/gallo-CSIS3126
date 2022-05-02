const mongoose =require('mongoose');
const Product = require('../models/product');

module.exports.authCheck = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.returnUrl = req.originalUrl;
        req.flash('error','You must be logged in')
        res.redirect('/login')
    }else{
        next()
    }
}

module.exports.isUser = async(req,res,next)=>{
    const product = await Product.findById(req.params.id);
    if(product.author._id!=req.user.id){
        req.flash('error','Invalid Permission');
        return res.redirect(`/products/${product._id}/show`);
    }else{
        next();
    }
}