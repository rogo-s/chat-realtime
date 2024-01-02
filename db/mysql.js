const mysql = require("mysql2")

const connection = mysql.createConnection({
    host: 'roundhouse.proxy.rlwy.net',
    user: 'root',
    password: 'G1EDGBfCCafaDa6G26dcC5B3EBCA-e1b',
    port: 13525,
    protocol: 'TCP',
    database: "railway"
  });

module.exports = connection
