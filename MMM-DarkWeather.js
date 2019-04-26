/* Magic Mirror
 * Module: MMM-DarkWeather
 *
 * By Cowboysdude
 *
 */
Module.register("MMM-DarkWeather", {

    // Module config defaults.
    defaults: {
        updateInterval: 5 * 60 * 1000,
        animationSpeed: 10,
        initialLoadDelay: 0,
        retryDelay: 1500,
        apiKey: "",
        airKey: ""
    },

    getStyles: function() {
        return ["MMM-DarkWeather.css", "grid.css"];
    },
    getScripts: function() {
        return ["moment.js"];
    },

    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification('CONFIG', this.config, this.config.lang);
        this.config.lang = this.config.lang || config.language;
        this.current = {};
        this.forecast = [];
        this.location = {};
        this.moon = {};
        this.SRSS = {};
        this.air = {};
		this.hl = {};
        this.scheduleUpdate();
        this.loaded = true;
    },
	
	imageArray: {
            "clear-day": "clear",
            "clear-night": "clear",
            "partly-cloudy-day": "mostlycloudy",
            "partly-cloudy-night": "mostlycloudy",
            "cloudy": "cloudy",
            "rain": "rain",
            "sleet": "sleet",
            "snow": "chancesnow",
            "wind": "na",
            "fog": "fog",
			"overcast":"overcast"
        }, 

    processDark: function(data) {
	 
        this.current = data.current ;
        this.forecast = data.forecast;
		this.hl = data.highlow;
    },

    processLoc: function(data) {
        this.location = data;
    },
	
    processSRSS: function(data) {
        this.SRSS = data.results;
    },

    processMoon: function(data) {
        this.moon = data;
    },

    processAIR: function(data) {
        this.air = data.data.current.pollution.aqius;
    },

    scheduleUpdate: function() {
        setInterval(() => {
            this.getDark();
        }, this.config.updateInterval);
        this.getDark(this.config.initialLoadDelay);
    },

    getDark: function() {
        this.sendSocketNotification("GET_DARK"); 
        this.sendSocketNotification("GET_LOCATION"); 
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "DARK_RESULT") {
            this.processDark(payload);
        }
        if (notification === "LOCATION") {
            this.processLoc(payload);
        }
        if (notification === "MOON") {
            this.processMoon(payload);
        }
        if (notification === "SRSS_RESULT") {
            this.processSRSS(payload);
        }
        if (notification === "AIR_RESULTS") {
            this.processAIR(payload);
        }
        if (notification === "ALERT_RESULTS") {
            this.processAlert(payload);
        }
        this.updateDom(this.config.initialLoadDelay);
    },

    secondsToString: function(seconds) {
        var srss = this.SRSS.day_length;
        var numhours = Math.floor((srss % 86400) / 3600);
        var numminutes = Math.floor(((srss % 86400) % 3600) / 60);
        if (numminutes > 0) {
            return numhours + ":" + numminutes;
        } else {
            return numhours + this.translate(" hours ");
        }
    },

    getDom: function() {

        var current = this.current;
        var forecast = this.forecast;
		console.log(forecast);
		var hl = this.hl.hl;
        var location = this.location;
        var moon = this.moon;
        var air = this.air;
        var srss = this.SRSS;
        var sunrise = srss.sunrise;
        var sunset = srss.sunset;
		var ss = moment(srss.sunset).format('h');
		var sr = moment(srss.sunrise).format('h');
        var utcsunrise = moment.utc(sunrise).toDate();
        var utcsunset = moment.utc(sunset).toDate();
        var sunrises = config.timeFormat == 12 ? moment(utcsunrise).local().format("h:mm A") : moment(utcsunrise).local().format("HH:mm A");
        var sunsets = config.timeFormat == 12 ? moment(utcsunset).local().format("h:mm A") : moment(utcsunset).local().format("HH:mm A");
        var DayLength = this.secondsToString();
		var icon = current.icon;
        var d = new Date();
        var n = d.getHours(); 
		
        var wrapper = document.createElement('div');

        var top = document.createElement('div');
        top.className = "flex-container";
		
		var curCon = document.createElement("div");
        curCon.classList.add("img","center");
        curCon.innerHTML = (n > sr && n < ss) ? "<img src='modules/MMM-DarkWeather/images/" + this.imageArray[icon] + ".png'>" : "<img src='modules/MMM-DarkWeather/images/nt_" + this.imageArray[icon] + ".png'>";
        wrapper.appendChild(curCon);

        var cname = document.createElement('span')
        cname.className = "column";
        cname.classList.add("bright", "fonts", "medium", "half","tempf");
        cname.innerHTML = location.geoplugin_city + "," + location.geoplugin_regionCode;
        wrapper.appendChild(cname);

        var sum = document.createElement('span');
		sum.classList.add("fonts","bright","center");
		sum.innerHTML= "<br>"+current.summary;
		wrapper.appendChild(sum); 
		
		var temper = document.createElement('span');
        temper.className = "column";
        temper.classList.add("large", "bright", "fonts","tempf");
        temper.innerHTML = Math.round(current.temperature) + "&deg";
        top.appendChild(temper);

        var hightemp = hl.todayhigh;
		var lowtemp = hl.todaylow; 
		 
		var highlow = document.createElement('span'); 
        highlow.classList.add("fonts", "bright", "padding", "xsmall");
        highlow.innerHTML = "<font color=#B22222>"+hightemp + "&deg</font>/<font color=#1E90FF >" + lowtemp+"&deg</font>";
        top.appendChild(highlow); 
		
        var gust = current.windGust > 0 ? "Gusts: " + Math.round(current.windGust) : "";
        var bearing = current.windSpeed > 0 ? "Direction: " + toText() : "";

        function toText() {
            if (bearing > 337.5) return 'Northerly';
            if (bearing > 292.5) return 'North Westerly';
            if (bearing > 247.5) return 'Westerly';
            if (bearing > 202.5) return 'South Westerly';
            if (bearing > 157.5) return 'Southerly';
            if (bearing > 122.5) return 'South Easterly';
            if (bearing > 67.5) return 'Easterly';
            if (bearing > 22.5) {
                return 'North Easterly';
            }
            return 'Northerly';
        }
 
        var UV = (n >= sr && n <= ss) ? "UV: "+current.uvIndex : this.moon;
		var hum = current.humidity.toString().replace(/^[0.]+/, "");
		var humid = hum < 10 ? hum+"0%": hum + "%";
		
		var boxy = document.createElement('div'); 
        boxy.classList.add("bright", "line","xsmall","lpadding","column");
        boxy.innerHTML = "AQ: " + air + "<br>Baro: " + Math.round(current.pressure * 0.02953) + " inHG<br>Wind: " + Math.round(current.windSpeed) + " mph<br>" + bearing + "<br>" + gust + " mph";
        top.appendChild(boxy);

        var srise = document.createElement('div'); 
        srise.classList.add("bright", "line", "xsmall","column");
        srise.innerHTML = "Sunrise: " + sunrises + "<br>Sunset: " + sunsets + "<br>Day Length: " + DayLength + "<br>Humidity: "+humid+"<br>Visibility: " + current.visibility + "mi<br>"+UV;
        top.appendChild(srise);
		
		wrapper.appendChild(top); 
		 
		
		
		///////////////FORECAST/////////////////////////////////////
	
		    var d = new Date();
            var weekday = new Array(7);
            weekday[0] = "Sun";
            weekday[1] = "Mon";
            weekday[2] = "Tue";
            weekday[3] = "Wed";
            weekday[4] = "Thu";
            weekday[5] = "Fri";
            weekday[6] = "Sat";

            var t = this.translate(weekday[d.getDay()]);
			
           var able = document.createElement('div');
		   able.id = "navBar";
		  
		   for (let i = 1; i < forecast.length; i++) {  
         
		    var fore = forecast[i];
            var now = moment.unix(fore.time).format('ddd');
		    var humd = fore.humidity.toString().replace(/^[0.]+/, "");
		    var humidity = humd < 10 ? humd+"0%": humd + "%";
            var fsunrise = fore.sunriseTime;
            var fsunset = fore.sunsetTime; 
			var futcsunrise = moment.unix(fsunrise).format("LT");
			var futcsunset = moment.unix(fsunset).format("LT");
		    var fhigh = "<font color=#B22222>"+Math.round(fore.apparentTemperatureHigh)+"</font>";
			var flow = "<font color=#1E90FF >"+Math.round(fore.apparentTemperatureLow)+"</font>";
	 
          if (now != t){ 
		  
		      var icon = "<img class=forecast src=modules/MMM-DarkWeather/images/"+this.imageArray[fore.icon]+".png>";
		         
			  var days = document.createElement('div');
			  days.id = "subDiv"+i;
			  days.classList.add("fsize","bright","fonts");
			  days.innerHTML="<hr>"+now+"<br>"+fhigh+"/"+flow+"<br>"+icon+"<br><img class=sicon src=modules/MMM-DarkWeather/images/icons/humidity.png>"+humidity+"<br><img class=sicon src=modules/MMM-DarkWeather/images/icons/sunrise.svg>"+futcsunrise+"<br><img class=sicon src=modules/MMM-DarkWeather/images/icons/sunset.svg>"+futcsunset; 
			  able.appendChild(days); 

				 
		  }
	} 
	     wrapper.appendChild(able);
	   
		///////////////FORECAST/////////////////////////////////////	

        return wrapper;
    }, 
});