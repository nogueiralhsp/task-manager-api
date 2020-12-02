const chalk = require('chalk')
const express = require ('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

console.log(process.env.PORT);

app.listen (port, ()=>{
     
     console.log(chalk.yellowBright('Server is up on port ' + port))   

})