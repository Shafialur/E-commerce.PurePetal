const mongoose=require("mongoose")

const cartShema=new mongoose.Schema({
    userid:{
        type:String,
        required:true
    },
    products: [{
        productid: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        productdt: {
            type: String,
            required: true
        },
        productimg: {
            type: String,
            required: true
        },
        pprice: {
            type: String,
            required: true
        },
        promoprice: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        stock: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            default:1
        }
        
    }]

})


module.exports = mongoose.model("Cart",cartShema)