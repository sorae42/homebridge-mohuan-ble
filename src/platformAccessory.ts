import { Service, PlatformAccessory, CharacteristicValue } from "homebridge";

import { ExampleHomebridgePlatform } from "./platform.js";
import noble, { Characteristic, Peripheral } from "@abandonware/noble";
import { hslToRgb } from "./util.js";

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private states = {
    // state
    On: false,
    Brightness: 100,

    // colors!
    Hue: 0,
    Saturation: 0,
    Lightness: 0,
  };

  private peripheral?: Peripheral;
  private characteristic?: Characteristic;
  private connected?: boolean = false;

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        "Welpur, Kimoji LLC."
      )
      .setCharacteristic(this.platform.Characteristic.Model, "5050RGBLED")
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        "CNLEDNOSERIALLOL"
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
      accessory.context.device.name
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    // register handlers for the Brightness Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.Hue)
      .onSet(this.setHue.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.Saturation)
      .onSet(this.setSaturation.bind(this));

    // Re-Setup bluetooth
    noble.on("stateChange", async (state) => {
      if (state === "poweredOn") {
        await noble.startScanningAsync([], false);
      }
    });

    noble.on("discover", async (peripheral) => {
      if (peripheral.uuid === accessory.context.device.uuid) {
        await noble.stopScanningAsync();
        this.peripheral = peripheral;
        peripheral.disconnectAsync();
      }
    });
  }

  async connectAndGetWriteCharacteristics() {
    if (!this.peripheral) {
      await noble.startScanningAsync();
      return;
    }
    this.platform.log.debug("GetWriteCharacteristics");
    await this.peripheral.connectAsync();
    this.connected = true;
    const { characteristics } =
      await this.peripheral.discoverSomeServicesAndCharacteristicsAsync(
        ["EEA0"],
        ["EE01"]
      );
    this.characteristic = characteristics[0];
    this.platform.log.debug("GetWriteCharacteristics OK!");
  }

  async debounceDisconnect() {
    let timer: any;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (this.peripheral) {
          await this.peripheral.disconnectAsync();
          this.connected = false;
        }
      }, 5000);
    };
  }

  async setOn(value: CharacteristicValue) {
    if (!this.connected) await this.connectAndGetWriteCharacteristics();
    if (!this.characteristic) return;

    if (this.states.On !== value) {
      // set to red by default
      const data = Buffer.from(
        `6996${value ? "060101FF0000FF" : "020100"}`,
        "hex"
      );
      this.characteristic?.write(data, true, (e) => {
        if (e) this.platform.log.error(e);
        this.states.On = value as boolean;
        this.setRGB();
        this.debounceDisconnect();
      });
    }

    this.platform.log.debug("Set Characteristic On ->", value);
  }

  // TODO: Check bluetooth status and report it here
  async getOn(): Promise<CharacteristicValue> {
    const isOn = this.states.On;
    if (!this.connected) {
      await this.connectAndGetWriteCharacteristics();
      throw new this.platform.api.hap.HapStatusError(
        this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
      );
    } else {
      this.platform.log.debug("Get Characteristic On ->", isOn);
      return isOn;
    }
  }

  async setBrightness(value: CharacteristicValue) {
    this.states.Brightness = value as number;
    this.setRGB();
    this.platform.log.debug("Set Characteristic Brightness -> ", value);
  }

  async setHue(value: CharacteristicValue) {
    this.states.Hue = value as number;
    this.setRGB();
    this.platform.log.debug("Set Characteristic Hue -> ", value);
  }

  async setSaturation(value: CharacteristicValue) {
    this.states.Saturation = value as number;
    this.setRGB();
    this.platform.log.debug("Set Characteristic Saturation -> ", value);
  }

  async setRGB() {
    if (!this.connected) await this.connectAndGetWriteCharacteristics();
    if (!this.characteristic) return;
    let rgb = hslToRgb(
      this.states.Hue / 360,
      this.states.Saturation / 100,
      this.states.Brightness / 200
    );

    const r = ("0" + rgb[0].toString(16)).slice(-2);
    const g = ("0" + rgb[1].toString(16)).slice(-2);
    const b = ("0" + rgb[2].toString(16)).slice(-2);
    const brightness = (
      "0" + Math.round((this.states.Brightness / 100) * 255).toString(16)
    ).slice(-2);

    const data = Buffer.from(`69960502${r}${g}${b}${brightness}`, "hex");
    console.log(r, g, b, brightness, data);

    this.characteristic?.write(data, true, (e) => {
      if (e) this.platform.log.error(e);
      this.debounceDisconnect();
    });
  }
}
