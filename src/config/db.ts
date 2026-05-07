import mongoose= require("mongoose");

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.MONGODB_URL as string);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

export default connectDB;