//Nickslist - Made by Nicholas Gallo
//Design Project CSIS 3126
//Last Updated: January 28, 2022

//Module Requires
const express = require('express');
const app = express();
const path = require('path')
const ejsMate=require('ejs-mate')
const mongoose =require('mongoose');
const Product = require('./models/product');
const Category = require('./models/categories')
const { urlencoded } = require('express');
const {validateProduct}=require('./utilities/validateProduct')
const methodOverride = require('method-override')
const morgan = require('morgan');
const catchAsync = require('./utilities/catchAsync');
const ExpressError = require('./utilities/ExpressError');
const Joi = require('joi')
const session = require('express-session');
const flash=require('connect-flash');


//Connecting MongoDB Database
mongoose.connect('mongodb://localhost:27017/NicksList',{

})

const db=mongoose.connection;

db.once('open',()=>{
    console.log('Database Connected')
})

//App and Path Sets
app.use(express.urlencoded({extended:true}))//Parse req.body
app.engine('ejs',ejsMate);
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname,'views'))
app.use(express.static(__dirname + 'public'));
app.use(express.static('./public'))
app.use(flash())

app.use(session(
    {secret:'tempSecret',
    resave:'false',
    saveUninitialized:'true',
    cookie:{
        httpOnly:true,
        expires:Date.now()+1000*60*60*24*7
    }
}))

app.use(morgan('tiny'))

app.use(methodOverride('_method'))

const seedDB=async()=>{
    const categoryArr=['Electronics_Media','Home_Garden','Clothing',"Baby_Kids","Vehicles","Toys_Games","Sports_Outdoors","Collectables","Pet","Health_Beauty","Equipment","General","Other"]

    for(let i=0;i<50;i++){
        let productTemp = {
            productTitle:"Temp Title",
            productDescription:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas congue, quam quis interdum tempus, leo nulla luctus massa, in fringilla est eros ac magna. Nullam rhoncus sagittis purus eu venenatis. Etiam neque metus, fermentum et magna vel, semper fringilla enim. Curabitur imperdiet imperdiet tortor, quis laoreet purus porttitor ut. Etiam dictum nibh in arcu porttitor, vitae tempus enim iaculis. Fusce purus diam, maximus quis lacus mattis, semper lacinia arcu. Nulla posuere maximus magna venenatis consectetur. Sed elementum molestie turpis tempus lobortis. Suspendisse semper orci ut orci aliquam ultrices. Pellentesque ac mollis sem. Ut eu ipsum justo. Morbi pellentesque felis mi, in efficitur elit volutpat sit amet.",
            productPrice:'10.99',
            category: categoryArr[12%i],
        }
        const product = await new Product(productTemp);
        await product.save()
    }
}

app.use((req,res,next)=>{
    res.locals.success=req.flash('success')
    res.locals.error=req.flash('error')
    next()
})

//Routes
app.get('/',catchAsync(async(req,res)=>{
    const products = await Product.find({}).limit(20)
    res.render('home',{products});
}))

app.get('/products/new',async(req,res)=>{
    const categories = await Category.find({})
    console.log(categories)
    res.render('products/newProduct',{categories})
})

app.get('/products',catchAsync(async(req,res)=>{
    const products=await Product.find({});
    res.render('products/show',{products})
}))

app.get('/products/:id/show',catchAsync(async(req,res)=>{
    console.log(req.params.id)
    const product = await Product.findById(req.params.id);
    res.render('products/productShow',{product})
}))


app.get('/products/sort',catchAsync(async(req,res)=>{
    var products
    console.log(req.query)
    if(req.query.category){
        products = await Product.find({"category":req.query.category});
    }else{
        const query = {$text:{$search:req.query.search}}
        console.log(query)
        products = await Product.find(query);
    }

    //console.log(products)
    res.render('products/show',{products})
}))

app.get('/products/:id/edit',catchAsync(async(req,res)=>{
    const product = await Product.findById(req.params.id);
    res.render('products/edit',{product})
}))

app.put('/products/:id/show',catchAsync(async(req,res)=>{
    const product=await Product.findByIdAndUpdate(req.params.id,req.body)
    console.log(product)
    await product.save();
    res.redirect(`/products/${req.params.id}`)
}))

app.post('/products',validateProduct,catchAsync(async(req,res)=>{
    var product = await new Product(req.body)
    product.save();
    req.flash('success','Product Successfully Posted')
    res.redirect(`/products/${product._id}/show`)
}))

app.delete('/products/:id/show',catchAsync(async(req,res)=>{
    const product = await Product.findByIdAndDelete(req.params.id)
    res.redirect('/products')
}))

app.all('*',(req,res,next)=>{
    next(new ExpressError('Page not Found',404));
})

app.use((err,req,res,next)=>{
    const {statusCode = 500,message='Oops! Something Went Wrong'} = err;
    res.render('error',{statusCode,message});
})

app.listen(3000,()=>{
    console.log('Connected to 3000')
})