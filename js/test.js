// test.js

import mqtt from "https://cdnjs.cloudflare.com/ajax/libs/mqtt/4.2.8/mqtt.min.js"; // Example CDN link

// MQTT client configuration
const clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8);
const host = 'ws://broker.hivemq.com:8000/mqtt'; // MQTT broker address
const options = {
  // MQTT options, if needed
};

let client; // MQTT client variable

// Function to initialize MQTT client
export function initMqttClient() {
  console.log('Connecting MQTT client');
  client = mqtt.connect(host, options); // Initialize MQTT client

  // Event listeners and other MQTT client logic here

  // Event listener: on connect
  client.on('connect', () => {
    console.log('Connected to MQTT broker');
    // You can update UI or perform actions on successful connection here
  });

  // Event listener: on error
  client.on('error', (err) => {
    console.log('Connection error: ', err);
    // Handle connection errors here
  });

  // Example subscription
  const topic = 'emqx/esp8266/checkstatus';
  client.subscribe(topic, (err) => {
    if (err) {
      console.log('Subscription error:', err);
    } else {
      console.log('Subscribed to topic:', topic);
    }
  });

  // Event listener: on message
  client.on('message', (topic, message) => {
    console.log('Received message:', topic, message.toString());
    // Process received messages here
    // Example: Check if device is active
    if (topic === 'emqx/esp8266/checkstatus' && message.toString().trim() === 'Device is active') {
      console.log('Device is active!');
      // Perform actions when device is active
      // Example: Redirect to another page
      setTimeout(() => {
        window.location.href = 'index.html'; // Redirect to index.html after 2 seconds
      }, 2000);
    }
  });

  // Example function: publish message
  function publishMessage() {
    const topic = 'emqx/esp8266/checkstatus';
    const message = 'checkOnline';
    client.publish(topic, message);
    console.log('Published message:', message, 'to topic:', topic);
  }

  // Example usage of publishing a message
  publishMessage();
}
