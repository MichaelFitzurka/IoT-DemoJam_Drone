/*jslint node: true, vars: true */

(function () {
    'use strict';

    // Route traffic for AMQ-mqtt-tcp.
    var tcpProxy = require('tcp-proxy'),
        tcpAmqServer = tcpProxy.createServer({
            target: {
                host: 'iotdj-datacenter',
                port: 30616
            }
        });
    tcpAmqServer.listen(61616);
    console.info('AMQ MQTT TCP Proxy Started.');

    // Stop gracefully on Ctrl-C.
    process.on('SIGINT', function () {
        process.exit();
    });

}());
