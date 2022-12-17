const multer= require('multer')
const path= require('path')


let storage= multer.diskStorage({
    destination:function(req,files,cb){
        cb(null,'public/images')
    },
    filename:function(req,file,cb){
        let ext = path.extname(file.originalname)
        cb(null,file.fieldname +'-' +Date.now() + ext)
    }
})

store= multer({storage:storage})
module.exports=store