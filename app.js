const express=require('express')
const db=require('./server/database/connection')
const dotenv=require('dotenv')


const adminRouter=require('./server/routes/adminRouter')
const userRouter=require('./server/routes/userRouter')

const app = express();
const sessions=require('express-session')
app.use(express.static('public'))

dotenv.config({path:"config.env"})
const PORT=process.env.PORT || 8080

app.set('view engine','ejs')
app.use(express.urlencoded({extended:false}))

//session
app.use(sessions({
    secret : 'verygoodpassword',
    resave : false,
    saveUninitialized : true,
    cookie : {maxAge: 6000000}
}))

app.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
      next();
    });

db.connectToDb((err)=>{
    if(!err){
        app.listen(PORT,()=>{
    console.log(`listening to port ${PORT}`)
        })
    }
})


app.use(adminRouter)
app.use(userRouter)


app.use(function(req,res){
    res.status(404).render('user/404.ejs');
});