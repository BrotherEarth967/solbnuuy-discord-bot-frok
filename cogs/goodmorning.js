
const cron = require("node-cron");

let channel;

const days = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday"
];
const months = [
	"January",
	"Febuary",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
const quotes = require("./goodmorning.json");

function dailyrandom(l) {
	const date = new Date(Date.now());
	let day = (date.getFullYear() * 12 * 30 + date.getMonth() * 30 + date.getDate()).toString();
	let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
	for (let i = 0, m; i < day.length; ++i) {
		m = day.charCodeAt(i);
		h1 = h2 ^ Math.imul(h1 ^ m, 597399067);
		h2 = h3 ^ Math.imul(h2 ^ m, 2869860233);
		h3 = h4 ^ Math.imul(h3 ^ m, 951274213);
		h4 = h1 ^ Math.imul(h4 ^ m, 2716044179);		
	}
	day = (h1 ^ h2 ^ h3 ^ h4) >>> 0;
	day %= l.length;
	return l[day];
}
function stndrd(n) {
	n = n.toString().at(-1);
	if (n == 0) return "st";
	if (n == 1) return "nd";
	if (n == 2) return "rd";
	return "th";
}
async function goodmorning(ctx) {
	let date = new Date();
	let embed = await weathertoday(conf.goodmorninglocation);
	embed.title = "Good morning";
	embed.msg = `It is **${days[date.getDay()]}**, the **${date.getDay() + 1}${stndrd(date.getDay())}** of **${months[date.getMonth()]}**, **${date.getFullYear()}**\n\n > ${dailyrandom(quotes)}\n\n` + embed.msg;
	embed.url = undefined;
	ctx.embedreply(embed);
}
async function weathertoday(location) {
	let data;
	try {
		data = await ffetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}/next1days?unitGroup=metric&elements=datetime%2Clatitude%2Clongitude%2Ctemp%2Cfeelslike%2Chumidity%2Cprecip%2Cprecipprob%2Cwindspeed%2Cwinddir%2Cpressure%2Ccloudcover%2Cvisibility%2Csevererisk%2Csunrise%2Csunset%2Cmoonphase%2Cdescription%2Cicon&include=days&key=${conf.visualcrossingkey}&options=nonulls&contentType=json`);
		data = JSON.parse(data);
	} catch (e) {
		return {
			title: "Error",
			msg: `Location "\`${location}\`" not found`,
			color: [255, 0, 0]
		};
	}
	return {
		title: `${data.resolvedAddress} (${data.latitude}, ${data.longitude})`,
		url: `https://www.google.com/maps/@?api=1&map_action=map?&center=${data.latitude},${data.longitude}`,
		msg: `${data.days[0].description}\n:thermometer: ${Math.round(data.days[0].temp)}°C (feels like ${Math.round(data.days[0].feelslike)}°C)`,
		thumb: `https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/4th%20Set%20-%20Color/${data.days[0].icon}.png`,
		color: [0, 255, 255],
		fields: [
			{
				name: "Cloud Cover :cloud:",
				value: Math.round(data.days[0].cloudcover) + "%",
				inline: true
			}, {
				name: "Visibility :eyes:",
				value: Math.round(data.days[0].visibility) + "% (" + Math.round(9.75 * data.days[0].visibility) + "m)",
				inline: true
			}, {
				name: "Humidity :fog:",
				value: Math.round(data.days[0].humidity) + "%",
				inline: true
			}, {
				name: "Rain :droplet:",
				value: data.days[0].precip + "mm (" + Math.round(data.days[0].precipprob) + "%)",
				inline: true
			}, {
				name: "Pressure :timer:",
				value: Math.round(data.days[0].pressure) + "hPa",
				inline: true
			}, {
				name: "Wind :dash:",
				value: Math.round(data.days[0].windspeed) + "kmh (" + Math.round(data.days[0].winddir) + "°)",
				inline: true
			}, {
				name: "Sunrise :sunrise_over_mountains:",
				value: data.days[0].sunrise,
				inline: true
			}, {
				name: "Sunset :city_dusk:",
				value: data.days[0].sunset	,
				inline: true					
			}, {
				name: "Moon Phase " + [":new_moon:", ":new_moon:", ":waxing_crescent_moon:", ":first_quarter_moon:", ":waxing_gibbous_moon:", ":full_moon:", ":waning_gibbous_moon:", ":last_quarter_moon:", ":waning_crescent_moon:", ":new_moon:"][Math.floor(data.days[0].moonphase * 10)],
				value: Math.round(data.days[0].moonphase * 100) + "%",
				inline: true
			}
		]
	};
}

client.once("ready", async function() {
	channel = await client.channels.fetch(conf.goodmorningchannel);
	channel.embedreply = client._embedreply;
	cron.schedule("0 7 * * *", () => {
		goodmorning(channel);
	});
});

module.exports.cmds = {
	"goodmorning": {
		desc: "Say good morning text",
		func: async function (args) {
			goodmorning(this);
		}
	},
	"quote": {
		desc: "Get a random inspirational quote",
		func: async function (args) {
			let i = Math.floor(Math.random() * quotes.length);
			this.embedreply({
				title: `Quote #${i}`,
				msg: quotes[i],
				color: this.color
			});
		}
	},
	"weather": {
		desc: "Get today's weather",
		args: [
			[dc.BIGTEXT, "location", "Where to get weather data for", true]
		],
		func: async function (args) {
			this.embedreply(await weathertoday(args[0]));
		}
	}
};
