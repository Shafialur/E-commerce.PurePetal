const mongoose=require("mongoose")

const wishlistSchema=new mongoose.Schema({
    userid:{
        type:String,
        required:true
    },
    products: [{
        type:mongoose.Types.ObjectId,
        ref:"Product",
        required:true
    }]

})


module.exports = mongoose.model("Wishlist",wishlistSchema)