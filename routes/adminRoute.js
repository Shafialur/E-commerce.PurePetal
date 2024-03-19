const express = require('express')
admin_route = express()

const session = require('express-session')
const config = require('../config/config')


admin_route.use(session({ secret: config.sessionSecret }))

admin_route.use(express.json())
admin_route.use(express.urlencoded({ extended: true })) //

const multer = require('multer')
const path = require("path")

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/productimages'))
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname
        cb(null, name)
    }
})
const upload = multer({ storage: storage })

admin_route.set('view engine', 'ejs')
admin_route.set('views', './views/admin')

const auth = require('../middleware/adminAuth')

const adminController = require('../controllers/adminController')
const productController = require('../controllers/productController')
const categoryController=require('../controllers/categoryController')
const orderController=require('../controllers/orderController')
const couponController=require('../controllers/couponController')

admin_route.get('/', auth.isLogout, adminController.loadLogin)
admin_route.post('/', adminController.verifyLogin)

// admin_route.get('/home',auth.isLogin,adminController.loadDashboard)
admin_route.get('/logout', adminController.loadLogout)
admin_route.get('/dashboard', auth.isLogin, adminController.adminDashboard)

admin_route.get('/userslist', auth.isLogin, adminController.loadDashboard)


admin_route.get('/edit_user', auth.isLogin, adminController.editUserLoad)
admin_route.post('/edit_user', adminController.updateUsers)

admin_route.get('/block_user/:id', auth.isLogin, adminController.toggleBlock)

admin_route.get('/register', auth.isLogin, adminController.adRegister)
admin_route.post('/register', auth.isLogin, adminController.insertUser)

//-----------------------------------------------------Product---------------

admin_route.get('/productlists', auth.isLogin, productController.productlist)


admin_route.get('/addproduct', auth.isLogin, productController.addproduct)
admin_route.post('/addproduct', auth.isLogin, upload.array('images'), productController.insertProduct)

admin_route.get('/editproduct', auth.isLogin, productController.editproduct)
admin_route.post('/editproduct', auth.isLogin, upload.array('images'), productController.updateProducts)

admin_route.get('/showproduct/:id', auth.isLogin,productController.toggleShow)

admin_route.get('/deleteproductimg',auth.isLogin,productController.deleteproductimg)


//-------------------------------------------------------------------------------
admin_route.get('/categorylist', auth.isLogin, categoryController.listcategory)

admin_route.get('/addcategory', auth.isLogin, categoryController.addcategory)
admin_route.post('/addcategory', auth.isLogin,categoryController.insertCategory)

admin_route.get('/deletecategory/:id',auth.isLogin,categoryController.deletecategory)
admin_route.get('/editcategory',auth.isLogin,categoryController.editcategory)
admin_route.post('/editcategory',auth.isLogin,categoryController.updateCategory)

admin_route.get('/showcategory/:id', auth.isLogin,categoryController.toggleList)
//................................................................................
admin_route.get('/orderlist', auth.isLogin,orderController.orderlist)
admin_route.get('/orderdetails',auth.isLogin,orderController.orderdetailsadmin)
admin_route.post('/updateOrderStatus',auth.isLogin,orderController.updatestatus)
admin_route.get('/salesreport',auth.isLogin,productController.salesreport)
admin_route.get('/downloadPdf',auth.isLogin,productController.pdfDownload)
admin_route.get('/downloadExcel',auth.isLogin,productController.downloadExcel)
// ....................................../Coupon
admin_route.get('/couponlist',auth.isLogin,couponController.couponlist)
admin_route.get('/addcoupon',auth.isLogin,couponController.addcoupon)
admin_route.post('/addcoupon',auth.isLogin,couponController.submitcoupon)
admin_route.get('/listingCoupon/:id',auth.isLogin,couponController.changelisting)


admin_route.post('/productlists', auth.isLogin, productController.productOffer)
admin_route.post('/categorylist', auth.isLogin, categoryController.categoryOffer)





admin_route.get('*', (req, res) => {
    res.redirect('/admin')
})



module.exports = admin_route