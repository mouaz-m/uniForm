var mongoose=require('mongoose');

const User = require ('./models/users');

mongoose.connect('mongodb://localhost:27017/k3ki', { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log("MONGO CONNECTION OPEN!!!")
})
.catch(err => {
  console.log("OH NO MONGO CONNECTION ERROR!!!!")
  console.log(err)
})

const p = new User ({
    firstName: "mouaz",
    lastName: "maatouk",
    email: "mouaz-m@hotmail.com",
    age: 12-05-1993
})

p.save().then(p => {
    console.log(p)
})
.catch(e => {
    console.log(e)
})