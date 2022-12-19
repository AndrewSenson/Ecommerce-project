const mongoose =require('mongoose')

module.exports={
    connectToDb:(cb)=>{
        mongoose.connect( 'mongodb+srv://andrewsenson:hfkn7H6Z8xcjp8vx@miniproject.odcszuk.mongodb.net/miniProject')
        .then(()=>{console.log("connected to db")
        return cb()

        })
        .catch((err)=>{
            console.log(err)
            return cb(err)
        })
    }
}
