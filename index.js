
const express=require("express")
const app=express()
const session=require("express-session")
const path=require("path")
require('dotenv').config()


const mongoose=require("mongoose")
console.log("Connected To MongoDB");
mongoose.connect(`${process.env.mongoDBurl}`).then(()=>{
  console.log('Conneted');
})





app.use(session({
    secret: process.env.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
  }));
  
app.use("/static",express.static(path.join(__dirname,"public")))

app.use(express.static('public'));

// app.use("/assets",express.static(path.join(__dirname,"public/assets")))

//......users route
const userRoute=require("./routes/userRoute")
app.use("/",userRoute)

//......admin route
const adminRoute=require('./routes/adminRoute')
app.use('/admin',adminRoute)

const port=process.env.PORT||3000

app.listen(port,()=>{
    console.log(`Server Running on http://localhost:${port}`)
})

