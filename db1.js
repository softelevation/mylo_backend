const QueryBuilder = require('node-querybuilder');

const settings = {
				host: process.env.DB_HOST,
				database: process.env.DB_DATABASE,
				user: process.env.DB_USERNAME,
				password: process.env.DB_PASSWORD
			}
const pool = new QueryBuilder(settings, 'mysql', 'pool');
module.exports = pool;