const mongoose = require('mongoose');

const Schema =mongoose.Schema

const CategorySchema = new Schema({
        category :{
            type : String,
            default : "category"
        }
},{timestamps : true})

const Category=mongoose.model('Category',CategorySchema);
module.exports=Category
