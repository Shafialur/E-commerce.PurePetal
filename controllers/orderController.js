const user = require("../models/userModel")
const product = require('../models/productModel')
const category = require('../models/categoryModel')
const address = require("../models/addressModel")
const cart = require("../models/cartModel")
const order = require('../models/ordersModel')
const wallet = require('../models/walletModel')
const Razorpay = require('razorpay')

var instance = new Razorpay({
    key_id: 'rzp_test_OXv4uPdE8Ey3fK',
    key_secret: 'cNvdsQSvTjpacQQ1nAwkU05Y',
});


const ordersuccess = async (req, res) => {
    try {
        const userData = await user.findOne({ _id: req.session.user_id });
        const isLoggedIn = req.session.user_id ? true : false;

        // Assuming you have a Cart model for your cart schema
        const cartDelete = await cart.findOneAndDelete({ userid: req.session.user_id });

        return res.render('ordersuccess', { isLoggedIn, userData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const submitorder = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const orderproductsData = await cart.find({ userid: userId }, { products: 1, _id: 0 });
        const userData = await user.findOne({ _id: userId });
console.log(req.body);
        const { addressId, paymentOption, cartSubtotal, discount } = req.body;


        if (!orderproductsData || !orderproductsData[0] || !orderproductsData[0].products) {
            // Handle the case where orderproducts or orderproducts[0].products is undefined
            return res.status(404).json({ success: false, message: 'Cart is empty or not found' });
        }

        const orderproducts = orderproductsData[0].products;
        // Find the specific subdocument in the 'address' array based on its _id
        const getAddress = await address.findOne({ userid: userId});
        const addressData=getAddress.address.find(item=> item._id==addressId)
        if (addressData) {
            const matchedAddress = addressData;
            const { house, landmark, city, state, zipcode, country } = matchedAddress;

            // Extract only the desired fields from the products array
            const selectedProducts = orderproducts.map(product => ({
                productid: product.productid,
                title: product.title,
                pprice: product.pprice,
                quantity: product.quantity,
                imageurl: product.productimg,
                category: product.category
            }));
            console.log(selectedProducts);
            for (let i = 0; i < selectedProducts.length; i++) {

                const productData = await product.findOne({ _id: selectedProducts[i].productid })
                const newstock = productData.quantity - selectedProducts[i].quantity
                const newproductquantity = await product.updateOne({ _id: selectedProducts[i].productid }, { $set: { quantity: newstock } })
            }



            if (paymentOption == "Cash On Delivery") {
                if (cartSubtotal <= 1000) {
                    const newOrder = new order({
                        userid: userId,
                        products: selectedProducts,
                        email: userData.email,
                        date: new Date(),
                        address: `${house}, ${landmark}, ${city}, ${state}, ${zipcode}, ${country}`,
                        paymethod: paymentOption,
                        total: cartSubtotal,
                        discount: discount
                    });
                    await newOrder.save();

                    res.status(200).json({ success: true, paymentOption, message: 'Order placed successfully' });
                }
                else {
                    return res.status(200).json({ paymentOption, message: "~~Order Above 1000 not allowed for COD" })
                }
            }
            else if (paymentOption == "Online Payment") {

                const newOrder = new order({
                    userid: userId,
                    products: selectedProducts,
                    email: userData.email,
                    date: new Date(),
                    address: `${house}, ${landmark}, ${city}, ${state}, ${zipcode}, ${country}`,
                    paymethod: paymentOption,
                    total: cartSubtotal,
                    discount: discount

                });


                await newOrder.save();
                const totalamount = newOrder.total

                var options = {
                    amount: newOrder.total,  // amount in the smallest currency unit
                    currency: "INR",
                    receipt: newOrder.orderId
                };
                instance.orders.create(options, function (err, order) {
                    const orderId = newOrder.orderId

                    return res.status(200).json({ success: true, order, orderId, totalamount, paymentOption, message: 'Order placed successfully' });
                });

            } else if (paymentOption == "Wallet") {
                const walletData = await wallet.findOne({ userid: req.session.user_id })
                if (walletData.rupees >= cartSubtotal) {

                    const newOrder = new order({
                        userid: userId,
                        products: selectedProducts,
                        email: userData.email,
                        date: new Date(),
                        address: `${house}, ${landmark}, ${city}, ${state}, ${zipcode}, ${country}`,
                        paymethod: paymentOption,
                        paymentstatus: "PaymentSuccess",
                        total: cartSubtotal,
                        discount: discount

                    });
                    await newOrder.save();
                    let walletBalance = walletData.rupees - cartSubtotal
                    const newBalance = await wallet.updateOne({ userid: req.session.user_id }, { rupees: walletBalance })
                    return res.status(200).json({ paymentOption })
                }
                else {
                    return res.status(200).json({ paymentOption, message: "~~No enough balance in your wallet" })
                }
            }
            else {

                res.status(400).json({ success: false, message: "order not placed" })
            }

        } else {
            // If no address is found, or the address array is empty
            res.status(404).json({ success: false, message: 'Address not found' });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const orderlist = async (req, res) => {
    try {
        var page = 1
        if (req.query.page) {
            page = req.query.page
        }

        const limit = 10
        const orderData = await order.find({})
            .sort({ date: -1 }) // Sorting by createdAt field in descending order
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await order.find({}).countDocuments()

        return res.render('orderlist', {
            orderData, totalPages: Math.ceil(count / limit),
            currentPage: page,
            previous: parseInt(page) - 1,
            next: parseInt(page) + 1
        })

    } catch (error) {
        console.log(error.message);
    }
}

const cancelorder = async (req, res) => {
    try {
        const orderid = req.params.id
        const ordermodified = await order.updateOne({ orderId: orderid }, { orderstatus: "Cancelled" })
        const orderData = await order.findOne({ orderId: orderid })

        for (let i = 0; i < orderData.products.length; i++) {
            const productData = await product.findOne({ _id: orderData.products[i].productid })
            const newstock = productData.quantity + orderData.products[i].quantity
            const newproductData = await product.updateOne({ _id: orderData.products[i].productid }, { $set: { quantity: newstock } })
        }

        res.redirect('/editprofile?id=cancelled')


    } catch (error) {
        console.log(error.message);
    }
}

const returnorder = async (req, res) => {
    try {
        const orderid = req.params.id
        const ordermodified = await order.updateOne({ orderId: orderid }, { orderstatus: "Return" })
        const orderData = await order.findOne({ orderId: orderid })
        res.redirect('/editprofile?id=return')
    }
    catch (error) {
        console.log(error.message);
    }
}
const orderdetails = async (req, res) => {
    try {
        const orderid = req.query.id
        const orderData = await order.findOne({orderId: orderid})
        const userData = await user.findOne({ _id: orderData.userid })

        return res.render('orderdetails', { orderData, userData })
    } catch (error) {
        console.log(error.message);
    }
}
const orderdetailsadmin = async (req, res) => {
    try {
        const orderid = req.query.id
        const orderData = await order.findOne({ orderId: orderid })
        const userData = await user.findOne({ _id: orderData.userid })
        return res.render('orderdetailsadmin', { orderData, userData })

    } catch (error) {
        console.log(error.message);
    }
}

const updatestatus = async (req, res) => {
    try {
        const status = req.body.newStatus;
        const orderid = req.body.orderId;

        const orderData = await order.findOne({ orderId: orderid });
        if (orderData.orderstatus !== status) {
            const changedstatus = await order.updateOne({ orderId: orderid }, { orderstatus: status });
            let neworderData = await order.findOne({ orderId: orderid })
            if (changedstatus) {

                if (neworderData.orderstatus == "Returned") {
                    const walletData = await wallet.findOne({ userid: req.session.user_id });
                    let walletMoney = parseFloat(walletData.rupees); // Convert to numeric value
                    walletMoney += parseFloat(orderData.total); // Add the order total 
                    // Update wallet balance
                    const addtowallet = await wallet.updateOne({ userid: req.session.user_id }, { rupees: walletMoney });
                    console.log(walletMoney);

                    //update stock
                    for (let i = 0; i < neworderData.products.length; i++) {
                        const productData = await product.findOne({ _id: orderData.products[i].productid })
                        const newstock = productData.quantity + neworderData.products[i].quantity
                        const newproductData = await product.updateOne({ _id: neworderData.products[i].productid }, { $set: { quantity: newstock } })
                    }

                }
                else if (neworderData.orderstatus == "Delivered") {
                    const paymentstatus = await order.updateOne({ orderId: orderid }, { paymentstatus: "PaymentSuccess" });
                }
                res.redirect('/admin/orderlist');
            }
        }

    } catch (error) {
        console.log(error.message);
    }
}

const paymentstatus = async (req, res) => {
    try {
        const { status, orderId } = req.body;
        const orderData = await order.findOneAndUpdate({ orderId: orderId }, { paymentstatus: status })
        console.log(orderData);
        return res.status(200).json()

    } catch (error) {
        console.log(error.message);
    }
}

const failedpayment = async (req, res) => {
    try {
        const orderid = req.query.id;
        const orderData = await order.findOne({ orderId: orderid });
        const isLoggedIn = req.session.user_id ? true : false;
        const userData = await user.find({ _id: req.session.user_id });
        const addressData = await address.findOne({ userid: req.session.user_id });
        console.log(orderData);

        return res.render('failedpayment', { isLoggedIn, userData, addressData, orderData });

    } catch (error) {
        console.error("Error in failedpayment function:", error);
        return res.status(500).send("Internal Server Error");
    }
}



module.exports = {
    ordersuccess,
    submitorder,
    orderlist,
    cancelorder,
    orderdetails,
    orderdetailsadmin,
    updatestatus,
    returnorder,
    paymentstatus,
    failedpayment
}