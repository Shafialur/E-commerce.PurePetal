const user = require('../models/userModel')

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            next()
        } else {
            res.redirect('/')
        }

    } catch (error) {
        console.log(error.message)
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            const userData = await user.findOne({ _id: req.session.user_id }, { _id: 0, is_block: 1 })
            if (userData.is_block == 0) {
                res.redirect('/home')
            }else{
                next()
            }
        }
        else{
            next()
        }
        
    } catch (error) {
        console.log(error.message)
    }
}
const isLoginpage = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            const userData = await user.findOne({ _id: req.session.user_id }, { _id: 0, is_block: 1 })
            if (userData.is_block == 0) {
                next()
            } else {
                res.redirect('/login')

            }
        } else {
            res.redirect('/login')
        }

    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    isLogin,
    isLogout,
    isLoginpage
}