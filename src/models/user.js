const mongoose = require('mongoose')
const validator = require ('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require ('./task')

//creating user model Schema
const userSchema = new mongoose.Schema({
     name:{
          type: String,
          required: true,
          trim: true
     },
     email: {
          type : String,
          unique: true,
          require: true,
          trim: true,
          lowercase: true,
          validate(value){
               if (!validator.isEmail(value)){
                    throw new Error('Email is invalid\n')
               }
          }
     },
     password:{
          type: String,
          required: true,
          minlength: 7,
          trim: true,
          validate(value){
               if(validator.contains(value.toLowerCase(),'password')){
                    throw new Error("the word password can't be used.\n")
               }
          }
     },
     age: {
          type: Number,
          default: 0,
          validate(value){
               if (value < 0) {
                    throw new Error ('Age must be a positive number\n')
               }
          }

     },
     tokens: [{ // an array of tokens so if an user logout of in a device it keeps logged in on another devices
          token: {
               type: String,
               required: true
          }
     }],
     avatar:{
          type: Buffer
     }
},{
     timestamps: true
})

userSchema.virtual('tasks',{
     ref:'Task',
     localField:'_id',
     foreignField:'owner'
})

//this line "clears" the user schema before sending anytime.
//it removes any info which we want to keep out and or safe
userSchema.methods.toJSON = function () {
     const user = this
     const userObject = user.toObject()

     delete userObject.password
     delete userObject.tokens     
     delete userObject.avatar
     
     return userObject
}

userSchema.methods.generateAuthToken = async function () {
     const user = this
     const token = jwt.sign({ _id: user._id.toString() },process.env.JWT_SECRET)
     
     user.tokens = user.tokens.concat({token})
     await user.save()

     return token
 }

userSchema.statics.findByCredentials = async (email, password) =>{
     
     const user = await User.findOne({email})

     if (!user) {
          throw new Error ('Unable to login')

     }

     const isMatch = await bcrypt.compare(password, user.password)

     if (!isMatch) {
          throw new Error('Unable to login')
     } 

     return user
}

//Hash the plain text password
userSchema.pre('save', async function (next){
     const user = this

     //check if password is modified and hash it before store to db
     if (user.isModified('password')) {
          user.password = await bcrypt.hash(user.password, 8)
     }
     next()
})

//Delete user tasks when user is removed
userSchema.pre('remove', async function(next){
     const user = this

     await Task.deleteMany({ owner: user._id })

     next()
})

//creating user model
const User = mongoose.model('User',userSchema)

module.exports = User