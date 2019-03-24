# Helios Server

### Dependencies
* Node.js 10.15.1
* MongoDB 4.0.6
* Node Modules
    * Express 4.6.14
    * Body Parser 1.18.3
    * MongoDB 3.1.13
    * Rwlock 5.0.0

### Setup
* Add `<path_to_mongodb>/bin` to PATH
* `mkdir -p /data/db`
* `chown <current_user> /data`
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
