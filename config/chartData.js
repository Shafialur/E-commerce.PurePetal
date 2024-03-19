const Order = require('../models/ordersModel')

const getDailyDataArray = async () => {
    // Weekly data
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    const dailyOrders = await Order.aggregate([
        {
            $match: {
                orderstatus: "Delivered",
                date: { $gte: sevenDaysAgo, $lte: currentDate },
            },
        },
        {
            $group: {
                _id: { $dayOfWeek: "$date" },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);
    
    const dayNames = [
        "Sunday",    // Sunday corresponds to index 0
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    const dailyDataArray = [];
    // Start with Sunday
    for (let i = 0; i < 7; i++) {
        const foundDay = dailyOrders.find(order => order._id === i + 1);
        const count = foundDay ? foundDay.count : 0;
        const dayName = dayNames[i];
        dailyDataArray.push({ day: dayName, count });
    }

    return dailyDataArray;
};

const getMonthlyDataArray = async () => {
    // Monthly Data
    const currentDate = new Date();
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 12);

    const monthlyOrders = await Order.aggregate([
        {
            $match: {
                orderstatus: "Delivered",
                date: { $gte: sevenMonthsAgo, $lte: currentDate },
            },
        },
        {
            $group: {
                _id: { $month: "$date" },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const monthlyDataArray = [];
    // Start with January
    for (let i = 0; i < 12; i++) {
        const foundMonth = monthlyOrders.find(order => order._id === i + 1);
        const count = foundMonth ? foundMonth.count : 0;
        const monthName = monthNames[i];
        monthlyDataArray.push({ month: monthName, count });
    }

    return monthlyDataArray;
};

  
//Yearly data
const getYearlyDataArray = async () => {
    const currentDate = new Date();
    const sevenYearsAgo = new Date(currentDate);
    sevenYearsAgo.setFullYear(currentDate.getFullYear() - 7);
  
    const yearlyOrders = await Order.aggregate([
      {
        $match: {
          orderstatus: "Delivered" ,
          date: { $gte: sevenYearsAgo, $lte: currentDate },
        },
      },
      {
        $group: {
          _id: { $year: "$date" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
  
    const yearlyDataArray = [];
    for (let i = 6; i >= 0; i--) {
      const year = currentDate.getFullYear() - i;
  
      const foundYear = yearlyOrders.find((order) => order._id === year);
      const count = foundYear ? foundYear.count : 0;
      yearlyDataArray.push({ year, count });
    }
  
    return yearlyDataArray;
  };
  
  module.exports = { getMonthlyDataArray, getDailyDataArray, getYearlyDataArray }