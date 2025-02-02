const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const {nonUser, userOneId, userOne, setupDatabase} = require ('./fixtures/db')

beforeEach(setupDatabase)

test('Should signup a new user', async () => {
    const response = await request(app).post('/users').send({
        name:'Henrique',
        email:'henrique@example.com',
        password:'Greentest'
    }).expect(201)

    // Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Henrique',
            email: 'henrique@example.com'
        },
        token: user.tokens[0].token
    })
    expect(user.password).not.toBe('Greentest')
})

test ('Should login existing user', async() => {
    const response = await request(app)
        .post('/users/login')
        .send({
            email: userOne.email,
            password: userOne.password
        }).expect(200)

    //Fetch the user from the database
    const user = await User.findById(response.body.user._id)
    expect(response.body.token).toBe(user.tokens[1].token)
    
})

test ('Should not login nonexistent user', async() => {
    await request(app)
        .post('/users/login')
        .send({
            email: nonUser.email,
            password: nonUser.password
        }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
      //we use set to set up headers for authentication, or in our case authorization pathern
      //see middleware/auth.js for understanding. 
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for user', async() => {
    await request(app)
        .delete('/users/me')
      //we use set to set up headers for authentication, or in our case authorization pathern
      //see middleware/auth.js for understanding. 
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    //validating user was removed
    const user = await User.findById(userOne._id)
    expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async() => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

test('Should upload avatar image', async() => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar','tests/fixtures/profile-pic.jpg')
        .expect(200)
        
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test ('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Kelen',
            email: 'kelen@example.com'
        })
        .expect(200)
        const user = await User.findById(userOneId)
        expect(user.name).toEqual('Kelen')
})

test ('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'taubate',
            eail: 'kelen@example.com'
        })
        .expect(400)
})



//
// User Test Ideas
//
// Should not signup user with invalid name/email/password
// Should not update user if unauthenticated
// Should not update user with invalid name/email/password
// Should not delete user if unauthenticated