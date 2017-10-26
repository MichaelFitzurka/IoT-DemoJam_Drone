# IoT-DemoJam_Drone
Internet of Things DemoJam :: Drone

---
Based on: https://cylonjs.com/documentation/examples/cylon/js/leap_ardrone/  
Modified for the Bebop 2 Drone and DemoJam theatrics.

Hardware needed:
- Parrot Bebop Drone 2: https://www.parrot.com/us/drones/parrot-bebop-2
- Leap Motion Controller: https://www.leapmotion.com/
- FAA Resgistration for Unmanned Aircraft Systems: https://www.faa.gov/uas/getting_started/
- Fishing/Safety net

Software needed:
- NodeJS (https://nodejs.org/en/)
- VLC (https://www.videolan.org/)
- Mbrola (http://tcts.fpms.ac.be/synthesis/mbrola.html)
- UK Voice File (http://tcts.fpms.ac.be/synthesis/mbrola/dba/en1/en1-980910.zip) - I thought the drone was most amusing with a British accent.

## Notes:
This project became a bit of a catch-all for the [IoT-DemoJam](https://github.com/MichaelFitzurka/IoT-DemoJam) ecosystem.
The [NodeJS](https://nodejs.org/en/)/[Cylon.js](https://cylonjs.com/) application:
- Hosts a web page for the drone with mirrored log output to the screen,
- Hosts sound files for the web page here and on [BPMS](https://github.com/MichaelFitzurka/IoT-DemoJam_Datacenter_BPMS),
- Controls the drone flight via a Leap Motion Controller and/or through keyboard commands,
- Sends data to [Alexa](https://github.com/MichaelFitzurka/IoT-DemoJam_Alexa) via REST calls and by sending an AWS SNS,
- Gives a voice to the drone through espeak and mbrola,
- Routes the drone video through VLC,
- And interacts with the sensors via web page display and direct light manipulation for worst case scenarios.

### Folders:
- iotdj-dronecam - This folder contains the compressed HTML, JavaScript and CSS files for use in the demo.  
> CSS Compression: https://css.github.io/csso/csso.html  
> HTML Minifier: http://kangax.github.io/html-minifier/  
> JS Hint Online: http://jshint.com/  
> JS Validator: https://codebeautify.org/jsvalidate  
> JS Compressor: https://jscompress.com/
- iotdj-dronecam-raw - This folder contains the raw HTML, JavaScript and CSS files in a more readable format.  
  I included the external javascript files in the project so that you could potentially run this without internet connectivity.  
  The files are from:  
> browser.console.mirror.js: https://www.npmjs.com/package/console-mirroring  
> leap.rigged-hand-0.1.7.min.js: https://github.com/leapmotion/leapjs-rigged-hand  
> leap-0.6.4.min.js: https://developer-archive.leapmotion.com/javascript  
> leap-plugins-0.1.12.min.js: https://developer-archive.leapmotion.com/javascript  
> socket.io-1.4.5.js: https://socket.io/blog/socket-io-1-4-5/#  
> three.min.js: https://threejs.org/
- node_modules_modifications - This folder contains changes to three node_modules that get downloaded by:
```sh
npm install
```
You will need to copy these files over the files that get downloaded into the node_modules folder by:
```sh
cp -rf node_modules_modifications/* node_modules
```

### Files:
- iotdj-drone.js - The main controller.
- iotdj-no-drone.js - A copy of the iotdj-drone.js file with all cylon-bebop controls commented out.  
  This is helpful for when you want to test out the application without being WiFi connected to the drone.
- iotdj-tcp-proxy.js - This file is not drone related, but is needed to route TCP traffic from the Smart Gateway to the Datacenter CDK/KVM virtual machines.

### Controls:
#### Keyboard Controls (on NodeJS terminal or on web page):
| Key | Description |
| :---: | :--- |
| D | Sends live **D**ata values to AWS/Alexa |
| E | Perform a drone camera **E**ye roll |
| F | Says "I'm hit!" for if/when the drone crashes; **F**! |
| L | Tells the drone to **L**and |
| P | Takes a drone **P**icture |
| Q | **Q**uit the application (only from NodeJS terminal) |
| R | Tells the drone to **R**ecord video (on/off) |
| S | Tells the drone to **S**top/hover |
| T | Tells the drone to **T**akeoff |
| V | Tells the drone to stream **V**ideo via SDP (on/off) |
| X | Sends default data values to AWS/Ale**x**a |
| 0 | Drone's Sound Check |
| 1 | Drone's **first** line: Intruder detected |
| 2 | Drone's **second** line: Nuke denied + eye roll |
| 3 | Drone's **third** line: Scare intruder + send data to AWS/Alexa |
| 4 | Manually turn yellow sensor light on |
| 5 | Manually turn yellow sensor light off |
| 6 | Manually turn green sensor light on |
| 7 | Manually turn green sensor light off |
| 8 | Manually turn blue sensor light on |
| 9 | Manually turn blue sensor light off |
| space | Ignore hand positioning for piloting drone (on/off) |
| right | Tells the drone to do a **Right** flip |
| left | Tells the drone to do a **Left** flip |
| up | Tells the drone to do a Front flip |
| down | Tells the drone to do a Back flip |
| home | Tells the drone to fly in a straight line back to the takeoff point |
| Ctrl-C | Quit the application (only from NodeJS terminal) |

#### Leap Controls (on NodeJS terminal or on web page):
| [Gesture Controls](https://developer.leapmotion.com/documentation/csharp/devguide/Leap_Gestures.html) (Always work) | Description |
| :--- | :--- |
| Clockwise Circle | Tells the drone to **Takeoff** |
| Couter-clockwise Circle | Tells the drone to **Land** |
| Key Tap (quick down and back) | Tells the drone to **Stop/hover** |
| Screen Tap (quick forward and back) | Tells the drone to **Stop/hover** |

| Hand Position Controls (Can be suspended) | Description |
| :--- | :--- |
| Flat hand, rotated clockwise | Tells the drone to **rotate clockwise** |
| Flat hand, rotated counter-clockwise | Tells the drone to **rotate counter-clockwise** |
| Raise hand from sensor | Tells the drone to fly **Up** |
| Lower hand toward sensor | Tells the drone to fly **Down** |
| Angle hand, fingers down | Tells the drone to fly **Forward** |
| Angle hand, fingers up | Tells the drone to fly **Backward** |
| Angle hand, right side lower | Tells the drone to fly to the **Right** |
| Angle hand, left side lower | Tells the drone to fly to the **Left** |

#### Flight Control Notes:
Although fully functional, the controls are difficult to use on stage.  Right and left are relative to the drone camera, so it requires a bit of three dimensional thinking, while you are controlling the drone dialog, facing the audience and trying to keep your hand from shaking because you are nervous and it registers those shakes as flight commands.  Plus, with everything else running for the demo on your laptop and 1.6 MBs of JavaScript, it is a bit slow to register commands.

The fishing net is part joke and part important safety equipment.  Even with turning off the relative hand positions as flight controls (with the space key), air currents indoors from air conditioning can cause the drone to drift.  Wow them, go quick through the dialog, and then land.

### Code Flags:
Lines 9-11 of [iotdj-drone.js](https://github.com/MichaelFitzurka/IoT-DemoJam_Drone/blob/master/iotdj-drone.js) and [iotdj-no-drone.js](https://github.com/MichaelFitzurka/IoT-DemoJam_Drone/blob/master/iotdj-no-drone.js) are convenient code flags.

| Flag | if true | if false |
| :---: | :--- | :--- |
| DEBUG_MODE | Shows all messages | Hides most messages, even errors.  Still shows messages that you would want to show the audience on screen. |
| FLIGHT_MODE (iotdj-drone.js) | Controls will fly the drone | Video and camera functions will work, but the drone will not fly.  Good for coding/testing in the office. |
| FLIGHT_MODE (iotdj-no-drone.js) | Drone commented out, so no flight | Drone commented out.  Good for coding/testing without the drone. |
| PUBLISH_MODE | Will collect and send data to AWS | Will still collect the data, but not send it AWS, to reduce costs. |

### REST API Keys:
In both [iotdj-drone.js](https://github.com/MichaelFitzurka/IoT-DemoJam_Drone/blob/master/iotdj-drone.js) and [iotdj-no-drone.js](https://github.com/MichaelFitzurka/IoT-DemoJam_Drone/blob/master/iotdj-no-drone.js), there are REST API calls to the IoT DemoJam ecosystem to collect status and deliver it to Alexa.  
You will need to generate a few keys and update the values for your system.  
See the [README.md](https://github.com/MichaelFitzurka/IoT-DemoJam_Alexa/blob/master/README.md) from the [IoT-DemoJam_Alexa](https://github.com/MichaelFitzurka/IoT-DemoJam_Alexa) project for more information.

Lines 23 & 24: You will need to configure the AWS object to talk to your SNS.  Follow the steps [here](http://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html) to create your accessKeyId and secretAccessKey.

Line 42: You will need the ARN of your AWS SNS.  If you don't have it written down, you can find it [here](https://console.aws.amazon.com/sns/v2/home?region=us-east-1#/topics).

Line 68: You will need a Service Account Token from CDK/OpenShift.  See https://docs.openshift.com/container-platform/3.5/rest_api/index.html#rest-api-serviceaccount-tokens and/or the [README-Datacenter-OCP.md](https://github.com/MichaelFitzurka/IoT-DemoJam/blob/master/README-Datacenter-OCP.md) from the [IoT-DemoJam](https://github.com/MichaelFitzurka/IoT-DemoJam) project for more information.
