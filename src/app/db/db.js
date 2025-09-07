import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()
export async function Connect() {
    try {
        mongoose.connect(process.env.mongo).then(x => { console.log("connected") }).catch(error => { console.log("not connected") })
    } catch (err) {
        console.log("something is  not right")

    }


}