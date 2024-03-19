const user = require('../models/userModel')
const product = require('../models/productModel')
const Address = require('../models/addressModel')


const addAddress = async (req, res) => {
    try {

        id = req.session.user_id
        const userData = await user.find({ _id: id })
        const isLoggedIn = req.session.user_id ? true : false;

        return res.render('addaddress', { isLoggedIn, userData })
    } catch (error) {
        console.log(error.message);
    }
}

const addaddress = async (req, res) => {
    try {
        const id = req.session.user_id;
        const newAddress = {
            house: req.body.house,
            landmark: req.body.landmark,
            city: req.body.city,
            state: req.body.state,
            zipcode: req.body.zipcode,
            country: req.body.country
        };
        const address = new Address({
            userid: id,
            address: [newAddress]
        });
        await address.save();

        return res.redirect('/editprofile');

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const addnewaddress = async (req, res) => {
    try {
        id = req.session.user_id
        const userData = await user.find({ _id: id })
        const isLoggedIn = req.session.user_id ? true : false;

        return res.render('addaddress', { isLoggedIn, userData })
    } catch (error) {
        console.log(error.message);
    }
}



const submitnewaddress = async (req, res) => {
    try {
        const userId = req.session.user_id;

        // Create a new address object from the request body
        const newAddress = {
            house: req.body.house,
            landmark: req.body.landmark,
            city: req.body.city,
            state: req.body.state,
            zipcode: req.body.zipcode,
            country: req.body.country
        };

        // Find the user's document in the Address collection
        const existingAddress = await Address.findOne({ userid: userId });

        // If the user's document exists, update the 'address' array
        if (existingAddress) {
            existingAddress.address.push(newAddress);
            await existingAddress.save();
        } else {
            // If the user's document doesn't exist, you may want to handle this case appropriately
            console.log("User document not found");
            // You can choose to create a new document or handle it according to your application logic
        }

        return res.redirect('/editprofile?success=2');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

const deleteaddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const addressId = req.params.id;

        const userAddress = await Address.findOne({ userid: userId });
        if(userAddress){
            const deletedata = await Address.updateOne({userid:userId},
                {$pull:{'address':{_id:addressId}}})

            res.redirect('/editprofile?id=deleted')
        }
    }
    catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const editAddress = async (req, res) => {
    try {
        const id = req.session.user_id;
        const userData = await user.findOne({ _id: id });
        const addressData=await Address.findOne({userid:id})
        const index = req.query.id;
        const address = addressData.address[index]
       
        const isLoggedIn = req.session.user_id ? true : false;
        res.render('editaddress', { isLoggedIn, userData,address });

    } catch (error) {
        console.log(error.message);
    }
};



const editaddresspost = async (req, res) => {
    try {   
        const userId = req.session.user_id;
        const addId= req.body.id;
        const {house,landmark,city,state,zipcode,country} = req.body;

        const result = await Address.updateOne(
            {
                userid: userId,
                'address._id': addId
            },
            {
                $set: {
                    'address.$.house': house,
                    'address.$.landmark': landmark,
                    'address.$.city': city,
                    'address.$.state': state,
                    'address.$.zipcode': zipcode,
                    'address.$.country': country
                }
            },{new:true}
        );

        if (result) {
            console.log('Update successful');
    
            res.redirect('/editprofile');
        } else {
            console.log('No matching document found or no changes made');
            
            res.redirect('/editprofile');
        }
    } catch (error) {
        console.log(error.message);
        // Handle the error, redirect or send an error response
        res.redirect('/editprofile');
    }
};






module.exports = {
    addAddress,
    addaddress,
    addnewaddress,
    submitnewaddress,
    deleteaddress,
    editAddress,
    editaddresspost

}