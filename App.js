import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { btoa, atob } from 'react-native-quick-base64'; // btoa is to esp, atob is from esp

// npx expo run:ios

const bleManager = new BleManager();
const SERVICE_UUID = '7A0247E7-8E88-409B-A959-AB5092DDB03E';
const CHAR_UUID = '82258BAA-DF72-47E8-99BC-B73D7ECD08A5';

export default function App() {
  const [deviceID, setDeviceID] = useState(null);

  const [connectionStatus, setConnectionStatus] = useState('Searching...');

  const deviceRef = useRef(null);

  const searchAndConnectToDevice = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        setConnectionStatus('Error searching for devices');
        return;
      }
      if (device.name === 'ESP32') {
        bleManager.stopDeviceScan();
        setConnectionStatus('Connecting...');
        connectToDevice(device);
      }
    });
  };

  useEffect(() => {
    searchAndConnectToDevice();
  }, []);

  const connectToDevice = (device) => {
    return device
      .connect()
      .then((device) => {
        setDeviceID(device.id);
        setConnectionStatus('Connected');
        deviceRef.current = device;
        return device.discoverAllServicesAndCharacteristics();
      })
      .then((device) => {
        return device.services();
      })
      .then((services) => {
        let service = services.find((service) => service.uuid === SERVICE_UUID);
        return service.characteristics();
      })
      .then((characteristics) => {
        let DataCharacteristic = characteristics.find(
          (char) => char.uuid === CHAR_UUID
        );

        // setStepDataChar(stepDataCharacteristic);
        // stepDataCharacteristic.monitor((error, char) => {
        if (error) {
          console.error(error);
          return;
        }
        const encodedData = btoa('hello world');
        //   const rawStepData = atob(char.value);
        //   console.log('Received step data:', rawStepData);
        //   setStepCount(rawStepData);
        // });
      })
      .catch((error) => {
        console.log(error);
        setConnectionStatus('Error in Connection');
      });
  };

  useEffect(() => {
    const subscription = bleManager.onDeviceDisconnected(
      deviceID,
      (error, device) => {
        if (error) {
          console.log('Disconnected with error:', error);
        }
        setConnectionStatus('Disconnected');
        console.log('Disconnected device');
        //setStepCount(0); // Reset the step count
        if (deviceRef.current) {
          setConnectionStatus('Reconnecting...');
          connectToDevice(deviceRef.current)
            .then(() => setConnectionStatus('Connected'))
            .catch((error) => {
              console.log('Reconnection failed: ', error);
              setConnectionStatus('Reconnection failed');
            });
        }
      }
    );
    return () => subscription.remove();
  }, [deviceID]);

  return (
    <View style={styles.container}>
      <Text>Test 9</Text>
      <Text>{connectionStatus}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
