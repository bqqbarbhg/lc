var loopback = require('loopback');
var boot = require('loopback-boot');
var path = require('path');

var app = module.exports = loopback();

// start the server
boot(app, path.resolve(__dirname, 'config'), err => {
	if (err) throw err;

	if (require.main === module)
		app.listen(() => {app.emit('started');});
});


// models
var Score = app.models.Score;
var UserAgent = app.models.UserAgent;

// autofetch params
app.param('scoreId', (req, res, next, scoreId) => {
	Score.findById(scoreId)
	.then(score => {
		req.score = score || {};
		next();
	}).catch(next);
});

// routes
app.get('/s', function (req, res, next) {
	Score.find()
	.then(scores => {
		res.json(scores).end();
		next();
	}).catch(next);
});

app.get('/s/:scoreId', function (req, res, next) {
	res.json(req.score).end();
	next();
});

app.get('/r/:scoreId', function (req, res, next) {

	// TODO: fetch replay for score

});