const mongoose=require("mongoose")

const productShema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    productdt:{
        type:String,
        required:true
    },
    productimg:[{
        type:String,
        required:true
    }],
    pprice:{
        type:String,
        required:true
    },
    promoprice:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Types.ObjectId,
        ref:"Category",
        required:true
    },
    is_block:{
        type:Number,
        default:0,
    },
    quantity:{
        type:Number,
        default:1
    }
})

module.exports = mongoose.model("Product",productShema)