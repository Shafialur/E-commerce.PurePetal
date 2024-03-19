const wallet=require('../models/walletModel')
const user=require('../models/userModel')

const walletDetails=async(req,res)=>{
    try{
        const isLoggedIn = req.session.user_id ? true : false;
        const userData=await user.findOne({_id:req.session.user_id})
        
        walletData=await wallet.findOne({userid:req.session.user_id})
        res.render('userWallet',{isLoggedIn,userData,walletData})
    }catch(error){
        console.log(error.message);
    }
}


module.exports={
    walletDetails
}