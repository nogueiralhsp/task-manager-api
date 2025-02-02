const express = require ('express')
const Task = require('../models/task')
const User = require('../models/user')
const auth = require('../middleware/auth')

const router = new express.Router()

router.post ('/tasks',auth, async (req,res)=>{
     //const task = new Task (req.body)

     const task = new Task({
          ...req.body,
          owner: req.user._id
     })

     try {
          await task.save()
          res.status(201).send(task)
     } catch (e) {
          res.status(400).send()
     }
 
      // Used to be
     // task.save().then(()=>{
     //      res.status(201).send(task)
     // }).catch((e)=>{
     //      res.status(400).send(e)
     // })
})

router.patch('/tasks/:id', auth, async (req,res) =>{
     
     const updates = Object.keys(req.body)
     const allowedUpdates = ['completed','description']
     const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

     if (!isValidOperation) {
          return res.status(400).send({error:'invalid updates!'}) 
          
     }

     try {
          const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

          if (!task) {
               return res.status(404).send({error:'task not found'})
          }
          
          updates.forEach((update) => task[update] = req.body[update])
          await task.save()
          res.send(task)
     } catch (e) {
          res.status(400).send(e)
     }
})

// Route for finding task by ID
router.get('/tasks/:id', auth, async (req, res)=>{
     const _id = req.params.id

     try {
          const task = await Task.findOne({_id, owner: req.user._id})
          
          
          // Where:
          // _id = is the id of the task we are looking for
          // owner = is the id of the user that created the task


          if (!task) {
               return res.status(404).send()
          }
          res.send(task)

     } catch (e) {
          res.status(500).send()
     }

     // Used to be
     // Task.findById(_id).then((task)=>{
     //      if(!task){
     //           return res.status(404).send()
     //      }

     //      res.send(task)

     // }).catch((e)=>{
     //      res.status(500).send()
     // })
})


// GET/tasks?completed=true
// GET/tasks?limit=10&skip=20
// GET/tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res)=>{
     const match = {}
     const sort = {}

     if (req.query.completed) {
          match.completed = req.query.completed === 'true'
     }

     if(req.query.sortBy){
          const parts = req.query.sortBy.split(':')
          sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
     }

     try {
          // const user = await User.findById(req.user._id)
          await req.user.populate({
               path: 'tasks',
               match,
               options:{
                    limit: parseInt(req.query.limit),
                    skip: parseInt(req.query.skip),
                    sort
               }
          }).execPopulate()
          res.status(200).send(req.user.tasks)
     } catch (e) {
          res.status(500).send()
     }

     // Used to be
     // Task.find().then((tasks)=>{
     //      res.send(tasks)
     // }).catch((e)=>{
     //      res.status(500).send()
     // })
})

router.delete('/tasks/:id', auth, async (req,res) =>{
     try {
          // const task = await Task.findByIdAndDelete(req.params.id)
          const task = await Task.findOneAndDelete ({ _id: req.params.id, owner: req.user._id })

          if (!task) {
               return res.status(404).send({error:'task not found'})
          }
          
          res.send(task)
     } catch (e) {
          res.status(500).send()
     }
})

module.exports = router