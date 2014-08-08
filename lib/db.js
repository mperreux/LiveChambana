var mongojs = require('mongojs');
var db = mongojs('localhost:27017/livechambana', ['apartments', 'users']);
module.exports = db;