const product = require('../models/productModel')
const category = require('../models/categoryModel')
const Order = require('../models/ordersModel')
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs')


const productlist = async (req, res) => {
    try {
        var page = 1
        if (req.query.page) {
            page = req.query.page
        }

        const limit = 5
        const productData = await product.find({})
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('category')
            .exec()


        const count = await product.find({ is_block: 0 }).countDocuments()

        return res.render('productlist', {
            products: productData, totalPages: Math.ceil(count / limit),
            currentPage: page,
            previous: parseInt(page) - 1,
            next: parseInt(page) + 1
        })

    } catch (error) {
        console.log(error.message)
    }
}



const addproduct = async (req, res) => {
    try {
        const categoryData = await category.find({})
        return res.render('addproduct', { category: categoryData })
    } catch (error) {
        console.log(error.message)
    }
}


const insertProduct = async (req, res) => {
    try {
        const productimg = req.files.map(file => file.filename)
        const categoryId = await category.findOne({ title: req.body.category });
        const Product = new product({
            title: req.body.title,
            productdt: req.body.productdt,
            productimg: productimg,
            pprice: req.body.pprice,
            promoprice: req.body.promoprice,
            category: categoryId._id,
            quantity: req.body.quantity
        })
        const productData = await Product.save()
        if (productData) {
            return res.redirect('/admin/productlists')

        }
        else {
            return res.send("Not Added")
        }

    }
    catch (error) {
        console.log(error.message)
    }
}



const editproduct = async (req, res) => {
    try {
        const id = req.query.id
        const productData = await product.findById({ _id: id })
        if (productData) {
            return res.render('editproduct', { product: productData })
        } else {
            return res.redirect('/admin/editproduct')
        }

    } catch (error) {
        console.log(error.message)
    }
}


const updateProducts = async (req, res) => {
    try {
        const updatedImages = req.files.map(file => file.filename)
        const categoryId = await category.findOne({ title: req.body.category });
        const productData = await product.findByIdAndUpdate({ _id: req.body.id },


            {
                $set: {
                    title: req.body.title,
                    productdt: req.body.productdt,
                    pprice: req.body.pprice,
                    promoprice: req.body.promoprice,
                    category: categoryId._id,
                    quantity: req.body.quantity
                },
                $push: {
                    productimg: { $each: updatedImages }
                }
            }, { new: true }
        )
        return res.redirect('/admin/productlists')
    } catch (error) {
        console.log(error.message)
    }
}

const toggleShow = async (req, res) => {
    try {

        const id = req.params.id;
        const productData = await product.findById(id);

        if (!productData) {
            return res.status(404).send("Product not found");
        }

        // Toggle the value of is_block
        const newIsBlockValue = productData.is_block === 0 ? 1 : 0;

        await product.updateOne({ _id: id }, { $set: { is_block: newIsBlockValue } });

        console.log(`User is_block toggled to: ${newIsBlockValue}`);
        return res.redirect('/admin/productlists');
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");
    }
};


const deleteproductimg = async (req, res) => {
    try {
        console.log(req.query);
        const proid = req.query.id;
        const index = req.query.index;
        // Find the product by ID
        const productData = await product.findById({ _id: proid });

        // If the product exists
        if (productData) {
            // Use $pull as part of the update operation
            productData.productimg.splice(index, 1); // Remove the element at the specified index

            // Save the updated product data
            await productData.save();

            return res.render('editproduct', { product: productData })


        } else {

            res.status(404).json({ message: 'Product not found' });
        }

    } catch (error) {
        console.log(error.message);
        // Send an error response
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const salesreport = async (req, res) => {
    try {
        var page = 1
        const limit = 10
        const count = await Order.find({}).countDocuments()
        if (req.query.page) {
            page = req.query.page
        }
        if (req.query.startDate && req.query.endDate) {
            const startDate = new Date(req.query.startDate); // Parse start date
            const endDate = new Date(req.query.endDate);     // Parse end date
        
            // Ensure that startDate is before endDate
            if (startDate > endDate) {
                return res.status(400).json({ success: false, message: "Start date must be before end date" });
            }
        
            const deliveredOrders = await Order.aggregate([
                {
                    $match: {
                        orderstatus: "Delivered",
                        date: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $lookup: {
                        from: "userdetials",
                        localField: "userid",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $sort: { date: -1 } // Sorting by date field in descending order
                }
            ])
            
            if (deliveredOrders.length === 0) {
                return res.status(400).render('salesreport', {
                    orderData: deliveredOrders,
                    totalPages: 1,
                    currentPage: page,
                    previous: parseInt(page) - 1,
                    next: parseInt(page) + 1,
                    message:"No data found for the specified date range"
                });
            }


            return res.status(200).render('salesreport', {
                orderData: deliveredOrders,
                totalPages: 1,
                currentPage: page,
                previous: parseInt(page) - 1,
                next: parseInt(page) + 1
            });
            
        }
        if (req.query.option) {
            const option = req.query.option;

            if (option == 'Yearly') {
                const inputDate = new Date("Wed Feb 21 2024 12:37:39 GMT+0530 (India Standard Time)");
                const utcDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), inputDate.getHours(), inputDate.getMinutes(), inputDate.getSeconds()));

                // Extract the year from the date
                const year = utcDate.getUTCFullYear();

                var deliveredOrders = await Order.aggregate([
                    {
                        $match: {
                            orderstatus: "Delivered",
                            date: {
                                $gte: new Date(Date.UTC(year, 0, 1)), // January 1st of the specified year
                                $lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)) // December 31st of the specified year

                            }
                        },
                    },
                    {
                        $group: {
                            _id: { $year: "$date" },
                            orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
                        }

                    },
                    {
                        $unwind: "$orders" // Unwind the orders array
                    },
                    {
                        $lookup: {
                            from: "userdetials", // Assuming the name of the User collection is "users"
                            localField: "orders.userid", // Field in the orders array
                            foreignField: "_id", // Field in the User collection
                            as: "orders.userid" // Output array field
                        }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            orders: { $push: "$orders" } // Group orders back into an array
                        }
                    }, {
                        $sort: { "_id.year": 1, "_id.month": 1 } // Sort by year and month
                    }
                ]).sort({ date: -1 }) // Sorting by createdAt field in descending order
                    

            } else if (option == 'Monthly') {
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth();
                const startDate = new Date(currentYear, currentMonth, 1); // First day of the current month
                const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // Last day of the current month

                deliveredOrders = await Order.aggregate([
                    {
                        $match: {
                            orderstatus: "Delivered",
                            date: {
                                $gte: startDate,
                                $lte: endDate
                            }
                        }
                    },
                    {
                        $group: {
                            _id: { year: { $year: "$date" }, month: { $month: "$date" } }, // Group by year and month
                            orders: { $push: "$$ROOT" }
                        }
                    },
                    {
                        $unwind: "$orders"
                    },
                    {
                        $lookup: {
                            from: "userdetials",
                            localField: "orders.userid",
                            foreignField: "_id",
                            as: "orders.userid"
                        }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            orders: { $push: "$orders" }
                        }
                    },
                    {
                        $sort: { "_id.year": 1, "_id.month": 1 }
                    }
                ]).sort({ date: -1 }) // Sorting by createdAt field in descending order
                    
            } else if (option == 'Weekly') {
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth();
                const currentDay = new Date().getDate();
                const currentDayOfWeek = new Date().getDay();

                const startOfWeek = new Date(currentYear, currentMonth, currentDay - currentDayOfWeek);
                const endOfWeek = new Date(currentYear, currentMonth, currentDay + (6 - currentDayOfWeek), 23, 59, 59);


                deliveredOrders = await Order.aggregate([
                    {
                        $match: {
                            orderstatus: "Delivered",
                            date: {
                                $gte: startOfWeek,
                                $lte: endOfWeek
                            }
                        }
                    },
                    {
                        $group: {
                            _id: { year: { $year: "$date" }, week: { $week: "$date" } }, // Group by year and week
                            orders: { $push: "$$ROOT" }
                        }
                    },
                    {
                        $unwind: "$orders"
                    },
                    {
                        $lookup: {
                            from: "userdetials",
                            localField: "orders.userid",
                            foreignField: "_id",
                            as: "orders.userid"
                        }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            orders: { $push: "$orders" }
                        }
                    },
                    {
                        $sort: { "_id.year": 1, "_id.week": 1 }
                    }
                ]).sort({ date: -1 })
                    
            }

            
            if (deliveredOrders.length == 0) {
                return res.status(400).render('salesreport', {
                    date: deliveredOrders[0]._id, orderData: deliveredOrders[0].orders,
                    option: option, totalPages:1,
                    currentPage: page,
                    previous: parseInt(page),
                    next: parseInt(page)
                })
            }
            
          

            return res.status(200).render('salesreport', {
                date: deliveredOrders[0]._id, orderData: deliveredOrders[0].orders,
                option: option, totalPages:1,
                currentPage: page,
                previous: parseInt(page),
                next: parseInt(page)
            })
        }


        const orderData = await Order.find({ orderstatus: "Delivered" })
            .sort({ date: -1 }) // Sorting by createdAt field in descending order
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();


        res.render('salesreport', {
            orderData, totalPages: Math.ceil(count / limit),
            currentPage: page,
            previous: parseInt(page) - 1,
            next: parseInt(page) + 1
        })

    } catch (error) {
        console.log(error.message);
    }
}


const pdfDownload = async (req, res) => {
    try {
        const option = req.query.option
        const startdate = req.query.startDate // Parse start date
        const enddate = req.query.endDate
        
        if (req.query.startDate && req.query.endDate) {
            const startDate = new Date(req.query.startDate); // Parse start date
            const endDate = new Date(req.query.endDate);     // Parse end date
        
            // Ensure that startDate is before endDate
            if (startDate > endDate) {
                return res.status(400).json({ success: false, message: "Start date must be before end date" });
            }
        
            var deliveredOrders = await Order.aggregate([
                {
                    $match: {
                        orderstatus: "Delivered",
                        date: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: { year: { $year: "$date" }, month: { $month: "$date" } }, // Group by year and month
                        orders: { $push: "$$ROOT" }
                    }
                },
                {
                    $unwind: "$orders"
                },
                {
                    $lookup: {
                        from: "userdetials",
                        localField: "orders.userid",
                        foreignField: "_id",
                        as: "orders.userid"
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        orders: { $push: "$orders" }
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.month": 1 }
                }
            ]);
        
        }
        else if (option == 'Yearly') {
            const inputDate = new Date("Wed Feb 21 2024 12:37:39 GMT+0530 (India Standard Time)");
            const utcDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), inputDate.getHours(), inputDate.getMinutes(), inputDate.getSeconds()));

            // Extract the year from the date
            const year = utcDate.getUTCFullYear();

            var deliveredOrders = await Order.aggregate([
                {
                    $match: {
                        orderstatus: "Delivered",
                        date: {
                            $gte: new Date(Date.UTC(year, 0, 1)), // January 1st of the specified year
                            $lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)) // December 31st of the specified year

                        }
                    },
                },
                {
                    $group: {
                        _id: { $year: "$date" },
                        orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
                    }

                },
                {
                    $unwind: "$orders" // Unwind the orders array
                },
                {
                    $lookup: {
                        from: "userdetials", // Assuming the name of the User collection is "users"
                        localField: "orders.userid", // Field in the orders array
                        foreignField: "_id", // Field in the User collection
                        as: "orders.userid" // Output array field
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        orders: { $push: "$orders" } // Group orders back into an array
                    }
                }, {
                    $sort: { "_id.year": 1, "_id.month": 1 } // Sort by year and month
                }
            ]);
        }
        else if (option == 'Monthly') {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            const startDate = new Date(currentYear, currentMonth, 1); // First day of the current month
            const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // Last day of the current month

            var deliveredOrders = await Order.aggregate([
                {
                    $match: {
                        orderstatus: "Delivered",
                        date: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: { year: { $year: "$date" }, month: { $month: "$date" } }, // Group by year and month
                        orders: { $push: "$$ROOT" }
                    }
                },
                {
                    $unwind: "$orders"
                },
                {
                    $lookup: {
                        from: "userdetials",
                        localField: "orders.userid",
                        foreignField: "_id",
                        as: "orders.userid"
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        orders: { $push: "$orders" }
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.month": 1 }
                }
            ]);
        }
        else if (option == 'Weekly') {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            const currentDay = new Date().getDate();
            const currentDayOfWeek = new Date().getDay();

            const startOfWeek = new Date(currentYear, currentMonth, currentDay - currentDayOfWeek);
            const endOfWeek = new Date(currentYear, currentMonth, currentDay + (6 - currentDayOfWeek), 23, 59, 59);

            var deliveredOrders = await Order.aggregate([
                {
                    $match: {
                        orderstatus: "Delivered",
                        date: {
                            $gte: startOfWeek,
                            $lte: endOfWeek
                        }
                    }
                },
                {
                    $group: {
                        _id: { year: { $year: "$date" }, week: { $week: "$date" } }, // Group by year and week
                        orders: { $push: "$$ROOT" }
                    }
                },
                {
                    $unwind: "$orders"
                },
                {
                    $lookup: {
                        from: "userdetials",
                        localField: "orders.userid",
                        foreignField: "_id",
                        as: "orders.userid"
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        orders: { $push: "$orders" }
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.week": 1 }
                }
            ]);
        }else{
            const inputDate = new Date("Wed Feb 21 2024 12:37:39 GMT+0530 (India Standard Time)");
            const utcDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), inputDate.getHours(), inputDate.getMinutes(), inputDate.getSeconds()));

            // Extract the year from the date
            const year = utcDate.getUTCFullYear();

            var deliveredOrders = await Order.aggregate([
                {
                    $match: {
                        orderstatus: "Delivered",
                        date: {
                            $gte: new Date(Date.UTC(year, 0, 1)), // January 1st of the specified year
                            $lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)) // December 31st of the specified year

                        }
                    },
                },
                {
                    $group: {
                        _id: { $year: "$date" },
                        orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
                    }

                },
                {
                    $unwind: "$orders" // Unwind the orders array
                },
                {
                    $lookup: {
                        from: "userdetials", // Assuming the name of the User collection is "users"
                        localField: "orders.userid", // Field in the orders array
                        foreignField: "_id", // Field in the User collection
                        as: "orders.userid" // Output array field
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        orders: { $push: "$orders" } // Group orders back into an array
                    }
                }, {
                    $sort: { "_id.year": 1, "_id.month": 1 } // Sort by year and month
                }
            ]);
        }

        const doc = new PDFDocument();

        // Set the Content-Type header to display the PDF in the browser
        res.setHeader("Content-Type", "application/pdf");
        // Set Content-Disposition to suggest a filename
        res.setHeader("Content-Disposition", 'inline; filename="sale_report.pdf"');
        // Pipe the PDF content to the response stream
        doc.pipe(res);
        if (startdate && enddate) {
            doc.text(`Sales Report: ${startdate} | ${enddate}`, { align: "left", fontSize: 12, underline: true }).moveDown();        
        }else if (option == 'Weekly') {
            doc.text("Weekly Sales Report", { fontSize: 17, underline: true }).moveDown();
        } else if (option == 'Monthly') {
            doc.text("Monthly Sales Report", { fontSize: 17, underline: true }).moveDown();
        } else if (option == 'Yearly') {
            doc.text("Yearly Sales Report", { fontSize: 17, underline: true }).moveDown();
        }else {
            doc.text("Sales Report", { fontSize: 17, align:"center", underline: true }).moveDown();
        }
        // Add content to the PDF (based on your sale report structure)
        doc
            .fontSize(22)
            .text("PurePetal", { align: "center" })
            .text("Luxurious Watches", { align: "center" })
            .text("Kochi,India", { align: "center" })
            .text("", { align: "center" });

        const rowHeight = 20; // You can adjust this value based on your preference

        // Calculate the vertical position for each line of text in the row
        const yPos = doc.y + rowHeight / 2;
        // Create a table header
        doc
            .fontSize(12)
            .rect(10, doc.y, 800, rowHeight) // Set a rectangle for each row
            .text("Order ID", 20, yPos)
            .text("Date", 90, yPos)
            .text("Customer Email", 230, yPos)
            .text("Total", 340, yPos)
            .text("Status", 400, yPos)
            .text("Payment", 470, yPos);
        doc.moveDown();

        // Loop through fetched orders and products
        for (const order of deliveredOrders[0].orders) {
            // Set a fixed height for each row
            const rowHeight = 20; // You can adjust this value based on your preference

            // Calculate the vertical position for each line of text in the row
            const yPos = doc.y + rowHeight / 2;

            // Add the sale report details to the PDF table
            doc
                .fontSize(10)
                .rect(10, doc.y, 800, rowHeight) // Set a rectangle for each row
                .stroke() // Draw the rectangle
                .text(order.orderId.toString(), 15, yPos)
                .text(order.date.toISOString().split("T")[0], 80, yPos)
                .text(order.email, 190, yPos)
                .text(order.total.toString(), 350, yPos)
                .text("Delivered", 400, yPos)
                .text(order.paymethod, 460, yPos);
            // Move to the next row
            doc.moveDown();
        }
        // Add a separator between rows


        // End the document
        doc.end();
    }
 catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const downloadExcel = async (req, res) => {
    try {
        const option = req.query.option;
        // Fetch your sale report data from MongoDB, similar to what you're doing for the PDF download
        const orders = await fetchSaleReportData(option);

        // Create a new Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sale Report");

        // Add headers to the worksheet with Product Name
        worksheet.addRow([
            "Order ID",
            "Date",
            "Customer Email",
            "Total",
            "Status",
            "Payment Method",
        ]);

        // Add data to the worksheet
        orders.forEach((order) => {

            worksheet.addRow([
                order.orderId,
                order.date.toISOString().split("T")[0],
                order.email,
                order.total,
                order.orderstatus, // Assuming a static status for simplicity
                order.paymethod,
            ]);
        });

        // Set headers for the response
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=sale_report.xlsx"
        );

        // Write the Excel workbook to the response
        await workbook.xlsx.write(res);

        // End the response
        res.end();
    } catch (error) {
        console.error("Error downloading Excel:", error);
        res.status(500).send("Internal Server Error");
    }
};

async function fetchSaleReportData(option) {
    try {
        if (option == 'Yearly') {
            const inputDate = new Date("Wed Feb 21 2024 12:37:39 GMT+0530 (India Standard Time)");
            const utcDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), inputDate.getHours(), inputDate.getMinutes(), inputDate.getSeconds()));

            // Extract the year from the date
            const year = utcDate.getUTCFullYear();

            var deliveredOrders = await Order.aggregate([
                {
                    $match: {
                        orderstatus: "Delivered",
                        date: {
                            $gte: new Date(Date.UTC(year, 0, 1)), // January 1st of the specified year
                            $lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)) // December 31st of the specified year

                        }
                    },
                },
                {
                    $group: {
                        _id: { $year: "$date" },
                        orders: { $push: "$$ROOT" } // Add all details of delivered orders to an array
                    }

                },
                {
                    $unwind: "$orders" // Unwind the orders array
                },
                {
                    $lookup: {
                        from: "userdetials", // Assuming the name of the User collection is "users"
                        localField: "orders.userid", // Field in the orders array
                        foreignField: "_id", // Field in the User collection
                        as: "orders.userid" // Output array field
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        orders: { $push: "$orders" } // Group orders back into an array
                    }
                }, {
                    $sort: { "_id.year": 1, "_id.month": 1 } // Sort by year and month
                }
            ]);
        } else if (option == 'Monthly') {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            const startDate = new Date(currentYear, currentMonth, 1); // First day of the current month
            const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // Last day of the current month

            deliveredOrders = await Order.aggregate([
                {
                    $match: {
                        orderstatus: "Delivered",
                        date: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: { year: { $year: "$date" }, month: { $month: "$date" } }, // Group by year and month
                        orders: { $push: "$$ROOT" }
                    }
                },
                {
                    $unwind: "$orders"
                },
                {
                    $lookup: {
                        from: "userdetials",
                        localField: "orders.userid",
                        foreignField: "_id",
                        as: "orders.userid"
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        orders: { $push: "$orders" }
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.month": 1 }
                }
            ]);
        } else if (option == 'Weekly') {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            const currentDay = new Date().getDate();
            const currentDayOfWeek = new Date().getDay();

            const startOfWeek = new Date(currentYear, currentMonth, currentDay - currentDayOfWeek);
            const endOfWeek = new Date(currentYear, currentMonth, currentDay + (6 - currentDayOfWeek), 23, 59, 59);

            deliveredOrders = await Order.aggregate([
                {
                    $match: {
                        orderstatus: "Delivered",
                        date: {
                            $gte: startOfWeek,
                            $lte: endOfWeek
                        }
                    }
                },
                {
                    $group: {
                        _id: { year: { $year: "$date" }, week: { $week: "$date" } }, // Group by year and week
                        orders: { $push: "$$ROOT" }
                    }
                },
                {
                    $unwind: "$orders"
                },
                {
                    $lookup: {
                        from: "userdetials",
                        localField: "orders.userid",
                        foreignField: "_id",
                        as: "orders.userid"
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        orders: { $push: "$orders" }
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.week": 1 }
                }
            ]);
        }
        return deliveredOrders[0].orders
    } catch (error) {
        console.error("Error fetching sale report data:", error);
        throw error;
    }
}

const productOffer = async (req, res) => {
    try {
        const { offerPrice, originalPrice, productId } = req.body
        

        const productData = await product.findOne({ _id: productId })
        const updatedProduct = await product.updateOne({ _id: productId }, { promoprice: originalPrice, pprice: offerPrice })
        return res.redirect('/admin/productlists')


    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {

    productlist,
    addproduct,
    insertProduct,
    editproduct,
    updateProducts,
    toggleShow,
    deleteproductimg,
    salesreport,
    pdfDownload,
    downloadExcel,
    productOffer
}