const mongoose=require("mongoose")

const categoryShema=new mongoose.Schema({
    imageurl:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    is_block:{
        type:Number,
        default:0
    }

})

module.exports = mongoose.model("Category",categoryShema)