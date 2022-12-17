const mongoose = require('mongoose')
const {ObjectId}=require('bson')


const Schema = mongoose.Schema

const wishlistSchema = new Schema({
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
    category : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    image1 :{
        type : String,
        required : true
    }

   }]
},{timestamps:true})

const Wishlist = mongoose.model('Wishlist',wishlistSchema)
module.exports = Wishlist