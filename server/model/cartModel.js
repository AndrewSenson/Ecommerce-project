const mongoose = require('mongoose')
const {ObjectId}=require('bson')


const Schema = mongoose.Schema

const cartSchema = new Schema({
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
    orderStatus : {
        type : String,
        required : true
    }

   }],
   bill : {
    type : Number,
    required : true,
    default : 0
   },
   address : {
    
   }
},{timestamps:true})

const Cart = mongoose.model('Cart',cartSchema)
module.exports = Cart