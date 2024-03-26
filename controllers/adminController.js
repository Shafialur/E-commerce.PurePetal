const user = require('../models/userModel')
const product = require('../models/productModel')
const order = require('../models/ordersModel')
const category = require('../models/categoryModel')
const bcrypt = require('bcrypt')
const { getDailyDataArray, getMonthlyDataArray, getYearlyDataArray } = require('../config/chartData')


const loadLogin = async (req, res) => {
    try {
        return res.render('login')
    } catch (error) {
        console.log(error.message)
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password
        const userData = await user.findOne({ email: email })
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {
                if (userData.is_admin === 0) {
                    return res.render('login', { message: "You Are Not Admin" })
                } else {
                    req.session.admin_id = userData._id
                    return res.redirect('/admin/dashboard')
                }

            } else {
                return res.render('login', { message: "Incorrect Password" })
            }
        } else {
            return res.render('login', { message: "Incorrect Email" })
        }


    } catch (error) {
        console.log(error.message)
    }
}
const loadDashboard = async (req, res) => {
    try {

        var search = ''
        if (req.query.search) {
            search = req.query.search
        }

        var page = 1
        if (req.query.page) {
            page = req.query.page
        }

        const limit = 8
        // let baseQuery = {
        //     is_block: 0,
        //     $or: [
        //         { title: { $regex: '.*' + search + '.*', $options: 'i' } },
        //         { productdt: { $regex: '.*' + search + '.*', $options: 'i' } },
        //     ]
        // };


        const userData = (await user.find({})
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec()).reverse()
       

        const count = await user.find({ is_block: 0 }).countDocuments()


        // const userData=await user.find({is_admin:0})
        return res.render('userslist', {
            users: userData, totalPages: Math.ceil(count / limit),
            currentPage: page,
            previous: parseInt(page) - 1,
            next: parseInt(page) + 1
        })

    } catch (error) {
        console.log(error.message)
    }
}

const loadLogout = async (req, res) => {
    try {
        req.session.admin_id = undefined
        return res.redirect('/admin')
    } catch (error) {
        console.log(error.message)
    }
}


const adminDashboard = async (req, res) => {
    try {
        const products = await product.find()
        const users = await user.find()
        const orders = await order.find()
        const categories = await category.find()
        const orderData = await order.find({ orderstatus: "Delivered" }).limit(5).sort({ date: -1 })
        const topProducts=await getTopSellingProducts()
        console.log(topProducts)

        const topCategories=await getTopSellingCategories()

        let totalOrderPrice = 0;
        orders.forEach(order => {
            totalOrderPrice += order.total || 0
        })
        // Get monthly data
        const monthlyDataArray = await getMonthlyDataArray();
        const dailyDataArray = await getDailyDataArray();
        const yearlyDataArray = await getYearlyDataArray();

        const monthlyOrderCounts = monthlyDataArray.map((item) => item.count)

        const dailyOrderCounts = dailyDataArray.map((item) => item.count)

        const yearlyOrderCounts = yearlyDataArray.map((item) => item.count)


        return res.render('dashboard', {
            users: users,
            orders: orders, products: products, categories: categories,
            totalOrderPrice, orderData, dailyOrderCounts, monthlyOrderCounts, yearlyOrderCounts,
            topProducts,
            topCategories
        })
    } catch (error) {
        console.log(error.message);
    }
}

// Function to fetch top selling products
const getTopSellingProducts = async () => {
    try {
        // Initialize productSales
        const productSales = {};

        const orders = await order.find({ orderstatus: "Delivered" });

        // Calculate total sales for each product
        orders.forEach(order => {
            order.products.forEach(item => {
                if (productSales[item.productid]) {
                    productSales[item.productid] += item.quantity;
                } else {
                    productSales[item.productid] = item.quantity;
                }
            });
        });

        // Fetch product details for top products
        const productIds = Object.keys(productSales);
        const topProductsDetails = await product.find({ _id: { $in: productIds } });

        // Map product details with sales
        const topProducts = topProductsDetails.map(product => ({
            id: product._id,
            name: product.title,
            sales: productSales[product._id],
        }));

        // Sort topProducts by sales in descending order
        topProducts.sort((a, b) => b.sales - a.sales);

        return topProducts.slice(0, 10); // Return only top 10 products
    } catch (error) {
        console.error(error.message);
        return [];
    }
};


// Function to fetch top selling categories
const getTopSellingCategories = async () => {
    try {
        const orders = await order.find({ orderstatus: "Delivered" })
        const categorySales = {};

        // Calculate total sales for each category
        orders.forEach(order => {
            order.products.forEach(item => {
                const categoryId = item.category;
                console.log(categoryId);
                if (categoryId) { // Check if categoryId is defined
                    if (categorySales[categoryId]) {
                        categorySales[categoryId] += item.quantity;
                    } else {
                        categorySales[categoryId] = item.quantity;
                    }
                }
            });
        });

        // Sort categories by sales and get top 10
        const categoryIds = Object.keys(categorySales)
        const topCategoriesDetails = await category.find({ _id: { $in: categoryIds}});

        const topCategories= topCategoriesDetails.map(category => ({
            id: category._id,
            name: category.title,
            sales: categorySales[category._id],
        }));

        topCategories.sort((a,b) => b.sales-a.sales)

        return topCategories.slice(0,10)
    } catch (error) {
        console.error(error.message);
        return [];
    }
};

// Edit user..........................

const editUserLoad = async (req, res) => {
    try {
        const id = req.query.id
        const userData = await user.findById({ _id: id })
        if (userData) {
            return res.render('edit_user', { user: userData })
        } else {
            return res.redirect('/admin/dashboard')
        }

    } catch (error) {
        console.log(error.message)
    }
}

const updateUsers = async (req, res) => {
    try {
        const userData = await user.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mobile } })
        return res.redirect('/admin/userslist')
    } catch (error) {
        console.log(error.message)
    }
}

const toggleBlock = async (req, res) => {

    try {

        const id = req.params.id;
        const userData = await user.findById(id);

        if (!userData) {
            return res.status(404).send("User not found");
        }

        // Toggle the value of is_block
        const newIsBlockValue = userData.is_block === 0 ? 1 : 0;
        if (newIsBlockValue == 0) {

        }

        await user.updateOne({ _id: id }, { $set: { is_block: newIsBlockValue } });

        console.log(`User is_block toggled to: ${newIsBlockValue}`);
        return res.status(200).json({ success: true, message: `user${newIsBlockValue}were done successfully` });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: "internal server Error" });
    }
};

const adRegister = async (req, res) => {
    try {
        return res.render('addnewuser')
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

const insertUser = async (req, res) => {
    try {
        const spassword = await securepassword(req.body.password)
        const User = new user({
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            password: spassword,
            is_block: 0,
            is_admin: 0
        })
        const userData = await User.save()
        if (userData) {
            return res.redirect('/admin/userslist')

        }
        else {
            return res.send("Not registered")
        }
    }
    catch (error) {
        console.log(error.message)
    }
}




module.exports = {
    loadLogin,
    verifyLogin,
    loadLogout,
    adminDashboard,
    editUserLoad,
    updateUsers,
    toggleBlock,
    adRegister,
    insertUser,
    loadDashboard,

}