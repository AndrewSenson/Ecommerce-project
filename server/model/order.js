const mongoose = require('mongoose')
const {ObjectId}=require('bson')


const Schema = mongoose.Schema

const orderSchema = new Schema({
   owner : {
    type: String,
    required : true
   },
   items : [{
    itemId :{
        type : ObjectId,
        required : true
    },
    productName : {
        type : String,
        required : true
    },
    quantity : {
        type : Number,
        required : true,
        min : 1,
        default : 1
    },
    price : {
        type : Number,
        required : true
    },
    category : {
        type : String,
        required : true
    },
    image1 :{
        type : String,
        required : true
    },
    orderStatus: {
        type : String,
        default : "none"
   }

   }],
   address :{
    name : { type : String },
    mobile : { type : Number },
    address1 : { type : String},
    address2 : { type : String},
    city : { type : String },
    state : { type : String },
    zip : { type : Number } 
   },
   cartBill : {
    type : Number,
    required : true,
    default : 0
   },
   orderBill : {
    type : Number,
    required : true,
    default : 0
   },
   paymentMethod :{
    type : String,
    required : true
   },
   orderDate : {
        type : Date,
   },
   couponCode : {
         type : String
   } ,
   couponValue : {
    type : String 
   }

   
},{timestamps:true})

const Order = mongoose.model('Order',orderSchema)
module.exports = Order