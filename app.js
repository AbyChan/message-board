'use strict';

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var cors = require('cors');

app.use(cors());

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

var sqlite3 = require('sqlite3').verbose(),
    fs = require('fs'),
    path = require('path');

var fileExist = function(path) {
    try {
        var stats = fs.lstatSync(path);
        if ( stats.isFile() ) {
            return true;
        }
    } catch (e) {
        return false;
    }
};

var initDB = function(dbPath) {
    if (fileExist(dbPath)) {
        return new sqlite3.Database(dbPath);

    } else {
        var db = new sqlite3.Database(dbPath);
        createTable(db);
    }
};

var createTable = function(db){
    db.serialize(function(){
        db.run(
            'CREATE TABLE message (' +
                'name TEXT NOT NULL, '+
                'message TEXT NOT NULL, '+
                'date DATETIME);'
        );
    });
};

var insertMessage = function(db, name, message, cb){
    db.serialize(function(){
        db.run(
            'INSERT INTO message (name, message, date) VALUES (?, ?, ?)',
            [name, message, new Date().toString()], cb);
    });
};

var db = initDB('./db.sqlite3');

app.post('/message', function(req, res) {
    //req.hostname
    var name = req.body.name,
        message = req.body.message;

    if( !name || !message ){
        return res.json({status: 0, message: 'miss param!'});
    } if( name.length > 30 ) {
        return res.json({status: 0, message: 'name too long!'});
    } if( message.length > 1000 ) {
        return res.json({status: 0, message: 'message too long!'});
    } else {
        insertMessage(db, name, message, function(err){
            if( err ){
                return res.json({status: 0, message: 'db error!'});
            }
            return res.json({status: 1, message: 'success!'});
        });
    }
});


app.listen(8088, '0.0.0.0');
console.log('message board listen on 0.0.0.0:8088');
