/* Magic Mirror
 * Module: MMM-DarkWeather
 *
 * By Cowboysdude
 *
 */
const NodeHelper = require('node_helper');
const request = require('request');
const moment = require('moment');
var ipRes;

module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting node_helper for: " + this.name); 
		},
		
		getLOC: function() { 
		 request({ 
			  url:  'https://api.ipify.org?format=json',
            method: 'GET'
        }, (error, response, body) => { 
		  if (!error && response.statusCode == 200) {
              ipRes = JSON.parse(body);
				this.getIP(); 
		       }
                    });
					
       },
		
		getIP: function() { 
		 request({ 
			  url:  'http://www.geoplugin.net/json.gp?ip='+ipRes, 
            method: 'GET'
        }, (error, response, body) => { 
		    if (!error && response.statusCode == 200) {
                var result = JSON.parse(body); 
		 this.sendSocketNotification("LOCATION", result);
		 this.getMoonData();
			}
            }); 
           },
	
	
	getMoonData: function() { 
		var date = moment().unix(); 
        request({ 
			  url: "http://api.farmsense.net/v1/moonphases/?d="+date,
			//url: "https://mykle.herokuapp.com/moon",
            method: 'GET'
        }, (error, response, body) => {
                var results = JSON.parse(body);  
                var result = results[0]['Phase'];
				 this.sendSocketNotification("MOON", result);
				 this.getSRSS();
                    });
           // }
       // });
    },
	
	getDark: function(url) {
        request({
            url: "https://api.darksky.net/forecast/"+this.config.apiKey+"/"+this.config.userlat+","+this.config.userlon+"?lang="+this.config.lang+"&exclude=minutely,hourly,flags",
            method: 'GET'
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) { 
			var result = JSON.parse(body);
			var highlow = {
				  hl: {
					  todayhigh: Math.round(result.daily.data[0].apparentTemperatureHigh),
					  todaylow:  Math.round(result.daily.data[0].apparentTemperatureLow)
					  }
				}
			var current = result.currently;
			var forecasts = result.daily.data; 
			var forecast = forecasts.slice(0, 6);
		 
                this.sendSocketNotification('DARK_RESULT', {current, forecast, highlow} );
            }
        });
    },
	
	getSRSS: function(){
     	var self = this;
	 	request({ 
    	    url: "http://api.sunrise-sunset.org/json?lat="+this.config.userlat+"&lng="+this.config.userlon+"&formatted=0",
    	          method: 'GET' 
    	        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                        var srssresult = JSON.parse(body);
                        this.sendSocketNotification("SRSS_RESULT", srssresult);
                        this.getAir();
            }
       });
    },
	
	getAir: function(){
     	var self = this;
	 	request({ 
    	    url: "http://api.airvisual.com/v2/nearest_city?lat="+this.config.userlat+"&lon="+this.config.userlon+"&rad=100&key="+this.config.airKey,
    	          method: 'GET' 
    	        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                        var airresult = JSON.parse(body);
                        this.sendSocketNotification("AIR_RESULTS", airresult);
            }
       });
   },

		socketNotificationReceived: function(notification, payload) {
			if(notification === 'CONFIG'){
				this.config = payload; 
			}
			 else if (notification === 'GET_DARK') {
				this.getDark(payload);
			}
			 else if (notification === 'GET_MOON'){
				 this.getMoonData(payload);
			}
			 else if (notification === 'GET_LOCATION'){
				 this.getLOC(payload);
			}
			else if (notification === 'GET_SRSS'){
				 this.getSRSS(payload);
			}
		}
	});