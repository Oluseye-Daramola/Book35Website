   require('dotenv').config();
   const { sendWelcomeEmail } = require('../Services/emailService');

   sendWelcomeEmail({
     toEmail: 'daramolaoluseye22@gmail.com', // an inbox you can check
     name: 'Test User',
     businessName: 'Test Agency',
   })
     .then((res) => console.log('Sent!', res))
     .catch((err) => console.error('Failed:', err.message));