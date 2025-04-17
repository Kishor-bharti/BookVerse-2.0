const mysql = require('mysql');

// MySQL connection details
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '7517',
  database: 'USERS'
});

// Login controller
exports.login = (req, res) => {
  const { username, password } = req.body;

  // Query the database for the user
  connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      const user = results[0];

      // Compare the provided password with the stored password
      if (user.password === password) {
        // Login successful
        res.status(200).json({ message: 'Login successful' });
      } else {
        // Invalid password
        res.status(401).json({ message: 'Invalid username or password' });
      }
    } else {
      // User not found
      res.status(401).json({ message: 'Invalid username or password' });
    }
  });
};

// // Signup controller
// exports.signup = (req, res) => {
//   const { username, password } = req.body;

//   // Check if the username already exists
//   connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
//     if (err) throw err;

//     if (results.length > 0) {
//       // Username already exists
//       res.status(409).json({ message: 'Username already exists' });
//     } else {
//       // Insert the new user into the database
//       connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err, result) => {
//         if (err) throw err;

//         // Send a success response
//         res.status(201).json({ message: 'Sign-up successful' });
//       });
//     }
//   });
// };

// Signup controller
exports.signup = (req, res) => {
  const { username, password, mobile, email } = req.body;

  // Check if the username or email already exists
  connection.query(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [username, email],
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error occurred' });
      }

      if (results.length > 0) {
        // Check which field already exists
        const existingUser = results[0];
        if (existingUser.username === username) {
          return res.status(409).json({ message: 'Username already exists' });
        }
        if (existingUser.email === email) {
          return res.status(409).json({ message: 'Email already exists' });
        }
      }

      // Insert the new user into the database
      const query = `
        INSERT INTO users (username, password, mobile, email) 
        VALUES (?, ?, ?, ?)
      `;

      connection.query(
        query,
        [username, password, mobile, email],
        (err, result) => {
          if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ message: 'Error creating user' });
          }

          // Send a success response
          res.status(201).json({
            message: 'Sign-up successful',
            userId: result.insertId
          });
        }
      );
    }
  );
};