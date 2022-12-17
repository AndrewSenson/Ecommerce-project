const mongoose = require('mongoose');

const Schema =mongoose.Schema

const AdminSchema = new Schema({
    name:{
        type:String,
        required: true
    },
    password:{
        type:String,
        required:true
    }
},{timestamps : true})

const Admin=mongoose.model('Admin',AdminSchema);
module.exports=Admin 
