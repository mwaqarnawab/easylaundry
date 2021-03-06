const express = require('express');
var bodyParser = require('body-parser');
const app = express();
var argv = require('minimist')(process.argv.slice(2));
var cors = require('cors');
var mysql = require('mysql2');

// CONTROLLERS
var usersCtrl = require('./controllers/users');
var adminCtrl = require('./controllers/admins');
var ordersCtrl = require('./controllers/orders');
var appointmentCtrl = require('./controllers/appointments');
var servicesCtrl = require('./controllers/services')
var financialDetailsCtrl = require('./controllers/financial_details')

//CORS
app.use(
	cors({
		credentials: true,
		origin: true
	})
);
app.options('*', cors());

// SWAGGER
var subpath = express();
app.use(
	bodyParser.json({
		limit: '50mb'
	})
);
app.use(
	bodyParser.urlencoded({
		limit: '50mb',
		extended: true
	})
);
app.use('', subpath);
var swagger = require('swagger-node-express').createNew(subpath);
app.use(express.static('swagger'));
swagger.setApiInfo({
	title: 'CRUD API',
	description: 'CRUD API Description',
	termsOfServiceUrl: '',
	contact: '<your email here>',
	license: '',
	licenseUrl: ''
});
// Set api-doc path
swagger.setAppHandler(app);
swagger.configureSwaggerPaths('', 'api-docs', '');

// Configure the API domain
var domain = 'localhost';
if (argv.domain !== undefined) domain = argv.domain;
else
	console.log(
		'No --domain=xxx specified, taking default hostname "localhost".'
	);

// Configure the API port
var port = 8080;
if (argv.port !== undefined) port = argv.port;
else console.log('No --port=xxx specified, taking default port ' + port + '.');

// Set and display the application URL
var applicationUrl = 'http://' + domain + ':' + port;
swagger.configure(applicationUrl, '1.0.0');

// MYSQL
app.use(function(req, res, next) {
	res.locals.connection = mysql.createPool({
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'Asia/Karachi',
		timezone: 'UTC+5'
	});
	next();
});
app.get('/', function(req, res) {
	// res.sendFile(__dirname + '/swagger/index.html');
	console.log('Simple default Request', '');
	res.send(400, 'Invalid URL');
});
app.use('/users', usersCtrl);
app.use('/services', servicesCtrl);
app.use('/admin', adminCtrl)
app.use('/financialDetails', financialDetailsCtrl);
app.use('/orders', ordersCtrl);
app.use('/appointments', appointmentCtrl);

app.listen(3000, function() {
	console.log('server running on port 3000', '');
});

app.set('view engine', 'ejs');
