const category = require('../models/categoryModel')
const product = require('../models/productModel')


const listcategory = async (req, res) => {
    try {
        var page = 1
        if (req.query.page) {
            page = req.query.page
        }
    
        const limit = 5
        const categoryData = await category.find({})
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec()
            
    
        const count = await category.find({ is_block: 0}).countDocuments()
        
        return res.render('categorylist', { category: categoryData,totalPages: Math.ceil(count / limit),
        currentPage: page,
        previous: parseInt(page) - 1,
        next: parseInt(page) + 1})
    } catch (error) {
        console.log(error.message)
    }
}

const addcategory = async (req, res) => {
    try {
        return res.render('addcategory')
    } catch (error) {
        console.log(error.message)
    }
}

const insertCategory = async (req, res) => {
    try {
        // Check if a category with the same title already exists
        const existingCategory = await category.findOne({ title: req.body.title });

        if (existingCategory) {
            
            return res.render('addcategory',{message:"Category is already exists"});
        }

        // If no category with the same title exists, create and save the new category
        const newCategory = new category({
            imageurl: req.body.imageurl,
            title: req.body.title,
            description: req.body.description,
            is_block: 0
        });

        const categoryData = await newCategory.save();

        if (categoryData) {
            return res.redirect('/admin/categorylist');
        } else {
            return res.send('Failed to add category.');
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal server error.');
    }
};

const deletecategory = async (req, res) => {

    try {

        const id = req.params.id;
        const categoryData = await category.findById(id);

        if (!categoryData) {
            return res.status(404).send('Category not found');
        }

        // Proceed with deletion
        await category.findByIdAndDelete(id);
        return res.redirect('/admin/categorylist');
    }
    catch (error) {
        console.log(error.message)
        return res.status(500).send("Internal Server Error");
    }
}

const editcategory = async (req, res) => {

    try {
        const id = req.query.id
        const categoryData = await category.findOne({ _id: id })

        return res.render('editcategory', { category: categoryData })

    }

    catch (error) {
        console.log(error.message)
    }
}

const updateCategory = async (req, res) => {
    try {
        const existingCategory = await category.findOne({ title: req.body.title });

        if (existingCategory && existingCategory._id.toString() !== req.body.id) {

            return res.status(400).send('Category with the same title already exists.');
        }

        // No duplicate title found, proceed with updating the category
        const categoryData = await category.findByIdAndUpdate(
            { _id: req.body.id },
            { $set: { imageurl: req.body.imageurl, title: req.body.title, description: req.body.description } }
        );

        return res.redirect('/admin/categorylist');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal server error.');
    }
}


const toggleList = async (req, res) => {
    try {

        const id = req.params.id;
        const categoryData = await category.findById(id);

        if (!categoryData) {
            return res.status(404).send("category not found");
        }

        // Toggle the value of is_block
        const newIsBlockValue = categoryData.is_block === 0 ? 1 : 0;

        await category.updateOne({ _id: id }, { $set: { is_block: newIsBlockValue } });

        console.log(`Category is_block toggled to: ${newIsBlockValue}`);
        return res.redirect('/admin/categorylist');
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");
    }
};


const categoryOffer=async(req,res)=>{
    try{
        const {offerPercentage,category}=req.body
        console.log(offerPercentage,category);
        const productData=await product.find({category:category}).populate('category')

        for(let i=0;i<productData.length;i++){
            const percentageAmount=productData[i].pprice*offerPercentage/100
            productData[i].promoprice=parseInt(productData[i].pprice)
            productData[i].pprice-=parseInt(percentageAmount)
            await productData[i].save()
        }
        res.redirect('/admin/categorylist')
    }catch(error){
        console.log(error.message);
    }
}





module.exports = {
    listcategory,
    addcategory,
    insertCategory,
    deletecategory,
    editcategory,
    updateCategory,
    toggleList,
    categoryOffer
}