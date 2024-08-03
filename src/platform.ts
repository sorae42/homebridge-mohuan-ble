import {
  API,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from "homebridge";
import noble, { Peripheral } from "@abandonware/noble";
import { PLATFORM_NAME, PLUGIN_NAME } from "./settings.js";
import { ExamplePlatformAccessory } from "./platformAccessory.js";

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class ExampleHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  public readonly accessories: PlatformAccessory[] = [];

  private connected: Boolean = false;

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.log.debug("Finished initializing platform:", this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on("didFinishLaunching", () => {
      log.debug("Executed didFinishLaunching callback");
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info("Loading accessory from cache:", accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    noble.on("stateChange", async (state) => {
      if (state === "poweredOn") {
        await noble.startScanningAsync([], false);
      }
    });

    // TODO: Multiple devices support.
    noble.on("discover", async (peripheral) => {
      if (this.connected) return;

      this.log.debug(
        `name:${peripheral.advertisement.localName} uuid:${peripheral.uuid}`
      );

      if (peripheral.uuid === this.config["bluetoothuuid"]) {
        await noble.stopScanningAsync();
        this.log.success(
          `Connection OK! ${peripheral.advertisement.localName} ${peripheral.uuid}`
        );

        const uuid = this.api.hap.uuid.generate(
          peripheral?.advertisement.localName || "MOHUANLED404"
        );
        const existingAccessory = this.accessories.find(
          (accessory) => accessory.UUID === uuid
        );

        if (false) {
          this.accessories.forEach((accessory) => {
            this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
              accessory,
            ]);
          });
        }

        if (existingAccessory) {
          this.log.info(
            "Restoring existing accessory from cache:",
            existingAccessory.displayName
          );

          new ExamplePlatformAccessory(this, existingAccessory);
        } else {
          this.log.info(
            "Setting up new accessory:",
            peripheral?.advertisement.localName
          );

          const accessory = new this.api.platformAccessory(
            peripheral?.advertisement.localName || "Light Strip",
            uuid
          );

          accessory.context.device = {
            hkid: uuid,
            uuid: peripheral.uuid,
            name: peripheral?.advertisement.localName,
          };

          new ExamplePlatformAccessory(this, accessory);

          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
            accessory,
          ]);

          this.log.debug("Registration OK!");
        }
        this.connected = true;
        peripheral.disconnectAsync();
      }
    });
  }
}
