const mongoose=require("mongoose")

const addressSchema=new mongoose.Schema({
    userid:{
        type:String,
        required:true
    },
    address: [{
        house: {
            type: String,
            required: true
        },
        landmark: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipcode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    }]

})

module.exports = mongoose.model("Address",addressSchema)