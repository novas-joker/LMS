import mongoose from 'mongoose';

// Connect to MongoDB

const connectDB = async () =>{
    mongoose.connection.on('connected',()=>console.log('Db connected'))
    await mongoose.connect(`${process.env.MONGODB_URI}/lms`)
}
export default connectDB;