/*jslint node: true, vars: true, nomen: true */

(function () {
    'use strict';

    var request = require('request'),
        sleep = require('system-sleep'),
        spawn = require('child_process').spawn,
        DEBUG_MODE = true,
        FLIGHT_MODE = false,
        PUBLISH_MODE = false,
        handEnabled = true,
        vlc = null, // Setup camera feed through VLC.
        videoEnabled = 0,
        videoRecording = 0;

    // Support Functions.

    function sendAwsSns(datacenterPodCount, gatewayContainerCount, sensorCount, taskCount, maxTemp) {
        var AWS = require('aws-sdk');

        AWS.config.update({
            accessKeyId: "***Your-accessKeyId-Here***",
            secretAccessKey: "***Your-secretAccessKey-Here***",
            region: "us-east-1"
        });

        var sns = new AWS.SNS(),
            payload = {
                datacenterPodCount: datacenterPodCount,
                gatewayContainerCount: gatewayContainerCount,
                sensorCount: sensorCount,
                taskCount: taskCount,
                maxTemp: maxTemp
            };

        console.info('Payload: ' + JSON.stringify(payload));

        if (PUBLISH_MODE) {
            sns.publish({
                Message: JSON.stringify(payload),
                TopicArn: 'arn:aws:sns:us-east-1:***Your-ID-Here***:iotdj-aws-sns'
            }, function (error, data) {
                if (error) {
                    if (DEBUG_MODE) { console.error(error.stack + '\n' + data); }
                    return;
                }
                console.info('Payload sent to AWS.');
            });
        } else {
            if (DEBUG_MODE) { console.info('Payload NOT sent to AWS - cheapskate.'); }
        }
    }

    // NOTE: This would "work" better as a scheduled task, but to keep AWS prices low, its on demand by key-press.
    function sendDataToAlexa() {
        var datacenterPodCount = 0,
            gatewayContainerCount = 0,
            sensorCount = 0,
            taskCount = 0,
            maxTemp = 0;

        // Get datacenterPodCount from OpenShift
        request({
            url: 'https://iotdj-datacenter:8443/api/v1/namespaces/iotdj-docp/pods',
            timeout: 5000,
            auth: {
                bearer: '***Your-bearer-auth-Here***'
            },
            strictSSL: false
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                datacenterPodCount = (body.match(/Running/g) || []).length;
            } else {
                if (DEBUG_MODE) { console.error('OpenShift Body ' + body + '\n' + error.stack); }
            }
        });

        // Get gatewayContainerCount from Docker
        request({
            url: 'http://iotdj-smartgateway:2375/containers/json',
            timeout: 5000
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                gatewayContainerCount = (body.match(/\"Id\":/g) || []).length;
            } else {
                if (DEBUG_MODE) { console.error('Docker Body ' + body + '\n' + error.stack); }
            }
        });

        // Get sensorCount && maxTemp from Sensors URLs
        request({
            url: 'http://iotdj-sensor-yellow/maxTemp',
            timeout: 5000
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                sensorCount += 1;
                if (parseInt(body, 10) > maxTemp) {
                    maxTemp = parseInt(body, 10);
                }
            } else {
                if (DEBUG_MODE) { console.error('Yellow Sensor Body ' + body + '\n' + error.stack); }
            }
        });
        request({
            url: 'http://iotdj-sensor-green/maxTemp',
            timeout: 5000
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                sensorCount += 1;
                if (parseInt(body, 10) > maxTemp) {
                    maxTemp = parseInt(body, 10);
                }
            } else {
                if (DEBUG_MODE) { console.error('Green Sensor Body ' + body + '\n' + error.stack); }
            }
        });
        request({
            url: 'http://iotdj-sensor-blue/maxTemp',
            timeout: 5000
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                sensorCount += 1;
                if (parseInt(body, 10) > maxTemp) {
                    maxTemp = parseInt(body, 10);
                }
            } else {
                if (DEBUG_MODE) { console.error('Blue Sensor Body ' + body + '\n' + error.stack); }
            }
        });

        // Get taskCount from BPMS server
        request({
            url: 'http://iotdj-laptop:8080/business-central/rest/task/query',
            auth: {
                user: 'psteiner',
                pass: 'change12_me'
            },
            timeout: 5000
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                taskCount = (body.match(/<id>/g) || []).length;
                taskCount -= 2; // minus 1 for staged task and 1 task not yet closed.
                if (taskCount < 0) { taskCount = 0; }
            } else {
                if (DEBUG_MODE) { console.error('BPMS Body ' + body + '\n' + error.stack); }
            }
        });

        // Let all callbacks occur
        sleep(10000);

        sendAwsSns(datacenterPodCount, gatewayContainerCount, sensorCount, taskCount, maxTemp);
    }

    function backFlip(drone) {
        console.info('Command: backFlip');
        if (FLIGHT_MODE) { drone.backFlip(); }
    }

    function changeSensorLightState(sensor, state) {
        if (DEBUG_MODE) { console.info('Turning ' + sensor + ' light ' + state + '.'); }
        request({
            url: 'http://iotdj-sensor-' + sensor + '/light?state=' + state,
            timeout: 5000
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                if (DEBUG_MODE) { console.log('Success.'); }
            } else {
                if (DEBUG_MODE) { console.error('Body: ' + body + '\n' + error.stack); }
            }
        });
    }

    function eyeRoll(camera) {
        // pan: up 20 to down -90
        // tilt: right 40 to left -40
//        camera.orientation(0, 0);
        sleep(100);
//        camera.orientation(0, -10);
        sleep(100);
//        camera.orientation(0, -20);
        sleep(100);
//        camera.orientation(5, -30);
        sleep(100);
//        camera.orientation(10, -20);
        sleep(100);
//        camera.orientation(15, -10);
        sleep(100);
//        camera.orientation(20, 0);
        sleep(100);
//        camera.orientation(15, 10);
        sleep(100);
//        camera.orientation(10, 20);
        sleep(100);
//        camera.orientation(5, 30);
        sleep(100);
//        camera.orientation(0, 20);
        sleep(100);
//        camera.orientation(0, 10);
        sleep(100);
//        camera.orientation(0, 0);
    }

    function frontFlip(drone) {
        console.info('Command: frontFlip');
//        if (FLIGHT_MODE) { drone.frontFlip(); }
    }

    function land(drone) {
        console.info('Command: land');
//        if (FLIGHT_MODE) { drone.land(); }
    }

    function leftFlip(drone) {
        console.info('Command: leftFlip');
//        if (FLIGHT_MODE) { drone.leftFlip(); }
    }

    function navigateHome(piloting) {
        console.info('Command: navigateHome');
//        if (FLIGHT_MODE) { piloting.navigateHome(1); }
    }

    function rightFlip(drone) {
        console.info('Command: rightFlip');
//        if (FLIGHT_MODE) { drone.rightFlip(); }
    }

    function sayImHit(voice) {
        voice.say('I\'m hit!  Go on without me.');
        console.log('<h2><i>Drone:</i> <span style="color:red">I\'m HIT!</span></h2>');
        sleep(700);
        console.log('<h2><i>Drone:</i> Go on without me. <span style="color:purple">(✖╭╮✖)</span></h2>');
    }

    function sayIntruderDetected(voice) {
        voice.say('Intruder detected!  He appears to be armed!  With.  A fishing net?  Shall I nuke the site from orbit?');
        console.log('<h2><i>Drone:</i> <span style="color:red">⚠️ Intruder detected! ⚠️</span></h2>');
        sleep(1200);
        console.log('<h2><i>Drone:</i> He appears to be armed!</h2>');
        sleep(1500);
        console.log('<h2><i>Drone:</i> With ... <span style="color:purple">O.o</span> ... a fishing net!?!?</h2>');
        sleep(2200);
        console.log('<h2><i>Drone:</i> Shall I <span style="color:yellow">☢</span> nuke <span style="color:yellow">☢</span> the site from orbit?</h2>');
    }

    function sayNukeDenied(voice, camera) {
        eyeRoll(camera);
        voice.say('But?  It\'s the only way to be sure.');
        console.log('<h2><i>Drone:</i> But?! <span style="color:red">&nbsp; ̿\'̿\'\\̵͇̿̿\\з=( ͠° ͟ʖ ͡°)=ε/̵͇̿̿/\'̿̿ ̿ ̿ ̿ ̿ ̿</span></h2>');
        sleep(500);
        console.log('<h2><i>Drone:</i> It\'s the only way to be sure.</h2>');
    }

    function sayStopBlowing(voice) {
        voice.say('Okay.  Hey!  Intruder!  Stop blowing that sensor!');
        console.log('<h2><i>Drone:</i> <span style="color:green">👌 ¯\\_(ツ)_/¯</span></h2>');
        sleep(500);
        console.log('<h2><i>Drone:</i> Hey!</h2>');
        sleep(800);
        console.log('<h2><i>Drone:</i> <span style="color:red">⚠️ Intruder! ⚠️</span></h2>');
        sleep(1200);
        console.log('<h2><i>Drone:</i> <span style="color:red">🛑</span> Stop <i>blowing</i> that sensor! <span style="color:red">🛑</span></h2>');
        sendDataToAlexa();
    }

    function saySoundCheck(voice) {
        voice.say('Testing, testing.  Check one, check one.  Sibilance, sibilance.');
    }

    function stopVLC() {
        if (!!vlc) {
//            vlc.kill('SIGINT');
            vlc = null;
        }
        videoEnabled = 0;
    }

    function startVLC() {
        stopVLC();

//        vlc = spawn('cvlc', ['bebop2.sdp', ':network-caching=1000',
//            ':sout=#transcode{vcodec=theo,vb=1600,scale=1,acodec=none}:http{mux=ogg,dst=:9081/stream}']);
//        vlc.on('exit', function (code, signal) {
//            console.log('child process exited with code ' + code + ' and signal ' + signal);
//        });
//        vlc.stdout.on('data', (data) => {
//            console.log('child stdout:\n' + data);
//        });
//        vlc.stderr.on('data', (data) => {
//            console.error('child stderr:\n' + data);
//        });
        videoEnabled = 1;
    }

    function stopDrone(drone) {
        console.info('Command: stop');
//        if (FLIGHT_MODE) { drone.stop(); }
    }

    function takeOff(drone) {
        console.info('Command: takeOff');
//        if (FLIGHT_MODE) { drone.takeOff(); }
    }

    function takePicture(media) {
        console.info('State: Picture Taken');
//        media.pictureV2();
    }

    function toggleHand(drone) {
        handEnabled = !handEnabled;
        console.info('State: handEnabled(' + handEnabled + ')');
        stopDrone(drone);
    }

    function toggleRecording(media) {
        if (videoEnabled === 1 && videoRecording === 0) {
            videoRecording = 1;
        } else {
            videoRecording = 0;
        }
        console.info('State videoRecording(' + videoRecording + ')');
//        media.videoV2(videoRecording);
    }

    function toggleVideo(video) {
        if (videoEnabled === 0) {
            startVLC();
        } else {
            stopVLC();
        }
        console.info('State: videoEnable(' + videoEnabled + ')');
//        video.videoEnable(videoEnabled);
    }

    // Serve up web page with 2-way socket communication.
    var express = require('express'),
        app = express(),
        server = require('http').createServer(app),
        io = require('socket.io')(server);
    app.use('/', express.static(__dirname + '/'));
    server.listen(process.env.PORT || 9080);
    require('console-mirroring')(io);

    // Stop gracefully on Ctrl-C.
    process.on('SIGINT', function () {
        stopVLC();
        process.exit();
    });

    // Control drone.
    var cylon = require('cylon'),
        TURN_TRESHOLD = 0.2,
        TURN_SPEED_FACTOR = 200.0, // 2.0,
        DIRECTION_THRESHOLD = 0.25,
        DIRECTION_SPEED_FACTOR = 1.5, // 0.05,
        UP_CONTROL_THRESHOLD = 50,
        UP_SPEED_FACTOR = 0.5, // 0.01,
        CIRCLE_THRESHOLD = 1.5,
        handStartPosition = [],
        handStartDirection = [],
        handWasClosedInLastFrame = false;

    cylon.robot({

        connections: {
            speech: { adaptor: 'speech' },
//            bebop : { adaptor: 'bebop' },
            keyboard: { adaptor: 'keyboard' },
            leapmotion: { adaptor: 'leapmotion', background: true }
        },

        devices: {
            voice: { driver: 'speech', voice: 'mb-en1', speed: 130 },
//            drone: { driver: 'bebop', connection: 'bebop' },
//            camera: { driver: 'camera', connection: 'bebop' },
//            common: { driver: 'common', connection: 'bebop' },
//            media: { driver: 'media-record', connection: 'bebop' },
//            picture: { driver: 'picture-settings', connection: 'bebop' },
//            piloting: { driver: 'piloting', connection: 'bebop' },
//            speed: { driver: 'speed-settings', connection: 'bebop' },
//            video: { driver: 'media-streaming', connection: 'bebop' },
            keyboard: { driver: 'keyboard', connection: 'keyboard' },
            leapmotion: { driver: 'leapmotion', connection: 'leapmotion' }
        },

        work: function (my) {
            // Drone init.
//            my.drone.on('ready', function () {
//                console.info('State: ready');

//                my.drone.on('battery', function (result) { console.info('Battery: ' + result + '%'); });
//                my.drone.on('takingOff', function () { console.info('State: takingOff'); });
//                my.drone.on('hovering', function () { console.info('State: hovering'); });
//                my.drone.on('flying', function () { console.info('State: flying'); });
//                my.drone.on('landing', function () { console.info('State: landing'); });
//                my.drone.on('landed', function () { console.info('State: landed'); });
//                my.drone.on('unknown', function (data) { if (DEBUG_MODE) { console.warn('State: unknown', data); } });
//                my.drone.on('FlatTrimChanged', function () { console.info('State: Flat Trim Acknowledged.'); });

//                var today = new Date().toISOString();
//                my.common.currentDate(today);
//                my.common.currentTime(today);

//                my.camera.orientation(0, 0);

//                my.video.videoStreamMode(0); // 0 = enabled: Video streaming is enabled.
//                my.picture.videoStabilizationMode(3); // 3 = none: Video follows drone angles
//                my.picture.videoResolutions(0); // 0 = rec1080_stream480: 1080p recording, 480p streaming.
//                my.media.video(0); // 0 turn off recording just in case
//                my.media.videoV2(0); // 0 turn off recording just in case

//                my.piloting.flatTrim();
//                my.speed.outdoor(0); // 1 if outdoor flight, 0 if indoor flight
//            });

            // Direct Keyboard commands.
            my.keyboard.on('q', function () {
                stopVLC();
                process.exit();
            });

            my.keyboard.on('0', function () { saySoundCheck(my.voice); });
            my.keyboard.on('1', function () { sayIntruderDetected(my.voice); });
            my.keyboard.on('2', function () { sayNukeDenied(my.voice, my.camera); });
            my.keyboard.on('3', function () { sayStopBlowing(my.voice); });
            my.keyboard.on('4', function () { changeSensorLightState('yellow', 'on'); });
            my.keyboard.on('5', function () { changeSensorLightState('yellow', 'off'); });
            my.keyboard.on('6', function () { changeSensorLightState('green', 'on'); });
            my.keyboard.on('7', function () { changeSensorLightState('green', 'off'); });
            my.keyboard.on('8', function () { changeSensorLightState('blue', 'on'); });
            my.keyboard.on('9', function () { changeSensorLightState('blue', 'off'); });
            my.keyboard.on('d', function () { sendDataToAlexa(); });
            my.keyboard.on('e', function () { eyeRoll(my.camera); });
            my.keyboard.on('f', function () { sayImHit(my.voice); });
            my.keyboard.on('l', function () { land(my.drone); });
            my.keyboard.on('p', function () { takePicture(my.media); });
            my.keyboard.on('r', function () { toggleRecording(my.media); });
            my.keyboard.on('s', function () { stopDrone(my.drone); });
            my.keyboard.on('t', function () { takeOff(my.drone); });
            my.keyboard.on('v', function () { toggleVideo(my.video); });
            my.keyboard.on('x', function () { sendAwsSns(4, 2, 3, 0, 32); });
            my.keyboard.on('space', function () { toggleHand(my.drone); });

            my.keyboard.on('right', function () { rightFlip(my.drone); });
            my.keyboard.on('left', function () { leftFlip(my.drone); });
            my.keyboard.on('up', function () { frontFlip(my.drone); });
            my.keyboard.on('down', function () { backFlip(my.drone); });

            my.keyboard.on('home', function () { navigateHome(my.piloting); });

            // keyboard commands from web page / socket.io.
            io.on('connection', function (socket) {
                socket.on('key', function (key) {
                    if (key === '0') {
                        saySoundCheck(my.voice);
                    } else if (key === '1') {
                        sayIntruderDetected(my.voice);
                    } else if (key === '2') {
                        sayNukeDenied(my.voice, my.camera);
                    } else if (key === '3') {
                        sayStopBlowing(my.voice);
                    } else if (key === '4') {
                        changeSensorLightState('yellow', 'on');
                    } else if (key === '5') {
                        changeSensorLightState('yellow', 'off');
                    } else if (key === '6') {
                        changeSensorLightState('green', 'on');
                    } else if (key === '7') {
                        changeSensorLightState('green', 'off');
                    } else if (key === '8') {
                        changeSensorLightState('blue', 'on');
                    } else if (key === '9') {
                        changeSensorLightState('blue', 'off');
                    } else if (key === 'D') {
                        sendDataToAlexa();
                    } else if (key === 'E') {
                        eyeRoll(my.camera);
                    } else if (key === 'F') {
                        sayImHit(my.voice);
                    } else if (key === 'L') {
                        land(my.drone);
                    } else if (key === 'P') {
                        takePicture(my.media);
                    } else if (key === 'R') {
                        toggleRecording(my.media);
                    } else if (key === 'S') {
                        stopDrone(my.drone);
                    } else if (key === 'T') {
                        takeOff(my.drone);
                    } else if (key === 'V') {
                        toggleVideo(my.video);
                    } else if (key === 'X') {
                        sendAwsSns(4, 2, 3, 0, 32);
                    } else if (key === ' ') {
                        toggleHand(my.drone);
                    } else if (key === '\'') {
                        rightFlip(my.drone);
                    } else if (key === '%') {
                        leftFlip(my.drone);
                    } else if (key === '&') {
                        frontFlip(my.drone);
                    } else if (key === '(') {
                        backFlip(my.drone);
                    } else if (key === '$') {
                        navigateHome(my.piloting);
                    } else if (DEBUG_MODE) {
                        console.log('Unmapped Key: ' + key);
                    }
                });
            });

            // Leap commands.
            my.leapmotion.on('gesture', function (gesture) {
                var type = gesture.type,
                    state = gesture.state,
                    progress = gesture.progress,
                    stop = (state === 'stop');

                if (type === 'circle' && stop && progress > CIRCLE_THRESHOLD) {
                    if (gesture.normal[2] < 0) {
                        takeOff(my.drone);
                    }

                    if (gesture.normal[2] > 0) {
                        land(my.drone);
                    }
                }

                // emergency stop
                if (type === 'keyTap' || type === 'screenTap') {
                    stopDrone(my.drone);
                }
            });

            my.leapmotion.on('hand', function (hand) {
                var signal,
                    value,
                    handOpen = !!hand.fingers.filter(function (f) {
                        return f.extended;
                    }).length;

                if (handEnabled && handOpen) {
                    if (handWasClosedInLastFrame) {
                        handStartPosition = hand.palmPosition;
                        handStartDirection = hand.direction;
                    }

                    var horizontal = Math.abs(handStartDirection[0] - hand.direction[0]),
                        vertical = Math.abs(hand.palmPosition[1] - handStartPosition[1]);

                    // TURNS
                    if (horizontal > TURN_TRESHOLD) {
                        signal = handStartDirection[0] - hand.direction[0];
                        value = (horizontal - TURN_TRESHOLD) * TURN_SPEED_FACTOR;

                        if (signal > 0) {
                            console.info('Command: counterClockwise(' + value + ')');
                            if (FLIGHT_MODE) { my.drone.counterClockwise(value); }
                        }

                        if (signal < 0) {
                            console.info('Command: clockwise(' + value + ')');
                            if (FLIGHT_MODE) { my.drone.clockwise(value); }
                        }
                    }

                    // UP and DOWN
                    if (vertical > UP_CONTROL_THRESHOLD) {
                        if ((hand.palmPosition[1] - handStartPosition[1]) >= 0) {
                            signal = 1;
                        } else {
                            signal = -1;
                        }

                        value = Math.round(vertical - UP_CONTROL_THRESHOLD) * UP_SPEED_FACTOR;

                        if (signal > 0) {
                            console.info('Command: up(' + value + ')');
                            if (FLIGHT_MODE) { my.drone.up(value); }
                        }

                        if (signal < 0) {
                            console.info('Command: down(' + value + ')');
                            if (FLIGHT_MODE) { my.drone.down(value); }
                        }
                    }

                    // DIRECTION FRONT/BACK
                    if ((Math.abs(hand.palmNormal[2]) > DIRECTION_THRESHOLD)) {
                        if (hand.palmNormal[2] > 0) {
                            value = Math.abs(Math.round(hand.palmNormal[2] * 10 + DIRECTION_THRESHOLD) *
                                    DIRECTION_SPEED_FACTOR);

                            console.info('Command: forward(' + value + ')');
                            if (FLIGHT_MODE) { my.drone.forward(value); }
                        }

                        if (hand.palmNormal[2] < 0) {
                            value = Math.abs(Math.round(hand.palmNormal[2] * 10 - DIRECTION_THRESHOLD) *
                                    DIRECTION_SPEED_FACTOR);

                            console.info('Command: backward(' + value + ')');
                            if (FLIGHT_MODE) { my.drone.backward(value); }
                        }
                    }

                    // DIRECTION LEFT/RIGHT
                    if (Math.abs(hand.palmNormal[0]) > DIRECTION_THRESHOLD) {
                        if (hand.palmNormal[0] > 0) {
                            value = Math.abs(Math.round(hand.palmNormal[0] * 10 + DIRECTION_THRESHOLD) *
                                    DIRECTION_SPEED_FACTOR);

                            console.info('Command: left(' + value + ')');
                            if (FLIGHT_MODE) { my.drone.left(value); }
                        }

                        if (hand.palmNormal[0] < 0) {
                            value = Math.abs(Math.round(hand.palmNormal[0] * 10 - DIRECTION_THRESHOLD) *
                                    DIRECTION_SPEED_FACTOR);

                            console.info('Command: right(' + value + ')');
                            if (FLIGHT_MODE) { my.drone.right(value); }
                        }
                    }

                    // AUTO FREEZE
                    if (// within left/right threshold
                        (Math.abs(hand.palmNormal[0]) < DIRECTION_THRESHOLD) &&
                            // within forward/back threshold
                            (Math.abs(hand.palmNormal[2]) < DIRECTION_THRESHOLD) &&
                            // within up/down threshold
                            Math.abs(hand.palmPosition[1] - handStartPosition[1]) < UP_CONTROL_THRESHOLD &&
                            // within turn threshold
                            Math.abs(handStartDirection[0] - hand.direction[0]) < TURN_TRESHOLD
                    ) {
                        stopDrone(my.drone);
                    }
                }

                if (!handOpen && !handWasClosedInLastFrame) {
                    stopDrone(my.drone);
                }

                handWasClosedInLastFrame = !handOpen;
            });
        }
    }).start();

}());
