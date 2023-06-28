const express = require('express');
require('dotenv').config();
const cors = require('cors');
const  dbConnect = require('./config/configDB');
dbConnect()
const morgan = require('morgan');

const cookieParser = require('cookie-parser');
const { tokenPost, verifyJWT } = require('./middleware/authMiddleware');
const { ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);

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
    const cartCollection = database.collection('carts');
    const paymentCollection = database.collection('school-payments');

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

    // create payment intent
    app.post('/create-payment-intent', verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card'],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // payment related api
    app.post('/payments', verifyJWT, async (req, res) => {
      const payment = req.body;
      const insertResult = await paymentCollection.insertOne(payment);

      const deleteQuery = {
        _id: { $in: payment.cartItems.map((id) => new ObjectId(id)) },
      };
      console.log(deleteQuery);
      const deleteResult = await cartCollection.deleteMany(deleteQuery);

      // update
      const courseIds = payment.courseItems.map((item) => item);
      console.log(courseIds);
      const updateQuery = {
        _id: { $in: courseIds.map((id) => new ObjectId(id)) },
      };
      console.log(updateQuery);

      const updateResult = await coursesCollection.updateMany(updateQuery, {
        $inc: { seats: -1 },
      });
      console.log(updateResult);

      res.send({ insertResult, deleteResult, updateResult });
    });

    // cart collection apis
    app.get('/payment-history', verifyJWT, async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: 'forbidden access' });
      }
      const query = { email: email };
      const result = await paymentCollection.find(query).toArray();
      res.status(200).send(result);
    });

    /*

    app.post('/payments', verifyJWT, async (req, res) => {
      const payment = req.body;
      const insertResult = await paymentCollection.insertOne(payment);
      if

      const query = {
        _id: {
          $in: payment.cartItems.map((item) => new ObjectId(item.courseId)),
        },
      };
      const deleteResult = await cartCollection.deleteMany(query);

      // Update the coursesCollection
      const courseIds = payment.cartItems.map((item) => item.courseId);
      const updateQuery = { courseId: { $in: courseIds } };

      const coursesToUpdate = await coursesCollection
        .find(updateQuery)
        .toArray();

      const updatePromises = coursesToUpdate.map(async (course) => {
        const decrementResult = await coursesCollection.updateOne(
          { _id: course._id },
          { $inc: { seats: -1 } }
        );
        return decrementResult;
      });

      const updateResults = await Promise.all(updatePromises);

      res.send({ insertResult, deleteResult, updateResults });
    });
    */

    //enrolled-states

    app.get('/enrolled-states', verifyJWT, async (req, res) => {
      const email = req.query.email;
      function onlyUnique(value, index, array) {
        return array.indexOf(value) === index;
      }

      if (!email) {
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: 'forbidden access' });
      }
      const query = { email: email };
      const paidFor = await paymentCollection
        .find(query)
        .project({ courseItems: 1, _id: 1 })
        .toArray();

      // courses
      const courseIds = paidFor
        .map((x) => x.courseItems)
        .flat(1)
        .filter(onlyUnique);

      const courseQuery = {
        _id: { $in: courseIds.map((id) => new ObjectId(id)) },
      };
      const result = await coursesCollection.find(courseQuery).toArray();

      res.status(200).send(result);
    });

    // cart collection apis
    app.get('/carts', verifyJWT, async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: 'forbidden access' });
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.status(200).send(result);
    });

    app.post('/carts', async (req, res) => {
      const item = req.body;
      // console.log(item);
      const result = await cartCollection.insertOne(item);
      res.send(result);
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    //courses admin
    app.get('/admin/courses', verifyJWT, verifyAdmin, async (req, res) => {
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

    //courses public route
    app.get('/courses', async (req, res) => {
      const { limit } = req.query;
      const limInt = parseInt(limit) || 0;
      const query = { status: 'active' };
      const courses = await coursesCollection
        .find(query)
        .limit(limInt)
        .sort({ uploadAt: -1 })
        .toArray();
      // Extracting instructor emails from course objects
      const instructorEmails = courses.map((course) => course.instructorEmail);
      // Fetching instructor info from usersCollection
      const instructors = await usersCollection
        .find({ email: { $in: instructorEmails } })
        .project({ email: 1, _id: 1 })
        .toArray();
      // Creating a map of instructor email to instructor info
      const instructorMap = instructors.reduce((map, instructor) => {
        map[instructor.email] = instructor;
        return map;
      }, {});
      // Assigning instructor info to respective course objects
      const coursesWithInstructors = courses.map((course) => {
        const instructor = instructorMap[course.instructorEmail];
        return { ...course, instructor };
      });

      res.send(coursesWithInstructors);
    });

    //courses
    app.get('/courses/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      // Find the instructor document
      const course = await coursesCollection.findOne(query);
      if (course) {
        const options = {
          projection: { address: 1, _id: 1 },
        };
        course.instructorDetail = await usersCollection.findOne(
          {
            email: course.instructorEmail,
          },
          options
        );
      }

      if (course?.status !== 'active') {
        return res.status(423).json({
          error: 'The resource that is being accessed is not unlocked yet',
        });
      } else {
        res.status(200).send(course);
      }
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

    // single course update
    app.patch('/courses/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;

      const email = req.decoded?.email;
      const filter = { _id: new ObjectId(id) };
      const course = await coursesCollection.findOne(filter);

      const options = { upsert: false };
      const updatedCourse = req.body;
      if (email === course['instructorEmail']) {
        const updateDoc = {
          $set: {
            ...updatedCourse,
          },
        };
        const result = await coursesCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      } else {
        res.status(403).send({ error: true, message: 'unauthorized access' });
      }
    });

    // courses by instructor collection apis
    app.get('/my-corses', verifyJWT, async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: 'forbidden access' });
      }
      const query = { instructorEmail: email };
      const result = await coursesCollection.find(query).toArray();
      res.status(200).send(result);
    });

    //courses
    app.get('/my-corses/:id', verifyJWT, async (req, res) => {
      const { id } = req.params;
      const email = req.decoded?.email;
      const query = { _id: new ObjectId(id) };
      // Find the instructor document
      const course = await coursesCollection.findOne(query);

      if (course && email === course['instructorEmail']) {
        res.status(200).send(course);
      } else {
        res.status(403).send({ error: true, message: 'forbidden access' });
      }
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
    // users related apis
    // app.get('/users/instructors/:id', async (req, res) => {
    //   const { id } = req.params;
    //   console.log(id);
    //   const { limit } = req.query;

    //   const query = { role: 'instructor' };
    //   const result = await usersCollection.findOne(query);
    //   res.send(result);
    // });

    app.get('/users/instructors/:id', async (req, res) => {
      const { id } = req.params;
      const query = { role: 'instructor', _id: new ObjectId(id) };

      // Find the instructor document
      const instructor = await usersCollection.findOne(query);
      if (!instructor) {
        return res.status(404).json({ error: 'Instructor not found' });
      }
      // Get the course IDs associated with the instructor
      const response = { instructor: instructor };
      const courseIds = instructor.courses;
      if (!courseIds) {
        response.courses = [];
      } else {
        response.courses = await coursesCollection
          .find({ _id: { $in: courseIds }, status: 'active' })
          .toArray();
      }
      // Send the response
      res.json(response);
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
// run().catch(console.dir);


app.get('enrolled-states', verifyJWT, async (req, res) => {


})





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


/*

 app.get('enrolled-states', verifyJWT, async (req, res) => {
   const pipeline = [
     {
       $unwind: '$courseItems',
     },
     {
       $addFields: {
         courseItemId: { $toObjectId: '$courseItems' },
       },
     },
     {
       $lookup: {
         from: 'course',
         localField: 'courseItemId',
         foreignField: '_id',
         as: 'courseItemDetails',
       },
     },
     {
       $unwind: '$courseItemDetails',
     },
     {
       $group: {
         _id: '$courseItemDetails.category',
         count: { $sum: 1 },
         totalPrice: { $sum: '$courseItemDetails.price' },
       },
     },
     {
       $project: {
         category: '$_id',
         count: 1,
         total: { $round: ['$totalPrice', 2] },
         _id: 0,
       },
     },
   ];
   const result = await paymentCollection.aggregate(pipeline).toArray();
   res.send(result);
 });
*/