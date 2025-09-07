import { GitHub } from "arctic";
import dotenv from "dotenv";

dotenv.config();

export const github = new GitHub(  
     process.env.Github_Client_Id,
    process.env.Github_Client_Secret,
    process.env.GITHUB_REDIRECT_URI
 )