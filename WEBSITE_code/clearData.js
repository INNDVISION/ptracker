const mongoose = require('mongoose');

const mongoUri = 'YOUR MONGO DP URL';

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    return mongoose.connection.db.collection('datas').deleteMany({});
  })
  .then(() => {
    console.log('Collection cleared');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error clearing collection:', err);
  });
