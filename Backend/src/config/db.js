const mongoose = require('mongoose')

function ConnectDb(){
    mongoose.connect(process.env.MongoUri)
    .then(()=>{
        console.log("database Connected Successfully");
    })
    .catch((err)=>{
        console.log("error",err);
    })
}

module.exports=ConnectDb;