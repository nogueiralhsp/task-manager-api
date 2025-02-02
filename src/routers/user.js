const express = require ('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router = new express.Router()




//creates new user
router.post ('/users', async (req,res)=>{
     const user = new User (req.body)

     try{
          await user.save()
          sendWelcomeEmail(user.email, user.name)
          const token = await user.generateAuthToken()
          res.status(201).send({user,token})
     }catch(e){
          res.status(400).send()
     }
     
     //used to be
     // user.save().then(()=>{
     //      res.status(201).send(user)
     // }).catch((e)=>{
     //      res.status(400).send(e)
     // })
     
})

//login user
router.post('/users/login', async (req, res) => {
     try {
         
         const user = await User.findByCredentials(req.body.email, req.body.password)
         const token = await user.generateAuthToken()
        
         res.send({ user, token })
     } catch (e) {
         res.status(400).send('Credentials do not match')
     }
 })

//logout user
router.post('/users/logout', auth, async(req, res)=> {
     try {
          req.user.tokens = req.user.tokens.filter((token) =>{
               return token.token !== req.token
          })
          await req.user.save()

          res.status(200).send()
     } catch (e) {
          res.status(500).send()
     }
})

//logout from all devices, clear all tokens
router.post('/users/logoutAll', auth, async(req, res)=> {
     try {
          req.user.tokens = []
          await req.user.save()

          res.status(200).send()
     } catch (e) {
          res.status(500).send()
     }
})


// //read all the users in the DB
// router.get('/users', auth, async (req,res)=>{
     
//      try {
//           const users = await User.find()
//           res.send(users)
//      } catch (e) {
//           res.status(500).send()
//      }
     
//      // Used to be
//      // User.find({}).then((users)=> {
//      //      res.send(users)
//      // }).catch((e)=>{
//      //      res.status(500).send()
//      // })
// })

//profile request
router.get('/users/me', auth, async(req,res) => {
     res.send(req.user)
})


// //returns id by id
// router.get('/users/:id', async (req, res)=>{
//      const _id = req.params.id

//      try {
//           const user = await User.findById(_id)
//           if (!user) {
//                return res.status(404).send()
//           }
//           res.send(user)
//      } catch (e) {
//           res.status(500).send()
//      }
 
//           // Used to be
//      // User.findById(_id).then((user)=>{
//      //      if (!user){
//      //           return res.status(404).send()const express = require ('express')
// })

// updates user info
router.patch('/users/me', auth, async (req,res) =>{

     //***now that we are using auth middleware, we have available req.user***//

     const updates = Object.keys(req.body) //creates "updates" array with the key words from req.body
     const allowedUpdates = ['name','email','password','age'] //the alloweds property to update
     const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

     if (!isValidOperation) {
          return res.status(400).send({error:'invalid updates!'})
     }
     try {
          updates.forEach((update) =>req.user[update] = req.body[update]) 
          await req.user.save()
          res.send(req.user)
     } catch (e) {
          res.status(400).send(e)
     }
})

router.delete('/users/me', auth, async (req,res)=>{
     try {
          await req.user.remove()
          sendCancelationEmail(req.user.email, req.user.name)
          res.send(req.user)
     } catch (e) {
          res.status(500).send(e)
     }
})


const upload = multer({
     //dest:'avatars', => Used to used that to save on projects folders
     limits:{
          fileSize:1000000
     },
     fileFilter(req, file, cb){
          if(!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png)$/)){ //!!!Regular expression!!!
               return cb(new Error('Unsuported file type. Please upload an image file'))
          }

          cb(undefined, true)
     }
    
})

// uploading avatar
router.post('/users/me/avatar', auth, upload.single('avatar'),async (req, res) =>{
     const buffer = await sharp (req.file.buffer).resize({width:250, height: 250}).png().toBuffer()
     req.user.avatar = buffer
     await req.user.save()
     res.send()

},(error, req, res, next)=>{
     res.status(400).send({error: error.message})
})

//deleting avatar
router.delete('/users/me/avatar', auth, async (req, res) =>{
     req.user.avatar = undefined
     await req.user.save()
     res.send()
})

router.get('/users/:id/avatar', async(req, res)=>{
     
     console.log('test')
     try {
          
          const user = await User.findById(req.params.id)

          if (!user || !user.avatar) {
               throw new Error()
          }

          res.set('Content-Type','image/png')
          res.send(user.avatar)
     } catch (e) {
          res.status(404).send()
     }
})

module.exports = router