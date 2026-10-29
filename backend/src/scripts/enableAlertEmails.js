require("dotenv").config();
const mongoose = require("mongoose");
const { Alert } = require("../models");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await Alert.updateMany({}, { $set: { notifyEmail: true } });
  console.log(`Email alerts enabled on ${result.modifiedCount} alert(s)`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
