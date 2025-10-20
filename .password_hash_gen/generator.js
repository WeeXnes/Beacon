const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.log('Please provide a password as a command-line argument.');
    process.exit(1);
}

const saltRounds = 12;

bcrypt.hash(password, saltRounds)
    .then(hash => {
        console.log('Generated bcrypt hash:', hash);
    })
    .catch(err => {
        console.error('Error generating hash:', err);
    });
