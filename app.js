//Nickslist - Made by Nicholas Gallo
//Design Project CSIS 3126
//Last Updated: January 28, 2022

//Module Requires
if(process.env.NODE_ENV!=='production'){
    require('dotenv').config()
}
const express = require('express');
const app = express();
const path = require('path')
const ejsMate=require('ejs-mate')
const mongoose =require('mongoose');
const Product = require('./models/product');
const Category = require('./models/categories')
const User = require('./models/user');
const { urlencoded } = require('express');
const {validateProduct}=require('./utilities/validateProduct')
const {authCheck}=require('./utilities/middleware');
const methodOverride = require('method-override')
const morgan = require('morgan');
const catchAsync = require('./utilities/catchAsync');
const ExpressError = require('./utilities/ExpressError');
const Joi = require('joi')
const session = require('express-session');
const flash=require('connect-flash');
const fetch = require('node-fetch');
const passport = require('passport');
const LocalStrategy = require('passport-local')
const {productStorage}=require('./utilities/cloudinaryConfig');
const multer=require('multer');
const productUpload=multer({storage:productStorage});
const seedJSON=require('./seed.json')

console.log(seedJSON)




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

//Passport Setup for User Login
app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const seedDB=async()=>{
    const categoryArr=['Electronics_Media','Home_Garden','Clothing',"Baby_Kids","Vehicles","Toys_Games","Sports_Outdoors","Collectables","Pet","Health_Beauty","Equipment","General","Other"]
    const items = seedJSON.products;
    let zip=2801;
    for(let category of categoryArr){
        for(let item of items){
            var address = `https://api.mapbox.com/geocoding/v5/mapbox.places/0${zip}.json?country=US&access_token=pk.eyJ1Ijoibmlja2dhbGxvMjAwMSIsImEiOiJjbDBvZzhjMzExNGQ2M2N0a3UxODdtdWFwIn0.knAV-XLzazZUGDKAQTi__A`
            var location = await fetch(address,{'method':'GET'}).then(res=>res.json());
            if(location.features[0]){
                const product = await new Product(item)
                product.lat=location.features[0].geometry.coordinates[0]
                product.long=location.features[0].geometry.coordinates[1]
                product.locationName=location.features[0].place_name;
                product.category=category;
                product.save()
            }
            zip++
            if(zip==2940){
                zip=2801
            }
        }
    }

    // for(let i=0;i<50;i++){
    //     let productTemp = {
    //         productTitle:"Temp Title",
    //         productDescription:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas congue, quam quis interdum tempus, leo nulla luctus massa, in fringilla est eros ac magna. Nullam rhoncus sagittis purus eu venenatis. Etiam neque metus, fermentum et magna vel, semper fringilla enim. Curabitur imperdiet imperdiet tortor, quis laoreet purus porttitor ut. Etiam dictum nibh in arcu porttitor, vitae tempus enim iaculis. Fusce purus diam, maximus quis lacus mattis, semper lacinia arcu. Nulla posuere maximus magna venenatis consectetur. Sed elementum molestie turpis tempus lobortis. Suspendisse semper orci ut orci aliquam ultrices. Pellentesque ac mollis sem. Ut eu ipsum justo. Morbi pellentesque felis mi, in efficitur elit volutpat sit amet.",
    //         productPrice:'10.99',
    //         category: categoryArr[i%12],
    //         lat: '-71.47',
    //         long: '41.83',
    //         locationName:"Johnston, Rhode Island 02919, United States", 
    //         author:'6231295de6eff1bdd36d8695'         
    //     }
    //     const product = await new Product(productTemp);
    //     await product.save()
    // }
}

//seedDB();

app.use((req,res,next)=>{
    res.locals.currentUser=req.user;
    res.locals.success=req.flash('success')
    res.locals.error=req.flash('error')
    next()
})

//Routes
app.get('/',catchAsync(async(req,res)=>{
    const products = await Product.find({}).limit(20)
    res.render('home',{products});
}))

app.get('/login',(req,res)=>{
    res.render('user/login')
})

app.get('/logout',authCheck,(req,res)=>{
    req.logout();
    req.flash('success',"Logged Out");
    res.redirect('/login')
})

app.get('/register',(req,res)=>{
    res.render('user/register')
})

app.post('/register',catchAsync(async(req,res)=>{
    try{
        const {password}=req.body;
        const user = new User(req.body)
        const userRegistered = await User.register(user,password)
        req.login(userRegistered,err=>{
            if(err) return next(err)
            req.flash('success','Account Created')
            res.redirect('/');
        })
    }catch(e){
        req.flash('error',e.message);
        res.redirect('/register')
    }

}))

app.post('/login',passport.authenticate('local',{failureFlash:true,failureRedirect:'/login'}),(req,res)=>{
    req.flash('success','Successfully Logged In');
    res.redirect('/');
})
app.get('/products/new',authCheck,async(req,res)=>{
    const categories = await Category.find({})
    res.render('products/newProduct',{categories})
})

app.get('/products',catchAsync(async(req,res)=>{
    const products=await Product.find({});
    res.render('products/show',{products})
}))

app.get('/products/:id/show',catchAsync(async(req,res)=>{
    const product = await Product.findById(req.params.id).populate('author');
    var relatedProducts = await Product.find({$text:{$search:product.productTitle}}).limit(7)
    if(relatedProducts.length<7){
        const remaining = 3-relatedProducts.length;
        const other =await Product.find({"category":product.category}).limit(remaining)
        relatedProducts=relatedProducts.concat(other);
    }
    res.render('products/productShow',{product,relatedProducts})
}))


app.get('/products/sort',catchAsync(async(req,res)=>{
    var products
    if(req.query.category){
        products = await Product.find({"category":req.query.category});
    }else{
        const query = {$text:{$search:req.query.search}}
        products = await Product.find(query);
    }

    //console.log(products)
    res.render('products/show',{products})
}))

app.get('/products/:id/edit',authCheck,catchAsync(async(req,res)=>{
    const product = await Product.findById(req.params.id);
    res.render('products/edit',{product})
}))

app.get('/account',authCheck,catchAsync(async(req,res)=>{
    const userListings = await Product.find({'author':req.user._id});
    res.render('user/account',{userListings})
}))

app.put('/products/:id/show',authCheck,catchAsync(async(req,res)=>{
    const product=await Product.findByIdAndUpdate(req.params.id,req.body)
    await product.save();
    res.redirect(`/products/${req.params.id}`)
}))

app.post('/products',authCheck,productUpload.array('image'),validateProduct,catchAsync(async(req,res)=>{
    const address = `https://api.mapbox.com/geocoding/v5/mapbox.places/${req.body.zip}.json?country=US&access_token=pk.eyJ1Ijoibmlja2dhbGxvMjAwMSIsImEiOiJjbDBvZzhjMzExNGQ2M2N0a3UxODdtdWFwIn0.knAV-XLzazZUGDKAQTi__A`
    const location = await fetch(address,{'method':'GET'}).then(res=>res.json());
    var product = await new Product(req.body)
    product.images=req.files.map(f=>({url:f.path,filename:f.filename}))
    product.lat=location.features[0].geometry.coordinates[0]
    product.long=location.features[0].geometry.coordinates[1]
    product.locationName=location.features[0].place_name;
    product.author=req.user._id;
    console.log(product)
    await product.save();
    req.flash('success','Product Successfully Posted')
    res.redirect(`/products/${product._id}/show`)
}))

app.delete('/products/:id/show',authCheck,catchAsync(async(req,res)=>{
    const product = await Product.findByIdAndDelete(req.params.id)
    console.log(product)
    res.redirect('/products')
}))

app.put('/addSave',catchAsync(async(req,res)=>{
    console.log(req.body);
    const{user,product}=req.body;
    var productSave = await Product.findById(product);
    if(productSave.savedBy.includes(user)){
        let newSave = productSave.savedBy.filter(function(x){
            return x!== user;
        })
        productSave.savedBy=newSave;
        productSave.save();
    }else{
        productSave=await Product.findByIdAndUpdate(product,{$push:{'savedBy':user}})
        productSave.save();
    }
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