const User = require('../model/userModel');
const Admin=require('../model/adminModel');
const Product=require('../model/productModel');
const Cart=require('../model/cartModel');
const CartProduct=require('../model/cart')
const otp=require('../middleware/otp')
const Razorpay = require('razorpay');
const Order = require('../model/order')
const {ObjectId}=require('bson');
const Wishlist = require('../model/wishlistModel');
const Category = require('../model/category');
const Coupon = require('../model/couponModel');
const Paypal = require('paypal-rest-sdk')
const orderHelpers = require('../helpers/order-helpers');
const cart = require('../model/cart');
const excelJs = require('exceljs');

let session;
let validation={
    category : false,
    coupon : false,
    couponUser : false,
    couponExpiry : false,
    couponMin : false,
    couponSuccess : false
}


exports.loginRouter=(req,res)=>{
    res.render('user/login')
}


exports.otpVerification = (req,res)=>{
    if(req.session.otplogin){
        res.redirect('/user_home')
    }else{
        res.render('user/mobile-verification')

    }
}

exports.otpVerify =(req,res)=>{
    if(req.session.otplogin){
        res.redirect('/user_home')
    }else{
        res.render('user/otp-verify')
    }
}
exports.sendOtp =(req,res)=>{
    
    User.findOne({mobile : req.body.mobile})
        .then((user)=>{
            if(user){
                req.session.mobileNumber=req.body.mobile
                otp.sendOtp(req.body.mobile)
                res.redirect('/user_otp_verify')
            }else{
                res.redirect('/')
            }

        })
}
exports.verifyOtp=(req,res)=>{
    let otpObject=req.body
    otp.veriOtp(otpObject.otp,req.session.mobileNumber)
        .then((verify)=>{
            if(verify){
                User.findOne({mobile : req.session.mobileNumber})
                    .then((user)=>{
                        req.session.userId=user.email   
                        req.session.otplogin = true
                        res.redirect('/user_home')
                    })
            }else{
                res.redirect('/verifyOtp?otp=false')
            }
        })
        .catch((err)=>{
            console.log(err)
        })

}

exports.signup=(req,res)=>{
if(req.body.password === req.body.confirmPassword){
    let userEmail=req.body.email
   User.findOne({email:userEmail})
    .then((result)=>{
        if(result){
      
            res.redirect('/user_signup?userExist=true')
        }else{
          
            const userData=new User(req.body)
            userData.blockStatus=false;
            userData.save()
            .then(()=>{
                res.redirect('/user_login')
            })
            .catch((err)=>{
                console.log(err)
                res.redirect('/user_signup')
            })
        }
    })
   
    
}else{
    
    res.redirect('/user_signup?confirmPassword=false')
}
}

exports.login=(req,res)=>{
    const loginData=req.body
    User.findOne({email:loginData.email,password:loginData.password,blockStatus:false})
    .then((result)=>{
        if(result){
            session=req.session
            session.userId=loginData.email
            res.redirect('/user_home') 
        }else{
            User.findOne({email:loginData.email})
            .then((result)=>{
                if(result){
                    if(result.blockStatus){
                        res.redirect('/user_login?blockStatus=true')
                    }else{
                        res.redirect('/user_login?pass=false')
                    }    
                }else{
                    res.redirect('/user_login?register=false')
                }
            })
        }
       
    })
    .catch((err)=>{
        console.log(err)
    })
}



module.exports.userSignup=(req,res)=>{
    let response={
        confirmPassErr:req.query.confirmPassword,
        confirmPassErrMsg:"The passwords not matching!!!",
        userExistErr:req.query.userExist,
        userExistErrMsg:"This user is already registered"

    } 
            res.render('user/signup',{response})
  
}

exports.userLogin=(req,res)=>{
    let response={
        blockStatusErr:req.query.blockStatus,
        blockStatusErrMsg:"You were blocked by the admin!!!",
        passErr:req.query.pass,
        passErrMsg:"Incorrect password",
        registerErr:req.query.register,
        registerErrMsg: "User not registered"

    }
  
   
        res.render('user/login',{response})
    // }
}


exports.isLoggedIn = (req,res,next)=>{
    session = req.session
    if(session.userId){
        next();
    }else
    res.redirect('/user_login');
}

exports.isLoggedOut = (req,res,next)=>{
    session = req.session
    if(!session.userId){
        next();
    }else
    res.redirect('/user_home')
}

exports.adminLoggedIn = (req,res,next)=>{
    session = req.session
    if(session.adminId){
        next();
    }else
    res.redirect('/admin_login');
}

exports.adminLoggedOut = (req,res,next)=>{
    session = req.session
    if(!session.adminId){
        next();
    }else
    res.redirect('/admin_panel')
}
 

exports.userHome=(req,res)=>{
    Cart.find()
        .then((cart)=>{
            Category.find()
            .then((category)=>{
            //   console.log(cart[0].items.length);
                res.render('user/home',{category,cart})
            }).catch((err)=>{
                console.log(err);
            })
        })
   
    
}

exports.logout=(req,res)=>{

    req.session.userId=""
    req.session.otplogin=""
    req.session.mobileNumber=""
  

    res.redirect('/user_login')
}

exports.userCart=(req,res)=>{
    let user=req.session.userId
    Category.find()
            .then((category)=>{
                Cart.findOne({owner:user })
                .then((result)=>{
                    if(result){
                        res.render('user/cart',{result,category})
                        
                    }else{
                        res.render('user/cart',{result:{items:[]},category,validation})
                        validation.couponUser=false;
                        validation.couponExpiry=false;
                    }
        
                })
                .catch((err)=>{
                    console.log(err)
                })
            })
   
}
exports.cartPage=(req,res)=>{
    let session = req.session 
    let user = session.userId

        
    Cart.findOne({ owner : user})
            .then((result)=>{
                if(result){
                    Cart.findOne({"items.itemId" : req.query.id})
                        .then((oldCart)=>{
                            if(oldCart){
                                let cart = new CartProduct(oldCart);
                                let cartItem =cart.add(req.query.id)
                                cartItem.then((cartItem)=>{
                                    let newCart = oldCart;
                                    
                                    let indexOfOldItem = 0;
                                   
                                    for(let i=0; i<newCart.items.length; i++){
                                        if(req.query.id.includes(newCart.items[i].itemId)){
                                            indexOfOldItem = i;
                                            break;
                                        }
                                    }
                                    newCart.items.splice(indexOfOldItem, 1, cartItem[0]);
                                    Cart.replaceOne({owner : oldCart.owner},{
                                        owner : newCart.owner,
                                        items : newCart.items,
                                        bill : cart.bill
                                    })
                                    .then(()=>res.redirect('/user_shop'))
                                })
                            }else{
                                Product.findOne({ _id :req.query.id})
                                        .then((product)=>{
                                            let newCartItem = {
                                                itemId : product._id,
                                                productName : product.productName,
                                                quantity : 1,
                                                price : product.price,
                                                category : product.category,
                                                image1 : product.image1,
                                                orderStatus : "none"
                                            }
                                            let newCart = result;
                                            newCart.items.push(newCartItem)
                                            totalBill = +newCart.bill + +newCartItem.price
                                            newCart.bill = totalBill;
                                            Cart.replaceOne({owner : user},{
                                                owner : newCart.owner,
                                                items : newCart.items,
                                                bill : newCart.bill
                                            })
                                                .then(()=>res.redirect('/user_shop'))
                                        })
                            }
                        })
                    }else{
                        Product.findOne({_id : ObjectId(req.query.id)})
                                .then((product)=>{
                                    let cart =new Cart({
                                        owner : user,
                                        items : [{
                                            itemId : product._id,
                                            productName : product.productName,
                                            quantity : 1,
                                            price : product.price,
                                            category : product.category,
                                            image1 : product.image1,
                                            orderStatus : "none"
                                        }]
                                    })
                                    cart.bill =cart.items[0].quantity * cart.items[0].price
                                    cart.save()
                                    .then(()=>res.redirect('/user_shop'))
                                })
                    }
                })
            }

exports.deleteCart=(req,res)=>{
    Cart.findOne({owner : req.session.userId})
        .then((result)=>{
            let indexOfOldItem = 0;
            for(let i=0;i<result.items.length;i++){
                if(req.query.id.includes(result.items[i].itemId)){
                    indexOfOldItem = i;  
                     break;
                }
            }
            
            
            let cartBill = +result.bill - +result.items[indexOfOldItem].price
            result.items.splice(indexOfOldItem,1);
            Cart.replaceOne({owner : result.owner},{
                owner : result.owner,
                items : result.items,
                bill : cartBill
            })
                .then(()=>{
                    Cart.findOne({ owner : req.session.userId})
                        .then((result)=>{
                            if(result.items.length < 1){
                                Cart.deleteOne({ owner : req.session.userId})
                                    .then(()=>{
                                       
                                        res.redirect('/user_cart')
                                    })
                            }else{
                                res.redirect('/user_cart')
                            }
                        })
                })
        })
}

exports.cartOperation=(req,res)=>{

    Cart.findOne({owner: req.session.userId})
        .then((oldCart)=>{
            
            let operations =(cartItem)=>{
                let newCart = oldCart

                let indexOfOldItem = 0;
                for(let i=0;i<newCart.items.length; i++){
                    if(req.query.id.includes(newCart.items[i].itemId)){
                        indexOfOldItem=i;
                        break;
                    }
                }
                if(cartItem[0].quantity > 0){
                    newCart.items.splice(indexOfOldItem,1,cartItem[0]);
                    Cart.replaceOne({owner : oldCart.owner},{
                        owner : newCart.owner,
                        items : newCart.items,
                        bill : cart.bill
                    })
                        .then(()=>{
                            res.redirect('/user_cart')
                        })
                }else{
                    newCart.items.splice(indexOfOldItem,1);
                    Cart.replaceOne({owner : oldCart.owner},{
                        owner : newCart.owner,
                        items : newCart.items,
                        bill : cart.bill
                    })
                        .then(()=>{
                            Cart.findOne({ owner : oldCart.owner})
                                .then((result)=>{
                                    if(result.items.length <1){
                                        Cart.deleteOne({owner : oldCart.owner})
                                            .then(()=>res.redirect('/user_cart'))
                                    }else{
                                        res.redirect('/user_cart')
                                    }
                                })
                        })
                }
            }
            let cart = new CartProduct(oldCart)
            if(req.query.add){
                let cartItem = cart.add(req.query.id)
                cartItem.then((cartItem)=>{
                    operations(cartItem);
                })  
            }else{
                let cartItem = cart.subtract(req.query.id)
                cartItem.then((cartItem)=>{
                    operations(cartItem);
                })
            }
        })
        
       
}



exports.userShop=(req,res)=>{
    req.session.coupon=''

 Category.find()
        .then((category)=>{
            Product.find()
            .then((result)=>{
                if(result)
                res.render('user/shop',{result,category})
            })
        })
     
}

exports.productView =(req,res)=>{
    const prodId=req.query.id

    Category.find()
            .then((category)=>{
                Product.findOne({_id:ObjectId(prodId)})
                .then((product)=>{
                    if(product){
                        res.render('user/productView',{product,category})
                    }else{
                        res.send('product view not found')
                    }
                })
            })

  
}

exports.userProfile=(req,res)=>{

    Category.find()
            .then((category)=>{
                User.findOne({email:req.session.userId})
                .then((user)=>{
                
                    res.render('user/myAccount',{user,category})
        
                })
                .catch((err)=>console.log(err))
            })

  
}

exports.applyCoupon=(req,res)=>{
    let coupons= req.body.applyCoupon.toUpperCase()
    // console.log(coupons);
    Cart.findOne({owner : req.session.userId})
        .then((cart) => {
          
            Coupon.findOne({couponCode : coupons})
            .then((coupon)=>{
              if(coupon){
                  console.log("coupon is valid")
                   Coupon.findOne({couponCode:coupons,users:req.session.userId})  
                          .then((coupon2)=>{
                              if(coupon2){
                                //   console.log(coupon2);
                                  validation.couponUser=true;
                                  // res.redirect('/user_cart')
                                  res.json({})
                              }else{
                                 if(coupon.couponExpiry >= Date.now()){
                                   if(coupon.minBill > cart.bill ){
                                     validation.couponMin = true;
                                      // res.redirect('/user_cart')
                                          res.json({})
  
                                  }else{
                                      req.session.coupon = coupon;
                                      console.log("ready to use");
                                      validation.couponSuccess = true;
                                      console.log(validation.couponSuccess);
                                      res.json({couponValue : coupon.couponValue, couponCode : coupon.couponCode})
                                  }
                                        
  
                                 }else{
                                  validation.couponExpiry=true;
                                          // res.redirect('/user_cart')
                                          res.json({})
                                 
                                 }
                                
                              }
                          })
  
              }else{
                  validation.coupon=true;
                  console.log('invalid coupon');
                  // res.redirect('/user_cart')
                  res.json({})
  
              }
            })

        })
    
}
//wishlist>>>>>>>>>>>>
exports.userWishlist=(req,res)=>{
    let user =req.session.userId

    Category.find()
            .then((category)=>{
                Wishlist.findOne({owner: user})
                .then((result)=>{
                    if(result){
                        res.render('user/wishlist',{result,category})
                    }else{
                        res.render('user/wishlist',{result:{items:[]},category})
                    }
                })
            })

   
    

}
exports.addToWishlist=(req,res)=>{


    const user=req.session.userId
    const from=req.query.from
    console.log(req.query.from);
    Wishlist.findOne({owner:user})
            .then((result)=>{
                if(result){
                   
                    Wishlist.findOne({'items.itemId':req.query.id})
                            .then((oldWishlist)=>{
                                if(oldWishlist){
                                    if(from==="shop"){
                                        res.redirect('/user_shop')
                                    }else{
                                        res.redirect('/user-category')
                                    }
                                    
                                }else{
                                    Product.findOne({_id : req.query.id})
                                            .then((product)=>{
                                                let newWishlistItem ={
                                                    itemId :req.query.id,
                                                    productName : product.productName,
                                                    category : product.category,
                                                    price : product.price,
                                                    image1 : product.image1
                                                }
                                                let newWishlist = result;
                                                newWishlist.items.push(newWishlistItem);

                                                Wishlist.replaceOne({owner:user},{
                                                    owner : newWishlist.owner,
                                                    items : newWishlist.items
                                                })
                                                        .then(()=>{
                                                            if(from==="shop"){
                                                                console.log("inside if");
                                                                res.redirect('/user_shop')
                                                            }else{
                                                                console.log("inside else");
                                                                res.redirect('/user-category')
                                                            }
                                                        })

                                                
                                            })
                                }
                            })
                }else{
                  

                    Product.findOne({_id :ObjectId(req.query.id) })
                            .then((product)=>{
                              
                                let wishlist = new Wishlist({
                                    owner : user,
                                    items :{
                                        itemId : product._id,
                                        productName : product.productName,
                                        category : product.category,
                                        price :product.price,
                                        image1 : product.image1
                                    }
                                })
                                wishlist.save()
                                        .then((result)=>{
                                            
                                            if(from==="shop"){
                                             
                                                res.redirect('/user_shop')
                                            }else{
                                                
                                                res.redirect('/user-category')
                                            }
                                        })
                            })
                }
            })
            .catch((err)=>console.log(err))

}
exports.deleteWishlist=(req,res)=>{
    Wishlist.findOne({owner:req.session.userId})
            .then((result)=>{
                let indexOfOldItem = 0;
                for(let i=0;i<result.items.length;i++){
                    if(req.query.id.includes(result.items[i].itemId)){
                        indexOfOldItem=i;
                        break;
                    }
                }
                result.items.splice(indexOfOldItem,1)
                Wishlist.replaceOne({owner:result.owner},{
                    owner : result.owner,
                    items : result.items
                })
                    .then(()=>{
                        res.redirect('/user-wishlist-page')
                    })

                        })
}
exports.checkout=(req,res)=>{
    Cart.find()
        .then((cartItems) => {
            console.log(cartItems.length)
            if(cartItems.length){
                Category.find()
                .then((category)=>{
                    User.findOne({ email : req.session.userId })
                    .then((user) => {
                        Cart.findOne( { owner : req.session.userId })
                            .then((cart) => {
                                
                                // if(cart.items.length){
    
                                // }
                                let userAddress = user.address
                                if(cart) {
                                    if(user.address.length) {
                                        res.render('user/checkout', { cart, userAddress,category })
                                    }else{
                                        res.redirect('/cart/checkout/shipping/add-new-address?userAddress=false')
                                    }
                                }else
                                    if(user.address.length) {
                                        res.render('user/checkout', { cart : { items : [] }, userAddress , category})
                                    }else{
                                        res.redirect('/cart/checkout/shipping/add-new-address?userAddress=false')
                                    }
                            })
                    })
                })
            }else{
                res.redirect('/user_cart')
            }
       

        })
   
   
}

exports.addAddress=(req,res)=>{
    Category.find()
            .then((category)=>{
                Cart.findOne({ owner : req.session.userId })
                .then((cart) => {
                    let userAddress = req.query.userAddress ? true : false;
                    if(cart) {
                        if(userAddress) {
                            res.render('user/addAddress', { cart, userAddress,category })
                        }else{
                            res.render('user/addAddress', { cart,category })
                        }
                    }else{
                        res.render('user/addAddress', { cart : { items : [] }, userAddress,category })
                    }
                })
            })
 
}
exports.shipping=(req,res)=>{
    if(req.body.save) {
        User.findOne({ email : req.session.userId })
            .then((user) => {
                if(user.address) {
                    let updatedUser = user;
                    updatedUser.address.push({ 
                        name : req.body.name, 
                        mobile : req.body.mobile, 
                        address1 : req.body.address1, 
                        address2 : req.body.address2, 
                        city : req.body.city, 
                        state : req.body.state, 
                        zip : req.body.zip 
                    })
                    User.replaceOne({ email : req.session.userId }, updatedUser)
                        .then(() => {
                            res.redirect('/cart/checkout/shipping/add-new-address')
                        })
                }else {
                    let updatedUser = user;
                    updatedUser.address = [{ 
                        name : req.body.name, 
                        mobile : req.body.mobile, 
                        address1 : req.body.address1, 
                        address2 : req.body.address2, 
                        city : req.body.city, 
                        state : req.body.state, 
                        zip : req.body.zip 
                    }]
                    User.replaceOne({ email : req.session.userId }, updatedUser)
                        .then(() => {
                            res.send("updated");
                        })
                }
                
            })
    }else{
        let anonymousAddress = {
            name : req.body.name, 
            mobile : req.body.mobile, 
            address1 : req.body.address1, 
            address2 : req.body.address2, 
            city : req.body.city, 
            state : req.body.state, 
            zip : req.body.zip 
        }
        req.session.anonymousAddress = anonymousAddress
        res.redirect('/payment')
    }
}
//admin

exports.    adminLogin=(req,res)=>{
    let response={
        adminPassErr:req.query.pass,
        adminPassErrMsg:"Invalid password",
        adminRegisterErr:req.query.register,
        adminRegisterErrMsg:"Admin not found"
    }

    session=req.session
    if(session.adminId){
        res.render('admin/dashboard')
    }else{
        res.render('admin/login',{response})
    }
}
exports.adminPanel=(req,res)=>{
    res.render('admin/dashboard')
}

exports.adminLogout=(req,res)=>{
    req.session.destroy();
    res.redirect('/admin_login')
}

exports.adminSignIn=(req,res)=>{
    const loginData=req.body
    Admin.findOne({name:loginData.name,password:loginData.password})
    .then((result)=>{
        if(result){
            session=req.session
            session.adminId=loginData.name
        
            res.redirect('/admin_panel') 
        }else{
            Admin.findOne({name:loginData.name})
            .then((result)=>{
                if(result){
                    res.redirect("/admin_login?pass=false")
                }else{
                
                    res.redirect("/admin_login?register=false")
                }
            })
        }
       
    })
    .catch((err)=>{
        console.log(err)
    })
}

exports.adminUsers=(req,res)=>{
    User.find((err,users)=>{
        if(!err){
            res.render('admin/userManagement',{users})
        }
    })

}
exports.userBlock=(req,res)=>{
let blockId=req.query.id
User.updateOne({_id: ObjectId(blockId)},{$set:{blockStatus:true}})
    .then(()=>{
        
        req.session.userId=""
        res.redirect('/user-management')
    })
    .catch((err)=>{
        console.log(err)
    })

}

exports.userUnblock=(req,res)=>{
    let blockId=req.query.id
    User.updateOne({_id: ObjectId(blockId)},{$set:{blockStatus:false}})
        .then(()=>{
            res.redirect('/user-management')
        })
        .catch((err)=>{
            console.log(err)
        })
}

//user side category >>>>>>>>>>>
exports.userCategory=(req,res)=>{
    const category1 = req.query.cat
    // console.log(category1)
    Category.find()
    .then((category)=>{
        Product.find({category : category1})
               .then((result)=> {
                res.render("user/category",{category,result})
               })
    })

}

//Admin products>>>>>>>>>>>>>>>>>

exports.adminProducts=(req,res)=>{
    Product.find()
   
            .then((result)=>{
                let num=1
                if(result)
                res.render('admin/adminProducts',{result,num})
            })
   
}
exports.addProducts=(req,res)=>{
    Category.find()
            .then((category)=>{
                res.render('admin/addProducts',{prod:"",category})   
            })
    
}

exports.addProduct=(req,res,next)=>{
    const files = req.files;

    if(!files){
        const error = new Error('Please choose file')
        error.httpStatusCode = 400
        return next(error)
    }
    let productDetail=new Product({
        productName : req.body.productName,
        price : req.body.price,
        description : req.body.description,
        stock : req.body.stock,
        category: req.body.category,
        subCategory : req.body.subCategory,
        image1 : req.files[0] && req.files[0].filename ? req.files[0].filename:"",
        image2 : req.files[1] && req.files[1].filename ? req.files[1].filename:""
    })

    productDetail.save()
    .then(()=>{
        res.redirect('/add-products')
    })
    .catch(error=>{
        console.log(error)
    })
}


exports.editProduct=(req,res)=>{
    let prId =req.query.id
    Product.findOne({_id:ObjectId(prId)})
            .then((prod)=>{
                if(prod){
                    res.render('admin/addProducts',{prod})
                }
            })
}
//Admin orders >>>>>>>>>>>>>>>
exports.adminOrders=(req,res)=>{
    Order.find()
        .then((orders)=>{
         
            res.render('admin/adminOrders',{orders})

        })
}
exports.viewOrders=(req,res)=>{
    let orderId= req.query.id;
    Order.findOne({_id:ObjectId(orderId)})
        .then((order)=>{
            res.render('admin/orderView',{order})
        })
   
}
exports.orderAccept=(req,res)=>{
    let itemId=req.query.id;
    let orderId=req.query.orderId;

    Order.updateOne({_id:ObjectId(orderId),"items.itemId":itemId},{$set:{'items.$.orderStatus':'Approved'}})
        .then(()=>{
            res.redirect(`/view-orders?id=${orderId}`)
        })
        .catch((err)=>console.log(err))
}
exports.orderProcessed=(req,res)=>{
    let itemId=req.query.id;
    let orderId=req.query.orderId;

    Order.updateOne({_id:ObjectId(orderId),"items.itemId":itemId},{$set:{'items.$.orderStatus':'Shipped'}})
        .then(()=>{
            res.redirect(`/view-orders?id=${orderId}`)
        })
        .catch((err)=>console.log(err))
}
exports.orderShipped=(req,res)=>{
    let itemId=req.query.id;
    let orderId=req.query.orderId;

    Order.updateOne({_id:ObjectId(orderId),"items.itemId":itemId},{$set:{'items.$.orderStatus':'Delivered'}})
        .then(()=>{
            res.redirect(`/view-orders?id=${orderId}`)
        })
        .catch((err)=>console.log(err))
}
exports.orderCancel=(req,res)=>{
    let itemId=req.query.id;
    let orderId=req.query.orderId;

    Order.updateOne({_id:ObjectId(orderId),"items.itemId":itemId},{$set:{'items.$.orderStatus':'Vendor Cancelled'}})
        .then(()=>{
            res.redirect(`/view-orders?id=${orderId}`)
        })
        .catch((err)=>console.log(err))
}

//admin category>>>>>>>
exports.adminCategory=(req,res)=>{

    Category.find()
            .then((category)=>{
                res.render('admin/adminCategory',{category,validation})
             
                validation.category=false;
                console.log(validation.category);
            })
    
}
exports.addCategory=(req,res)=>{
    let newCategory=req.body.category;
    Category.findOne({category : newCategory})
            .then((result)=>{
                if(result){
                 validation.category=true
                    res.redirect('/admin-category')
                }else{
                   
                    let newCategory = new Category(
                        {
                            category : req.body.category
                        }
                    )
                    
                    newCategory.save()
                                .then(()=>{
                                    res.redirect('/admin-category')
                                })
                                .catch((err)=>console.log(err))

                }
            })
}
exports.categoryDelete=(req,res)=>{
   
    const category = req.query.catName
 
    Category.deleteOne({category : category})
            .then(()=>{
                res.redirect('/admin-category')
            })
}
//EDIT PRODUCT>>>>>>>

exports.updateProduct=(req,res)=>{
    let updateId=req.query.id

    
    
Product.updateOne({_id:ObjectId(updateId)},{$set:{
    productName : req.body.productName,
        price : req.body.price,
        description : req.body.description,
        stock : req.body.stock,
        category: req.body.category,
        subCategory : req.body.subCategory,
        image1 : req.files[0] && req.files[0].filename ? req.files[0].filename:"",
        image2 : req.files[1] && req.files[1].filename ? req.files[1].filename:""
}})
        .then(()=>{
            res.redirect('/admin-products')
})
        .catch((err)=>{
            console.log(err)
        })
}

//ADMIN COUPON>>>>>>>>>>>>
exports.adminCoupon=(req,res)=>{
        Coupon.find()
                .then((coupon)=>{
                    Coupon.updateMany({couponExpiry:{$lte: Date.now()}},{$set:{status:"Expired"}})
                           .then(()=>{
                            res.render('admin/coupon',{validation,coupon})
                            validation.coupon=false
                           })
                  
                })
                .catch((err)=>console.log(err))
      
}
exports.addCoupon=(req,res)=>{
    Coupon.findOne({couponCode : req.body.couponcode})
           .then((coupon)=>{
            if(coupon){
                
                validation.coupon=true;
                res.redirect('/admin-coupon')
            }else{
                
                let newCoupon = new Coupon({
                    couponCode : req.body.couponcode,
                    couponValue : req.body.couponvalue,
                    minBill : req.body.minbill,
                    couponExpiry : req.body.expirydate,
                    status : "Active"
                }) 
            
                newCoupon.save()
                res.redirect('/admin-coupon')
            }
           })
 
   
}

exports.deleteCoupon=(req,res)=>{
    Coupon.deleteOne({_id : req.query.id})
          .then(()=>{
            res.redirect('/admin-coupon')
          })    
}

//DELETE PRODUCT>>>>>>>>>>>

exports.deleteProduct=(req,res)=>{
    deleteId=req.query.id

    Product.deleteOne({_id:ObjectId(deleteId)})
    .then(()=>{
        res.redirect('/admin-products')
    })
    .catch((err)=>{
        console.log(err)
    })
}

//PAYMENT>>>>>>>

exports.paymentPage=(req,res)=>{

    Category.find()
            .then((category)=>{
                User.findOne({ email : req.session.userId })
                .then((user) => {
                    if(req.session.anonymousAddress){
                        userAddress = req.session.anonymousAddress
                        Cart.findOne({ owner : req.session.userId })
                            .then((cart) => {
                                if(cart) {                
                                    res.render('user/payment', { userAddress, cart,category,validation })
                                    validation.coupon=false;
                                    validation.couponUser=false;
                                    validation.couponExpiry=false;
                                    validation.couponMin=false;
                                    validation.couponSuccess=false;

                                }else{
                                    res.render('user/payment', { userAddress, cart : { items : [] },category,validation })
                                    validation.coupon=false;
                                    validation.couponUser=false;
                                    validation.couponExpiry=false;
                                    validation.couponMin=false;
                                    validation.couponSuccess=false;

                                }
                            })
                    }else {
                        userAddress = user.address[+req.query.index]
                        Cart.findOne({ owner : req.session.userId })
                            .then((cart) => {
                                if(cart) {
                                    res.render('user/payment', { userAddress, cart,category,validation })
                                    validation.coupon=false;
                                    validation.couponUser=false;
                                    validation.couponExpiry=false;
                                    validation.couponMin=false;
                                    validation.couponSuccess=false;

                                }else{
                                    res.render('user/payment', { userAddress, cart : { items : [] },category,validation })
                                    validation.coupon=false;
                                    validation.couponUser=false;
                                    validation.couponExpiry=false;
                                    validation.couponMin=false;
                                    validation.couponSuccess=false;

                                }
                            })
                    }
                })
            
            })
  
}

exports.payment = (req, res) => {

    let index = +req.body.selectedAddressIndex
    User.findOne({email:req.session.userId})
         .then((result)=>{
           let address=result.address[index]
            Cart.updateOne({owner:req.session.userId},{$set:{address:address}})
           .then(()=>{
               res.redirect(`/payment?index=${req.body.selectedAddressIndex}`)
           })
   })

    
}



exports.paymentSuccess =(req,res) => {

    const order = req.session.order
    const coupon = req.session.coupon
    const userId = req.session.userId

    order.items.forEach((items) =>{
        items.orderStatus = "processed"
    })

    orderHelpers.updateStock(order.items)
                .then(()=>{
                    console.log("stock updated");
                    return orderHelpers.createOrder(order)
                })
                .catch((err)=>{
                    console.log(err);
                })
                .then(() => {
                    console.log('order created');
                    return orderHelpers.couponUpdate(coupon,userId)
                })
                .catch((err) =>{
                    console.log(err);
                
                } )
                .then(()=>{
                    console.log('coupon updated');
                    return orderHelpers.deleteCart(userId)
                })
                .catch((err)=>{
                    console.log(err);
                })
                .then(()=>{

                    res.render('user/paymentSuccess')
                })
                .catch((err)=>{
                    console.log(err);
                })


}








exports.userPayment = (req,res) => {

    function createOrder(cart) {
            let newOrder={
                owner : cart.owner,
                items : cart.items,
                address : cart.address,
                cartbill : cart.bill,
                couponCode : coupon.couponCode || '',
                couponValue : coupon.couponValue || '',
                orderBill : orderBill || cart.bill,
                paymentMethod : paymentMethod,
                orderDate : new Date().toLocaleString('en-us',{ hour12: false })
            }
            req.session.order = newOrder;
            // console.log(req.session.order)
    }




    const userId = req.session.userId;
    const paymentMethod = req.body.paymentType
    const orderBill = req.body.Bill
    const coupon = req.session.coupon || {}


    orderHelpers.findCart(userId)
                .then((cart)=>{
                    if(paymentMethod === "cod"){
                        createOrder(cart)
                        res.json({codSuccess : true})
                    }else if(paymentMethod === "paypal"){
                        createOrder(cart)
                        res.json({paypal : true})
                    }else if(paymentMethod === "razorpay"){
                        createOrder(cart)
                        res.redirect('/razorpay')
                    }
                })
                .catch((err)=>{
                    console.log(err);
                })


}

exports.paypal = (req, res) => {
    let billAmount = Order.findOne({ owner : req.session.userId })
    .then((order) => {
       return order.orderBill;
    })
    billAmount.then((bill) => {
       bill = Math.round(+bill*0.01368)
       console.log(bill);
    
    Paypal.configure({
    'mode': 'sandbox', //sandbox or live 
    'client_id': 'AfsauzwbN-cCXnIfnjyh3rddzvTj0ne12oSF1QTF9sur1hOxnUS9_iO5an3ryu2eH_Nrkom51ir_o67H', 
    // please provide your client id here 
    'client_secret': 'EBK455UIa43pFnTvrelAcB7q53e5URMx6bGNEDwJMZB-gn_C7KERvCmuwdgDFYYFX5ZbXqOdGpdWdDsW' // provide your client secret here 
    });

    // create payment object 
    let payment = {
    "intent": "authorize",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": 'http://localhost:5050/payment-success',
        "cancel_url": "http://127.0.0.1:3000/err"
    },
    "transactions": [{
        "amount": {
            "total": `${+bill}`,
            "currency": "USD"
        },
        "description": " a book on mean stack "
    }]
    }

    let createPay = ( payment ) => {
    return new Promise( ( resolve , reject ) => {
        Paypal.payment.create( payment , function( err , payment ) {
            if ( err ) {
                reject(err); 
            }
        else {
            resolve(payment); 
        }
        }); 
    });
    }	

    // call the create Pay method 
    createPay( payment ) 
    .then( ( transaction ) => {
    console.log(transaction)
    var id = transaction.id; 
    var links = transaction.links;
    var counter = links.length; 
    while( counter -- ) {
        if ( links[counter].method == 'REDIRECT') {
            // console.log(transaction);
            // redirect to paypal where user approves the transaction 
            return res.redirect( links[counter].href )
        }
    }
    })
    .catch( ( err ) => { 
    console.log( err ); 
    res.redirect('/err');
    });


    })
}

exports.razorpay = (req, res) => {
    const bill = Cart.findOne({ owner : req.session.userId })
                     .then((cart) => {
                        return cart.bill
         })
    bill.then((totalBill) => {
        console.log(totalBill)
        const razorpay = new Razorpay({
            key_id : `${process.env.RAZORPAY_KEY_ID}`,
            key_secret : `${process.env.RAZORPAY_KEY_SECRET}`
        })
    
        let options = {
            amount: totalBill*100,  // amount in the smallest currency unit
            currency: "INR"
          };
          
          razorpay.orders.create(options, function(err, order) {
            console.log(order);
            res.json({ razorpay : true, order });
          });
    })
}



//User side order  >>>>>>

exports.userOrders=(req,res)=>{
    Category.find()
            .then((category)=>{
                Order.find()
                .then((orders)=>{
                    
                    res.render('user/userOrders',{orders,category})
                })
            })
   
    
}

exports.userViewItems=(req,res)=>{

    Category.find() 
            .then((category)=>{
                Order.findOne({_id:ObjectId(req.query.id)})
        .then((inOrder)=>{
            
            res.render('user/userViewItems',{inOrder,category})
        })
    
            })

    
}

exports.userOrderCancel=(req,res)=>{
    let itemId=req.query.id
    let orderId=req.query.orderId

    Order.updateOne({_id:ObjectId(orderId),"items.itemId":itemId},{$set:{"items.$.orderStatus":"User Cancelled"}})
        .then(()=>{
            res.redirect(`/user-viewItems?id=${orderId}`)
        })
        .catch((err)=>{
            console.log(err);
        })
}

//Admin dashboard >>>>>>>>>>>>>>>>>>>>>


  


exports.test = (req, res) => {

    const months = [
        january = [],
        february = [],
        march = [],
        april = [],
        may = [],
        june = [],
        july = [],
        august = [],
        september = [],
        october = [],
        november = [],
        december = []
    ]
    
    const quarters = [
        Q1 = [],
        Q2 = [],
        Q3 = [],
        Q4 = []
    ]

    const monthNum = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ]

    Order.find({ "items.orderStatus" : "Delivered" })
        .then((orders) => {
            console.log('xxx',orders);
            monthNum.forEach((month, monthIndex) => {
                orders.forEach((order, index) => {
                    if(order.orderDate.getMonth()+1 == monthIndex+1 ) {
                        months[monthIndex].push(order);
                    }
                })
            })//author:Andrew
            
            orders.forEach((order) => {
                if(order.orderDate.getMonth()+1 <= 3){
                    quarters[0].push(order)
                }else if(order.orderDate.getMonth()+1 > 3 && order.orderDate.getMonth()+1 <= 6){
                    quarters[1].push(order)
                }else if(order.orderDate.getMonth()+1 > 6 && order.orderDate.getMonth()+1 <= 9){
                    quarters[2].push(order)
                }else if(order.orderDate.getMonth()+1 >9 && order.orderDate.getMonth()+1 <= 12){
                    quarters[3].push(order)
                }
            })
            
            const monthlySalesTurnover = [];
            const quarterlySalesTurnover = [];
            months.forEach((month) => {
                let eachMonthTurnover = month.reduce((acc, curr) => {
                    acc += +curr.orderBill;
                    return acc;
                }, 0)
                monthlySalesTurnover.push(eachMonthTurnover);
            })

            quarters.forEach((quarter) => {
                let eachQuarterTurnover = quarter.reduce((acc, curr) => {
                    acc += curr.orderBill;
                    return acc;
                }, 0)
                quarterlySalesTurnover.push(eachQuarterTurnover)
            })

            let annualSales = orders.reduce((acc, curr) => {
                acc += curr.orderBill
                return acc;
            }, 0)

            console.log('monthlySalesTurnover:', monthlySalesTurnover);
            console.log('quarterlySalesTurnover:',quarterlySalesTurnover);
            console.log('annualSales:',annualSales);

            res.json({ salesOfTheYear : monthlySalesTurnover, quarterlySales : quarterlySalesTurnover, annualSales : annualSales })
        })
}

//Excel sheet

exports.exportExcel = (req,res) => {

    Order.find()
    .then((SalesReport)=>{
      
  
   console.log(SalesReport)
    try {
      const workbook = new excelJs.Workbook();
  
      const worksheet = workbook.addWorksheet("Sales Report");
  
      worksheet.columns = [
        { header: "S no.", key: "s_no" },
        { header: "OrderID", key: "_id" },
        { header: "Date", key: "orderDate" },
        { header: "Products", key: "productName" },
        { header: "Method", key: "paymentMethod" },
        // { header: "status", key: "status" },
        { header: "Amount", key: "orderBill" },
      ];
      let counter = 1;
      SalesReport.forEach((report) => {
        report.s_no = counter;
        report.productName = "";
        // report.name = report.userid;
        report.items.forEach((eachproduct) => {
          report.productName += eachproduct.productName + ", ";
        });
        worksheet.addRow(report);
        counter++;
      });
  
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });
      
  
      res.header(
        "Content-Type",
        "application/vnd.oppenxmlformats-officedocument.spreadsheatml.sheet"
      );
      res.header("Content-Disposition", "attachment; filename=report.xlsx");
  
      workbook.xlsx.write(res);
    } catch (err) {
      console.log(err.message);
    }
  });

}