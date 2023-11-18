process.env.TZ = 'Asia/Makassar';
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
const port = 80;

const moment = require('moment-timezone');

// Serve login.html as the root page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Middlewares

app.use(express.json()); // This line is required for Express 4.16+ to parse JSON bodies
app.use(express.static('public'));

//MySQL connection
const connection = mysql.createConnection({
  host: 'jorgyaws.cd79jedmkciu.us-east-1.rds.amazonaws.com',
  user: 'root',
  password: 'root1234',
  database: 'jorgy_app'
});

// const connection = mysql.createConnection({
//   host: process.env.RDS_HOSTNAME,
//   user: process.env.RDS_USERNAME,
//   password: process.env.RDS_PASSWORD,
//   database: process.env.RDS_PORT,
// });


connection.query("SET time_zone = '+08:00';", (err, result) => {
  if (err) console.log(err);
  else console.log("Timezone set to UTC+8");
});



// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Validate the username and password with your database
  if (username === 'admin' && password === 'password') {
    // Successful login
    // Manage session state here (e.g., using express-session)
    // Redirect or send a success response
    res.json({ success: true, redirect: '/index.html' });
  } else {
    // Login failed
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      // handle error
      res.status(500).json({ message: 'Logout failed', error: err });
    } else {
      res.json({ success: true });
    }
  });
});




// Route to get all products
app.get('/api/products', (req, res) => {
  connection.query('SELECT * FROM product_information', (error, results) => {
    if (error) {
      return res.status(500).send('Error retrieving products: ' + error.message);
    }
    res.json(results);
  });
});


// Route to get all customers
app.get('/api/customers', (req, res) => {
    const query = 'SELECT * FROM customer_information';
    connection.query(query, (error, results) => {
      if (error) {
        return res.status(500).json({ message: 'Error retrieving customers: ' + error.message });
      }
      res.json(results);
    });
  });
  
  // Route to add a new customer
  app.post('/api/customers', (req, res) => {
    const { customer_name, address , customer_number  } = req.body;
    const query = 'INSERT INTO customer_information (customer_name, address) VALUES (?, ?)';
    connection.query(query, [customer_name, address , customer_number], (error, results) => {
      if (error) {
        return res.status(500).json({ message: 'Error adding customer: ' + error.message });
      }
      res.json({ message: 'Customer added successfully!', customerId: results.insertId });
    });
  });
  
  
  
  // Route to delete a customer
  app.delete('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM customer_information WHERE id = ?';
    connection.query(query, [id], (error, results) => {
      if (error) {
        return res.status(500).json({ message: 'Error deleting customer: ' + error.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Customer not found.' });
      }
      res.json({ message: 'Customer deleted successfully!' });
    });
  });

  // Route to get all products
app.get('/api/products', (req, res) => {
  connection.query('SELECT id, productName, productQuantity, productPrice, stockQuantity FROM product_information', (error, results) => {
    if (error) {
      return res.status(500).send('Error retrieving products: ' + error.message);
    }
    res.json(results);
  });
});
  
  


app.post('/api/add_product', (req, res) => {
    // Extract the product data from the request body
    const { productName, productQuantity, productPrice } = req.body;
  
    // Insert the new product into the database
    const query = 'INSERT INTO product_information (productName, productQuantity, productPrice) VALUES (?, ?, ?)';
    connection.query(query, [productName, productQuantity, productPrice], (error, results) => {
      if (error) {
        res.status(500).send('Error adding product: ' + error.message);
      } else {
        res.json({ message: 'Product added successfully!', productId: results.insertId });
      }
    });
});


app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM product_information WHERE id = ?';
    connection.query(query, [id], (error, results) => {
      if (error) {
        return res.status(500).json({ message: 'Error retrieving product: ' + error.message });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Product not found.' });
      }
      res.json(results[0]); // Send back the product as a JSON object
    });
  });

 
  
  // Route to update a product
app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { productName, productQuantity, productPrice } = req.body;
  
    const query = `
      UPDATE product_information 
      SET productName = ?, productQuantity = ?, productPrice = ?
      WHERE id = ?`;
  
    connection.query(query, [productName, productQuantity, productPrice, id], (error, results) => {
      if (error) {
        return res.status(500).json({ message: 'Error updating product: ' + error.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Product not found.' });
      }
      res.json({ message: 'Product updated successfully!' });
    });
  });
  
  

  // Example server-side route for getting a customer by ID
app.get('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM customer_information WHERE id = ?`;

  connection.query(query, [id], (error, results) => {
    if (error) {
      res.status(500).json({ message: 'Server error' });
    } else if (results.length === 0) {
      res.status(404).json({ message: 'Customer not found' });
    } else {
      res.json(results[0]);
    }
  });
});

app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { customerName, address, customerNumber } = req.body;

  const query = 'UPDATE customer_information SET customer_name = ?, address = ?, customer_number = ? WHERE id = ?';


  connection.query(query, [customerName, address, customerNumber, id], (error, results) => {
    if (error) {
      console.error('Error updating customer:', error);
      return res.status(500).json({ message: 'Error updating customer', error: error.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    res.json({ message: 'Customer updated successfully!' });
  });
});


  
  // Route to delete a product
  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
  
    const query = 'DELETE FROM product_information WHERE id = ?';
  
    connection.query(query, [id], (error, results) => {
      if (error) {
        return res.status(500).send('Error deleting product: ' + error.message);
      }
      if (results.affectedRows === 0) {
        return res.status(404).send('Product not found.');
      }
      res.json({ message: 'Product deleted successfully!' });
    });
  });

  app.post('/api/add_customer', (req, res) => {
    const { customerName, address, customerNumber } = req.body;
    const query = 'INSERT INTO customer_information (customer_name, address, customer_number) VALUES (?, ?, ?)';
    
    console.log('Executing query:', query);
    console.log('With values:', [customerName, address, customerNumber]);
    
    connection.query(query, [customerName, address, customerNumber], (error, results) => {
      if (error) {
        console.error('Error adding customer:', error);
        res.status(500).json({ message: 'Error adding customer', error: error.message });
      } else {
        console.log('Insert result:', results);
        res.json({ message: 'Customer added successfully!', customerId: results.insertId });
      }
    });
  });


  app.post('/api/add_sales', (req, res) => {
    const { customerId, salesItems } = req.body;
  
    // Generate an invoiceId
    const timestamp = new Date().getTime();
    const invoiceId = `INV-${customerId}-${timestamp}`;
  
    // Get the current date and time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS)
    
    const purchasedDate = moment().tz('Asia/Makassar').format('YYYY-MM-DD HH:mm:ss');
  
    // Start a transaction
    connection.beginTransaction(error => {
      if (error) {
        return res.status(500).json({ message: 'Error starting transaction', error: error.message });
      }
  
      // Process each sales item
      salesItems.forEach(item => {
        const salesQuery = 'INSERT INTO sales_information (invoice_id, customer_id, product_id, quantity, purchased_date) VALUES (?, ?, ?, ?, ?)';
        connection.query(salesQuery, [invoiceId, customerId, item.productId, item.quantity, purchasedDate], error => {
          if (error) {
            return connection.rollback(() => {
              console.error('Error adding sales item:', error);
              res.status(500).json({ message: 'Error adding sales item', error: error.message });
            });
          }
  
          // Update the product quantity in the product_information table
          const updateProductQuery = 'UPDATE product_information SET productQuantity = productQuantity - ? WHERE id = ?';
          connection.query(updateProductQuery, [item.quantity, item.productId], error => {
            if (error) {
              return connection.rollback(() => {
                console.error('Error updating product quantity:', error);
                res.status(500).json({ message: 'Error updating product quantity', error: error.message });
              });
            }
          });
        });
      });
  
      // Commit the transaction
      connection.commit(error => {
        if (error) {
          return connection.rollback(() => {
            console.error('Error committing transaction:', error);
            res.status(500).json({ message: 'Error committing transaction', error: error.message });
          });
        }
        res.json({ message: 'Sales added successfully!', invoiceId: invoiceId });
      });
    });
  });
  
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
  
    // Here you should validate the username and password with your database
    if (username === 'admin' && password === 'password') { // Replace with actual validation
      // Successful login
      // Manage session state here (e.g., using express-session)
      res.json({ success: true });
    } else {
      // Login failed
      res.json({ success: false, message: 'Invalid credentials' });
    }
  });
  
  app.get('/api/sales', (req, res) => {
    const { year, month } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let baseQuery = 'FROM sales_information si JOIN customer_information ci ON si.customer_id = ci.id';
    let queryParams = [];

    // If year and month are provided, add them to the query
    if (year && month) {
        baseQuery += ' WHERE YEAR(si.purchased_date) = ? AND MONTH(si.purchased_date) = ?';
        queryParams.push(year, month);
    }

    const salesQuery = `
        SELECT si.invoice_id, ci.customer_name, COUNT(si.product_id) AS item_count, 
               SUM(si.quantity) AS total_quantity, MAX(si.purchased_date) AS last_purchase
        ${baseQuery}
        GROUP BY si.invoice_id, ci.customer_name
        ORDER BY last_purchase DESC
        LIMIT ?, ?
    `;
    queryParams.push(offset, limit);

    const countQuery = `
        SELECT COUNT(DISTINCT si.invoice_id) AS count
        ${baseQuery}
    `;

    // Execute count query
    connection.query(countQuery, queryParams.slice(0, -2), (error, countResult) => {
        if (error) {
            console.error('Count Query Error:', error);
            return res.status(500).send('Error retrieving sales count: ' + error.message);
        }

        const totalCount = countResult[0].count;

        // Execute sales query
        connection.query(salesQuery, queryParams, (error, salesResults) => {
            if (error) {
                console.error('Sales Query Error:', error);
                return res.status(500).send('Error retrieving sales: ' + error.message);
            }
            res.json({ sales: salesResults, totalCount });
        });
    });
});



  

app.get('/api/sales/invoices', (req, res) => {
  const query = 'SELECT DISTINCT invoice_id FROM sales_information'; // Adjust the query to match your database structure
  connection.query(query, (error, results) => {
      if (error) {
          return res.status(500).send('Error retrieving invoice IDs: ' + error.message);
      }
      res.json(results);
  });
});

app.get('/api/sales/details/:invoiceId', (req, res) => {
  const { invoiceId } = req.params;

  const query = `
      SELECT si.invoice_id, si.quantity, si.purchased_date, 
             ci.customer_name, ci.address, ci.customer_number,
             pi.productName , pi.productPrice
      FROM sales_information si
      JOIN customer_information ci ON si.customer_id = ci.id
      JOIN product_information pi ON si.product_id = pi.id
      WHERE si.invoice_id = ?`;
  connection.query(query, [invoiceId], (error, results) => {
      if (error) {
          console.error('Error fetching invoice details:', error);
          return res.status(500).json({ message: 'Error fetching invoice details', error: error.message });
      }
      res.json(results);
  });
});






  
  
  
  
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
