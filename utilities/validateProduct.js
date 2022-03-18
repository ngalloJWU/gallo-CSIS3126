const Joi = require('joi');

module.exports.validateProduct=(req,res,next)=>{
    console.log(req.body)
    const productSchema = Joi.object({
        productTitle:Joi.string().required(),
        productDescription:Joi.string().required(),
        productPrice:Joi.string().required(),
        category:Joi.string().required(),
        zip:Joi.string().required()
    })

    const {error} = productSchema.validate(req.body)

    if(error){
        console.log(error)
        res.redirect('/')
    }else{
        next()
    }

}