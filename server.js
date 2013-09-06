var http = require('http'),
    stream = require('stream');

var config = {
      host: 'nodejs.org',
      target_port: 80,
      listen_port: 8042,
      script: '<script>alert("hi")</script>',
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
    host:    config.host,
    method:  frontendReq.method,
    path:    frontendReq.url,
    headers: frontendReq.headers,
  }

  // Make request
  var backendReq = http.request(opts, function(backendRes) {
    var headers       = backendRes.headers,
        statusCode    = backendRes.statusCode,
        contentType   = headers['content-type'],
        contentLength = headers['content-length'];

    if (contentType === 'text/html') {
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
