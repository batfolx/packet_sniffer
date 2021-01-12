let pcap = require("pcap");
let io = require('socket.io-client');
let config = require('./config');
let data_utils = require('./calculate_user');
let socket = io.connect(`${config.proto}://${config.host}:${config.port}`, {reconnect: true});


// set device name here
let pcapSession = pcap.createSession(config.device, {monitor: true});

console.log("Listening on " + pcapSession.device_name);

// start listening for packet events
pcapSession.on('packet', function (raw_packet) {
    // wrap in try catch, sometimes decoding the packet fails
    try {
        let packet = pcap.decode.packet(raw_packet);
        let senderMacAddress = packet.payload.ieee802_11Frame.shost;
        let destinationMacAddress = packet.payload.ieee802_11Frame.dhost;
        let strength = packet.payload.ieee802_11Frame.strength;
        //console.log("This radioframe", packet.payload.ieee802_11Frame.bssid);
        //console.log("Sent from: ",senderMacAddress.toString(), "Sent to: ", destinationMacAddress.toString(), );

        // write the packets to the dictionary
        // hopefully doesn't overflow RAM
        // each key will be assigned an epoch number so as to update the server
        // of the new number. if the last time sent was at least
        // x amount of time, we will remove it from the dictionary
        // to free up memory and space
        // divide it by 1000 to get seconds since epoch
        data_utils.packets[senderMacAddress.toString()] = Date.now() / 1000;

    } catch (e) {
        // if something went wrong, probably because of the RadioFrame being weird,
        // so do nothing
    }

});

// every x amount of seconds
// fire off a websocket packet to the server
// calculating the amount of people
// in the vicinity
setInterval(function () {
    // get current time in seconds since epoch
    let now = Date.now() / 1000;
    for (let user in data_utils.packets) {
        try {
            let lastTimeUpdated = data_utils.packets[user];


            // if x amount of seconds have happened since
            // we last heard from a user, delete from the
            // dictionary

            //console.log("Now",now, "lastTime", lastTimeUpdated, "and them subtracted", now - lastTimeUpdated);
            if (now - lastTimeUpdated > config.timeout) {
                // remove them from the dictionary
                delete data_utils.packets[user];
                //console.log("Removing from dict");
            }
        } catch (e) {

        }

    }

    // estimate is simply the collected number of MAC addresses
    let estimate = Object.keys(data_utils.packets).length;
    console.log('Amount of people around me', estimate, 'sending to server...');

    // send data packet to the server
    if (socket.connected) {
        socket.emit('estimate', {
            'hostname': config.hostname,
            'id': config.id,
            'estimate': estimate
        });
    }



}, config.interval);




/*


find all devices with sudo iwconfig

find device to put into monitor

bring down network cardwith
sudo ifconfig <device> down

bring up monitor mode
sudo iwconfig <device> mode monitor

bring up network card
sudo ifconfig <device> up



The output to sudo rfkill list shows that your network card is "soft-blocked".

This could happen when the wireless card has been signalled to switch-off via the kernel.

Try the following steps:

run in a terminal:

sudo rfkill unblock wifi; sudo rfkill unblock all

rerun sudo rfkill list to confirm that the card has been unblocked.

reboot

rerun sudo rfkill list again to confirm unblocking as been retained.

rerun sudo lshw -class network - you should now see that the kernel has recognised (or not) the wireless card.

 */