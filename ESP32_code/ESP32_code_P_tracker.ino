#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <TinyGPS++.h>
#include <SdsDustSensor.h>
#include <RTClib.h>
#include <SD.h>
#include <SPI.h>
#include <Adafruit_HTU21DF.h> // Library for HTU21D

// OLED display settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// HTU21D settings
Adafruit_HTU21DF htu = Adafruit_HTU21DF(); // Initialize HTU21D sensor

// WiFi credentials
const char* ssid = "wifi24"; //Replace wifi23 with your Wifi/hotspot, note keep hotspot at 2.4Ghz
const char* password = "Maka1991"; //Replace Maka1991 with Your Wifi/hotspot passowrd

// YUR SERVER URL GOES HERE 
const char* serverName = "heroku your url";

// GPS and SDS011 settings
TinyGPSPlus gps;
HardwareSerial sdsSerial(2); // Use Serial2 for SDS011
SdsDustSensor sds(sdsSerial, 18, 19); // RX = GPIO 18, TX = GPIO 19 for SDS011

RTC_DS3231 rtc; // Create an RTC object

// SD card settings
#define CS_PIN 15
#define SCK_PIN 14
#define MOSI_PIN 23
#define MISO_PIN 27

// Variables to hold sensor data
String pm25 = "0.0";
String pm10 = "0.0";
String latitude = "0.0";
String longitude = "0.0";
String device_temp = "0.0";
String real_temp = "0.0";
String humidity = "0.0";

// Track the last minute when data was saved
int lastMinute = -1;

// Variables for 10-second interval
unsigned long lastDisplayUpdateTime = 0;
const unsigned long displayUpdateInterval = 10000; // 10 seconds

void setup() {
  Serial.begin(9600);
  Serial1.begin(9600, SERIAL_8N1, 4, 5); // RX = GPIO 4, TX = GPIO 5 for GPS
  sdsSerial.begin(9600, SERIAL_8N1, 18, 19); // Initialize Serial2 for SDS011

  // Initialize display
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for (;;);
  }

  display.setCursor(0, 20);
  display.setTextSize(2);
  display.print("CONNECTING");
  display.setCursor(0, 40);
  display.print("TO WIFI");
  display.display();

  // Initialize SDS011 sensor
  sds.begin();

  // Initialize RTC
  if (!rtc.begin()) {
    Serial.println("Couldn't find RTC");
    while (1);
  }

  // Initialize HTU21D sensor
  if (!htu.begin()) {
    Serial.println("Couldn't find HTU21D");
    while (1);
  }

  // Initialize SD card
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, CS_PIN);
  if (!SD.begin(CS_PIN)) {
    Serial.println("Card Mount Failed");
  } else {
    Serial.println("SD card initialized.");
  }

  // Connect to WiFi without blocking
  WiFi.begin(ssid, password);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
}

void loop() {
  DateTime now = rtc.now();
  unsigned long currentMillis = millis();

  // Update display every 10 seconds
  if (currentMillis - lastDisplayUpdateTime >= displayUpdateInterval) {
    lastDisplayUpdateTime = currentMillis;

    // Read PM data from SDS011 sensor
    PmResult pm = sds.readPm();
    int retryCount = 0;
    while (!pm.isOk() && retryCount < 3) {
      delay(1000); // Wait 1 second before retrying
      pm = sds.readPm();
      retryCount++;
    }

    if (pm.isOk()) {
      pm25 = String(pm.pm25);
      pm10 = String(pm.pm10);
    } else {
      Serial.print("Could not read from sensor, reason: ");
      Serial.println(pm.statusToString());
    }

    // Read GPS data
    while (Serial1.available() > 0) {
      gps.encode(Serial1.read());
    }

    if (gps.location.isUpdated()) {
      latitude = String(gps.location.lat(), 6);
      longitude = String(gps.location.lng(), 6);
    }

    // Read device temperature from DS3231
    device_temp = String(rtc.getTemperature(), 1);

    // Read real temperature and humidity from HTU21D
    real_temp = String(htu.readTemperature(), 1);
    humidity = String(htu.readHumidity(), 1);

    // Display data on OLED
    display.clearDisplay();
    display.setCursor(0, 0);
    String wifiStatus = WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED";
    display.print("WiFi: ");
    display.println(wifiStatus);

    display.setCursor(0, 16);
    display.print("PM2.5: ");
    display.println(pm25);

    display.setCursor(0, 26);
    display.print("PM10: ");
    display.println(pm10);

    display.setCursor(0, 36);
    display.print("Temp: ");
    display.println(real_temp);

    display.setCursor(0, 46);
    display.print("Humidity: ");
    display.println(humidity);
    
      display.setCursor(0, 56);
      display.print("Time: ");
      display.print(now.hour());
      display.print(":");
      if (now.minute() < 10) {
        display.print("0");  // Add a leading zero for minutes if needed
      }
      display.print(now.minute());
      display.print(":");
      if (now.second() < 10) {
        display.print("0");  // Add a leading zero for seconds if needed
      }
      display.println(now.second());

    display.display();
  }

  // Check if we are at a new minute
  if (now.minute() != lastMinute) {
    lastMinute = now.minute(); // Update lastMinute to the current minute

    // Check WiFi status
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Connecting to WiFi...");
      WiFi.begin(ssid, password);
      delay(2000); // Delay between WiFi connection attempts
    } else {
      Serial.println("WiFi connected.");
    }

    String timestamp = String(now.year()) + "/" + String(now.month()) + "/" + String(now.day()) + " " + String(now.hour()) + ":" + String(now.minute()) + ":" + String(now.second());

    // Save data to SD card
    File dataFile = SD.open("/data.txt", FILE_APPEND);
    if (dataFile) {
      if (dataFile.position() == 0) {
        dataFile.println("Timestamp\tPM2.5 (µg/m³)\tPM10 (µg/m³)\tCoordinates (lat, long)\tDevice Temp (°C)\tReal Temp (°C)\tHumidity (%)");
      }
      dataFile.print(timestamp);
      dataFile.print("\t");
      dataFile.print(pm25);
      dataFile.print("\t");
      dataFile.print(pm10);
      dataFile.print("\t");
      dataFile.print(latitude);
      dataFile.print(", ");
      dataFile.print(longitude);
      dataFile.print("\t");
      dataFile.print(device_temp);
      dataFile.print("\t");
      dataFile.print(real_temp);
      dataFile.print("\t");
      dataFile.println(humidity);
      dataFile.close();
    } else {
      Serial.println("Error opening data.txt");
    }

    // Send data to server if WiFi is connected
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverName);
      http.addHeader("Content-Type", "application/json");

      String httpRequestData = "{\"pm25\":" + pm25 + ",\"pm10\":" + pm10 + ",\"latitude\":" + latitude + ",\"longitude\":" + longitude + ",\"device_temp\":" + device_temp + ",\"real_temp\":" + real_temp + ",\"humidity\":" + humidity + "}";
      int httpResponseCode = http.POST(httpRequestData);

      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println(httpResponseCode);
        Serial.println(response);
      } else {
        Serial.print("Error on sending POST: ");
        Serial.println(httpResponseCode);
      }
      http.end();
    }
  }

  delay(500); // Short delay to reduce unnecessary processing
}
