const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { dbConnect, client } = require('./config/configDB');





const app = express();
const port = process.env.PORT || 5170;
// middleware
app.use(cors());
app.use(express.json());


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    dbConnect();
    const database = client.db('language-school');
    const usersCollection = database.collection('users');
    const coursesCollection = database.collection('courses');

    // single course creation
    app.post('/courses', async (req, res) => {
      const course = req.body;
      console.log(course);
      const result = await coursesCollection.insertOne(course);
      res.send(result);
    });
    // create user
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);








app.get('/', (req, res) => {
  res.sendFile(__dirname + '/file.html');
});

/*
app.get('/', (req, res) => {
  res.send('Hello World!');
});
*/
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
