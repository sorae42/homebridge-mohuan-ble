# Homebridge Plugin for Mohuan LED

Install: `npm install @sorae42/homebridge-mohuan-ble`

Please note that the color shown on the Home.app will not always accurate to the LED strip. Blame your Chinese manufacturer for that. (or send an PR if you figured out the accuracy!)

## How do I know my LED strip is compatible?

If your LED strip use MohuanLED app to control, it should be 100% compatible.

If not, do some bluetooth intercepting between your LED app and your strip to see whether the following data is the same:

(If you have an iOS device with a MacBook, you should use PacketLogger.app)

```
Data usually has 6-8 bytes of data.
6996 Default Header
0000 Command:
    0201 OFF
	0601 ON (usually set existing color)
	0502 SETCOLOR
	0303 SETMODE: FADE
	0304 SETMODE: FLASH

    Ignore the FADE and FLASH SETMODE as we don't have such thing in HomeKit.

The remaining 4 bytes are RGBA values.
```

If they don't match the same but have the same format, feel free to fork then change them. I will plan on implementing configuration for these settings sometime soon.

If none of the case above apply to you, you will be to fork the repo and change the data accordingly for your light strip.