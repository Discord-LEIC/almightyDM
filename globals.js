require("dotenv").config();

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_NAME = process.env.DB_NAME;
const DB_PSWD = process.env.DB_PSWD;



module.exports = {
    DB_HOST,
    DB_USER,
    DB_NAME,
    DB_PSWD
}
