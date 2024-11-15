import type {
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from "homebridge";

import { isLightTurnedOn, setDimmingLevel, toggleLight } from "./light.js";

import type { SmarthomeCVnetPlugin } from "./platform.js";

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class SmarthomeCVnetAccessoryBulb {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private States = {
    On: false,
    Brightness: 100,
  };

  constructor(
    private readonly platform: SmarthomeCVnetPlugin,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        "Default-Manufacturer",
      )
      .setCharacteristic(this.platform.Characteristic.Model, "Default-Model")
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        "Default-Serial",
      );

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service =
      this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.context.device.DisplayName,
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)) // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this)); // GET - bind to the `getOn` method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.States.On = value as boolean;

    const uuid = this.accessory.context.device.UniqueId;
    const zone = uuid.charCodeAt(1) - 65;
    const room = uuid.charCodeAt(3) - 65;
    toggleLight(`${zone}-${room}`);

    this.platform.log.debug("Set Characteristic On ->", value);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possible. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.
   * In this case, you may decide not to implement `onGet` handlers, which may speed up
   * the responsiveness of your device in the Home app.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    // console.log(JSON.stringify(this.accessory.context, null, 2));
    const uuid = this.accessory.context.device.UniqueId;
    const zone = uuid.charCodeAt(1) - 65;
    const room = uuid.charCodeAt(3) - 65;
    console.log(`uuid: ${uuid} zone: ${zone}, room: ${room}`);
    // implement your own code to check if the device is on
    // const isOn = this.States.On;
    const isOn = await isLightTurnedOn(`${zone}-${room}`);

    this.platform.log.debug("Get Characteristic On ->", isOn);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class SmarthomeCVnetAccessoryBulbBrightness {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private States = {
    On: false,
    Brightness: 100,
  };

  constructor(
    private readonly platform: SmarthomeCVnetPlugin,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        "Default-Manufacturer",
      )
      .setCharacteristic(this.platform.Characteristic.Model, "Default-Model")
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        "Default-Serial",
      );

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service =
      this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.context.device.DisplayName,
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)) // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this)); // GET - bind to the `getOn` method below

    // register handlers for the Brightness Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this)); // SET - bind to the `setBrightness` method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.States.On = value as boolean;

    const uuid = this.accessory.context.device.UniqueId;
    const zone = uuid.charCodeAt(1) - 65;
    const room = uuid.charCodeAt(3) - 65;
    toggleLight(`${zone}-${room}`);

    this.platform.log.debug("Set Characteristic On ->", value);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possible. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.
   * In this case, you may decide not to implement `onGet` handlers, which may speed up
   * the responsiveness of your device in the Home app.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    // console.log(JSON.stringify(this.accessory.context, null, 2));
    const uuid = this.accessory.context.device.UniqueId;
    const zone = uuid.charCodeAt(1) - 65;
    const room = uuid.charCodeAt(3) - 65;
    console.log(`uuid: ${uuid} zone: ${zone}, room: ${room}`);
    // implement your own code to check if the device is on
    // const isOn = this.States.On;
    const isOn = await isLightTurnedOn(`${zone}-${room}`);

    this.platform.log.debug("Get Characteristic On ->", isOn);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  async setBrightness(value: CharacteristicValue) {
    // implement your own code to set the brightness
    this.States.Brightness = value as number;

    const uuid = this.accessory.context.device.UniqueId;
    const zone = uuid.charCodeAt(1) - 65;
    const room = uuid.charCodeAt(3) - 65;
    let dimming = value as number; // Three levels. 33, 66, 100
    if (dimming < 33) {
      dimming = 1;
    } else if (dimming < 66) {
      dimming = 2;
    } else {
      dimming = 3;
    }
    setDimmingLevel(`${zone}-${room}`, dimming);

    this.platform.log.debug("Set Characteristic Brightness -> ", value);
  }
}
