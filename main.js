var dgram = require('dgram');
var EventEmitter = require('events');

var express = require("express");
var bodyParser = require("body-parser");

var Influx = require('influx');

function initRestAPI() {
	var app = express();

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	var server = app.listen(3000, function () {
	    console.log("app running on port.", server.address().port);
	});

	return app;
}

function initInflux() {
	var influx = new Influx.InfluxDB({
		host: '192.168.7.101',
		port: 8086,
	    database: 'weather'
	});

	return influx;
}

function main() {
	var influx = initInflux();

	var messagePump = new EventEmitter();
	messagePump.on('sample', function(data) {
		influx.writePoints(data.map(function(d) {
				console.info(d);
				return {
    			measurement: d.measurement,
    			tags: { source: d.source },
    			fields: { units: d.units, value: d.value },
    			timestamp: d.time
	    		};
  			}));
	});

	weatherflowListener(messagePump, null, null);
	//purpleListener();
}
main();

function weatherflowListener(pump, server, options) {
	var PORT = 50222;
	var server = dgram.createSocket('udp4');

	server.on('listening', function () {
	    var address = server.address();
	    console.log('UDP Server listening on :' + PORT);
	});

	server.on('message', function (message, remote) {
	    message = JSON.parse(message);
	    console.log('weather flow message, type: '+message.type);
	    var type = message.type;
	    var data;

	    if (type == 'obs_air')
	    	data = parseWeatherFlowAirReport(message);
	    else if (type == 'obs_sky')
	    	data = parseWeatherFlowSkyReport(message);

	    if (data)
	    	pump.emit('sample', data);

	});

	server.bind({ port: PORT });
}

function purpleListener(pump, restApi, options) {
	app.put("/sensors/purpleair/:key", function (req, res) {
		//key to sensor check

		//parse
		//pump

		res.status(200).send({ok: ':)'});
	});
}

// https://weatherflow.github.io/SmartWeather/api/udp/v91/
// {"serial_number":"AR-00012490","type":"obs_air","hub_sn":"HB-00004837","obs":[[1534912506,1005.70,21.38,68,0,0,3.51,1]],"firmware_revision":20}
// 0	Time Epoch	Seconds
// 1	Station Pressure	MB
// 2	Air Temperature	C
// 3	Relative Humidity	%
// 4	Lightning Strike Count	
// 5	Lightning Strike Avg Distance	km
// 6	Battery	
// 7	Report Interval	Minutes

function parseWeatherFlowAirReport(message) {
	var obs = message.obs[0];
	var time_epoch = new Date(obs[0]*1000);
	var pressure = obs[1];
	var temp = obs[2];
	var humidity = obs[3];

	return [
		{measurement:'temp', source: "WeatherFlow Air", source_id: message.serial_number, value: temp, units: 'C', time: time_epoch},
		{measurement:'pressure', source: "WeatherFlow Air", source_id: message.serial_number, value: pressure, units: 'MB', time: time_epoch},
		{measurement:'humidity', source: "WeatherFlow Air", source_id: message.serial_number, value: humidity, units: '%', time: time_epoch},
	];
}

//{"serial_number":"SK-00008021","type":"obs_sky","hub_sn":"HB-00004837","obs":[[1534912516,0,0.00,0.000000,0.00,0.28,0.76,44,3.45,1,0,null,0,3]],"firmware_revision":43}
// 0	Time Epoch	Seconds
// 1	Illuminance	Lux
// 2	UV	Index
// 3	Rain Accumulated	mm
// 4	Wind Lull (minimum 3 second sample)	m/s
// 5	Wind Avg (average over report interval)	m/s
// 6	Wind Gust (maximum 3 second sample)	m/s
// 7	Wind Direction	Degrees
// 8	Battery	Volts
// 9	Report Interval	Minutes
// 10	Solar Radiation	W/m^2
// 11	Local Day Rain Accumulation	mm
// 12	Precipitation Type	0 = none, 1 = rain, 2 = hail
// 13	Wind Sample Interval	seconds
function parseWeatherFlowSkyReport(message) {
	var obs = message.obs[0];
	var time_epoch = new Date(obs[0]*1000);
	var wind = obs[1];
	var UV = obs[2];
	var illuminance = obs[1];
	var rain = obs[3];

	return [
		//{measurement:'wind', source: "WeatherFlow Sky", source_id: message.serial_number, value: wind, units: 'tbd', time: time_epoch},
		{measurement:'UV', source: "WeatherFlow Sky", source_id: message.serial_number, value: UV, units: 'Index', time: time_epoch},
		{measurement:'illuminance', source: "WeatherFlow Sky", source_id: message.serial_number, value: illuminance, units: 'Lux', time: time_epoch},
		{measurement:'rain', source: "WeatherFlow Sky", source_id: message.serial_number, value: rain, units: 'mm', time: time_epoch},
	];	
}

// {"serial_number":"SK-00008021","type":"rapid_wind","hub_sn":"HB-00004837","ob":[1534912518,0.54,125]}
// {"serial_number":"HB-00004837","type":"hub_status","firmware_revision":"91","uptime":494815,"rssi":-73,"timestamp":1534912520,"reset_flags":"PIN,SFT","seq":49375,"fs":"1,0","radio_stats":[2,1],"mqtt_stats":[40]}
function parseWeatherFlowTodo() {}

// https://docs.google.com/document/d/15ijz94dXJ-YAZLi9iZ_RaBwrZ4KtYeCy08goGBwnbCU/edit
/*
{ SensorId: '68:c6:3a:8e:7a:22',
  DateTime: '2018/08/22T03:18:47z',
  Geo: 'AirMonitor_7a22',
  Mem: 25216,
  Id: 1682,
  Adc: 0.02,
  lat: 47.672394,
  lon: -122.360161,
  accuracy: 30,
  elevation: 65.79,
  version: '2.50i',
  uptime: 66880,
  rssi: -76,
  hardwareversion: '2.0',
  hardwarediscovered: '2.0+BME280+PMSX003A+PMSX003B',
  current_temp_f: 85,
  current_humidity: 32,
  current_dewpoint_f: 51.85,
  pressure: 1007.76,
  pm1_0_atm_b: 112.57,
  pm2_5_atm_b: 200.16,
  pm10_0_atm_b: 222.55,
  pm1_0_cf_1_b: 74.25,
  pm2_5_cf_1_b: 132.68,
  pm10_0_cf_1_b: 147.73,
  p_0_3_um_b: 18694.02,
  p_0_5_um_b: 5559.11,
  p_1_0_um_b: 1542.45,
  p_2_5_um_b: 149.5,
  p_5_0_um_b: 29.32,
  p_10_0_um_b: 8.77,
  pm1_0_atm: 110.85,
  pm2_5_atm: 195.33,
  pm10_0_atm: 236.89,
  pm1_0_cf_1: 73.24,
  pm2_5_cf_1: 129.52,
  pm10_0_cf_1: 157.2,
  p_0_3_um: 18785.94,
  p_0_5_um: 5558.98,
  p_1_0_um: 1458.39,
  p_2_5_um: 182.04,
  p_5_0_um: 55.78,
  p_10_0_um: 19.35,
  responseCode: '201',
  responseCode_date: 1534907918,
  key1_responseCode: '200',
  key1_responseCode_date: 1534907867,
  key1_count: 20234,
  key2_responseCode: '200',
  key2_responseCode_date: 1534907877,
  key2_count: 20184,
  responseCode_b: '200',
  responseCode_date_b: 1534907847,
  key1_responseCode_b: '200',
  key1_responseCode_date_b: 1534907897,
  key1_count_b: 20216,
  key2_responseCode_b: '200',
  key2_responseCode_date_b: 1534907907,
  key2_count_b: 20171 }
 */
function parsePurpleAirReport(message) {

	return [
		{measurement:'PM2.5 AQI', value: humidity, source:'...', units: '%', time: time_epoch},
		{measurement:'PM10 AQI', value: humidity, units: '%', time: time_epoch},
		{measurement:'pm1', value: humidity, units: '%', time: time_epoch},
		{measurement:'pm2.5', value: humidity, units: '%', time: time_epoch},
		{measurement:'pm10', value: humidity, units: '%', time: time_epoch},
		{measurement:'temp', value: humidity, units: '%', time: time_epoch},
		{measurement:'pressure', value: humidity, units: '%', time: time_epoch}
	];	
}

