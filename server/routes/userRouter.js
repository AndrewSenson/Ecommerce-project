const express=require('express')
const services=require('../controller/render')

const router=express.Router();
router.get('/', services.userHome)


router.get('/user_home', services.userHome)
router.get('/user_logout', services.logout)


router.get('/user_login',services.isLoggedOut,services.userLogin)
router.post('/user_login',services.login)


router.get('/user_otp_verification',services.isLoggedOut,services.otpVerification)
router.get('/user_otp_verify',services.otpVerify)
router.post('/user/send-otp',services.sendOtp)
router.post('/verify-Otp',services.verifyOtp)


router.get('/user_signup',services.isLoggedOut,services.userSignup)
router.post('/user_signup',services.signup)

router.get('/checkout',services.isLoggedIn, services.checkout)
router.get('/cart/checkout/shipping/add-new-address',services.isLoggedIn, services.addAddress);
router.post('/cart/checkout/shipping/add-new-address', services.shipping);

// router.post('/test', services.test)
router.get('/payment',services.isLoggedIn, services.paymentPage);
router.post('/payment', services.payment);
router.get('/payment-success',services.isLoggedIn,services.paymentSuccess)
router.post('/payment-success',services.userPayment)
router.get('/paypal',services.paypal)
router.get('/razorpay',services.razorpay)

router.get('/user_cart',services.isLoggedIn,services.userCart)
router.post('/user_cart',services.isLoggedIn,services.cartPage)
router.post('/cart-operation',services.cartOperation)
router.get('/user_cart/delete_cart',services.isLoggedIn,services.deleteCart)

router.get('/productView',services.productView)

router.get('/user-category',services.userCategory)

router.post('/apply-coupon',services.applyCoupon)

router.get('/user-orders',services.isLoggedIn,services.userOrders)
router.get('/user-viewItems',services.isLoggedIn,services.userViewItems)
router.get('/user-cancel-order',services.userOrderCancel)

router.get('/user_shop',services.userShop)
router.get('/user_profile',services.isLoggedIn,services.userProfile)
router.get('/user-wishlist-page',services.isLoggedIn,services.userWishlist)
router.get('/user-wishlist',services.isLoggedIn,services.addToWishlist)
router.get('/user-wishlist/delete-item',services.deleteWishlist)



module.exports = router;