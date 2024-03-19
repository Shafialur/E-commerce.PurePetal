const mongoose=require("mongoose")

const coupenShema=new mongoose.Schema({

    code:{
        type:String,
        required:true
    },
    discount:{
        type:String,
        required:true
    },
    minAmt:{
        type:String,
        required:true
    },
    maxDiscAmt:{
        type:Number,
        default:0
    },
    user:[{
        userid:{
            type:String

        }
    }],
    is_list:{
        type:Boolean,
        default:true
    }

})

module.exports = mongoose.model("Coupen",coupenShema)