
const mongoose=require("mongoose")
const mongodb=mongoose.connect("mongodb://127.0.0.1:27017/user_management_system")

module.exports=mongodb;