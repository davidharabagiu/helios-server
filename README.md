# Helios Server

### Dependencies
* Node.js 10.15.1
* MongoDB 4.0.6
* Express 4.6.14 Node Module
* Body Parser 1.18.3 Node Module
* MongoDB 3.1.13 Node Module

### Setup
* Add `<path_to_mongodb>/bin` to PATH
* `sudo mkdir -p /data/db`
* `sudo chown <current_user> /data`
* `npm install`

### Optional
* nodemon: `npm install nodemon -g`

### Run
```
mongod
node server.js
```

### Run with nodemon
```
nodemon
```
