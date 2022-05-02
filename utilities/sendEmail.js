const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:'nickslistshelp@gmail.com',
        pass: process.env.EMAIL_SECRET
    }
})

const mailOptions = {
    from:"nickslistshelp@gmail.com",
    to:"",
    subject:"NicksList Password Change Request",
    text:''
};

module.exports = {mailOptions,transporter}
