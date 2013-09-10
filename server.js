var http = require('http'),
    stream = require('stream');

var config = {
      host: 'store.ceiris.com',
      target_port: 80,
      listen_port: 8042,
      script: '<script>alert("Hi! I am an alert from injected javascript :D");console.log("i inject things")</script>',
    };

console.log('Forwarding Reqs to: ' + config.host)
console.log('Listening at Port: ' + config.listen_port)

var server = http.createServer(function(frontendReq, frontendRes) {
  // Stream for injecting scripts
  var injector = new stream.Transform()

  // Pass through chunks
  injector._transform = function(chunk, encoding, callback) {
    this.push(chunk)
    callback()
  }

  // Before emitting end inject script
  injector._flush = function(callback) {
    this.push(config.script)
    callback()
  }

  // Request options
  frontendReq.headers['accept-encoding'] = ''

  var opts = {
    port:    config.target_port,
    hostname:    config.host,
    host: config.host,
    method:  frontendReq.method,
    path:    frontendReq.url,
    //headers: frontendReq.headers,
  }

console.log(frontendReq.headers)

  // Make request
  var backendReq = http.request(opts, function(backendRes) {

    console.log(backendRes.headers)

    var headers       = backendRes.headers,
        statusCode    = backendRes.statusCode,
        contentType   = headers['content-type'];//,
        contentLength = headers['content-length'];

    if (contentType && contentType.indexOf("text/html") != -1) {
      // If this is an html page, inject our scripts and update header
      headers['content-length'] = parseInt(contentLength, 10) + config.script.length
      frontendRes.writeHead(statusCode, headers)
      backendRes.pipe(injector).pipe(frontendRes)
    } else {
      // ...otherwise just pipe it through normally using original headers
      frontendRes.writeHead(statusCode, headers)
      backendRes.pipe(frontendRes)
    }
  })

  backendReq.end()
})

server.listen(config.listen_port)
