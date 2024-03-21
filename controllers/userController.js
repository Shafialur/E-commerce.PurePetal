const User = require('../models/userModel')
const product = require('../models/productModel')
const category = require('../models/categoryModel')
const order = require('../models/ordersModel')
const cart=require('../models/cartModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const otpGenerator = require('otp-generator');
const session = require('express-session')
const address = require("../models/addressModel")
const wallet=require("../models/walletModel")



let otp;
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'mhdrizwanpkd@gmail.com',
        pass: 'sgzmnhpoginjuwat'
    },
});


const sendverify = async (req, res) => {

    console.log(req.session.user_email)
    const email = req.session.user_email;
    if (!email) {
        return res.status(400).json({ error: 'Invalid email' });
    }

    otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });

    const mailOptions = {
        from: 'mhdrizwanpkd@gmail.com',
        to: email,
        subject: 'Your OTP for Verification',
        text: `Your OTP is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.render('verification', {message: `Error sending otp ${otp}`})
            console.log(otp);
        }
        console.log(otp)
        res.status(200).redirect('/verify')
    });


}
const verifyPage = async (req, res) => {
    try {
        return res.status(200).render("verification");
    } catch (error) {
        return res.status(500).json("Internal Server Error")
    }
}

const otpsuccess = async (req, res) => {
    try {
        if (req.body.otp == otp) {

            const spassword = await securepassword(req.session.user_password)
            const user = new User({
                name: req.session.user_name,
                email: req.session.user_email,
                mobile: req.session.user_mobile,
                password: spassword,
                is_block: 0,
                is_admin: 0
            })

            const userData = await user.save();
            req.session.user_id = userData._id

            res.render('verifysuccess')

        } else if (req.body.otp == '') {
            res.render('verification', { message: "Enter otp" })
        }
        else {
            res.render('verification', { message: "Invalid OTP" })
        }
    } catch (error) {
        console.log(error.message)
    }

}



const securepassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message)
    }
}

const loadRegister = async (req, res) => {
    try {
        res.render("registration")
    }
    catch {
        console.log(error.message)
    }

}



const saveUser = async (req, res, next) => {
    try {

        const spassword = await securepassword(req.body.password)
        // const user=new User({
        //     name:req.body.name,
        //     email:req.body.email,
        //     mobile:req.body.mobile,
        //     password:spassword,
        //     is_block:0,
        //     is_admin:0
        // })

        // const userData=await user.save();

        req.session.user_name = req.body.name,
            req.session.user_email = req.body.email;
        req.session.user_mobile = req.body.mobile,
            req.session.user_password = req.body.password

        next()
        // if(userData){
        //     res.render('registration',{message:"Successfully Registered"})
        // }
        // else{
        //     res.render('registration',{message:"Registration Failed"})
        // }

    }
    catch (error) {
        console.log(error.message)
    }
}

//Login user.....

const loginLoad = async (req, res) => {
    try {
        id = req.session.user_id
        const userData = await User.find({ _id: id })
        const isLoggedIn = req.session.user_id ? true : false;
        res.render("login",{isLoggedIn,userData})

    } catch (error) {

        console.log(error.message)
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password
        const isLoggedIn = req.session.user_id ? true : false;

        const userData=await User.findOne({email:email})
        
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {
                if (userData.is_block == 1) {
                    res.render("login", { message: "Your Account has been Blocked", isLoggedIn })
                }
                else {
                    
                    req.session.user_id = userData._id
                    walletData= await wallet.findOne({userid:req.session.user_id})
                    if(!walletData){
                        let walletData = new wallet({
                            rupees:0.05,
                            userid: req.session.user_id,
                        });
                        await walletData.save();
                    }
                    
                    
                    res.redirect('/home')
                }

            }
            else {
                console.log('incorrect password')
                res.render("login", { message: "incorrect password",isLoggedIn })
            }
        }
        else {
            res.render("login", { message: "incorrect email/password" ,isLoggedIn })
        }

    } catch (error) {
        console.log(error.message)

    }
}


const loadHome = async (req, res) => {
    try {

        var search = ''
        if (req.query.search) {
            search = req.query.search
        }

        var page = 1
        if (req.query.page) {
            page = req.query.page
        }
        const catName = req.query.id;
        const limit = 4
        id = req.session.user_id
        const userData = await User.find({ _id: id })
        const isLoggedIn = req.session.user_id ? true : false;

        let baseQuery = {
            is_block: 0,
            $or: [
                { title: { $regex: '.*' + search + '.*', $options: 'i' } },
                { productdt: { $regex: '.*' + search + '.*', $options: 'i' } },
            ]
        };

        let query = catName ? { ...baseQuery, category: catName } : baseQuery;

        const productData = await product.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await product.find({
            is_block: 0,
            $or: [
                { title: { $regex: '.*' + search + '.*', $options: 'i' } },
                { description: { $regex: '.*' + search + '.*', $options: 'i' } },

            ]
        }).countDocuments()



        const categoryData = await category.find({ is_block: 0 })
        
        return res.render('home', {
            products: productData,
            userData,
            isLoggedIn,
            category: categoryData,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            previous: parseInt(page) - 1,
            next: parseInt(page) + 1
        })


    } catch (error) {
        console.log(error.message)
    }
}

const userLogout = async (req, res) => {
    try {
        req.session.user_id = undefined
        res.redirect('/')
    } catch (error) {

    }
}

const showProduct = async (req, res) => {

    try {
        const id = req.query.id
        const isLoggedIn = req.session.user_id ? true : false;
        const productData = await product.findById(id)
        const userData=await User.find({_id:req.session.user_id})
        if (productData) {
            return res.render('showproduct', { products: productData, isLoggedIn,userData })
        } else {
            return res.redirect('/admin/editproduct')
        }

    } catch (error) {
        console.log(error.message)
    }

}



const shoppage = async (req, res) => {
    try {

        var search = ''
        if (req.query.search) {
            search = req.query.search
        }

        var page = 1
        if (req.query.page) {
            page = req.query.page
        }
        const catName = req.query.id

        const limit = 4
        let baseQuery = {
            is_block: 0,
            $or: [
                { title: { $regex: '.*' + search + '.*', $options: 'i' } },
                { productdt: { $regex: '.*' + search + '.*', $options: 'i' } },
            ]
        };

        let query = catName ? { ...baseQuery, category: catName } : baseQuery;

        const productData = await product.find(query)
        .populate("category")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await product.find({
            is_block: 0,
            $or: [
                { title: { $regex: '.*' + search + '.*', $options: 'i' } },
                { description: { $regex: '.*' + search + '.*', $options: 'i' } },

            ]
        }).countDocuments()


        const categoryData = await category.find({ is_block: 0 })

        id = req.session.user_id
        const userData = await User.find({ _id: id })
        const isLoggedIn = req.session.user_id ? true : false;
        
       return res.render('shoppage', {
            products: productData,
            isLoggedIn,
            userData,
            category: categoryData,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            previous: parseInt(page) - 1,
            next: parseInt(page) + 1
        })
        

    } catch (error) {
        console.log(error.message)
    }
}

const sortshop=async(req,res)=>{
    try{ 
        const productData=await product.find({}).populate("category")
        const isLoggedIn = req.session.user_id ? true : false;
        const categoryData = await category.find({ is_block: 0 })
        console.log(req.query.option);
        
        if(req.query.option){   

            const option=req.query.option

            if (option === 'Low to High') {
                productData.sort((a, b) => a.pprice - b.pprice);
                

            } else if (option === 'High to Low') {
                productData.sort((a, b) => b.pprice - a.pprice);

            }
        }
        res.render('shoppagesort',{products:productData,isLoggedIn,category: categoryData})
        
    }catch(error){
        console.log(error.message);
    }
}

const editprofile = async (req, res) => {
    try {
        const id = req.session.user_id
        const userData = await User.findOne({ _id: id })
        const orderData = (await order.find({ userid: id })).reverse()


        const isLoggedIn = req.session.user_id ? true : false;
        const addressData = await address.findOne({ userid: id })


        if (userData) {

            return res.render('userdashboard', { isLoggedIn, userData, addressData, orderData })
        }
        else {
            return res.redirect('/login')
        }

    } catch (error) {
        console.log(error.message)
    }
}

const updateProfile = async (req, res) => {
    try {
        const password = req.body.password;
        const newpassword = req.body.npassword;
        const cpassword = req.body.cpassword;
        const id = req.session.user_id

        const hashedNewPassword = await securepassword(newpassword);
        const userData = await User.findOne({ _id: id })
        const orderData = await order.find({ userid: id })
        const addressData = await address.findOne({ userid: req.session.user_id })

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (cpassword === newpassword) {
                    await User.findByIdAndUpdate({ _id: userData._id }, { $set: { password: hashedNewPassword } });
                    // Optionally, you may redirect or send a response after a successful update
                    return res.render('userdashboard', { message3: "Password Changed Successfully", isLoggedIn: req.session.user_id ? true : false, userData, addressData,orderData });
                } 
            } else {
                return res.render('userdashboard', { message: "Current Password is incorrect!", isLoggedIn: req.session.user_id ? true : false, userData, addressData,orderData });
            }
        } else {
            return res.render('userdashboard', { message2: "User not found!", isLoggedIn: req.session.user_id ? true : false, userData, addressData });
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const updatedetails = async (req, res) => {
    try {
        const { name, email, mobile } = req.body
        const updateddetails = await User.updateOne({ _id: req.session.user_id }, { name: name, email: email, mobile: mobile })

        if (updateddetails) {
            res.redirect('/editprofile')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const forgetpassword = async (req, res) => {
    try {
        res.render('forgetpass')

    } catch (error) {
        console.log(error.message);
    }
}

const verifyemail = async (req, res) => {
    try {
        const Email = req.body.email
        req.session.email_id = Email
        const userData = await User.findOne({ email: Email })

        if (userData) {
            otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });

            const mailOptions = {
                from: 'mhdrizwanpkd@gmail.com',
                to: Email,
                subject: 'Your OTP for Verification',
                text: `Your OTP is: ${otp}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    return res.render('verification', { message: `Error sending otp ${otp}` })
                }
                console.log(otp)
                const message = "Verified...Otp sent successfully"
                res.status(200).json(message)
            });


        }
        if (!userData) {
            const message = "This Email is not Registered"
            res.status(200).json(message)
        }

    } catch (error) {
        console.log(error.message);
    }
}

const verifyotp = async (req, res) => {
    try {
        const Otp = req.body.otp
        console.log(Otp, otp);
        if (otp == Otp) {
            return res.status(200).json({ success: true, successmessage: 'otp successs' })
        } else {
            return res.status(400).json({ success: false, message: "Incorrect Otp" })
        }
    } catch (error) {
        console.log(error.message);
    }
}
const changePasswordPage = async (req, res) => {
    try {
        res.render('newpass')
    } catch (error) {
        console.log(error.message);
    }
}

const changepassword = async (req, res) => {
    try {
        const password = req.body.password
        const email = req.session.email_id
        const userData = await User.findOne({ email: email })
        const orderData=await order.find({ userid: userData._id })
        const addressData=await address.findOne({_id:userData._id})
        const NewPassword = await securepassword(password);

        if (userData) {
            await User.findByIdAndUpdate({ _id: userData._id }, { $set: { password:NewPassword } });
            
            return res.render('userdashboard', { message3: "Password Changed Successfully", isLoggedIn: req.session.user_id ? true : false, userData, addressData,orderData });

        }


    } catch (error) {
        console.log(error.message)
    }
}



module.exports = {
    loadRegister,
    saveUser,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    sendverify,
    otpsuccess,
    verifyPage,
    showProduct,
    shoppage,
    editprofile,
    updateProfile,
    updatedetails,
    forgetpassword,
    verifyemail,
    verifyotp,
    changePasswordPage,
    changepassword,
    sortshop
}