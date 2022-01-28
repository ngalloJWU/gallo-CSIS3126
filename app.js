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
const { urlencoded } = require('express');
const methodOverride = require('method-override')

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

app.use(methodOverride('_method'))


//Routes
app.get('/',(req,res)=>{
    res.render('home')
})

app.get('/products/new',async(req,res)=>{
    res.render('products/newProduct')
})

app.get('/products',async(req,res)=>{
    const products=await Product.find({});
    res.render('products/show',{products})
})

app.get('/products/:id',async(req,res)=>{
    const product = await Product.findById(req.params.id);
    res.render('products/productShow',{product})
})

app.get('/products/:id/edit',async(req,res)=>{
    const product = await Product.findById(req.params.id);
    res.render('products/edit',{product})
})

app.put('/products/:id',async(req,res)=>{
    const product=await Product.findByIdAndUpdate(req.params.id,req.body)
    console.log(product)
    await product.save();
    res.redirect(`/products/${req.params.id}`)
})

app.post('/products',async(req,res)=>{
    const product = await new Product(req.body)
    console.log(product);
    product.save();
    res.redirect('/')
})

app.delete('/products/:id',async(req,res)=>{
    const product = await Product.findByIdAndDelete(req.params.id)
    res.redirect('/products')
})

app.listen(3000,()=>{
    console.log('Connected to 3000')
})