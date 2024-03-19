const wishlist = require('../models/wishlistModel')
const product = require('../models/productModel')
const user = require('../models/userModel')

const wishlists = async (req, res) => {

    try {
        const userData = await user.find({ _id: req.session.user_id })
        console.log(userData);
        const wishlistData = await wishlist.findOne({ userid: req.session.user_id }).populate('products')
        res.render('wishlist', { isLoggedIn: req.session.user_id ? true : false, userData, wishlistData })

    } catch (error) {
        console.log(error.message);
    }
}


const addtowishlist = async (req, res) => {
    try {
        const productId = req.query.id;

        // Find the user's wishlist by user ID
        let existingWishlist = await wishlist.findOne({ userid: req.session.user_id });
        

        if (!existingWishlist) {
            // If the user doesn't have a wishlist yet, create a new one with the product
            const newWishlist = new wishlist({
                userid: req.session.user_id,
                products: [productId]
            });
            await newWishlist.save();
            console.log("Product added to wishlist");
        } else {
            // Check if the product already exists in the wishlist
            const productExists = existingWishlist.products.includes(productId);
            if(!productExists) {
                // If the product doesn't exist in the wishlist, add it
                existingWishlist.products.push(productId);
                await existingWishlist.save();
                console.log("Product added to wishlist");
            } else {
                console.log("Product already exists in the wishlist");
            }
        }

        return res.redirect('/shoppage');
    } catch (error) {
        console.log(error.message);
        // Handle error appropriately, maybe send an error response
    }
};



const deletewishlist = async (req, res) => {
    try {
        const id = req.query.id;
        const wishlistDoc = await wishlist.findOne({ userid: req.session.user_id }); // Find the wishlist document

        // Find the index of the product to delete
        const indexToDelete = wishlistDoc.products.findIndex(product => product.toString() === id.toString());
        console.log(indexToDelete);

        if (indexToDelete !== -1) {
            wishlistDoc.products.splice(indexToDelete, 1); // Remove the product from the array
            await wishlistDoc.save(); // Save the changes to the database
        } else {
            console.log("Product not found in wishlist.");
        }

        res.redirect('/wishlists');
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};


module.exports = {
    wishlists,
    addtowishlist,
    deletewishlist
}