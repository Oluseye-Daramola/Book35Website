require('dotenv').config(); 
const { sendWelcomeEmail } = require('../Services/emailService'); 
sendWelcomeEmail({ toEmail: 'daramolaoluseye22@gmail.com', name: 'Test User', businessName: 'Test Business' })
.then((result) => console.log('Sent:', result)) 
.catch((err) => console.error('Failed:', err));