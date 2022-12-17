const express=require('express')
const services=require('../controller/render')
const store=require('../middleware/multer');
const { route } = require('./userRouter');

const router=express.Router();


router.get('/admin_panel',services.adminLoggedIn ,services.adminPanel)
router.get('/admin_logout', services.adminLogout)

router.get('/admin_login',services.adminLoggedOut,services.adminLogin)
router.post('/admin_login',services.adminSignIn)

router.get('/user-management',services.adminLoggedIn,services.adminUsers)

router.get('/admin-coupon',services.adminLoggedIn,services.adminCoupon)
router.post('/add-coupon',services.addCoupon)
router.post('/delete-coupon',services.deleteCoupon)

router.post('/admin_panel/user-management/block',services.userBlock)
router.post('/admin_panel/user-management/unblock',services.userUnblock)

router.get('/admin-category',services.adminLoggedIn,services.adminCategory)
router.post('/admin-category',services.addCategory)
router.get('/category-delete',services.categoryDelete)

router.get('/admin-orders',services.adminLoggedIn,services.adminOrders)
router.get('/view-orders',services.adminLoggedIn,services.viewOrders)
router.get('/order-accept',services.orderAccept)
router.get('/order-cancel',services.orderCancel)
router.get('/order-processed',services.orderProcessed)
router.get('/order-shipped',services.orderShipped)

router.post('/test', services.test)

router.get('/admin/exportExcel',services.exportExcel)

router.get('/admin-products',services.adminLoggedIn,services.adminProducts)
router.get('/add-products',services.adminLoggedIn,services.addProducts)

router.post('/admin_panel/add-product',store.any(),services.addProduct)
router.post('/admin_panel/add-product/update',store.any(),services.updateProduct)
router.get('/admin_panel/edit-product',services.editProduct)
router.get('/admin_panel/delete-product',services.deleteProduct)


module.exports = router;