/*jslint browser: true, devel: true, vars: true */
/*global Leap, THREE, io, consoleMirroring */

var IoTDJ = window.IoTDJ || {};

(function () {
    'use strict';

    // Show Leap Rigged Hand
    window.controller = new Leap.Controller();
    window.controller.use('riggedHand', {
        checkWebGL: true
    }).connect();
    window.controller.setBackground(true);
    window.controller.plugins.riggedHand.camera.lookAt(new THREE.Vector3(0, 150, 0));

    // Play Live Video Stream
    var videoBackground = document.getElementById("video-background"),
        videoStream = document.getElementById("video-stream");
    console.log(videoStream.getAttribute("src"));
    videoStream.setAttribute("src", "http://localhost:9081/stream?t=" + new Date().getTime());
    console.log(videoStream.getAttribute("src"));
    videoBackground.load();
    videoBackground.play();

    // Display Console Log
    var socket = io.connect('http://' + location.host, {
        'reconnect': true,
        'reconnection delay': 50,
        'max reconnection attempts': 300
    });
    consoleMirroring.init({
        socketLib: socket,
        containerId: 'console',
        fullScreen: false,
        border: false
    });

    // Send Keyboard Commands to Server/Socket.IO
    document.onkeydown = function (event) {
        socket.emit("key", String.fromCharCode(event.which || event.keyCode));
    };

    // Status Buttons
    var statusButton = '';
    IoTDJ.statusButtonOnclick = function statusButtonOnclick(newStatusButton) {
        document.getElementById('statusY').className = 'action-button shadow animate yellow';
        document.getElementById('statusG').className = 'action-button shadow animate green';
        document.getElementById('statusB').className = 'action-button shadow animate blue';
        if (newStatusButton === statusButton) {
            statusButton = '';
            document.getElementById('status').style.visibility = 'hidden';
        } else if (newStatusButton === 'Y' || newStatusButton === 'G' || newStatusButton === 'B') {
            statusButton = newStatusButton;
            document.getElementById('status').style.visibility = 'visible';
            if (newStatusButton === 'Y') {
                document.getElementById('statusY').className = 'action-button shadow animate yellow-selected';
            } else if (newStatusButton === 'G') {
                document.getElementById('statusG').className = 'action-button shadow animate green-selected';
            } else if (newStatusButton === 'B') {
                document.getElementById('statusB').className = 'action-button shadow animate blue-selected';
            }
        }
    };

    IoTDJ.takePicture = function takePicture() {
        socket.emit("key", "P");
    };

}());
