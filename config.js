// configuration file that allows the server to work
// and the
let os = require('os');

//
let id = '10561';

// ip address goes here
let host = '';
let port = 10010;
let proto = 'http';
let hostname = os.hostname();

module.exports = {
  id: id,
  host: host,
  port: port,
  timeout: 30,
  interval: 90 * 1000,
  proto: proto,
  hostname: hostname,
  device: 'wlan1'
};
