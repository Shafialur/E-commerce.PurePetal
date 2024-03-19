const user = require("../models/userModel")
const product = require('../models/productModel')
const category = require('../models/categoryModel')
const address = require("../models/addressModel")
const cart = require("../models/cartModel")


const addtocart = async (req, res) => {
    try {
        const productId = req.query.id;
        const productData = await product.findOne({ _id: productId });

        // Create a new product object
        const newProduct = {
            productid: productId,
            title: productData.title,
            productdt: productData.productdt,
            productimg: productData.productimg[0],
            pprice: productData.pprice,
            promoprice: productData.promoprice,
            category: productData.category,
            stock: productData.quantity,
            quantity: 1
        };

        // Find the user's cart by user ID
        let existingCart = await cart.findOne({ userid: req.session.user_id });

        if (!existingCart) {
            // If the user doesn't have a cart yet, create a new one with the product
            const newCart = new cart({
                userid: req.session.user_id,
                products: [newProduct]
            });
            await newCart.save();
        } else {
           
            const existingProductIndex = existingCart.products.findIndex(product => product.productid === productId);
            if (existingProductIndex !== -1) {
                console.log( existingCart.products[existingProductIndex]);
            } else {
                
                existingCart.products.push(newProduct);
            }
            
            await existingCart.save();
        }

        return res.redirect('/mycart');
    } catch (error) {
        console.log(error.message);
    }
};


const mycart = async (req, res) => {
    try {
        const id = req.session.user_id
        const userData = await user.find({ _id: id })
        const isLoggedIn = req.session.user_id ? true : false;
        const cartProducts = await cart.findOne({ userid: id })

        return res.render('mycart', { isLoggedIn, userData, cart: cartProducts })

    } catch (error) {
        console.log(error.message);
    }
}

const deletecart = async (req, res) => {
    try {
        const productId = req.query.id
        console.log(productId)
        const result = await cart.updateOne({ userid: req.session.user_id }, {
            $pull: { 'products': { _id: productId } }
        })
        return res.redirect('/mycart')

    } catch (error) {
        console.log(error.message);
    }
}

const updatequantity = async (req, res) => {
    try {
        const proId = req.query.id
        const newquantity = req.query.quantity
        console.log(proId, newquantity);
        const result = await cart.updateOne(
            { userid: req.session.user_id, 'products._id': proId },
            { $set: { 'products.$.quantity': newquantity } }
        );

        if (result) {
            return res.status(200).json({ success: true, successmessage: 'Saved New Quantity' })

        }

    } catch (error) {
        console.log(error.message);
    }
}

const checkoutpage = async (req, res) => {
    try {
        const id = req.session.user_id
        const userData = await user.find({ _id: id })
        const isLoggedIn = req.session.user_id ? true : false;
        const cartProducts = await cart.findOne({ userid: id })
        const addressData = await address.findOne({ userid: id })

        res.render('checkout', { isLoggedIn, userData, cart: cartProducts, addressData })
    } catch (error) {
        console.log(error.message);
    }

}
const getstock = async (req, res) => {
    try {
        const productId = req.query.id
        const cartData = await cart.findOne({ userid: req.session.user_id })
        if (!cartData || !cartData.products) {
            return res.status(404).json({ error: 'Cart data or products not found' });
        }

        const product = cartData.products.find(item => item._id == productId)


        if (product) {
            res.json({ stock: product.stock }); // Return the stock data as JSON
        } else {
            res.status(404).json({ error: 'Product not found in cart' });
        }
    } catch (error) {
        console.log(error.message);
    }
}




module.exports = {
    addtocart,
    mycart,
    deletecart,
    updatequantity,
    checkoutpage,
    getstock
}