const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGROD_API_KEY)

const sendWelcomeEmail = (email, name) => {
     sgMail.send({
          to: email,
          from: 'nogueiralhsp@gmail.com',
          subject:'Thanks for joining in!',
          text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
     })
}

const sendCancelationEmail = (email, name) => {
     sgMail.send({
          to: email,
          from: 'nogueiralhsp@gmail.com',
          subject:'Sorry to see you go!',
          text: `Your account has been delete, ${name}. \nWe are sorry to see you go, hope to see you back soon.\nHenrique App Team.`
     })
}

module.exports = {
     sendWelcomeEmail,
     sendCancelationEmail
}