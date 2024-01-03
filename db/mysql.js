const mysql = require("mysql2")
const DSN = 'mysql://root:3HE1Ef4Af5f1D2fGe62d4Ebgbd6CeD6H@viaduct.proxy.rlwy.net:14038/railway';

const connection = mysql.createPool(DSN);
module.exports = connection
