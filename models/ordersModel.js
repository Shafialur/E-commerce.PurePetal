const mongoose=require("mongoose")

const orderShema=new mongoose.Schema({
    userid:{
        type:String,
        ref:'User',
        required:true
    },
    orderId:{
        type:String,
        default: function(){
            return Math.floor(100000 + Math.random()*900000).toString() 
        }
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
        pprice: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            default:1
        },
        imageurl:{
            type:String,
            required:true
        },
        category:{
            type:mongoose.Types.ObjectId,
            ref:"Category",
            required:true
        }    
    }],
    email:{
        type:String,
        required:false
    },
    date:{
        type:Date,
        default: Date.now(),
        required:false
    },
    address:{
        type:String,
        required:false
    },
    orderstatus:{
        type:String,
        default:"Pending"
    },
    paymentstatus:{
        type:String,
        default:"Pending"
    },
    paymethod:{
        type:String,
        required:false
    },
    deliveredDate: {
        type:Date,
        default:null
    },
    total:{
        type:Number,
        required:false
    },
    discount:{
        type:Number,
        required:false
    }

})


module.exports = mongoose.model("Order",orderShema)