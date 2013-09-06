var http = require('http')
var stream = require('stream')

config =
    { host: 'google.com'
    , target_port: 80
    , listen_port: 8042
    }

console.log( "Forwarding Requests to: " + config.host )
console.log( "Listening at Port: " + config.listen_port )

http.createServer(
    function( frontEndRequest, frontEndResponse ) {

        frontEndRequest.headers["accept-encoding"] = ""

        var backEndRequest =
            http.request
                ( { port: config.target_port
                  , host: config.host
                  , method: frontEndRequest.method
                  , path: frontEndRequest.url
                  , headers: frontEndRequest.headers
                  }
                , function( backEndResponse ) {

                    backEndResponse.on
                        ( 'data'
                        , function(chunk) {
                            frontEndResponse.write(chunk, "binary")
                          }
                        )

                    backEndResponse.on
                        ( 'end'
                        , function() {
                            frontEndResponse.end()
                          }
                        )
                    frontEndResponse.writeHead
                        ( backEndResponse.statusCode
                        , backEndResponse.headers
                        )
                  }
                )


        var frontEndRequestStream = []
        frontEndRequest.on
            ( 'data'
            , function(chunk) {
                frontEndRequestBuffer.push(chunk)
              }
            )

        frontEndRequest.on
            ( 'end'
            , function() {
                backEndRequest.write
                    ( frontEndRequestBuffer.join("")
                    , 'binary'
                    )
                backEndRequest.end()
              }
            )
    }

).listen(config.listen_port)
