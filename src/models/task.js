const mongoose = require('mongoose')
const validator = require ('validator')
const chalk = require('chalk')


//creating task Schema
const taskSchema = new mongoose.Schema({
     description:{
          type: String,
          required: true,
          trim: true
     },
     completed:{
          type: Boolean,
          default: false
     },
     owner:{
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'User'
     }
},{
     timestamps: true
})

taskSchema.pre('save', async function (next){
     const task = this

     //console.log(chalk.red.bold('here on taskSchema.pre(save)'))
     next()
})

//Creating Task Model
const Task = mongoose.model('Task',taskSchema)


module.exports = Task