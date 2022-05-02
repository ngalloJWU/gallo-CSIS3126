const Joi = require('joi');

module.exports.validateProduct=(req,res,next)=>{
    console.log(req.body)
    const productSchema = Joi.object({
        productTitle:Joi.string().required(),
        productDescription:Joi.string().required(),
        productPrice:Joi.number().required(),
        category:Joi.string().required(),
        zip:Joi.string().required(),
        deleteImages:Joi.array()
    })

    const {error} = productSchema.validate(req.body)

    if(error){
        const msg=error.details[0].message;
        req.flash('error',msg)
        console.log(error)
        res.redirect(req.originalUrl)
    }else{
        next()
    }

}

module.exports.validateUser = (req,res,next)=>{

    const userSchema = Joi.object({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
        username:Joi.string().max(15).alphanum().required(),
        password:Joi.string().required(),
        myZip:Joi.string().max(10).required(),
        phone:Joi.string().max(10).required(),
        preferredContact:Joi.string().required(),
        confirmPassword:Joi.string().required()
    })

    const {error} = userSchema.validate(req.body)

    if(error){
        const msg=error.details[0].message;
        req.flash('error',msg)
        res.redirect('/register')
    }else{
        next()
    }
}