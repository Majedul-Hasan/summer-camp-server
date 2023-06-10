const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { dbConnect, client } = require('./config/configDB');
const morgan = require('morgan');

const cookieParser = require('cookie-parser');
const { tokenPost, verifyJWT } = require('./middleware/authMiddleware');
const { ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5170;
// middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));

// jwt
app.post('/jwt', tokenPost);

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    dbConnect();
    const database = client.db('language-school');
    const usersCollection = database.collection('users');
    const coursesCollection = database.collection('courses');
    // Warning: use verifyJWT before using verifyAdmin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res
          .status(403)
          .send({ error: true, message: 'forbidden message' });
      }
      next();
    };

    //courses
    app.get('/courses', async (req, res) => {
      const { limit } = req.query;
      const limInt = parseInt(limit) || 0;
      const query = {};
      const result = await coursesCollection
        .find(query)
        .limit(limInt)
        .sort({ uploadAt: -1 })
        .toArray();
      res.send(result);
    });

    // single course creation
    app.post('/courses', verifyJWT, async (req, res) => {
      const email = req.decoded.email;
      const course = req.body;
      const user = await usersCollection.findOne({ email: email });
      console.log(user);

      if (user) {
        const result = await coursesCollection.insertOne(course);
        console.log(result);
        if (!user.courses) {
          user.courses = []; // Initialize 'courses' as an empty array if it doesn't exist
        }
        user.courses.push(result.insertedId);
        await usersCollection.updateOne(
          { _id: new ObjectId(user._id) },
          { $set: user }
        );
        console.log(result);
        console.log(user);
        res.send(result);
      }
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

    // new course

    // admins
    // users related apis
    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });
    // users related apis
    app.get('/users/students', verifyJWT, verifyAdmin, async (req, res) => {
      const query = { role: 'student' };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // users related apis
    app.get('/users/instructors', async (req, res) => {
      const { limit } = req.query;
      const limInt = parseInt(limit) || 0;
      const query = { role: 'instructor' };
      const result = await usersCollection.find(query).limit(limInt).toArray();
      res.send(result);
    });
    // user make admin
    app.patch('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin',
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get(
      '/course/admin/pending',
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const query = { status: 'pending' };
        const result = await coursesCollection.countDocuments(query);
        console.log(result);
        res.send({ pending: result });
        //  res.status(200).send(result);
      }
    );
    // course make active
    app.patch(
      '/course/active/:id',
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            status: 'active',
          },
        };
        const result = await coursesCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );
    // course make pending
    app.patch(
      '/course/pending/:id',
      verifyJWT,
      verifyAdmin,

      async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            status: 'pending',
          },
        };
        const result = await coursesCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );

    // course make pending
    app.patch(
      '/course/decline/:id',
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const feedback = req.body;
        console.log(feedback);

        const id = req.params.id;
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            status: 'denied',
            adminFeedback: feedback.feedback,
          },
        };
        const result = await coursesCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );

    // user make instructor
    app.patch(
      '/users/instructor/:id',
      verifyJWT,
      verifyAdmin,

      async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: 'instructor',
          },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );

    app.delete('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    //admin verification route
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      // console.log(email, query);
      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const user = await usersCollection.findOne(query);
      // console.log(user);
      const result = { role: user?.role };
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
