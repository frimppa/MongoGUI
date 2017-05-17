var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient,
    test = require('assert');
var uri = 'mongodb://192.84.181.206/testibase'
var tableify = require('tableify');
var json2html = require('node-json2html');

//global.jQuery = require('jquery');
//var bootstrap = require('bootstrap');
var app = express();

app.use('/css', express.static('css'));
app.use('/css/pictures', express.static('pictures'));
app.use(bodyParser.urlencoded({
    extended: true
}));
var db = 'mongodb://192.84.181.206/testibase';
//var db2 = ('testibase', new Server('localhost', 27017));
var http = require('http').Server(app);
var io = require('socket.io')(http);


// Connect using MongoClient
MongoClient.connect(uri, function(err, db) {
  // Use the admin database for the operation
  var adminDb = db.admin();
  // List all the available databases
  adminDb.listDatabases(function(err, dbs) {
    test.equal(null, err);
    test.ok(dbs.databases.length > 0);
    console.log(dbs);
    db.close();
  });
});


        
/*MongoClient.connect(uri, function(err, db) {
            console.log('connection 2 successful');
         var testi = db.collection('testitaulu');
        testi.find({}).toArray(function(err, items){
            test.equal(null, err);
            console.log(items);
        });
         db.close();
    });

*/

var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }, 
                replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } }; 

mongoose.connect(db, options, function(err) {
    if (err) {
        console.log(err);
    }
});


var Schema = mongoose.Schema;

var taulu;

var TestiSchema = new Schema({
    name: String,
    ID:   String,
    color:String
}, {collection: '', versionKey: false});


var testData = mongoose.model('', TestiSchema);

var array = ["testi", "nakki"];

function pallo(pal) {
    return pal === "testi";
}

console.log(array.find(pallo));


app.use(function (req, res, next) {
  res.locals.kannat = null
  res.locals.name = null
  res.locals.color = null
  res.locals.näytä = null
  res.locals.id = null
  res.locals.iid = null
  res.locals.väri = null
  res.locals.nimi = null
  next()
})

app.post('/testi', function(req,res){
 MongoClient.connect(uri, function(err, db) {
  // Create a collection we want to drop later
  taulu = req.body.valinta;
  var col = db.collection(taulu);
  // Show that duplicate records got dropped
  col.find({}).toArray(function(err, items) {
    //test.equal(null, err);
    //test.equal(4, items.length);
    console.log(items);

    var transform = {'<>':'li class="list-group-item"','html':'${ID} ${name} ${color}'};
     var tulos = json2html.transform(items, transform);

    res.render('index.ejs', {näytä: tulos});


    db.close();
  });
});
});
        
app.post('/test2', function(req, res){
    MongoClient.connect(uri, function(err, db) {
    var col = db.collection(taulu);
  // Show that duplicate records got dropped
  col.find({"ID": req.body.haku}).toArray(function(err, items) {
    //test.equal(null, err);
    //test.equal(4, items.length);
    console.log(items);
    res.render('index.ejs', {name: items[0].name, id: items[0].ID, color: items[0].color});
  });
  db.close();
    });
});


app.post('/vali', function(req,res,next){


    TestiSchema = new Schema({
    name: String,
    ID:   String,
    color:String
}, {collection: req.body.valinta, versionKey: false});

    if (mongoose.modelNames() != '') {
        console.log(mongoose.modelNames().toString());
        var test = mongoose.modelNames();
        console.log(test);
        
        
        var ask = req.body.valinta;

        console.log('toimiiko ', ask);

        function testi(pal){
            return pal === 'testitaulu';
        }
        console.log(test.find(testi));

        testData = mongoose.modelNames(ask);
        console.log('Schema ',TestiSchema);
        
    }
    testData = mongoose.model(req.body.valinta, TestiSchema);
    



});



app.get('/', function(req, res){
    

    res.render('index.ejs');
});



app.post('/close', function(req, res){
    res.render('index.ejs');
});
app.get('/show', function(req, res){
    testData.find().then(function(doc){
        console.log(doc);
       
        var transform = {'<>':'li class="list-group-item"','html':'${ID} ${name} ${color}'};
        var tulos = json2html.transform(doc, transform);

        res.render('index.ejs', {näytä: tulos});
    });
});

app.get('/haekanta', function(req, res){
    
    
    
    mongoose.connection.db.listCollections().toArray(function (err, names) {
      if (err) {
        console.log(err);
      } else {
        var transform = {'<>':'li class="list-group-item"','html':'${name}'};
        var tulos = json2html.transform(names, transform);
        
        res.render('index.ejs', { kannat: tulos });
        console.log(names);
        var model = mongoose.model('testitaulu', TestiSchema); 

        
        /*for(i=0; i<names.length; i++){
            console.log(names[i].name);
            
        
        }
        */
      }
      //console.log(mongoose.connection.db.testitaulu.find());

      
    });
});



    
app.post('/hae', function(req, res){
    testData.find({"ID": req.body.haku}).then(function(doc){
        
        res.render('index.ejs', {name: doc[0].name, id: doc[0].ID, color: doc[0].color});
    });
});

app.post('/update', function(req, res){
    
    testData.find({"ID": req.body.iid}, function(err, doc) {
        if (err) {
            console.log('ei löydy');
        }
        console.log(doc);
        //doc.name = req.body.nimi;
        doc[0].name = req.body.nimi;
        doc[0].color = req.body.väri;
        doc[0].save();
    });
    res.redirect('/');
});


app.post('/insert', function(req, res){
    var item = {
        name: req.body.name,
        ID: req.body.id,
        color: req.body.color
    };
    var data = new testData(item);
    data.save();
    console.log('lisätty');
    res.redirect('/');
    
});

app.post('/poisto', function(req,res){
testData.remove({"ID": req.body.poisto}, function(err){
        if(err){
            console.log('errorit',err);
        }
        console.log('Onnistui!')
    });
    res.redirect('/');
});




http.listen(8080);

io.sockets.on('connection', function(socket){
  
  console.log('a user connected');
});