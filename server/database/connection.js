const mongoose =require('mongoose')

module.exports={
    connectToDb:(cb)=>{
        mongoose.connect(process.env.PORT,{
    usenewurlparser: true,
    useunifiedtopology: true,
  })
        .then(()=>{console.log("connected to db")
        return cb()

        })
        .catch((err)=>{
            console.log(err)
            return cb(err)
        })
    }
}
