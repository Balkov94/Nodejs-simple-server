import * as http from 'http';
import * as url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import * as fs from 'fs';
let users = require('../users.json')

const HOSTNAME = 'localhost';
const PORT = 4000;
let nextId = 4;

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
   const path = url.parse(req.url).pathname
   console.log(`Request for: ${path}`)
   console.log(`METHOD: ${req.method}`)
   console.log(`HEADRES: ${JSON.stringify(req.headers)}`)

   // Get all users_____________________________________________
   if (req.method === 'GET' && path === '/api/users') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(users))

      // GET user by Id_____________________________________________
   } else if (req.method === 'GET' && path.match(/\/api\/users\/\w+/)) {
      const id = Number(req.url.split('/')[3]);
      const currUser = users.find(x => x.id === id);
      console.log(currUser);
      if (currUser) {
         res.end(JSON.stringify(currUser))
         res.writeHead(200, { 'Content-Type': 'application/json' });
      }
      else {
         res.writeHead(404, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({ message: `Error:404 User not found!` }))
      }

      //Delete user by Id _________________________________________
   } else if (req.method === 'DELETE' && path.match(/\/api\/users\/\w+/)) {
      const id = Number(req.url.split('/')[3]);
      const currUser = users.find(x => x.id === id);
      if (currUser) {
         const index = users.findIndex(x => x.id === id)
         users.splice(index, 1);
         fileUpdater(users);
         res.writeHead(200, {
            'Content-Type': 'application/json',
            'Location': `http://${HOSTNAME}:${PORT}/api/users/${id}`
         });
         res.end(JSON.stringify({ message: `User ID:${id} was deleted.` }))
      }
      else {
         res.writeHead(404, { 'Content-Type': 'application/json' });
         res.write("ERROR:404 User not found!");
         return res.end();
      }

      // PUT (Edit) user by id______________________________________
   } else if (req.method === 'PUT' && path.match(/\/api\/users\/\w+/)) {
      const id = Number(req.url.split('/')[3]);
      const currUser = users.find(x => x.id === id);
      if (currUser) {
         const index = users.findIndex(x => x.id === id)
         users.splice(index, 1);
         let bodyChunks: Uint8Array[] = [];
         req.on('data', chunk => bodyChunks.push(chunk))
            .on('end', async () => {
               let body = Buffer.concat(bodyChunks).toString();
               let objUser = JSON.parse(body);
               objUser = { ...objUser, id }
               users.push(objUser);
               fileUpdater(users);
               res.writeHead(200, {
                  'Content-Type': 'application/json',
                  'Location': `http://${HOSTNAME}:${PORT}/api/users/${id}`
               });
               res.end(JSON.stringify({ message: `User ID:${id} was edited.` }))
            })
      }
      else {
         res.writeHead(404, { 'Content-Type': 'application/json' });
         res.write("ERROR:404 User not found!");
         return res.end();
      }

      // POST user - CREATE ____________________________________________________
   } else if (req.method === 'POST') {
      let bodyChunks: Uint8Array[] = [];
      req.on('data', chunk => bodyChunks.push(chunk))
         .on('end', async () => {
            let body = Buffer.concat(bodyChunks).toString();
            console.log(body);
            const newUser = JSON.parse(body);
            newUser.id = ++nextId;
            users.push(newUser);
            fileUpdater(users);
            res.writeHead(201, {
               'Content-Type': 'application/json',
               'Location': `http://${HOSTNAME}:${PORT}/api/users/${newUser.id}`
            });
            res.write("Created user:")
            res.end(JSON.stringify(newUser));
         })

      //ERROR PAGE _____________________________________________________________
   } else if (req.method === 'GET') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'This is not the page you are looking for :)' }))
   }

})


server.listen(PORT, HOSTNAME, () => {
   console.log(`HTTP Server listening on: http://${HOSTNAME}:${PORT}`);
})

server.on('error', err => {
   console.log('Server error:', err);
});

function fileUpdater(users){
   fs.writeFile('users.json', JSON.stringify(users), function (err) {
      if (err) throw err;
      console.log('Users file was updated!');
   })
};