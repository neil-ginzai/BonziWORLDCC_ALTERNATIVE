const fs = require("fs");
const crypto = require("crypto");
//Read settings
const config = JSON.parse(fs.readFileSync("./config/server-settings.json"));
const jokes = JSON.parse(fs.readFileSync("./config/jokes.json"));
const facts = JSON.parse(fs.readFileSync("./config/facts.json"));
const copypastas = JSON.parse(fs.readFileSync("./config/copypastas.json"));
module.exports.ccblacklist = [];

function ipToInt(ip) {
	let ipInt = BigInt(0);
	if (ip.startsWith(":")) ip = 0 + ip;
	else if (ip.endsWith(":")) ip = ip + 0;
	ip = ip.split(":");
	let index = ip.indexOf("");
	ip.splice(ip.indexOf(""), 1)
	while (ip.length < 8) ip.splice(index, 0, 0);
	ip.map(e => { return parseInt("0x" + e) }).forEach(octet => {
		ipInt = (ipInt << BigInt(16)) + BigInt(octet);
	})
	return ipInt;
}

//NOTE: List parsing must be compatible with text editors that add \r and ones that don't
let ccc = fs.readFileSync("./config/colors.txt").toString().replace(/\r/g, "");
if (ccc.endsWith("\n")) ccc = ccc.substring(0, ccc.length - 1);
const colors = ccc.split("\n");
let klog = [];
let markuprules = {
	"**": "b",
	"__": "u",
	"--": "s",
	"~~": "i",
	"*g*": "span class=\"glowies-text\"",
	"*b*": "span class=\"weird-text\"",
	"*megatron*": "span class=\"palestine-text\"",
	"*bz*": "span class=\"WhateverTheAiPuts\"",
	"*geo*": "span class=\"geo\"",
	"*z*": "span class=\"singularity\"",
	"(mutt(": "span class=\"flag-text\"",
	"*rage*": "span class=\"red-glow-shake\"",
	"###": "font style='animation: rainbow 3s infinite;'",
	"^^": "font size=5",
	"%%": "marquee scrollamount=6",
}
let markleftrules = {
	"color": "color",
	"font": "font-family",
	"weight": "font-weight"
}

const emotes = {
	"cool": [{ type: 1, anim: "swag_fwd" }],
	"clap": [{ type: 1, anim: "clap_fwd" }, { type: 1, anim: "clap_back" }],
	"beat": [{ type: 1, anim: "beat_fwd" }],
	"bow": [{ type: 1, anim: "bow_fwd" }],
	"think": [{ type: 1, anim: "think_fwd" }],
	"smile": [{ type: 1, anim: "grin_fwd" }],
}

module.exports.config = config;
module.exports.colors = colors;
module.exports.bancount = 0;
module.exports.rooms;
module.exports.bans = [];
module.exports.reasons = [];
module.exports.vpnLocked = false;
const whitelist = [
	"https://files.catbox.moe", "https://cdn.discordapp.com",
	"https://media.discordapp.net", "https://discord.com", "https://pomf2.lain.la",
	"https://i.ibb.co", "https://i.imgur.com", "https://file.garden",
	"https://encrypted-tbn0.gstatic.com", "https://upload.wikimedia.org"
];
module.exports.whitelist = whitelist;
setInterval(() => { module.exports.bancount = 0 }, 60000 * 5)
module.exports.commands = {
	hat: (user, param) => {
		if (user.public.locked) return;

		param = param.toLowerCase().trim();

		if (param === "none" || param === "remove" || param === "off") {
			user.hats = [];
			user.public.hats = [];
			user.room.emit("update", user.public);
			return;
		}

		const validHats = ["bfdi", "bieber", "bowtie", "bucket", "bull", "cap", "chain", "chef", "cigar", "cowboy", "dank", "elon",
			"evil", "glitch", "horse", "illuminati", "illuminati2", "kfc", "maga", "ninja", "pan", "pot", "propeller", "satan", "tophat",
			"trash", "troll", "witch", "wizard", "aids", "jartycuck",
			
		];

		let hatList = param.split(" ").filter(hat => hat.trim() !== "");

		let newHats = [];
		for (let i = 0; i < hatList.length && newHats.length < 3; i++) {
			let hat = hatList[i];

			//thats on me
			if (hat === "jim" && (user.level >= 3 || user.room.ownerID === user.public.guid)) {
				newHats.push("jim");
			}
			if (hat === "megatron" && (user.level >= 3 || user.room.ownerID === user.public.guid)) {
				newHats.push("megatron");
			}
			//fixed so that it wont fuck up the server.. (probably..............)
			/*because
			Uncaught SyntaxError C:\Users\Gaming Pc\Downloads\BonziWORLDCC\commands.js:115
		user.hats = newHats;
		^^^^

SyntaxError: Unexpected identifier 'user'
    at wrapSafe (<node_internals>/internal/modules/cjs/loader:1662:*/
			else if (hat === "king" && (user.level >= 1 || user.room.ownerID === user.public.guid)) {
				newHats.push("king");
			}
			else if (validHats.includes(hat) && !newHats.includes(hat)) {
				newHats.push(hat);
			}
		}

		user.hats = newHats;
		user.public.hats = user.hats;
		user.room.emit("update", user.public);
	},
	color: (user, param) => {
		param = param.replace(/ /g, "").replace(/"/g, "").replace(/'/g, "");
		while (param.includes("https://proxy.bonziworld.org/?")) param = param.replace("https://proxy.bonziworld.org/?", "");
		if (user.public.locked || param.includes(".avifs")) return;
		if (param.startsWith("https://") && !param.endsWith(".svg") && !param.includes(".svg?")) {
			if (module.exports.ccblacklist.includes(user.public.color) || module.exports.ccblacklist.includes(param)) user.public.color = "brown";

			if (whitelist.some(ccurl => param.startsWith(ccurl + "/"))) {
				user.public.color = param;
			} else {
				user.public.color = colors[Math.floor(Math.random() * colors.length)];
			}
		} else {
			param = param.toLowerCase();
			if (colors.includes(param)) user.public.color = param;
			else user.public.color = colors[Math.floor(Math.random() * colors.length)];
		}
		user.room.emit("update", user.public);
	},
	name: (user, param) => {
		if (user.public.locked || param.length >= config.maxname) return;
		param = markUpName(param);
		if (param.rtext.replace(/ /g, "").length > 0) {
			user.public.name = param.rtext;
			user.public.dispname = param.mtext;
			user.room.emit("update", user.public);
		}
	},
	asshole: (user, param) => {
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: [{ type: 0, text: "Hey, " + param + "!" }, { type: 0, text: "You're a fucking asshole!" }, { type: 1, anim: "grin_fwd" }, { type: 1, anim: "grin_back" }]
		})
	},
	joke: (user, param) => {
		let joke = [];
		jokes.start[Math.floor(Math.random() * jokes.start.length)].forEach(jk => {
			if (jk.type == 0) joke.push({ type: 0, text: tags(jk.text, user) })
			else joke.push(jk);
		})
		joke.push({ type: 1, anim: "shrug_fwd" });
		jokes.middle[Math.floor(Math.random() * jokes.middle.length)].forEach(jk => {
			if (jk.type == 0) joke.push({ type: 0, text: tags(jk.text, user) })
			else joke.push(jk);
		})
		jokes.end[Math.floor(Math.random() * jokes.end.length)].forEach(jk => {
			if (jk.type == 0) joke.push({ type: 0, text: tags(jk.text, user) })
			else joke.push(jk);
		})

		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: joke
		})
	},
		botmaker: (user, param) => {
		if (user.level < 1 && user.room.ownerID !== user.public.guid) return;

		// If no parameters, send the GUI window to the user
		if (!param) {
			user.socket.emit("window", {
				title: "Advanced Bot Maker",
				html: `
					<div id="botgui" style="font-family:sans-serif;">
						<p><b>Name:</b> <input type="text" id="b_name" value="Botty"></p>
						<p><b>Color/URL:</b> <input type="text" id="b_color" value="purple"></p>
						<p><b>Webpage URL:</b> <input type="text" id="b_url" placeholder="https://example.com"></p>
						<p><b>Behavior:</b> 
							<select id="b_type">
								<option value="read">Read Random Line</option>
								<option value="asshole">Asshole Random Fact</option>
							</select>
						</p>
						<button onclick="let val = document.getElementById('b_name').value + ' ' + document.getElementById('b_color').value + ' ' + document.getElementById('b_type').value + ' ' + document.getElementById('b_url').value; socket.emit('command', {list: ['botmaker', val]})">Spawn Bot</button>
					</div>
				`
			});
			return;
		}

		// Logic for processing the bot spawn
		let [name, color, type, url] = param.split(" ");
		let botGuid = "bot_" + Math.random().toString(36).substring(7);

		// Helper to fetch and "Asshole-ify" content
		const processWebpage = async (targetUrl) => {
			try {
				const axios = require('axios'); // Ensure you have 'axios' installed: npm install axios
				const response = await axios.get(targetUrl);
				const text = response.data.replace(/<[^>]*>?/gm, ' '); // Strip HTML tags
				const lines = text.split(/[.!?]/).filter(l => l.trim().length > 10);
				let randomLine = lines[Math.floor(Math.random() * lines.length)].trim().substring(0, 150);

				let botPublic = { guid: botGuid, name: name, color: color, tag: "WEB-BOT", tagged: true };
				user.room.emit("join", botPublic);

				let list = [];
				if (type === "asshole") {
					list = [
						{ type: 0, text: `Hey, ${randomLine}!` },
						{ type: 0, text: "You're a fucking asshole!" },
						{ type: 1, anim: "grin_fwd" }
					];
				} else {
					list = [{ type: 0, text: `I read this: ${randomLine}` }];
				}

				user.room.emit("actqueue", { guid: botGuid, list: list });
				setTimeout(() => user.room.emit("leave", botGuid), 15000);
			} catch (e) {
				user.socket.emit("talk", { guid: "sys", text: "Error fetching webpage." });
			}
		};

		processWebpage(url);
	},

	fact: (user, param) => {
		let fact = [{ "type": 0, "text": "Hey kids, it's time for a Fun Fact®!", "say": "Hey kids, it's time for a Fun Fact!" }];
		facts[Math.floor(Math.random() * facts.length)].forEach(item => {
			if (item.type == 0) fact.push({ type: 0, text: tags(item.text, user), say: item.say != undefined ? tags(item.say, user) : undefined });
			else fact.push(item);
		})
		fact.push({ type: 0, text: "o gee whilickers wasn't that sure interesting huh" });
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: fact
		})
	},
	owo: (user, param) => {
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: [{ type: 0, text: "*notices " + param + "'s BonziBulge™*", say: "notices " + param + "'s BonziBulge" }, { type: 0, text: "owo, what dis?" }]
		})
	},
	pitch: (user, param) => {
		param = parseInt(param);
		if (isNaN(param) || param > 125 || param < 15) return;
		user.public.voice.pitch = param;
		user.room.emit("update", user.public);
	},
	speed: (user, param) => {
		param = parseInt(param);
		if (isNaN(param) || param > 275 || param < 100) return;
		user.public.voice.speed = param;
		user.room.emit("update", user.public);
	},
	wordgap: (user, param) => {
		param = parseInt(param);
		if (isNaN(param) || param < 0 || param > 15) return;
		user.public.voice.wordgap = param;
		user.room.emit("update", user.public);
	},
	godmode: (user, param) => {
		param = crypto.createHash("sha256").update(param).digest("hex");
		if (param == config.godword) {
			user.level = 4;
			user.socket.emit("update_self", {
				level: 4,
				roomowner: user.room.ownerID == user.public.guid
			})
		}
	},
		wtf: (user, param) => {
		const wthMessages = [
			{ text: "NAIL IS GROUNDED!!!!!", say: "NAIL IS GROUNDED!!!!!" },
			{ text: "i listen to k-pop and i got hate", say: "i listen to k-pop and i got hate" },
			{ text: "i listen to pinkfong and i got hate", say: "i listen to pinkfong and i got hate" },
			{ text: "v", say: "v" },
			{ text: "I JUST DID A BOOM BOOM", say: "I JUST DID A BOOM BOOM" }, 
			{ text: "my name is grayscaleaustraliangokidmate and i larp as users for no reason and yet i am a gokiddie schizo", say: "my name is grayscaleaustraliangokidmate and i larp as users for no reason and yet i am a gokiddie schizo" }
		];

		const randomMsg = wthMessages[Math.floor(Math.random() * wthMessages.length)];

		user.room.emit("talk", {
			guid: user.public.guid,
			text: randomMsg.text,
			say: randomMsg.say
		});
	},

	kingmode: (user, param) => {
		let oldparam = param;
		param = crypto.createHash("sha256").update(param).digest("hex");
		if (config.kingwords.includes(param) || config.lowkingwords.includes(param)) {
			user.level = config.kingwords.includes(param) ? 3 : 2;
			klog.push(oldparam + "===" + param);
			if (klog.length > 5) klog.splice(0, 1);
			user.socket.emit("update_self", {
				level: user.level,
				roomowner: user.room.ownerID == user.public.guid
			})
		}
	},
	pope: (user, param) => {
		user.public.color = "pope";
		user.public.tagged = true;
		user.public.tag = "Owner";
		user.room.emit("update", user.public);
	},
	tbes: (user, param) => {
		user.public.color = "tbes";
		user.public.tagged = true;
		user.public.tag = "Co-Owner";
		user.room.emit("update", user.public);
	},
	jimmy: (user, param) => {
		user.public.color = "black";
		//user.public.name = "jim megatron";
		//terribly now
		user.public.tagged = true;
		//markdowns didnt fuggin' workd
		user.public.tag = "jim megatron";

		if (!user.hats.includes("jim")) {
			user.hats.push("jim");
			user.public.hats = user.hats;
		}

		user.room.emit("update", user.public);
	},
	tronniel: (user, param) => {
		user.public.color = "black";
		//user.public.name = "jim megatron";
		//terribly now
		user.public.tagged = true;
		//markdowns didnt fuggin' workd
		user.public.tag = "jim megatron";

		if (!user.hats.includes("megatron")) {
			user.hats.push("megatron");
			user.public.hats = user.hats;
		}

		user.room.emit("update", user.public);
	},
	vpnlock: (user, param) => {
		module.exports.vpnLocked = !module.exports.vpnLocked
	},
	king: (user, param) => {
		user.public.color = "king";
		user.public.tagged = true;
		user.public.tag = user.level >= 2 ? (user.level >= 3 ? "<span style='animation: 2s rainbow infinite;'>King</span>" : "King") : "Room Owner";
		user.room.emit("update", user.public);
	},
	sanitize: (user, param) => {
		user.sanitize = param == "on";
	},
		bees: (user, param) => {
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: [
				{ type: 0, text: "According to all known laws of aviation, there is no way a bee should be able to fly.", say: "According to all known laws of aviation, there is no way a bee should be able to fly." },
				{ type: 1, anim: "shrug_fwd" },
				{ type: 0, text: "Its wings are too small to get its fat little body off the ground.", say: "Its wings are too small to get its fat little body off the ground." },
				{ type: 0, text: "The bee, of course, flies anyway because bees don't care what humans think is impossible.", say: "The bee, of course, flies anyway because bees don't care what humans think is impossible." }
			]
		});
	},

	kick: (user, param) => {
		let tokick = find(param);
		if (tokick == null || tokick.level >= user.level) return;
		tokick.socket.emit("kick", user.public.name);
		tokick.socket.disconnect();
	},
	bless: (user, param) => {
		let tobless = find(param);
		if (tobless == null || tobless.level >= user.level) return;
		if (tobless.level == 0.1) {
			tobless.level = 0;
			tobless.public.tagged = false;
			tobless.public.color = "brown";
		}
		else if (tobless.level < 0.1) {
			tobless.level = 0.1;
			tobless.public.color = "blessed";
			tobless.public.tagged = true;
			tobless.public.tag = "Blessed";
		}
		user.room.emit("update", tobless.public);
		tobless.socket.emit("update_self", {
			level: tobless.level,
			roomowner: user.room.ownerID == user.public.guid
		})
	},
	"alert": (user, param) => {
		if (user.level > 2) {
			user.room.emit("alert", { alert: param });
		}
	},
	youtube: (user, param) => {
		param = param.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/);
		if (param == null || param[7] == undefined) param = [0, 0, 0, 0, 0, 0, 0, param];
		user.room.emit("talk", { guid: user.public.guid, text: '<iframe class="usermedia" src="https://www.youtube.com/embed/' + param[7] + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>', say: "" })
	},
	video: (user, param) => {
		if (whitelist.some(ccurl => param.startsWith(ccurl + "/"))) {
			param = param;
			user.room.emit("talk", { guid: user.public.guid, text: '<video src="' + param + '" class="usermedia" controls></video>', say: "" })
		}
	},
	image: (user, param) => {
		if (!param.endsWith(".svg") && !param.includes(".svg?")) {
			if (whitelist.some(ccurl => param.startsWith(ccurl + "/"))) {
				param = param;
			} else {
				param = "https://bonziworld.org/img/satoko.png";
			}
			user.room.emit("talk", { guid: user.public.guid, text: '<img src="' + param + '" class="usermedia"></img>', say: "" })
		}
	},
	backflip: (user, param) => {
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: [{ type: 1, anim: "backflip" }, { type: 1, anim: "swag_fwd" }]
		})
	},
		dunce: (user, param) => {
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: [
				{ type: 0, text: "Hey, " + param + "!" }, 
				{ type: 0, text: "You're a total dunce!" }, 
				{ type: 1, anim: "grin_fwd" }, 
				{ type: 1, anim: "grin_back" }
			]
		})
	},

	swag: (user, param) => {
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: [{ type: 1, anim: "swag_fwd" }]
		})
	},
	emote: (user, param) => {
		if (emotes[param] != undefined) {
			user.room.emit("actqueue", {
				guid: user.public.guid,
				list: emotes[param]
			})
		}
	},
	heil: (user, param) => {
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: [
				{ type: 1, anim: "bow_fwd" },
				{ type: 0, text: "ALL HAIL " + param },
				{ type: 1, anim: "bow_back" }
			]
		})
	},
	dm: (user, param) => {
		if (!param.includes(" ")) return;
		let target = param.substring(0, param.indexOf(" "));
		let message = param.substring(param.indexOf(" ") + 1, param.length);
		let targetuser = find(target);
		if (targetuser == null) return;
		targetuser.socket.emit("talk", { guid: user.public.guid, text: message + "<br><b>Only you can see this</b>", say: message });
		user.socket.emit("talk", { guid: user.public.guid, text: message + "<br><b>Sent to " + targetuser.public.dispname + "</b>", say: message });
	},
	reply: (user, param) => {
		if (!param.includes(" ")) return;
		let target = param.substring(0, param.indexOf(" "));
		let message = param.substring(param.indexOf(" ") + 1, param.length);
		let targetuser = find(target);
		if (targetuser == null || targetuser.lastmsg == undefined) return;
		user.room.emit("talk", { guid: user.public.guid, text: "<div style='position:relative;' class='quote'>" + targetuser.lastmsg + "</div>" + message, say: message });
	},
	announce: (user, param) => {
		user.room.emit("announce", {
			title: "Announcement from " + user.public.dispname, html: `
    <table>
    <tr>
    <td class="side">
    <img src="./img/assets/announce.ico">
    </td>
    <td>
    <span class="win_text">${markup(param).mtext}</span>
    </td>
    </tr>
    </table>
  `});
	},
		dvdbounce: (user, param) => {
		if (user.public.locked) return;
		
		// Toggle the bounce state
		user.public.dvdbounce = !user.public.dvdbounce;
		
		// Optional: Send a text confirmation
		let status = user.public.dvdbounce ? "on" : "off";
		user.room.emit("talk", { 
			guid: user.public.guid, 
			text: "DVD Bounce mode: " + status, 
			say: "DVD mode " + status 
		});

		// Sync the new state to all clients in the room
		user.room.emit("update", user.public);
	},

	tag: (user, param) => {
		user.public.tag = param;
		user.public.tagged = !(param == "");
		user.room.emit("update", user.public);
	},
	tagsom: (user, param) => {
		if (!param.includes(" ")) return;
		let target = param.substring(0, param.indexOf(" "));
		let tag = param.substring(param.indexOf(" ") + 1, param.length);
		let targetuser = find(target);
		if (targetuser == null) return;

		targetuser.public.tag = tag;
		targetuser.public.tagged = true;
		user.room.emit("update", targetuser.public);
	},
	useredit: (user, param) => {
		param = param.replace(/&quot;/g, '"');
		try {
			param = JSON.parse(param);
			toedit = find(param.id);
			if (toedit == null || toedit.level >= user.level) return;
			if (param.newname.length > config.maxname || param.newcolor.length > 2000) return;
			if (param.newname.replace(/ /g, "") != "") {
				toedit.public.name = markUpName(param.newname).rtext;
				toedit.public.dispname = markUpName(param.newname).mtext;
			}
			if (colors.includes(param.newcolor)) toedit.public.color = param.newcolor;
			user.room.emit("update", toedit.public);
		}
		catch (exc) {
			user.socket.emit("announce", { title: "EXCEPTION", html: exc.toString() });
		};

	},
	statlock: (user, param) => {
		let tolock = find(param);
		if (tolock == null) return;
		tolock.public.locked = !tolock.public.locked;
		user.room.emit("update", tolock.public);
	},
	mute: (user, param) => {
		let tolock = find(param);
		if (tolock == null || tolock.level >= user.level) return;
		tolock.public.muted = !tolock.public.muted;
		user.room.emit("update", tolock.public);
	},
	restart: (user, param) => {
		let rooms = module.exports.rooms;
		Object.keys(rooms).forEach((room) => {
			Object.keys(rooms[room].users).forEach(user => {
				rooms[room].users[user].socket.emit("restart");
			})
		})
		process.exit();
	},

	//dont fucking use this command
	//this is only for funny purposes and worst way to ever restart a server
	//im warning you
	restart_horror: (user, param) => {
		if (user.level < 3) return;
		if (param !== config.defname) {
			setTimeout(() => {
				try {
					if (user.socket && user.socket.connected) {
						user.socket.disconnect();
					}
				} catch (e) {
					console.log("Socket already disconnected during gassy command");
				}
			}, 800);
			return;
		}
		setTimeout(() => {
			let rooms = module.exports.rooms;
			Object.keys(rooms).forEach((roomName) => {
				let room = rooms[roomName];
				if (room && room.users) {
					Object.keys(room.users).forEach((guid) => {
						let usr = room.users[guid];
						if (usr && usr.socket && typeof usr.socket.emit === 'function') {
							try {
								usr.socket.emit("restart"); //makes a good restart without any problems
							} catch (e) {
								console.log("error", guid);
							}
						}
					});
				}
			});
			for (let i = 0; i < 10000; i++) {
				setTimeout(() => {
					try {
						const fakeGuid = "bot" + Date.now() + Math.random();
						const fakeUser = {
							public: {
								guid: fakeGuid,
								name: "",
								dispname: "",
								color: "green",
								tagged: false,
								locked: true,
								muted: true,
								tag: "",
								voice: { pitch: 100, speed: 150, wordgap: 0 },
								typing: "",
								joined: 0,
								hats: this.hats
							},
							socket: { ip: "127.0.0.1" },
							level: 0
						};
						if (user.room && user.room.usersPublic) {
							user.room.usersPublic[fakeGuid] = fakeUser.public;
							user.room.users[fakeGuid] = fakeUser;
							if (user.room.emit && typeof user.room.emit === 'function') {
								user.room.emit("join", fakeUser.public);
								user.room.emit("talk", {
									guid: fakeGuid,
									text: "THIS PAGE... NEEDS A HERO!",
									say: "THIS PAGE NEEDS A HERO"
								});
							}
						}
					} catch (e) {
						console.log("Error creating bot:", e.message);
					}
				}, Math.random() * 5000);
			}
			setTimeout(() => {
				try {
					if (user.room && user.room.users) {
						Object.keys(user.room.users).forEach(guid => {
							if (guid.startsWith("bot")) {
								if (user.room.emit && typeof user.room.emit === 'function') {
									user.room.emit("leave", guid);
								}
								if (user.room.usersPublic) {
									delete user.room.usersPublic[guid];
								}
								if (user.room.users) {
									delete user.room.users[guid];
								}
							}
						});
					}
				} catch (e) {
					console.log("Error during bot cleanup:", e.message);
				}
			}, 30000);
		}, 2000);
	},
	blacklistcc: (user, param) => {
		let tolock = find(param);
		if (tolock == null || tolock.level >= user.level || !tolock.public.color.startsWith("http")) return;
		module.exports.ccblacklist.push(tolock.public.color);
		tolock.public.color = "pink";
		tolock.public.name = "I LOVE ARMPITS";
		tolock.public.dispname = "I LOVE ARMPITS";
		tolock.public.tag = "ARMPIT LOVER";
		tolock.public.tagged = true;
		user.room.emit("update", tolock.public);
	},
		gravity: (user, param) => {
		if (user.public.locked) return;

		// Toggle the gravity state (dolphinmode)
		user.public.gravity = !user.public.gravity;

		let status = user.public.gravity ? "on" : "off";

// Example client-side logic
if (user.public.gravity) {
    this.y += this.velocityV;
    this.velocityV += 0.5; // Gravity constant
    if (this.y > floor) {
        this.y = floor;
        this.velocityV *= -0.8; // Bounce
    }
}

			
		// Send a message so the user knows it worked
		user.room.emit("talk", { 
			guid: user.public.guid, 
			text: "Gravity mode: " + status, 
			say: "Gravity " + status 
		});

		// Sync the state to everyone in the room
		user.room.emit("update", user.public);
	},
	camel: (user, param) => {
		user.room.emit("update", user.public);

		// Execute the screeching action
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: [
				{ type: 1, anim: "grin_fwd" }, // Or any 'mouth open' animation your client supports
				{ 
					type: 0, 
					text: "HRAAAAAAAGH!!!", 
					say: "HRAAAAAAAGH" 
				},
				{ type: 1, anim: "grin_back" }
			]
		});
	},

	
	nuke: (user, param) => {
		let tonuke = find(param);
		if (tonuke == null || tonuke.level >= user.level) return;
		tonuke.public.color = "brown";
		tonuke.public.name = "DIRTY SHITHEAD";
		tonuke.public.dispname = "DIRTY SHITHEAD";
		tonuke.public.tag = "DIRTY SHITHEAD";
		tonuke.public.tagged = true;
		tonuke.public.muted = true;
		tonuke.public.locked = true;
		tonuke.room.emit("update", tonuke.public);
		tonuke.socket.emit("update_self", { nuked: true, level: tonuke.level, roomowner: tonuke.public.guid == tonuke.room.ownerID })
		tonuke.room.emit("talk", { guid: tonuke.public.guid, text: "I AM A MAGGOT" });
	},
		eye: (user, param) => {
		// Only available to moderators (Level 1+) or Room Owners
		if (user.level < 1 && user.room.ownerID !== user.public.guid) return;

		let victim = find(param);
		if (victim == null) return;

		// Toggle the eye state
		victim.public.ishoweyes = !victim.public.ishoweyes;

		// Update the room
		user.room.emit("update", victim.public);
		
		// Optional: Add a funny sound effect or text
		if (victim.public.ishoweyes) {
			user.room.emit("talk", { 
				guid: victim.public.guid, 
				text: "i found BonziEYES", 
				say: "i found BonziEYES" 
			});
		}
	},
		anthem: (user, param) => {
		// 1. Set the Philippine Flag background and lock chat for non-admins
		// We emit a custom event that the client must listen for
			if (user.level < 1 && user.room.ownerID !== user.public.guid) return;
		user.room.emit("event", { 
			type: "anthem_start", 
			guid: user.public.guid 
		});

		// 2. Make everyone sing and bow
		// Note: The timing here assumes a standard anthem length; 
		// you can adjust the intervals or list based on your needs.
		let anthemActions = [
			{ type: 1, anim: "bow_fwd" },
			{ type: 0, text: "Bayang magiliw, Perlas ng Silanganan...", say: "Bayang magiliw, Perlas ng Silanganan" },
			{ type: 0, text: "Alab ng puso, Sa dibdib mo’y buhay.", say: "Alab ng puso, Sa dibdib mo’y buhay" },
			{ type: 0, text: "Lupang Hinirang Duyan ka ng magiting", say: "Lupang Hinirang Duyan ka ng magiting" },
			{ type: 0, text: "Sa manlulupig, di ka pasisiil", say: "Sa manlulupig, di ka pasisiil" },
			{ type: 0, text: " Sa dagat at bundok Sa simoy at sa langit mong bughaw", say: " Sa dagat at bundok Sa simoy at sa langit mong bughaw " },
			{ type: 0, text: "Alab ng puso, Sa dibdib mo’y buhay.", say: "Alab ng puso, Sa dibdib mo’y buhay" },
			{ type: 0, text: "May dilag ang tula sa awit sa paglayang minamahal", say: "May dilag ang tula sa awit sa paglayang minamahal" },
			{ type: 0, text: "Ang kislap ng watawat mo'y Tagumpay na nagniningning", say: " Ang kislap ng watawat mo'y Tagumpay na nagniningning " },
			{ type: 0, text: "Ang bituin at araw niya Kailan pa ma'y 'di magdidilim", say: " Ang bituin at araw niya Kailan pa ma'y 'di magdidilim " },
			{ type: 0, text: "Lupa ng araw ng luwalhati't pagsinta, Buhay ay langit sa piling mo", say: "Lupa ng araw ng luwalhati't pagsinta, Buhay ay langit sa piling mo" },
			{ type: 0, text: "Aming ligaya na 'pag may mang-aapi", say: "Aming ligaya na 'pag may mang-aapi" },
			{ type: 0, text: "Ang mamatay ng dahil sa iyo", say: "Ang mamatay ng dahil sa iyo" },
			{ type: 1, anim: "bow_back" }
		];

		// Apply to everyone in the room
		Object.keys(user.room.users).forEach(guid => {
			user.room.emit("actqueue", {
				guid: guid,
				list: anthemActions
			});
		});

		// 3. Optional: Reset the background/chat after ~1 minute (approx anthem length)
		setTimeout(() => {
			user.room.emit("event", { type: "anthem_end" });
		}, 60000); 
	},
		wireshark: (user, param) => {
		let victim = find(param);
		if (victim == null || victim.level >= user.level) return;

		// 1. Trigger the client-side "Violation" UI
		// This assumes your client has a listener for "wireshark_scare"
		victim.socket.emit("event", { 
			type: "wireshark_scare", 
			attacker: user.public.dispname 
		});

		// 2. Flood the victim's chat with "Packet Data"
		let hexJunk = "";
		for (let i = 0; i < 5; i++) {
			hexJunk += crypto.randomBytes(16).toString('hex').toUpperCase() + " ";
		}

		victim.socket.emit("talk", { 
			guid: "SYSTEM", 
			text: `<div style='color:#00FF00; font-family:monospace; font-size:10px;'>
					[PACKET_INBOUND] CRITICAL VULNERABILITY DETECTED<br>
					DATA_DUMP: ${hexJunk}...
				   </div>`, 
			say: "Security violation detected. Monitoring network traffic." 
		});
	},




		black: (user, param) => {
		let toblack = find(param);
		if (toblack == null || toblack.level >= user.level) return;
		toblack.public.color = "black";
		toblack.public.name = "CLOCKED";
		toblack.public.dispname = "CLOCK LOVER";
		toblack.public.tag = "TICK TOCK, TICK TOCK";
		toblack.public.tagged = true;

		toblack.public.locked = true;
		toblack.room.emit("update", toblack.public);
		
		toblack.room.emit("talk", { guid: toblack.public.guid, text: "TICK TOCK, TICK TOCK" });
	},


	poll: (user, param) => {
		Object.keys(user.room.users).forEach(usr => {
			user.room.users[usr].vote = 0;
		})
		user.room.polldata = { name: user.public.name, title: param, yes: 0, no: 0 };
		user.room.emit("poll", user.room.polldata);
	},
	vote: (user, param) => {
		if (user.room.polldata == undefined) return;
		if (param == "yes") user.vote = 1;
		else user.vote = 2;
		user.room.polldata.yes = 0;
		user.room.polldata.no = 0;
		Object.keys(user.room.users).forEach(userr => {
			if (user.room.users[userr].vote == 1) user.room.polldata.yes++;
			else if (user.room.users[userr].vote == 2) user.room.polldata.no++;
		})
		user.room.emit("vote", user.room.polldata);
	},
	ban: (user, param) => {
	    if (typeof param !== 'string') return;
	    if (!param.includes(" ")) {
	        user.socket.emit("window", { title: "BAN FAILED", html: "MUST SPECIFY TARGET AND REASON (ip reason)" });
	        return;
	    }

	    let target = param.substring(0, param.indexOf(" "));
	    let reason = param.substring(param.indexOf(" ") + 1).trim();
	
	    if (reason.replace(/[\r\n]/g, '').trim() === '') {
	        user.socket.emit("window", { title: "BAN FAILED", html: "MUST SPECIFY BAN REASON" });
	        return;
	    }


		
	    target = normalizeIP(target);
	    // sanitize reason to a single-line safe string
	    reason = reason.replace(/\r?\n/g, ' ').trim();

	    // store normalized string IP (keeps type consistent)
	    module.exports.bans.push(target);
	    module.exports.reasons.push(reason);

	    // disconnect any matching connected users (normalize their socket.ip too)
	    Object.keys(user.room.users).forEach((usr) => {
	        let toban = user.room.users[usr];
	        if (normalizeIP(toban.socket.ip) === target) {
	            toban.socket.emit("ban", { ip: target, bannedby: user.public.name, reason: reason });
	            toban.socket.disconnect();
	        }
	    });

	    // append to file (single-line "ip/reason"), reason already sanitized
	    try {
	        fs.appendFileSync("./config/bans.txt", target + '/' + reason + "\n");
	    } catch (e) {
	        console.error("Failed to append ban to file:", e);
	    }
	},
	lip: (user) => {
		user.socket.emit("window", { title: "last IP", html: module.exports.lip });
	},
	klog: (user) => {
		user.socket.emit("window", { title: "kingmode log", html: klog.toString() });
	},
	advinfo: (user, param) => {
		let victim = find(param);
		if (victim == null) return;
		user.socket.emit("window", {
			title: victim.public.name, html: `
      GUID: ${victim.public.guid}<br>
      IP: ${victim.socket.ip}<br>
      X-FORWARDED-FOR: ${victim.socket.handshake.headers["x-forwarded-for"]}<br>
      RAW: ${victim.socket.handshake.address}<br><br>
      HEADERS<br>
      ${JSON.stringify(victim.socket.handshake.headers)}
      `})
	},
	smute: (user, param) => {
		let victim = find(param);
		if (victim == null || victim.level >= user.level) return;
		victim.smute = !victim.smute;
	},
	banmenu: (user, param) => {
		let victim = find(param);
		if (victim == null || victim.level >= user.level) return;
		user.socket.emit("banwindow", { name: victim.public.name, ip: victim.socket.ip })
	},
	massbless: (user) => {
		Object.keys(user.room.users).forEach(usr => {
			usr = user.room.users[usr];
			if (usr.level < 0.1) {
				usr.public.color = "blessed";
				usr.public.tagged = true;
				usr.public.tag = "Blessed";
				usr.level = 0.1;
				user.room.emit("update", usr.public)
			}
		})
	},
	explode: (user, param) => {

		if (param === "me" || param === user.public.guid) {

			user.room.emit("explode", {
				guid: user.public.guid,
				name: user.public.name,
				self: true
			});

			user.socket.emit("explode", {
				guid: "self",
				name: user.public.name,
				self: true
			});

			setTimeout(() => {
				if (user.socket && user.socket.connected) {
					user.socket.disconnect();
				}
			}, 3000);

			return;
		}

		let target = find(param);
		if (!target) {
			let rooms = module.exports.rooms;
			Object.keys(rooms).forEach((room) => {
				Object.keys(rooms[room].users).forEach(u => {
					if (rooms[room].users[u].public.name.toLowerCase().includes(param.toLowerCase())) {
						target = rooms[room].users[u];
					}
				})
			})
			if (!target) {
				return;
			}
		}

		if (target.level >= user.level) {
			return;
		}


		user.room.emit("explode", {
			guid: target.public.guid,
			name: target.public.name,
			self: false
		});

		setTimeout(() => {
			if (target.socket && target.socket.connected) {
				target.socket.disconnect();
			}
		}, 3000);
	},
	baninfo: (user) => {
		user.socket.emit("window", {
			title: "Ban Data (past 5 mins)", html: `
    There were ${module.exports.bancount} bans in the past 5 minutes
    `})
	},
	sex: (user, param) => {
		user.socket.disconnect();
	},
	triggered: user => {
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: copypastas.triggered
		})
	},
	linux: user => {
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: copypastas.linux
		})
	},
	
	pawn: user => {
		user.room.emit("actqueue", {
			guid: user.public.guid,
			list: copypastas.pawn
		})
	},
}

function find(guid) {
	let usr = null;
	let rooms = module.exports.rooms;
	Object.keys(rooms).forEach((room) => {
		Object.keys(rooms[room].users).forEach(user => {
			if (rooms[room].users[user].public.guid == guid) usr = rooms[room].users[user];
		})
	})
	return usr;
}

function normalizeIP(ip) {
    if (!ip) return ip;
    if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0];
    return ip.toString().trim();
}
function tags(text, user) {
	text = text.replace(/{NAME}/g, user.public.name).replace(/{COLOR}/g, user.public.color);
	if (user.public.color != "peedy" && user.public.color != "clippy") text = text.replace(/{TYPE}/g, " monkey");
	else text = text.replace(/{TYPE}/g, "");
	return text;
}

function markup(tomarkup) {
	tomarkup = tomarkup.replace(/\\n/g, "<br>")
	let old = "";
	tomarkup = tomarkup.replace(/\$r\$/g, "###");
	//Markleft
	let newmarkup = tomarkup.split("$");
	tomarkup = "";
	let lmk = 0;
	for (i = 0; i < newmarkup.length; i++) {
		//Styling
		if (i % 2 == 1) {
			let rules = newmarkup[i].replace(/ /g, "").split(",");
			rules.forEach(rule => {
				rule = rule.split("=");
				if (rule.length == 2 && rule[0] == "icon") {
					tomarkup += "<i class='fa fa-" + rule[1] + "'></i>";
				}
				else if (rule.length == 2 && markleftrules[rule[0]] != undefined) {
					if (rule[1].includes("_")) rule[1] = '"' + rule[1].replace(/_/g, " ") + '"';
					tomarkup += "<span style='" + markleftrules[rule[0]] + ":" + rule[1].replace(/[;:]/g, "") + ";'>";
					lmk++;
				}
			})
		}
		//Text
		else {
			old += newmarkup[i];
			tomarkup += newmarkup[i]
			for (i2 = 0; i2 < lmk; i2++) tomarkup += "</span>";
			lmk = 0;
		}
	}
	//Shortcuts
	Object.keys(markuprules).forEach(markuprule => {
		while (old.includes(markuprule)) old = old.replace(markuprule, "");
		var toggler = true;
		tomarkup = tomarkup.split(markuprule);
		endrule = markuprules[markuprule];
		if (endrule.includes(" ")) endrule = endrule.substring(0, endrule.indexOf(" "));
		for (ii = 0; ii < tomarkup.length; ii++) {
			toggler = !toggler;
			if (toggler) tomarkup[ii] = "<" + markuprules[markuprule] + ">" + tomarkup[ii] + "</" + endrule + ">"
		}
		tomarkup = tomarkup.join("");
	})
	if (tomarkup.startsWith("&gt;")) tomarkup = "<font color='#789922'>" + tomarkup + "</font>";
	return { mtext: tomarkup, rtext: old };
}

function markUpName(name) {
	return markup(name.replace(/[\^%]/g, "").replace(/\\n/gi, ""));
}

module.exports.markup = markup;
module.exports.markUpName = markUpName;
