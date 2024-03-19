const express=require("express")
const session=require('express-session')
const user_route=express()

const config=require('../config/config')
user_route.use(session({secret:config.sessionSecret}))

const auth=require('../middleware/auth')


user_route.set('view engine','ejs')
user_route.set('views','./views/users')

user_route.use(express.json())
user_route.use(express.urlencoded({extended:true}))

const userController=require("../controllers/userController")
const addressController=require('../controllers/addressController')
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')
const wishlistController=require('../controllers/wishlistController')
const couponController=require('../controllers/couponController')
const walletController=require('../controllers/walletController')



user_route.get('/register',auth.isLogout,userController.loadRegister)
user_route.post('/register',userController.saveUser,userController.sendverify)
user_route.get('/verify',userController.verifyPage)
user_route.post('/verify',userController.otpsuccess)

user_route.get('/resend-otp', userController.sendverify)

user_route.get('/', userController.loadHome)
user_route.get('/login',auth.isLogout,userController.loginLoad)

user_route.post('/login',auth.isLogout, userController.verifyLogin)

user_route.get('/home', auth.isLoginpage, userController.loadHome)

user_route.get('/showproduct',userController.showProduct)

user_route.get('/logout',userController.userLogout)

// ---------------------------------------------------------------------------
user_route.get('/shoppage',userController.shoppage)
user_route.get('/shoppagesort',userController.sortshop)

user_route.get('/editprofile',auth.isLoginpage,userController.editprofile)
user_route.post('/editprofile',auth.isLoginpage,userController.updateProfile)

user_route.get('/addaddress',auth.isLoginpage,addressController.addAddress)
user_route.post('/addaddress',addressController.addaddress)

user_route.get('/addnewaddress',auth.isLoginpage,addressController.addnewaddress)
user_route.post('/addnewaddress',addressController.submitnewaddress)

user_route.get('/deleteaddress/:id',auth.isLoginpage,addressController.deleteaddress)
user_route.get('/editaddress',auth.isLoginpage,addressController.editAddress)
user_route.post('/editaddress',addressController.editaddresspost)
//----------------------------------------------------------------------------cart
user_route.get('/addtocart',auth.isLoginpage,cartController.addtocart)
user_route.get('/mycart',auth.isLoginpage,cartController.mycart)
user_route.get('/deletecart',auth.isLoginpage,cartController.deletecart)

user_route.post('/updatequantity',auth.isLoginpage,cartController.updatequantity )

user_route.get('/checkoutpage',auth.isLoginpage,cartController.checkoutpage)

user_route.post('/submitOrder',auth.isLoginpage,orderController.submitorder)
user_route.get('/ordersuccess',auth.isLoginpage,orderController.ordersuccess)
user_route.get('/cancelorder/:id',auth.isLoginpage,orderController.cancelorder)
user_route.get('/returnorder/:id',auth.isLoginpage,orderController.returnorder)
user_route.get("/orderdetails",auth.isLoginpage,orderController.orderdetails)

user_route.post('/updateUserDetails',auth.isLoginpage,userController.updatedetails)
user_route.get('/forgetpassword',userController.forgetpassword)
user_route.post('/verifyemail',userController.verifyemail)
user_route.post('/verifyotp',userController.verifyotp)
user_route.get('/changePassword',userController.changePasswordPage)
user_route.post('/changePassword',userController.changepassword)
user_route.get('/getStock',cartController.getstock)
user_route.get('/wishlists',auth.isLoginpage,wishlistController.wishlists)
user_route.get('/addtowishlist',auth.isLoginpage,wishlistController.addtowishlist)
user_route.get('/deletewishlist',wishlistController.deletewishlist)
user_route.post('/applycoupon',auth.isLoginpage,couponController.applycoupon)
user_route.get('/userwallet',auth.isLoginpage,walletController.walletDetails)
user_route.post('/paymentstatus',auth.isLoginpage,orderController.paymentstatus)
user_route.get('/failedpayment',auth.isLoginpage,orderController.failedpayment)






module.exports = user_route