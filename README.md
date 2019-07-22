# SLS_anomaly_alerts
## Introduction
If you are reading this, you hopefully know about the [sea level sensors project](https://www.sealevelsensors.org/). At the time of this writing, the sls project was just beginning to get good data, but there were some sensors that were still causing issue. In addition, there was no real way to know if anything "interesting" was going on with the water levels aside from clicking through each sensor individually and examining it visually.

The purpose of our project was to create a programatic way to flag "interesting events". These events include both issues with the sensor and weather related issues. While our algorithm flags these events, it leaves it up to the user to determine what kind of events they are and what action should be taken.
## Usage
This project has two end products: An email alert system and a website. Since there is a lot of code overlap, both these projects are in the same git repository (although they can be ran individually if preferred).
### Email alerts
