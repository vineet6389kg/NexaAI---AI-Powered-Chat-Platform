import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'node:dns';

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());

dns.setServers([
    '8.8.8.8',
    '1.1.1.1'
]);

app.listen(PORT, () => {
    console.log(`server is running ${PORT}`);
    connectDB();
});

const connectDB = async() => {
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Conected to the Database!")
    }catch(err){
        console.log("Failed to connect with Database",err)

    }
}