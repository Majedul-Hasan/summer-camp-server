const mongoose = require('mongoose');

const MONGO_URI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@${process.env.DB_CLUSTER_NAME}.${process.env.DB_HOST}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const database = () =>
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      // useCreateIndex: true,
      //   useFindAndModify: false,
      useUnifiedTopology: true,
      autoIndex: true, // Don't build indexes
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    })
    // .connect(process.env.DATABASE_CLOUD,{})
    .then((DB) => {
      console.log('db connected: ', DB.connection.host);
    })
    .catch((err) => {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    });




module.exports = database;
