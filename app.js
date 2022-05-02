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
const resetToken = require('./models/resetTokens')
const { urlencoded } = require('express');
const {validateProduct,validateUser}=require('./utilities/validate')
const {authCheck,isUser}=require('./utilities/middleware');
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
const {productStorage,accountStorage, cloudinary}=require('./utilities/cloudinaryConfig');
const multer=require('multer');
const productUpload=multer({storage:productStorage});
const accountUpload=multer({storage:accountStorage});
const seedJSON=require('./seed.json')
const cookieParser=require('cookie-parser');
const turf=require('@turf/turf');
const { lineString } = require('@turf/turf');
const passwordComplexity = require('joi-password-complexity');
const nodemailer = require('nodemailer');
const {transporter,mailOptions}=require('./utilities/sendEmail');
const MongoDBStore=require("connect-mongo")(session)




//Connecting MongoDB Database
//'mongodb://localhost:27017/NicksList'
const dbUrl=process.env.DB_URL
mongoose.connect(dbUrl,{

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

/////////////////////
//SESSION SETTINGS
////////////////////
const store= new MongoDBStore({
    url:dbUrl,
    secret:'scacsascsccdsdcevrebrne',
    touchAfter:24*60*60
})

store.on('error',function(e){
    console.log(e)
})
app.use(session(
    {store,
    secret:'tempSecret',
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

app.use(cookieParser())

//////////////
//RESET PASSWORD SETTINGS
/////////////////////

const sendEmail = (email,code)=>{
    var options =mailOptions;
    const body = `We have recieved your request to change your password.\n\nPlease follow this link to proceed\n\nhttp://localhost:3000/reset/${code}\nIf you didn't request a password reset, please ignore this email`
    
    options.text=body;
    options.to=email
    transporter.sendMail(options,(err,info)=>{
        if(err){
            console.log(err);
            return;
        }
        console.log(info.response);
        
    })
    return;
}

const passwordOptions = {
    min:8,
    max:40,
    upperCase:1,
    lowerCase:1,
    numeric:1,
    symbol:1
}

////////////////////
//PASSWORD REQUIRMENTS
////////////////////
//Enforces password policy using Password Complexity module
const passwordRequirements =async(req,res,next)=>{
    console.log(req.body);
   const {error}=await passwordComplexity(passwordOptions).validate(req.body.password);
   if (error){
       const details= error.details
       const errors=[];
       for(let detail of details){
           errors.push(detail.type)
       }
       req.session.passError=errors;
       return res.redirect(`${req.originalUrl}`)
   }
   //checks for spaces
   if(req.body.password.includes(' ')){
     await req.flash('error','Password must not include spaces')
     return res.redirect(`${req.originalUrl}`)
   }
   //password matches confirm password
   if(req.body.password!=req.body.confirmPassword){
        await req.flash('error','Password must match.')
        return res.redirect(`${req.originalUrl}`)
    }else{
       next();
   }
}

//Seeding Database function
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
                product.zip=`0${zip}`
                product.lat=location.features[0].geometry.coordinates[0]
                product.long=location.features[0].geometry.coordinates[1]
                product.locationName=location.features[0].place_name;
                product.category=category;
                product.save()
            }
            zip++
            //RI Zipcodes
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

// const updateUser=async()=>{
//     let user = await User.findById('6231295de6eff1bdd36d8695')
//     console.log(user)
//     user.preferredContact = "Phone"
//     await user.save()
// }
// updateUser()

app.use((req,res,next)=>{
    console.log(req.cookies.zip)
    res.locals.currentUser=req.user;
    res.locals.location={
        zip:req.cookies.zip ||"02919",
        maxDis:req.cookies.maxDis||"100",
        lat:req.cookies.lat || 41.82785,
        long:req.cookies.long || -71.51813
    }
    res.locals.success=req.flash('success')
    res.locals.error=req.flash('error')
    next()
})
///////////
//Routes
//////////////

////////
//Product Routes
////////

//Home Page
app.get('/',catchAsync(async(req,res)=>{
    const today=new Date()
    let products = await Product.find({})
    console.log(products)
    console.log(res.locals.location)
    products=products.filter(product=>turf.length(lineString([[product.lat,product.long],[res.locals.location.lat,res.locals.location.long]],{units:'miles'}))<=parseInt(res.locals.location.maxDis)).reverse().slice(0,42)
    res.render('home',{products,today});
}))

//Set Preferred Zipcode
app.post('/',catchAsync(async(req,res)=>{
    const address = `https://api.mapbox.com/geocoding/v5/mapbox.places/${req.body.setLoc}.json?country=US&access_token=pk.eyJ1Ijoibmlja2dhbGxvMjAwMSIsImEiOiJjbDBvZzhjMzExNGQ2M2N0a3UxODdtdWFwIn0.knAV-XLzazZUGDKAQTi__A`
    const location = await fetch(address,{'method':'GET'}).then(res=>res.json());
    console.log(location)
    res.cookie('zip',req.body.setLoc)
    res.cookie('maxDis',req.body.maxDis)
    res.cookie('lat',location.features[0].geometry.coordinates[0])
    res.cookie('long',location.features[0].geometry.coordinates[1])
    res.redirect('/')
}))

//New Product Page
app.get('/products/new',authCheck,async(req,res)=>{
    const categories = await Category.find({})
    res.render('products/newProduct',{categories})
})

//Show Product Page
app.get('/products/:id/show',catchAsync(async(req,res)=>{
    const product = await Product.findById(req.params.id).populate('author');
    const today=new Date()
    let distance= turf.length(lineString([[product.lat,product.long],[res.locals.location.lat,res.locals.location.long]],{units:'miles'}))
    distance=Math.round(distance)
    var relatedProducts = await Product.find({$text:{$search:product.productTitle}}).limit(5)
    if(relatedProducts.length<5){
        const remaining = 3-relatedProducts.length;
        const other =await Product.find({"category":product.category}).limit(remaining)
        relatedProducts=relatedProducts.concat(other);
    }
    res.render('products/productShow',{product,relatedProducts,distance,today})
}))

//View Multiple Product
app.get('/products/sort',catchAsync(async(req,res)=>{
    today=new Date()
    var categoryName=""
    var products
    var url='/products/sort?'
    //Determine Page Count
    const page=parseInt(req.query.page)|| 1
    const startSkip=(page-1)*20
    const skip=page*20
    //Sorting Options
    if(req.query.category){
        console.log(req.query)
        url=url+`category=${req.query.category}&`
        categoryName=req.query.category.replace('_',' & ')
        if(req.query.factor){
            if(req.query.factor.length>1){
                req.query.factor.shift()
            }
            if(req.query.factor=='0'){
                products = await Product.find({"category":req.query.category}).sort({'productPrice':'asc'});
                url=url+`factor=0&`
            }else if(req.query.factor=='1'){
                products = await Product.find({"category":req.query.category}).sort({'productPrice':'desc'});
                url=url+`factor=1&`
            }else if(req.query.factor=='2'){
                products = await Product.find({"category":req.query.category});
                products=products.reverse()
                url=url+`factor=2&`
            }else if(req.query.factor=='3'){
                products = await Product.find({"category":req.query.category});
                url=url+`factor=3&`
            }
        }else{
            products = await Product.find({"category":req.query.category});
        }
    }else{
        const query = {$text:{$search:req.query.search}}
        req.query.search=req.query.search.replace(' ','%20')
        url=url+`search=${req.query.search}&`
        if(req.query.factor){
            if(req.query.factor.length>1){
                req.query.factor.shift()
            }
            if(req.query.factor=='0'){
                products = await Product.find(query).sort({'productPrice':'asc'});
                url=url+`factor=0&`
            }else if(req.query.factor=='1'){
                products = await Product.find(query).sort({'productPrice':'desc'});
                url=url+`factor=1&`
            }else if(req.query.factor=='2'){
                products = await Product.find(query).sort({'productPrice':'asc'});
                url=url+`factor=2&`
            }else if(req.query.factor=='3'){
                products = await Product.find(query).sort({'productPrice':'desc'});
                url=url+`factor=3&`
            }
        }else{
            products = await Product.find(query);
        }
        var totalPages=await Product.count(query)
        totalPages=Math.floor(totalPages/20)
    }
    //Filter out products too far
    products=products.filter(product=>turf.length(lineString([[product.lat,product.long],[res.locals.location.lat,res.locals.location.long]],{units:'miles'}))<=parseInt(res.locals.location.maxDis))
    totalPages=products.length
    console.log(totalPages)
    products=products.slice(startSkip,skip)
    totalPages=Math.ceil(totalPages/20)
    res.render('products/show',{products,page,totalPages,url,categoryName})
}))

//Edit Product Page
app.get('/products/:id/edit',authCheck,isUser,catchAsync(async(req,res)=>{
    const product = await Product.findById(req.params.id);
    const categories = await Category.find({})
    console.log(product)
    res.render('products/edit',{product,categories})
}))

//Update Product
app.put('/products/:id/show',authCheck,isUser,productUpload.array('image'),validateProduct,catchAsync(async(req,res)=>{
    console.log(req.body)
    const address = `https://api.mapbox.com/geocoding/v5/mapbox.places/${req.body.zip}.json?country=US&access_token=pk.eyJ1Ijoibmlja2dhbGxvMjAwMSIsImEiOiJjbDBvZzhjMzExNGQ2M2N0a3UxODdtdWFwIn0.knAV-XLzazZUGDKAQTi__A`
    const location = await fetch(address,{'method':'GET'}).then(res=>res.json());
    console.log(location)
    if(location.features.length==0){
        req.flash('error','Invalid Zipcode')
        res.redirect(`/products/${req.params.id}/edit`)
    }
    const product=await Product.findByIdAndUpdate(req.params.id,req.body)
    let imgs=req.files.map(f=>({url:f.path,filename:f.filename}))
    product.images.push(...imgs)
    if(req.body.deleteImages){
        for(let filename of req.body.deleteImages){
            cloudinary.uploader.destroy(filename);
        }
        await product.updateOne({$pull:{images:{filename:{$in: req.body.deleteImages}}}})
    }
    product.lat=location.features[0].geometry.coordinates[0]
    product.long=location.features[0].geometry.coordinates[1]
    product.locationName=location.features[0].place_name;
    await product.save();
    res.redirect(`/products/${req.params.id}/show`)
}))

//Post Product
app.post('/products',authCheck,productUpload.array('image'),validateProduct,catchAsync(async(req,res)=>{
    const address = `https://api.mapbox.com/geocoding/v5/mapbox.places/${req.body.zip}.json?country=US&access_token=pk.eyJ1Ijoibmlja2dhbGxvMjAwMSIsImEiOiJjbDBvZzhjMzExNGQ2M2N0a3UxODdtdWFwIn0.knAV-XLzazZUGDKAQTi__A`
    const location = await fetch(address,{'method':'GET'}).then(res=>res.json());
    if(location.features.length==0){
        req.flash('error','Invalid Zipcode')
        res.redirect(`/products/new`)
    }
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

//Delete product
app.delete('/products/:id/show',authCheck,isUser,catchAsync(async(req,res)=>{
    const product = await Product.findByIdAndDelete(req.params.id)
    req.flash('success','Post Deleted')
    console.log(product)
    res.redirect('/products')
}))

//Save Product
app.put('/addSave',authCheck,catchAsync(async(req,res)=>{
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

//////////
//USER Routes
//////////

//Login Page
app.get('/login',(req,res)=>{
    res.render('user/login')
})

//Logout
app.get('/logout',authCheck,(req,res)=>{
    req.logout();
    req.flash('success',"Logged Out");
    res.redirect('/login')
})

//Register Page
app.get('/register',(req,res)=>{
    res.locals.passwordErr=req.session.passError || []
    req.session.passError=[]
    res.render('user/register')
})

//Register Account
app.post('/register',passwordRequirements,validateUser,catchAsync(async(req,res)=>{
    try{
        const {password}=req.body;
        const user = new User(req.body)
        const userRegistered = await User.register(user,password)
        await user.save()
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

//Login
app.post('/login',passport.authenticate('local',{failureFlash:true,failureRedirect:'/login'}),(req,res)=>{
    req.flash('success','Successfully Logged In');
    res.redirect('/');
})

//Account Page
app.get('/account',authCheck,catchAsync(async(req,res)=>{
    const userListings = await Product.find({'author':req.user._id});
    const saved= await Product.find({'savedBy':`${req.user._id}`})
    console.log(saved)
    res.render('user/account',{userListings,saved})
}))

app.put('/account',authCheck,catchAsync(async(req,res)=>{
    const user = await User.findByIdAndUpdate(req.user._id,req.body)
    await user.save()
    req.flash('success','Account Updated')
    res.redirect('/account')
}))

///RESET PASSWORD
app.get('/reset',(req,res)=>{
    res.render('user/reset')
})

app.post('/reset',catchAsync(async(req,res,next)=>{
    //req.body.username=req.body.username.toLowerCase();
    const validUser = await User.find(req.body);
    //checks for no user
    if(validUser.length<1){
        
    }else{
        //Creates reset token to change password
        const token = new resetToken(req.body);
        await token.save()
        sendEmail(req.body.email,token._id)
    }
    req.flash('success','Email has been sent. If user exists, check inbox or spam for verification');
    res.redirect('/')
}))

//Token/Reset Page
app.get('/reset/:tokenId',catchAsync(async(req,res,next)=>{
    const{tokenId}=req.params
    res.locals.passwordErr=req.session.passError || []
    req.session.passError=[]
    res.render('user/resetSuccess',{tokenId});
}))

//Submit Password Reset
app.post('/reset/:tokenId',passwordRequirements,catchAsync(async(req,res,next)=>{
    const {tokenId} = req.params;
    const token=await resetToken.findById(tokenId);
    //Token only lasts five minutes
    if(!token){
        req.flash('error','Reset Expired, Please try Again');
        return res.redirect('/reset')
    }
    const user = await User.findOne({email:token.email,username:token.username})
    await user.setPassword(req.body.password);
    await resetToken.findByIdAndDelete(tokenId);
    user.save()
    req.flash('success','Password successfully changed');
    res.redirect('/login')

}))

////////
//Error Routes
////////
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