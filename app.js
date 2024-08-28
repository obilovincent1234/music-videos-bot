var mongoose = require("mongoose");
var express = require("express");
var cors = require('cors')

//.env config
require('dotenv').config()


var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var messagesRouter = require('./routes/messages');

var app = express();

app.use(cors());
// app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


let searchesRouter = require('./routes/searches');
let moviesRouter = require('./routes/movies');

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/messages", messagesRouter);
app.use("/searches", searchesRouter);
app.use("/movies", moviesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.status(404);
    res.json({
        ok: false
    })
});
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = process.env.DEBUG === true ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json({
        stauts: 500,
        error: err.message
    });
});
mongoose.connect(`mongodb+srv://musicvideo:Vincentdepaul123@cluster0.cen1xf9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, {
    useNewUrlParser: true,
    authSource: 'admin',
    useUnifiedTopology: true
});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
    console.log("connected to com_watch database");
    app.listen(
        3000,
        console.log("server is running: ", new Date().toTimeString())
    );
});



const cron = require("node-cron");
const cronService = require("./services/cron")
cron.schedule("0 */15 * * * *", function () {
// cron.schedule("* * * * * *", function () {
    console.log('getNoResultSuggestion every 15 minutes');
    cronService.getNoResultSuggestion();
});

module.exports = app;
