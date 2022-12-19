const mongoose =require('mongoose')

module.exports={
    connectToDb:(cb)=>{
        mongoose.connect(process.env.PORT)
        .then(()=>{console.log("connected to db")
        return cb()

        })
        .catch((err)=>{
            console.log(err)
            return cb(err)
        })
    }
}
