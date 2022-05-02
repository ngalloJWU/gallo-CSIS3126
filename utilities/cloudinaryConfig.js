const cloudinary=require('cloudinary').v2;
const {CloudinaryStorage}=require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name:process.env.IMG_NAME,
    api_key:process.env.IMG_KEY,
    api_secret:process.env.IMG_SECRET
})

const productStorage=new CloudinaryStorage({
    cloudinary,
    params: {
        folder:'Products',
        allowedFormats:['png','jpg','jpeg']
    }
});
const accountStorage=new CloudinaryStorage({
    cloudinary,
    params: {
        folder:'Accounts',
        allowedFormats:['png','jpg','jpeg']
    }
});

module.exports={cloudinary,productStorage,accountStorage};