# Helios Server

### Dependencies
* Node.js 10.15.1
* MongoDB 4.0.6
* Node Modules
    * Express 4.6.14
    * Body Parser 1.18.3
    * MongoDB 3.1.13
    * Rwlock 5.0.0
    * Multer 1.4.1

### Setup
* Add `<path_to_mongodb>/bin` to PATH
* `mkdir -p /data/db`
* `chown <current_user> /data`
* `npm install`
* Obtain a HTTPS certificate. For local development and testing, a certificate can be created with the following command:
```
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

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
