const { ObjectId } = require('mongodb')
const mongoose=require('mongoose')
const walletSchema=new mongoose.Schema({
    rupees:{
        type:Number,
        default:0
    },
    userid:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required:true
    }
})

module.exports = mongoose.model("Wallet",walletSchema)