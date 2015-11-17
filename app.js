var express = require('express')
, routes = require('./routes')
, user = require('./routes/user')
, http = require('http')
, path = require('path')
, admin= require('./routes/admin')
, customer = require('./routes/customer')
, driver = require ('./routes/driver');

//Passport login for 
var amqp = require('amqp');
var connection = amqp.createConnection({host:'127.0.0.1'});
var rpc = new (require('./rpc/amqprpc'))(connection);

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//MongoSession
var mongoSessionConnectURL = "mongodb://localhost:27017/sessions";
var expressSession = require("express-session");
var mongoStore = require("connect-mongo")(expressSession);
var mongo = require("./routes/mongo"); // Database configuration file

var app = express();

//Sessions handling in mongodb
app.use(expressSession({
	secret : 'uberApplicationPrototype',
	resave : true,
	saveUninitialized : false,
	duration: 30 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
	store: new mongoStore({ url: mongoSessionConnectURL })
}));

//all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

//Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(app.router);

//Exposing the public folder to be accessed
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(__dirname + "/public"));

//development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});

//Passport Login for admin

//Passport Login Local Strategy
passport.use('admin-local',new LocalStrategy({ usernameField: 'username',
    passwordField: 'password'},
		function(username, password, done) {
	console.log("username : "+ username + "  password :  " + password);
	process.nextTick(function () {
		//UserDetails.findOne({'EMAIL':username},
		//connection.query("select * from ADMIN where EMAIL = '"+username+"'",
		var data = {};
		data.EMAIL = username;
		data.PASSWORD = password;
		console.log(JSON.stringify(req.body.loginType));

			rpc.makeRequest("verifyAdmin", data,
					function(err, user) {
				console.log("User : "+ JSON.stringify(user));
				if(err){
					return done(err);
				}
				else{
					if(user == null || user == "" || user == {}){
						return done(null, false);
					}
					else{
						if(user.code == "200"){
							console.log("Everthing is fine!!!")
							return done(null, user);
						}else{
							return done(null, false);
						}

					}
				}
			});
	});
}
));
passport.use('admin-local',new LocalStrategy({ usernameField: 'username',
    passwordField: 'password'},
		function(username, password, done) {
	console.log("username : "+ username + "  password :  " + password);
	process.nextTick(function () {
		//UserDetails.findOne({'EMAIL':username},
		//connection.query("select * from ADMIN where EMAIL = '"+username+"'",
		var data = {};
		data.EMAIL = username;
		data.PASSWORD = password;
		console.log(JSON.stringify(req.body.loginType));

			rpc.makeRequest("verifyAdmin", data,
					function(err, user) {
				console.log("User : "+ JSON.stringify(user));
				if(err){
					return done(err);
				}
				else{
					if(user == null || user == "" || user == {}){
						return done(null, false);
					}
					else{
						if(user.code == "200"){
							console.log("Everthing is fine!!!")
							return done(null, user);
						}else{
							return done(null, false);
						}

					}
				}
			});
	});
}
));
//END

//customer
passport.use('customer-local', new LocalStrategy({ usernameField: 'username',
    passwordField: 'password'},
		function(username, password, done) {
    	console.log("it got in");
	console.log("customer ==> username : "+ username + "  password :  " + password);
	process.nextTick(function () {
		//UserDetails.findOne({'EMAIL':username},
		//connection.query("select * from ADMIN where EMAIL = '"+username+"'",
		var data = {};
		data.EMAIL = username;
		data.PASSWORD = password;
			rpc.makeRequest("verifyAdmin", data,
					function(err, user) {
				console.log("User : "+ JSON.stringify(user));
				if(err){
					return done(err);
				}
				else{
					if(user == null || user == "" || user == {}){
						return done(null, false);
					}
					else{
						if(user.code == "200"){
							console.log("Everthing is fine!!!")
							return done(null, user);
						}else{
							return done(null, false);
						}

					}
				}
			});
	});
}
));


//Admin Related
//Passport Login function
app.get('/adminLoginPage',admin.adminLoginPage);
app.get('/customerLoginPage',customer.customerLoginPage);
app.get('/driverLoginPage',driver.driverLoginPage);
app.get('/adminHome',admin.adminHome);
app.get('/invalidAdminLogin',admin.invalidAdminLogin);
app.get('/invalidSessionAdminLogin',admin.invalidSessionAdminLogin);

app.post('/loginAdmin', 
		passport.authenticate('admin-local', {
			successRedirect: '/adminHome',
			failureRedirect: '/invalidAdminLogin'
		}));
app.post('/loginCustomer', 
		passport.authenticate('customer-local', {
			successRedirect: '/adminHome',
			failureRedirect: '/invalidCustomerLogin'
		}));
app.post('/loginDriver', 
passport.authenticate('local', {
successRedirect: '/adminHome',
failureRedirect: '/invalidAdminLogin2'
}));

app.get('/', function(req, res){
	res.render('home', { title: 'HOME' });
});
app.get('/Log_In', function(req, res){
	res.render('Log_In', { title: 'HOME' });
});
app.get('/signUpCustomer', function(req, res){
	res.render('Sign_Up_Customer', { title: 'HOME' });
});

mongo.connect(mongoSessionConnectURL, function() {
	http.createServer(app).listen(app.get('port'), function(){
		console.log('Uber server listening on port ' + app.get('port'));
	});
});