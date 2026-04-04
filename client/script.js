var $ = (a) => { return document.getElementById(a) }
let idcounter = 0;
let moving = false;
let target;
let announcements = [];
let poll;

function updateStartMenu(userData) {
    const startMenuName = document.getElementById('start_menu_name');
    const startMenuPfp = document.getElementById('start_menu_pfp');
    
    if (startMenuName && userData && userData.name) {
        startMenuName.textContent = userData.name || 'Anonymous';
    }
    
    if (startMenuPfp && userData && userData.color) {
        const profileImageUrl = `https://bonziworld-cc.onrender.com/profiles/${userData.color}.png`;
        startMenuPfp.style.backgroundImage = `url("${profileImageUrl}")`;
        
        startMenuPfp.onerror = function() {
            this.style.backgroundImage = 'url("./img/pfp/purple.webp")';
        };
    }
}
function spawnStartMenu(){
    $('start_menu').style.display='flex';
    $('start_menu').style.position='absolute';
    $('start_menu').style.left='0px';
    $('start_menu').style.bottom='32px';
}
function initializeStartMenu() {
    const savedName = localStorage.getItem('bw_userName');
    const savedColor = localStorage.getItem('bw_userColor') || 'purple';
    
    const userData = {
        name: savedName || 'Anonymous',
        color: savedColor
    };
    
    updateStartMenu(userData);
    
    window.addEventListener('userDataUpdated', function(e) {
        if (e.detail) {
            updateStartMenu(e.detail);
        }
    });
}

function saveUserPreferences(name, color) {
    if (name && name !== 'Anonymous') {
        localStorage.setItem('bw_userName', name);
    }
    if (color) {
        localStorage.setItem('bw_userColor', color);
    }
    
    updateStartMenu({ name: name, color: color });
    
    window.dispatchEvent(new CustomEvent('userDataUpdated', {
        detail: { name: name, color: color }
    }));
}

function addNameChangeFeature() {
    const startMenuName = document.getElementById('start_menu_name');
    if (startMenuName) {
        startMenuName.style.cursor = 'pointer';
        startMenuName.title = 'Click to change name';
        
        startMenuName.addEventListener('click', function() {
            const newName = prompt('Enter your new name:', this.textContent);
            if (newName && newName.trim() !== '') {
                saveUserPreferences(newName.trim(), localStorage.getItem('bw_userColor') || 'purple');
            }
        });
    }
}

function movestart(mouse, self) {
    if (moving) return;
    if (mouse.touches != undefined) mouse = mouse.touches[0];
    target = self;
    target.offsetx = mouse.clientX - target.x;
    target.offsety = mouse.clientY - target.y;
    target.lx = target.x;
    target.ly = target.y;
    moving = window.cont == undefined;
}
class msWindow {
    constructor(title, html, x, y, width, height, buttons) {
        this.x = x;
        this.y = y;
        this.toppad = 0;
        this.w = !width ? "auto" : width;
        this.h = !height ? "auto" : height;
        this.lx = x;
        this.ly = y;
        this.id = idcounter + "w";
        let btncounter = 0;
        idcounter++;
        if (buttons == undefined) buttons = [{ name: "CLOSE" }]
        html += "<center class='buttonbar'>";
        buttons.forEach((button) => {
            html += "<button class='msBtn' id='" + this.id + "b" + btncounter + "'>" + button.name + "</button> &nbsp; ";
            button.id = btncounter;
            btncounter++;
        })
        html += "</center>";
        document.getElementsByTagName("body")[0].insertAdjacentHTML("beforeend", `
            <div id='`+ this.id + `p' style='top:` + y + `;left:` + x + `;height: ` + height + `px;width: ` + width + `px;max-width: 80%;' class='msWindow_cont'>
            <p id="`+ this.id + `t" class='msWindow_title'>` + title + ` &nbsp; <button class="log_close" id='` + this.id + `close'></button></p>
            <div class='msWindow_body'>`+ html + `</div>
            </div>
            `);
        buttons.forEach((button) => {
            $(this.id + "b" + button.id).onclick = () => {
                if (button.callback != undefined) button.callback();
                this.kill();
            };
        })
        $(this.id + "close").onclick = () => { this.kill() };
        $(this.id + "t").addEventListener("mousedown", mouse => { movestart(mouse, this) });
        $(this.id + "t").addEventListener("touchstart", mouse => { movestart(mouse.touches[0], this) });
        this.w = $(this.id + "p").clientWidth + 10;
        this.h = $(this.id + "p").clientHeight;
        this.check();

        if (x == undefined && y == undefined) {
            this.y = innerHeight / 2 - $(this.id + "p").clientHeight / 2;
            this.x = innerWidth / 2 - $(this.id + "p").clientWidth / 2;
            $(this.id + "p").style.top = this.y;
            $(this.id + "p").style.left = this.x;
        }

        $(this.id + "p").style.width = this.w;
    }
    update() {
        $(this.id + "p").style.left = this.x;
        $(this.id + "p").style.top = this.y;
    }
    kill() {
        $(this.id + "p").remove();
        if (announcements.includes(this)) announcements.splice(announcements.indexOf(this), 1);
        else if (poll == this) poll = undefined;
        delete this;
    }
    check() {
        if (this.x < 0) this.x = 0;
        else if (this.x > innerWidth - this.w - 25) this.x = innerWidth - this.w - 25;
        if (this.y < 0) this.y = 0;
        else if (this.y > innerHeight - this.h - 50) this.y = innerHeight - this.h - 50;
        this.update();
    }
}
var jsnotified = false;
async function getClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        return text;
    } catch (err) {
        console.error("Failed to read clipboard contents: ", err);
    }
}

async function clipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy text:', err);
    }
}


(() => {
    let socket = io(location.href);
    delete io;
    let error_id = "error_disconnect";
    let level = 0;
    let welcomeversion = 6;
    let typestate = 0;
    let room = "";
    let censor = [/nigger/gi, /faggot/gi, /fuck/gi, /shit/gi, /slut/gi, /cunt/gi, /kike/gi, /goatse/gi, /kekma/gi, /ass/gi, /sex/gi, /cock/gi]
    let minx = 0;
    window.talkstate = 0;
    let talktarget = undefined;
    let mobile = innerWidth <= 560;
    let stage;
    const agents = {
    };
    setInterval(() => { Object.keys(agents).forEach(a => { agents[a].pub.joined++ }) }, 60000)
    const settings = parseCookie(document.cookie);
    let useredit = {
        name: "",
        id: "",
        newname: "",
        newcolor: ""
    }

    window.tts = {};

    const types = {
        "peedy": "peedy",
        "clippy": "clippy"
    }
    const colors = ["purple", "blessed", "yellow", "gigglyfuneclown", "red", "blue", "green", "pink", "brown", "orange", "black", "jew", "cyan", "white", "king", "pope", "tbes", "rabbi", "peedy", "clippy", "troll", "jabba", "spadezi", "raging"];

    const sheets = {
        bonzi: {
            spritew: 200,
            spriteh: 160,
            w: 3400,
            h: 3360,
            toppad: 0,
            anims: {
                idle: 0,
                enter: [277, 302, "idle", 0.25],
                leave: [16, 39, 40, 0.25],
                grin_fwd: { frames: range(182, 189).concat([184]), next: "grin_back", speed: 0.25 },
                grin_back: { frames: [183, 182], next: "idle", speed: 0.25 },
                shrug_fwd: [40, 50, "shrug_idle", 0.25],
                shrug_idle: [50],
                shrug_back: { frames: range(40, 50).reverse(), speed: 0.25, next: "idle" },
                backflip: [331, 343, "idle", 0.25],
                swag_fwd: [108, 125, "swag_idle", 0.25],
                swag_idle: 125,
                swag_back: { frames: range(108, 125).reverse(), next: "idle", speed: 0.25 },
                earth_fwd: [51, 56, "earth_idle", 0.25],
                earth_idle: [57, 80, "earth_idle", 0.25],
                earth_back: { frames: range(51, 58).reverse(), next: "idle", speed: 0.25 },
                clap_fwd: { frames: [0, 10, 11, 12, 13, 14, 15, 13, 14, 15], next: "clap_back", speed: 0.25 },
                clap_back: { frames: [13, 14, 15, 13, 14, 15, 12, 11, 10], next: "idle", speed: 0.25 },
                beat_fwd: { frames: [0, 101, 102, 103, 104, 105, 106, 107, 104, 105, 106, 107], next: "beat_back", speed: 0.25 },
                beat_back: { frames: [104, 105, 106, 107, 104, 105, 106, 107, 103, 102, 101], next: "idle", speed: 0.25 },
                think_fwd: { frames: range(242, 247).concat([247, 247, 247, 247]), next: "think_back", speed: 0.25 },
                think_back: { frames: range(242, 247).reverse(), next: "idle", speed: 0.25 },
                bow_fwd: [224, 231, "bow_idle", 0.25],
                bow_idle: 232,
                bow_back: { frames: range(224, 232).reverse(), next: "idle", speed: 0.25 },
                praise_fwd: [159, 163, "praise_idle", 0.25],
                praise_idle: 164,
                praise_back: { frames: range(159, 164).reverse(), next: "idle", speed: 0.25 },
            },
        },
        peedy: {
            spritew: 160,
            spriteh: 128,
            w: 4000,
            h: 4095,
            toppad: 12,
            anims: {
                idle: 0,
                enter: [659, 681, "idle", 0.25],
                leave: [23, 47, 47, 0.25],
                swag_fwd: [334, 347, "swag_idle", 0.25],
                swag_idle: 348,
                swag_back: { frames: range(334, 347).reverse(), next: "idle", speed: 0.25 },
                bow_fwd: [625, 632, "bow_idle", 0.25],
                bow_idle: 632,
                bow_back: { frames: range(625, 632).reverse(), next: "idle", speed: 0.25 },
                earth_fwd: [418, 429, "earth_idle", 0.25],
                earth_idle: [429],
                earth_back: { frames: range(418, 429).reverse(), next: "idle", speed: 0.25 },
                shrug_fwd: [644, 649, "shrug_idle", 0.25],
                shrug_idle: 649,
                shrug_back: { frames: range(644, 649).reverse(), next: "idle", speed: 0.25 },
                grin_fwd: [753, 763, "grin_back", 0.25],
                grin_back: { frames: range(753, 763).reverse(), next: "idle", speed: 0.25 },
                clap_fwd: { frames: range(322, 331), next: "clap_back", speed: 0.25 },
                clap_back: { frames: range(322, 331).reverse(), next: "idle", speed: 0.25 },
            }
        },
        clippy: {
            spritew: 124,
            spriteh: 93,
            w: 3348,
            h: 3162,
            toppad: 40,
            anims: {
                idle: 0,
                enter: [410, 416, "idle", 0.25],
                leave: { frames: [0].concat(range(364, 411)), speed: 0.25 },
                shrug_fwd: [199, 210, "shrug_idle", 0.25],
                shrug_idle: 210,
                shrug_back: { frames: range(199, 210).reverse(), next: "idle", speed: 0.25 },
                bow_fwd: [1, 11, "bow_idle", 0.25],
                bow_idle: 11,
                bow_back: { frames: range(1, 11).reverse(), next: "idle", speed: 0.25 }
            }
        },
    }

    const spritesheets = {};
    colors.forEach(color => {
        if (types[color] != undefined) {
            let sheet = sheets[types[color]];
            spritesheets[color] = new createjs.SpriteSheet({ images: ["./img/agents/" + color + ".png"], frames: { width: sheet.spritew, height: sheet.spriteh }, animations: sheet.anims })

        } else {
            spritesheets[color] = new createjs.SpriteSheet({ images: ["./img/agents/" + color + ".png"], frames: { width: 200, height: 160 }, animations: sheets.bonzi.anims })
        }
    })


    const clientcommands = {
        "settings": () => {
            new msWindow("Settings", `
                <datalist id="themes">
                    <option value="purple">
                    <option value="blue">
                    <option value="red">
                    <option value="green">
                    <option value="black">
                    <option value="windowsxp">
                </datalist>
  
                <table>
                <tr>
                <td class="side">
                <img src="./img/assets/settings.ico">
                </td>
                <td>
                <span class="win_text">
                <table style="margin-left: 10px;">
        
                <tr><td>Background (URL):</td><td><input id='bgName' value='${settings.bg}'></td></tr>
            
                <tr><td>Disable Crosscolors:</td><td><input type="checkbox" id="disCC" ${settings.disableCCs ? "Checked" : ""}></td></tr>
                <tr><td>Enable Autojoin:</td><td><input type="checkbox" id="autojoin" ${settings.autojoin ? "Checked" : ""}></td></tr>
                <tr><td>Your Name:</td><td><input id='username' value='${settings.name || localStorage.getItem('bw_userName') || "Anonymous"}'></td></tr>
                </table>
                <input type="submit" style="display:none;">
                </span>
                </td>
                </tr>
                </table>
                `, undefined, undefined, undefined, undefined, [{ name: "ACCEPT", callback: () => { 
                    const newName = $("username").value || settings.name || "Anonymous";
                    changeSettings($("disCC").checked, $("bgName").value, $("autojoin").checked, newName, $("theme_name")?.value, $("color_name")?.value); 
                    saveUserPreferences(newName, settings.color || 'purple');
                    location.reload(); 
                } }, { name: "CANCEL" }])
        },
        "applets": (applete) => {
            if (applete == "minibw") return;
            if (document.body.innerHTML.includes(` <button id="minibw" class="msBtn"style="max-height:60px;max-width:100px;">Open Mini Bonz`)) return;

            new msWindow('Apps', `  
                  <h1>BonziWORLD Apps</h1>
                  <div id="appletsview">
                      <div class="applets_item">
                        <img src="/img/assets/radio.png" width="100" height="100"/>
                        <button id="jukebox" class="msBtn"style="max-height:60px;max-width:100px;">Open Jukebox</button>
                      </div>
                       <div class="applets_item">
                        <img src="/img/logo_readme.png" width="100" height="auto"/>
                        <button id="minibw" class="msBtn"style="max-height:60px;max-width:100px;">Markup and Hats</button>
                      </div>
                      <div class="applets_item">
                        <img src="/img/assets/notepad.png" width="50" height="auto"/>
                        <button id="notepad" class="msBtn"style="max-height:60px;max-width:100px;">Open Notepad</button>
                      </div>
                  </div>
`, undefined, undefined, undefined, undefined, [
                { name: "Close" }]);

            setTimeout(() => {
                ["jukebox", "minibw", "notepad"].forEach(applet => {
                    $(applet).onclick = () => { clientcommands["applets_" + applet](); }
                });
            }, 1100);

        },
        "applets_jukebox": () => {
            if (document.body.innerHTML.includes("Use a custom URL that links to a<br>")) return;
            new msWindow("Jukebox", `
                <div style="display:flex;flex-direction:row;">
                    <img src="/img/assets/radio.png" width="100" height="100"/>
                <div>
              <p>
              Use a custom URL that links to a<br> 
              .MP3 file. <br>
              (example: https://website.com/music.mp3)
              </p>
              <div style="display:flex;flex-direction:row;">
                  Custom URL:&nbsp;<input type="text" id="track_custom" placeholder="Custom Music URL..."/>
                  <button class="msBtn" style="width:70" id="playtoggle" onclick="var musik=document.getElementById('track_custom').value;if(musik===undefined||musik==''){alert('You did not enter a custom music URL.'); return;}else{var audio=new Audio(musik);audio.play();}document.getElementById('playtoggle').innerText='Pause';var a=this.onclick;this.onclick=()=>{audio.pause();this.onclick=a;document.getElementById('playtoggle').innerText='Play'};audio.onended=()=>{document.getElementById('playtoggle').innerText='Play'}">Play</button>
              </div>
              </div>
              `, undefined, undefined, undefined, undefined, [{ name: "Close" }]);
        },
        "applets_minibw": () => {
            if (document.body.innerHTML.includes(`<button style="width:80px;height:30px;" class="msBtn" onclick="$('dialoguemini').innerText = 'Markup and Hats';$('minicont').style.`)) return;
            if ($('content').innerHTML.includes('<iframe id="minicont"')) return;
            new msWindow('Mini BonziWORLD', `
                <div id="minicont"style="display:flex;flex-direction:column;width:max-content;max-width:`+ (window.innerWidth / 1.8) + `;">
                <p id="dialoguemini">Find out the markup and hats.</p>
                <iframe src="markupandhats.html" width="`+ (window.innerWidth / 2) + `" height="400">Loading...</iframe></div>
                    <button style="width:80px;height:30px;" class="msBtn" onclick="$('dialoguemini').innerText = 'Markup and Hats';$('minicont').style.width = '30px';$('minicont').style.height = '30px';var r = this.onclick;this.innerText = 'Display'; this.onclick = () => {this.onclick = r; $('minicont').style.width='`+ (window.innerWidth / 2 + 100) + `px'; $('minicont').style.height = '500px'; this.innerText = 'Hide'};">Hide</button>

                `, undefined, undefined, undefined, undefined, [
                { name: "Close" }]);
        },
        "applets_notepad": () => {
            if ($("content").innerHTML.includes(`<textarea style="width:400px;height:300px;font-family:Tahoma;`)) return;
            new msWindow('Notepad', `
            <textarea style="width:400px;height:300px;font-family:Tahoma;" id="notepadcont"></textarea><br>
            <button class="msBtn" id="notepadcopy">Copy Text</button><br>
            <button class="msBtn" id="notepadpaste">Paste Text</button><br>
            <hr>
            <button class="msBtn" id="notepadrun">Run As Javascript</button>
            `, undefined, undefined, undefined, undefined, [{ name: "Close" }]);
            setTimeout(() => {
                $("notepadcopy").onclick = () => {
                    if ($("notepadcont").selectionStart === $("notepadcont").selectionEnd) { alert("No text selected. Hold and drag to select text."); return; }
                    else {
                        clipboard($("notepadcont").value.substring($("notepadcont").selectionStart, $("notepadcont").selectionEnd));
                    }
                }
                $("notepadpaste").onclick = () => {
                    getClipboard().then(clipcont => {
                        var result = $("notepadcont").value.substring(0, $("notepadcont").selectionStart) + clipcont + $("notepadcont").value.substring($("notepadcont").selectionStart, $("notepadcont").value.length);
                        $("notepadcont").value = result;
                    });

                }
                $("notepadrun").onclick = () => {
                    var a = "no";
                    if (jsnotified == false) {
                        a = prompt("Are you sure you want to do this? Running as javascript may cause damage to the page, and will cause errors if your text is not javascript. Running scripts from others can also lead to trouble, and is not reccomended unless you know it is not malicious. Type yes to continue or no if you do not want to continue:");
                        a = a.toLowerCase();
                        if (a == "yes") jsnotified = true;
                    }
                    if (jsnotified == true) {
                        try {
                            eval($("notepadcont").value);
                        } catch (e) {
                            alert(e);
                        }
                    }
                }
            }, 1100);
        }
    }


    function pushlog(text) {
        var toscroll = $("log_body").scrollHeight - $("log_body").scrollTop < 605;
        $("log_body").insertAdjacentHTML("beforeend", "<p>" + text + "</p>");
        if (toscroll) $("log_body").scrollTop = $("log_body").scrollHeight;
    }

    function linkify(msg) {
        if (msg.includes("<")) return msg;

        msg = msg.split(" ");
        let nmsg = [];
        msg.forEach(word => {
            if (word.startsWith("http://") || word.startsWith("https://")) {
                nmsg.push("<a href='" + word + "' target='_blank'>" + word + "</a>")
            }
            else nmsg.push(word);
        })
        return nmsg.join(" ");
    }


    class agent {
        constructor(x, y, upub) {
            let id = upub.guid;
            let image = upub.color;
            let sheet = sheets[image] == undefined ? sheets["bonzi"] : sheets[image];
            this.x = x;
            this.y = y;
            this.ttsmute = false;
            this.toppad = sheet.toppad;
            this.w = sheet.spritew;
            this.h = sheet.spriteh;
            this.anims = sheet.anims;
            this.id = upub.guid;
            this.lx = x;
            this.ly = y;
            this.pub = upub;
            this.hats = upub.hats || [];

            this.physics = {
                x: x,
                y: y,
                rotation: 0,
                velocityX: 0,
                velocityY: 0,
                angularVelocity: 0,
                gravity: 2,
                isFalling: false,
                exploded: false
            };
            this.element = this.parent;

            if (image.startsWith("http") && (settings.disableCCs || settings.under)) image = "purple";
            if (spritesheets[image] == undefined) {
                let img = new Image();
                img.crossOrigin = "anonymous";
                img.src = image;
                let spritesheet = new createjs.SpriteSheet({ images: [img], frames: { width: 200, height: 160 }, animations: sheets.bonzi.anims })
                this.sprite = new createjs.Sprite(spritesheet, "enter");
            }
            else this.sprite = new createjs.Sprite(spritesheets[image], "enter");
            this.sprite.x = x;
            this.sprite.y = y + this.toppad;
            stage.addChild(this.sprite);

            let bubbleclass = (x > innerWidth / 2 - this.w / 2) ? "bubble-left" : "bubble-right";
            if (mobile) bubbleclass = (y > innerHeight / 2 - this.h / 2) ? "bubble-top" : "bubble-bottom";
            $("agent_content").insertAdjacentHTML("beforeend", `
            <div id='`+ id + `p' style='margin-top:` + y + `;margin-left:` + x + `;height: ` + (this.h + sheet.toppad) + `px;width: ` + this.w + `px;' class='agent_cont'>
            <span class='tag' id='`+ id + `tg'></span>
            <span class='nametag' id='`+ id + `n'><span id='` + id + `nn'>` + this.pub.dispname + `</span><span id='` + id + `nt'></span></span>
            <span class='`+ bubbleclass + `' style='display: none;' id='` + id + `b' >
            <div id='`+ id + `t' class='bubble_text'></div>
            </span>
            <div style='width:${this.w};height:${this.h};' id='${this.id}c'></div>
            </div>
            `);

            $("agent_content").insertAdjacentHTML("beforeend", `
            <div id='`+ id + `hats' style='position:fixed;margin-top:` + y + `;margin-left:` + x + `;width:` + this.w + `px;height:` + this.h + `px;pointer-events:none;z-index:2;'>
            </div>
        `);

            this.updateHats();

            this.parent = $(this.id + "p");
            $(id + "c").onclick = () => { if (this.lx == this.x && this.ly == this.y) this.cancel() };
            if (this.pub.tagged) {
                $(id + "tg").style.display = "inline-block";
                $(id + "tg").innerHTML = this.pub.tag;
            }

            $(id + "c").addEventListener("mousedown", mouse => { movestart(mouse, this) });
            $(id + "c").addEventListener("touchstart", mouse => { movestart(mouse.touches[0], this) });
        }
        update() {
            this.parent.style.marginLeft = this.x;
            this.parent.style.marginTop = this.y;
            this.sprite.x = this.x;
            this.sprite.y = this.y + this.toppad;

            let hatsContainer = $(this.id + "hats");
            if (hatsContainer) {
                hatsContainer.style.marginLeft = this.x + 'px';
                hatsContainer.style.marginTop = this.y + 'px';
            }
        }
        updateHats() {
            let hatsContainer = $(this.id + "hats");
            if (!hatsContainer) return;

            hatsContainer.innerHTML = '';

            this.hats.forEach(hat => {
                hatsContainer.insertAdjacentHTML('beforeend',
                    `<img src="./img/hats/${hat}.webp" style="width:200px;height:160px;position:absolute;top:0;left:0;" alt="${hat} hat">`
                );
            });

            hatsContainer.style.marginLeft = this.x + 'px';
            hatsContainer.style.marginTop = this.y + 'px';
        }
        change(image) {
            this.cancel();
            let sheet = sheets[types[image]];
            let spritesheet;
            if (image.startsWith("http")) {
                if (settings.disableCCs) {
                    image = "purple";
                    spritesheet = spritesheets["purple"];
                }
                else {
                    let img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = image;
                    spritesheet = new createjs.SpriteSheet({ images: [img], frames: { width: 200, height: 160 }, animations: sheets.bonzi.anims })
                }
            } else spritesheet = spritesheets[image];
            if (sheet == undefined) sheet = sheets["bonzi"];
            this.w = sheet.spritew;
            this.h = sheet.spriteh;
            this.toppad = sheet.toppad;
            this.pub.color = image;

            $(this.id + "p").style.width = this.w;
            $(this.id + "p").style.height = this.h + sheet.toppad;
            $(this.id + "c").style.width = this.w;
            $(this.id + "c").style.height = this.h;

            stage.removeChild(this.sprite);
            this.anims = sheet.anims;
            this.sprite = new createjs.Sprite(spritesheet, "idle");
            this.update();
            stage.addChild(this.sprite);

            poscheck(this.id);
        }
        talk(write, say) {

            this.cancel();
            setTimeout(() => {
                $(this.id + "b").style.display = "block"
                if (say.startsWith("-") || this.ttsmute) say = "";
                else say = desanitize(say).replace(/ etc/gi, "E T C").replace(/ eg/gi, "egg");
                if (say != "") speak.play(say, this.id, this.pub.voice, () => {
                    delete window.tts[this.id];
                    $(this.id + "b").style.display = "none";
                })
                $(this.id + "t").innerHTML = linkify(write);
                pushlog("<font color='" + this.pub.color + "'>" + this.pub.name + ": </font>" + linkify(write));
            }, 100)
        }
        explode() {
            if (this.exploded) return;
            this.exploded = true;

            let startX = this.x;
            let startY = this.y;
            let elem = this.parent;

            let explosion = document.createElement("div");
            explosion.className = "explosion";
            explosion.style.left = startX + "px";
            explosion.style.top = startY + "px";
            document.body.appendChild(explosion);
            let sfx = new Audio("./explosion.mp3");
            sfx.volume = 0.5;
            sfx.play();

            elem.style.position = 'fixed';
            elem.style.left = startX + 'px';
            elem.style.top = startY + 'px';
            elem.style.margin = '0';

            this.physics.x = 0;
            this.physics.y = 0;
            this.physics.rotation = 0;
            this.physics.velocityY = -20;
            this.physics.velocityX = (Math.random() * 10 + 5) * (Math.random() > 0.5 ? 1 : -1);
            this.physics.angularVelocity = (Math.random() * 30 + 20) * (Math.random() > 0.5 ? 1 : -1);

            const physicsInterval = setInterval(() => {
                this.physics.velocityY += 2;
                this.physics.x += this.physics.velocityX;
                this.physics.y += this.physics.velocityY;
                this.physics.rotation += this.physics.angularVelocity;

                let rotDeg = this.physics.rotation;
                let rotRad = rotDeg * (Math.PI / 180);

                elem.style.transform =
                    `translate(${this.physics.x}px, ${this.physics.y}px) rotate(${rotDeg}deg)`;

                this.sprite.x = startX + this.physics.x;
                this.sprite.y = startY + this.physics.y + this.toppad;
                this.sprite.rotation = rotRad;

                if (frame > 60) {
                    elem.style.opacity = Math.max(0, 1 - (frame - 60) / 60);
                }

                if (frame > 120) {
                    clearInterval(physicsInterval);
                    explosion.remove();
                    setTimeout(() => {
                        this.kill(true);
                    }, 100);
                }
            }, 33);

            setTimeout(() => {
                if (explosion.parentNode) {
                    explosion.remove();
                }
            }, 1000);
        }
        actqueue(list, i) {
            if (i == 0) this.cancel();
            if (i >= list.length) return;
            if (list[i].say == undefined) list[i].say = list[i].text;
            if (list[i].type == 0) {
                setTimeout(() => {
                    if (settings.under) censor.forEach(c => {
                        list[i].text = list[i].text.replaceAll(c, "****");
                        if (list[i].say != undefined) list[i].say = list[i].say.replaceAll(c, "")
                    })
                    $(this.id + "t").innerHTML = linkify(list[i].text);
                    $(this.id + "b").style.display = "block"
                    if (!this.ttsmute) speak.play(list[i].say.replace(/[!:;]/g, '').replace(/ etc/gi, "E T C").replace(/ eg/gi, "egg"), this.id, this.pub.voice, () => {
                        delete window.tts[this.id];
                        $(this.id + "b").style.display = "none";
                        i++;
                        this.actqueue(list, i);
                    })
                    else {
                        setTimeout(() => {
                            delete window.tts[this.id];
                            $(this.id + "b").style.display = "none";
                            i++;
                            this.actqueue(list, i);
                        }, 2000)
                    }
                    pushlog("<font color='" + this.pub.color + "'>" + this.pub.name + ": </font>" + list[i].text);
                }, 100);
            } else {
                if (this.anims[list[i].anim] == undefined) {
                    i++;
                    this.actqueue(list, i);
                    return;
                }
                let animlen = this.anims[list[i].anim].frames != undefined ? this.anims[list[i].anim].frames.length : this.anims[list[i].anim][1] - this.anims[list[i].anim][0]
                this.sprite.gotoAndPlay(list[i].anim)
                setTimeout(() => {
                    i++;
                    this.actqueue(list, i);
                }, 1000 / 15 * animlen)
            }
        }
        kill(playignore) {
            this.cancel();
            if (!playignore) {
                this.sprite.gotoAndPlay("leave");
                let animlen = 1000 / 15 * (this.anims.leave[1] - this.anims.leave[0]);
                setTimeout(() => {
                    stage.removeChild(this.sprite);
                    $(this.id + "p").remove();
                    let hatsContainer = $(this.id + "hats");
                    if (hatsContainer) hatsContainer.remove();
                }, animlen)
            }
            else {
                stage.removeChild(this.sprite);
                $(this.id + "p").remove();
                let hatsContainer = $(this.id + "hats");
                if (hatsContainer) hatsContainer.remove();
            }
            delete agents[this.id];
        }
        cancel() {
            $(this.id + "b").style.display = "none";
            $(this.id + "t").innerHTML = '';
            if (window.tts[this.id] != undefined && window.tts[this.id].started) {
                window.tts[this.id].stop();
                window.tts[this.id] = undefined;
            }
            else if (window.tts[this.id] != undefined) {
                window.tts[this.id].start = () => { };
                window.tts[this.id] = undefined;
            }
            this.sprite.stop();
            this.sprite.gotoAndPlay("idle");
            if (agents[this.id] == undefined) {
                stage.removeChild(this.sprite);
                $(this.id + "p").remove();
                let hatsContainer = $(this.id + "hats");
                if (hatsContainer) hatsContainer.remove();
            }
        }
    }

    function poscheck(agent) {
        agent = agents[agent];
        if (agent.x > innerWidth - agent.w) agent.x = innerWidth - agent.w;
        if (agent.y > innerHeight - 32 - agent.h) agent.y = innerHeight - 32 - agent.h;
        if (agent.x > innerWidth / 2 - agent.w / 2 && !mobile) $(agent.id + "b").className = "bubble-left";
        else if (!mobile) $(agent.id + "b").className = "bubble-right";
        else if (agent.y > innerHeight / 2 - agent.h / 2) $(agent.id + "b").className = "bubble-top";
        else $(agent.id + "b").className = "bubble-bottom";
        agent.update();
    }



    function mousemove(mouse) {
        if (!moving || (mouse.touches == undefined && innerWidth < innerHeight)) return;
        if (mouse.touches != undefined) mouse = mouse.touches[0];
        target.x = Math.max(minx, Math.min(innerWidth - target.w, mouse.clientX - target.offsetx))

        target.y = Math.max(0, Math.min(innerHeight - target.h - 32, mouse.clientY - target.offsety));

        if ($(target.id + "b") != undefined) {
            if (mobile) $(target.id + "b").className = target.y > innerHeight / 2 - target.h / 2 ? "bubble-top" : "bubble-bottom";
            else $(target.id + "b").className = target.x > innerWidth / 2 - target.w / 2 ? "bubble-left" : "bubble-right";
        }
        target.update();
    }
    function mouseup(mouse) {
        moving = false;
    }

    function movehandler() {
        document.addEventListener("mousemove", mousemove)
        document.addEventListener("mouseup", mouseup)
        document.addEventListener("touchmove", mousemove)
        document.addEventListener("touchend", mouseup)

        window.addEventListener("resize", () => {
            $("bonzicanvas").width = innerWidth;
            $("bonzicanvas").height = innerHeight;
            stage.updateViewport(innerWidth, innerHeight);
            Object.keys(agents).forEach(poscheck)
        })

        document.addEventListener("contextmenu", mouse => {
            moving = false;
            mouse.preventDefault();
            let bid = -1;
            Object.keys(agents).forEach((akey) => {
                if (
                    mouse.clientX > agents[akey].x &&
                    mouse.clientX < agents[akey].x + agents[akey].w &&
                    mouse.clientY > agents[akey].y &&
                    mouse.clientY < agents[akey].y + agents[akey].h + agents[akey].toppad
                ) bid = akey;
            })

            if (bid > -1) {
                let cmenu = [
                    {
                        type: 0,
                        name: "Cancel",
                        callback: (passthrough) => {
                            passthrough.cancel();
                        }
                    },
                    {
                        type: 0,
                        name: agents[bid].ttsmute ? "Unmute TTS" : "Mute TTS",
                        callback: (passthrough) => {
                            passthrough.ttsmute = !passthrough.ttsmute;
                        }
                    },
                    {
                        type: 0,
                        name: "Get Stats",
                        callback: (passthrough) => {
                            new msWindow(passthrough.pub.name + "'s stats", `
                            <table>
                            <tr>
                            <td class="side">
                            <img src="./img/assets/lookup.ico">
                            </td>
                            <td>
                            <span class="win_text">
                            <table style="margin-left: 15px;">
                            <tr><td>Name:</td><td>${passthrough.pub.name}</td></tr>
                            <tr><td>Color:</td><td>${passthrough.pub.color}</td></tr>
                            <tr><td>Joined:</td><td>${passthrough.pub.joined} minutes ago</td></tr>
                            <tr><td>GUID:</td><td>${passthrough.id}</td></tr>
                            </table>
                            </span>
                            </td>
                            </tr>
                            </table>`);
                        }
                    },
                    {
                        type: 1,
                        name: "Messages",
                        items: [
                            {
                                type: 0,
                                name: "Hail",
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "heil", param: passthrough.pub.name });
                                }
                            },
                            {
                                type: 0,
                                name: "Direct Message",
                                callback: (passthrough) => {
                                    window.talkstate = 1;
                                    $("talkcard").innerHTML = "Sending a private message to " + passthrough.pub.name + " <i class='fa fa-times' onclick='this.parentElement.style.display=\"none\";window.talkstate=0;'></i>";
                                    talktarget = passthrough.id;
                                    $("talkcard").style.display = "inline-block";
                                }
                            },
                            {
                                type: 0,
                                name: "Reply",
                                callback: (passthrough) => {
                                    window.talkstate = 2;
                                    $("talkcard").innerHTML = "Replying to " + passthrough.pub.name + " <i class='fa fa-times' onclick='this.parentElement.style.display=\"none\";window.talkstate=0;'></i>";
                                    talktarget = passthrough.id;
                                    $("talkcard").style.display = "inline-block";
                                }
                            },
                            {
                                type: 0,
                                name: "Hey, NAME!",
                                callback: (passthrough) => {
                                    socket.emit("talk", `Hey, ${passthrough.pub.name}!`);
                                }
                            },
                        ]
                    },
                    {
                        type: 1,
                        name: "Insults",
                        items: [
                            {
                                type: 0,
                                name: settings.under ? "BLOCKED" : "Call an Asshole",
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "asshole", param: passthrough.pub.name })
                                }
                            },
                            {
                                type: 0,
                                name: "Notice Bulge",
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "owo", param: passthrough.pub.name })
                                }
                            },
                            {
                                type: 0,
                                name: "Call a Dunce",
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "dunce", param: passthrough.pub.name })
                                }
                            },
                            {
                                type: 0,
                                name: "Pastule",
                                callback: (passthrough) => {
                                    socket.emit("talk", passthrough.pub.name + ", stop being a pastule.")
                                }
                            },
                            {
                                type: 0,
                                name: settings.under ? "BLOCKED" : "Call a Stupid Bitch",
                                callback: (passthrough) => {
                                    socket.emit("talk", passthrough.pub.name + ", guess what? You're a stupid bitch! You're a stupid fucking bitch! I can't believe how dumb you are.")
                                }
                            },
                            {
                                type: 0,
                                name: "Tell to STFU",
                                callback: (passthrough) => {
                                    socket.emit("talk", passthrough.pub.name + ", shut the fuck up RIGHT NOW, " + (Math.random() > 0.5 ? " because I'm tired of your bullshit." : " NOW!"));
                                }
                            },
                            {
                                type: 0,
                                name: "Tell a Random Copypasta",
                                callback: (passthrough) => {
                                    const templates = [
                                        "{TITLE}WORLD: {MINTITLE} is {RANK}, {PERSON} is a {THING}... Here are top 5 {THING} to earn a prize \"{TITLE2}\". **5. {QUOTE}, Said by {PERSON}, 4. {QUOTE}, Said by {PERSON}, 3. {QUOTE}, Said by {PERSON}, 2. {QUOTE}, Said by {PERSON}, 1. {QUOTE}, Said by {PERSON}.**",
                                        "I'm a {PERSON}'s {THING}. and this is my {TITLE}: {MINTITLE} that have been {THING} by {PERSON} in honor of {TITLE}Chat. Hi, my name is {PERSON2}, and this is my website that I own, named \"{TITLE2}\"",
                                        "breaking news: {PERSON} has been confirmed to be a {THING} after the {TITLE} incident. {QUOTE} - source: {PERSON2} from {MINTITLE}{TITLE}",
                                        "{PERSON} walked into the {TITLE} room and said: {QUOTE}. everyone gasped. {PERSON2} replied: {QUOTE}. the {THING} began.",
                                        "in the year 20{RANDOMNUM}, {TITLE} was declared {RANK} by {PERSON}. the {THING} protocol was activated. {QUOTE}",
                                        "according to {PERSON2}, {PERSON} is secretly a {THING}. evidence: {QUOTE}. this contradicts earlier statements from {MINTITLE}{TITLE}.",
                                        "the {TITLE} agenda: step 1) {QUOTE} step 2) {QUOTE} step 3) become a {THING}. sponsored by {PERSON}'s {MINTITLE}.",
                                        "{PERSON} vs {PERSON2}: the ultimate {THING} battle. round 1: {QUOTE}. round 2: {QUOTE}. winner: {RANK}.",
                                        "leaked document from {TITLE} reveals {PERSON} is planning to {THING} the {MINTITLE}. key phrase: {QUOTE}.",
                                        "{PERSON} uploaded a video titled \"{TITLE2}\" where they {QUOTE}. comment from {PERSON2}: {QUOTE}. {THING} confirmed.",
                                        "the {TITLE} theory suggests that {PERSON} is actually {PERSON2} in disguise. proof: {QUOTE}. implications: {RANK}.",
                                        "{PERSON}'s last words before becoming a {THING}: {QUOTE}. {PERSON2} responded with: {QUOTE}. {TITLE} was never the same.",
                                        "in a shocking turn of events, {PERSON} admitted to being a {THING}. {QUOTE}. {PERSON2} immediately {QUOTE}. {TITLE} history.",
                                        "the {MINTITLE} manifesto: chapter 1 - {QUOTE}. chapter 2 - how to identify a {THING}. chapter 3 - {PERSON}'s downfall.",
                                        "{PERSON} was caught {QUOTE} in the {TITLE} server. {PERSON2} reacted by {QUOTE}. the {THING} scandal.",
                                        "according to anonymous sources, {PERSON} and {PERSON2} are working together to {THING} the {TITLE} community. leaked message: {QUOTE}.",
                                        "the {TITLE} enigma: why does {PERSON} keep saying {QUOTE}? is it related to the {THING} phenomenon? {PERSON2} thinks so.",
                                        "{PERSON} announced the \"{TITLE2}\" project, described as {RANK}. first feature: {QUOTE}. critics call it {THING}.",
                                        "behind the scenes at {TITLE}: {PERSON} was overheard saying {QUOTE} to {PERSON2}. the {THING} conspiracy deepens.",
                                        "{PERSON}'s guide to becoming a {THING}: 1) {QUOTE} 2) join {TITLE} 3) {QUOTE} 4) profit. reviewed by {PERSON2} as {RANK}.",
                                        "the {TITLE} tapes: recording shows {PERSON} admitting {QUOTE}. {PERSON2} can be heard saying {QUOTE} in background. {THING} confirmed.",
                                        "{PERSON} vs {TITLE}: the battle for {MINTITLE}. {PERSON2} mediates with {QUOTE}. outcome: {RANK}.",
                                        "inside {PERSON}'s {TITLE} folder: {QUOTE}, {QUOTE}, and plans to {THING}. {PERSON2} commented: {QUOTE}.",
                                        "the {THING} protocol has been activated by {PERSON}. {QUOTE}. {TITLE} officials including {PERSON2} responded with {QUOTE}.",
                                        "{PERSON} created a new {TITLE} called \"{TITLE2}\". description: {QUOTE}. {PERSON2} rated it {RANK}. controversy: {THING}.",
                                        "lost {TITLE} transcript reveals {PERSON} telling {PERSON2}: {QUOTE}. this led to the {THING} incident of 20{RANDOMNUM}.",
                                        "{PERSON}'s {TITLE} diary: day 1 - {QUOTE}. day 2 - met a {THING}. day 3 - {PERSON2} said {QUOTE}. day 4 - {RANK}.",
                                        "the {TITLE} equation: {PERSON} + {QUOTE} = {THING}. proof provided by {PERSON2}: {QUOTE}. solution: {MINTITLE}.",
                                        "{PERSON} was banned from {TITLE} for {QUOTE}. {PERSON2} defended them saying {QUOTE}. the {THING} debate continues.",
                                        "according to {TITLE} analytics, {PERSON} is {RANK} likely to become a {THING}. key indicator: {QUOTE}. {PERSON2} disagrees: {QUOTE}."
                                    ];

                                    const words = {
                                        RANDOMNUM: ["XX", "-ACK! WE DO NEVER KNOW WHAT YEAR IT IS....", "99", "BW", "00", "25", "20", "0000", "2130784732732483", "2020202020020", "222222222222222222222222222"],
                                        TITLE: ["Bonzi", "gold", "Nazar", "Erik", "Peedy", "Shit", "Retarded", "Ultimate", "Epic", "OG", "New", "Old"],
                                        TITLE2: ["BonziPOOP Gassy world", "nazar nazar tarzan", "egg pelvis WORLD", "E. gons", "chocolate chat for DroolBOX.", "/joke", "$****r****$ skirts lover", "godmode world", "gassy", "FREE POPE WORLD"],
                                        MINTITLE: ["Revived", "Retard", "Rerevived", "Recarbonated", "Ultra", "CC", ".net", ".org", "Ultimate", "Erik's server", "BWI", "BIA", "ASSWIPE", "GASSY", "Classic", "Pro", "Lite", "HD", "VR"],
                                        RANK: ["disgusting", "awesome", "gemmy", "coal", "brimstone", "COAL", "GEMMY", "cool", "MEGA GEMMY", "downloaded", "leaked", "dead", "silent", "too famous", "famous", "mid", "S-tier", "F-tier"],
                                        PERSON: ["erik", "fune", "jim", "sticky", "scrabby", "siob", "jy", "*g*BIA*g*", "*g*BWI*g*", "ziggy", "soyjaks", "the bonzis", "3 team of birds", "ahmads", "asshair", "niggo", "bonzi", "admin", "mod"],
                                        PERSON2: ["grimmy", "eric trawlas", "slop master", "porn destroyer", "birdyyy", "uwu lost sock gaming", "[[bonzipenis]]", "sharty", "X88B88", "erik's grim reaper", "soyjak king", "[[fVk3]]", "LBTY"],
                                        THING: ["pedophile", "awesome", "shithead", "blessed", "banned", "nuked", "kicked", "ultra blessed", "banned from BWI", "youtuber", "troonout", "troon", "killed", "legend", "noob", "god"],
                                        QUOTE: ["its from the logs", "stfu", "retard", "gofag", "mason alt", "nuke me", "soyballs", "bonziworld is gay", "temp banned", "SHUT THE FUCK UP", "LMFAO", "based", "cringe", "skill issue"]
                                    };

                                    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

                                    const template1 = getRandom(templates);
                                    const template2 = getRandom(templates);
                                    const template3 = getRandom(templates);

                                    const createReplacer = () => {
                                        const usedValues = {};

                                        return (str) => {
                                            return str.replace(/\{(\w+)\}/g, (match, placeholder) => {
                                                if (!words[placeholder]) return match;

                                                if (placeholder === 'PERSON') {
                                                    if (Math.random() > 0.5) {
                                                        return passthrough.pub.name;
                                                    } else {
                                                        let value = getRandom(words[placeholder]);

                                                        const key = `${placeholder}_${value}`;
                                                        for (let i = 0; i < 3; i++) {
                                                            if (!usedValues[key]) {
                                                                usedValues[key] = true;
                                                                return value;
                                                            }
                                                            value = getRandom(words[placeholder]);
                                                        }
                                                        return value;
                                                    }
                                                }

                                                let value = getRandom(words[placeholder]);

                                                if (placeholder === 'QUOTE') {
                                                    const key = `${placeholder}_${value}`;
                                                    for (let i = 0; i < 3; i++) {
                                                        if (!usedValues[key]) {
                                                            usedValues[key] = true;
                                                            return value;
                                                        }
                                                        value = getRandom(words[placeholder]);
                                                    }
                                                }

                                                return value;
                                            });
                                        };
                                    };

                                    const replacer1 = createReplacer();
                                    const replacer2 = createReplacer();
                                    const replacer3 = createReplacer();

                                    const message1 = replacer1(template1);
                                    const message2 = replacer2(template2);
                                    const message3 = replacer3(template3);

                                    const combinedMessage = message1 + " " + message2;

                                    socket.emit("talk", combinedMessage);
                                }
                            },
                        ]
                    }
                ]
                if (level >= 1) {
                    cmenu.push({
                        type: 1,
                        name: "Fun",
                        items: [

                            {
                                type: 0,
                                name: "Toggle Bless",
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "bless", param: passthrough.id })
                                }
                            },
                            {
                                type: 0,
                                name: "User Edit",
                                callback: (passthrough) => {
                                    useredit.name = passthrough.pub.name;
                                    useredit.id = passthrough.id;
                                    showUserEdit();
                                }
                            },
                            {
                                type: 0,
                                name: "NUKE",
                                disabled: level <= 1,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "explode", param: passthrough.id })
                                }
                            },
                                   {
                                type: 0,
                                name: "Clockify",
                                disabled: level <= 1,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "black", param: passthrough.id })
                                }
                            },
                            {
                                type: 0,
                                name: "Moronify",
                                disabled: level <= 1,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "moronify", param: passthrough.id })
                                }
                            },
                            {
                                type: 0,
                                name: "Block Screen",
                                disabled: level <= 1,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "blockscreen", param: passthrough.id })
                                }
                            },
                            {
                                type: 0,
                                name: "Nuke (old)",
                                disabled: level <= 1,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "nuke", param: passthrough.id })
                                }
                            },
                        ]
                    })


                    cmenu.push({
                        type: 1,
                        name: "Moderation",
                        items: [
                            {
                                type: 0,
                                name: agents[bid].pub.locked ? "Stat Unlock" : "Stat Lock",
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "statlock", param: passthrough.id })
                                }
                            },
                            {
                                type: 0,
                                name: agents[bid].pub.muted ? "Unmute" : "Mute",
                                disabled: level <= 1,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "mute", param: passthrough.id });
                                }
                            },
                            {
                                type: 0,
                                name: "Silent Mute",
                                disabled: level <= 1,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "smute", param: passthrough.id })
                                }
                            },
                            {
                                type: 0,
                                name: "Blacklist Crosscolor",
                                disabled: level <= 2,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "blacklistcc", param: passthrough.id })
                                }
                            },
                            {
                                type: 0,
                                name: "Eyeify",
                                disabled: level <= 2,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "eye", param: passthrough.id })
                                }
                            },
                            {
                                type: 0,
                                name: "Kick",
                                disabled: level <= 1,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "kick", param: passthrough.id })
                                }
                            },
                            {
                                type: 0,
                                name: "Advanced Info",
                                disabled: level <= 2,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "advinfo", param: passthrough.id })
                                }
                            },
                            {
                                type: 0,
                                name: "Stylish Ban",
                                disabled: level <= 2,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "stylishban", param: passthrough.id })
                                }
                            },
                            {
                                type: 0,
                                name: "BAN",
                                disabled: level <= 2,
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "banmenu", param: passthrough.id })
                                }
                            },
                        ]
                    })
                }
                if (level >= 4) {
                    cmenu.push({
                        type: 1,
                        name: "Gamer Pope",
                        items: [
                            {
                                type: 0,
                                name: "Set Tag",
                                callback: (passthrough) => {
                                    new msWindow("Change Tag", `
                                        <h1>Change ${passthrough.pub.name}'s tag</h1>
                                        <input id="new_tag">
                                    `, 60, 60, innerWidth - 120, undefined, [{ name: "SUBMIT", callback: () => { socket.emit("command", { command: "tagsom", param: passthrough.id + " " + $("new_tag").value }) } }, { name: "cancel" }])
                                }
                            },
                            {
                                type: 0,
                                name: "Anthem",
                                callback: (passthrough) => {
                                    socket.emit("command", { command: "anthem", param: passthrough.id })
                                }
                            },
                            {
                                type: 0,
                                name: "Get Heads",
                                callback: (passthrough) => {

                                }
                            },
                        ]
                    })
                }
                window.cont = contextmenu(cmenu, mouse.clientX, mouse.clientY, agents[bid], window.cont);
            }
        })
    }

    function talk() {
        let say = $("chatbar").value;
        if (window.talkstate == 2) {
            $("talkcard").style.display = "none";
            window.talkstate = 0;
            socket.emit("command", { command: "reply", param: talktarget + " " + say });
        }
        else if (window.talkstate == 1) {
            $("talkcard").style.display = "none";
            window.talkstate = 0;
            socket.emit("command", { command: "dm", param: talktarget + " " + say });
        }
        else if (say.startsWith("/")) {
            let cmd = say.split(" ");
            let command = cmd[0].substring(1);
            cmd.splice(0, 1);
            let param = cmd.join(" ");
            if (typeof clientcommands[command] != "function") socket.emit("command", { command: command, param: param });
            else clientcommands[command](param);
            if (command == "kingmode" || command == "godmode") {
                settings.autorun = { command: command, param: param };
                document.cookie = compileCookie(settings);
            }
        } else if (say.startsWith("https://youtube.com/watch?v=") || say.startsWith("https://www.youtube.com/watch?v=") || say.startsWith("https://youtu.be/")) {
            socket.emit("command", { command: "youtube", param: say });
        } else {
            socket.emit("talk", say);
        }
        $("chatbar").value = "";
    }

    var settingse = false;
    socket.on("alert", (alrt) => {
        if (alrt.alert !== "off") {
            banner.style.visibility = "visible";
            banner.innerHTML = "ALERT: " + alrt.alert;
        } else {
            banner.style.visibility = "hidden";
        }
    });
    function setup(logindata) {
        if (!location.href.includes("mini.html")) {
            $("settingsUi").onclick = () => {
                clientcommands.settings();
            }
            $("appletsUi").onclick = () => {
                clientcommands.applets();
            }
        }
        if (window.ticker == undefined) window.ticker = setInterval(() => {
            stage.update();
        }, 17)
        error_id = "error_disconnect";
        $("error_page").style.display = "none";
        $("error_restart").style.display = "none";
        $("error_disconnect").style.display = "none";

        level = logindata.level;
        $("room_name").innerHTML = logindata.roomname;
        $("room_count").innerHTML = Object.keys(logindata.users).length;
        room = logindata.roomname;
        $("error_room").innerHTML = logindata.roomname;
        $("room_priv").innerHTML = logindata.roompriv ? "private" : "public";
        $("login").style.display = "none";
        $("content").style.display = "block";
        if (logindata.owner) $("room_owner").style.display = "block";

        Object.keys(logindata.users).forEach(userkey => {
            let user = logindata.users[userkey];
            let type = sheets[types[user.color]] == undefined ? sheets["bonzi"] : sheets[types[user.color]]
            let x = Math.floor(Math.random() * (innerWidth - type.spritew - minx)) + minx;
            let y = Math.floor(Math.random() * (innerHeight - type.spriteh - 32 - type.toppad));
            agents[userkey] = new agent(x, y, user)
        })

        $("chatbar").addEventListener("keydown", key => {
            if (key.which == 13) talk();
        });
        $("chatbar").addEventListener("keyup", () => {
            let newstate = $("chatbar").value.startsWith("/") ? 2 : ($("chatbar").value != "" ? 1 : 0)
            if (typestate != newstate) {
                socket.emit("typing", newstate)
                typestate = newstate;
            }
        })
        if (settings.autorun != undefined && settings.autorun.command.endsWith("mode")) socket.emit("command", { command: settings.autorun.command, param: settings.autorun.param })

        const userData = {
            name: settings.name || localStorage.getItem('bw_userName') || 'Anonymous',
            color: logindata.color || settings.color || 'purple'
        };
        
        if (userData.name && userData.name !== 'Anonymous') {
            localStorage.setItem('bw_userName', userData.name);
        }
        if (userData.color) {
            localStorage.setItem('bw_userColor', userData.color);
        }
        
        updateStartMenu(userData);
        addNameChangeFeature();

        if ($("send_button")) {
            $("send_button").onclick = () => {
                typestate = 0;
                socket.emit("typing", 0);
                talk();
            };
            
            $("start_button").addEventListener("click", function(e) {
                if (window.cont) window.cont = killmenus(window.cont);
                
                var m = $("start_menu");
                if (!m) return;
                
                m.style.display = "flex";
                var r = $("send_button").getBoundingClientRect();
                m.style.left = r.left + "px";
                m.style.bottom = (window.innerHeight - r.top) + "px";
                
                setTimeout(function() {
                    document.addEventListener("click", function c(e) {
                        if (!m.contains(e.target) && e.target !== $("send_button")) {
                            m.style.display = "none";
                            document.removeEventListener("click", c);
                        }
                    });
                    
                    document.addEventListener("contextmenu", function c(e) {
                        m.style.display = "none";
                        document.removeEventListener("contextmenu", c);
                    });
                }, 10);
                
                $("settings_button").onclick = function() { 
                    clientcommands.settings(); 
                    m.style.display = "none"; 
                };
                
                $("jukebox_button").onclick = function() { 
                    clientcommands.applets_jukebox(); 
                    m.style.display = "none"; 
                };
                
                $("hats_button").onclick = function() { 
                    clientcommands.applets_minibw(); 
                    m.style.display = "none"; 
                };

                $("notepad_button").onclick = function() { 
                    clientcommands.applets_notepad(); 
                    m.style.display = "none"; 
                };
                
                $("start_menu_vault").onclick = function() { 
                    alert("Vault feature would go here"); 
                    m.style.display = "none"; 
                };
            });
        }

        socket.on("leave", guid => {
            pushlog(agents[guid].pub.dispname + " has left.");
            agents[guid].kill();
            $("room_count").innerHTML = Object.keys(agents).length;
        })
        socket.on("join", user => {
            let sheet = sheets[types[user.color]] == undefined ? sheets["bonzi"] : sheets[types[user.color]]
            let x = Math.floor(Math.random() * (innerWidth - sheet.spritew - minx)) + minx;
            let y = Math.floor(Math.random() * (innerHeight - sheet.spriteh - 32 - sheet.toppad));
            agents[user.guid] = new agent(x, y, user);
            $("room_count").innerHTML = Object.keys(agents).length;
            pushlog(user.dispname + " has just joined!");
        })
        socket.on("update", user => {
            $(agents[user.guid].id + "nt").innerHTML = user.muted ? "<br>(MUTED)" : user.typing;
            agents[user.guid].typing = user.typing;
            if (user.dispname != agents[user.guid].pub.dispname) $(agents[user.guid].id + "nn").innerHTML = user.dispname;
            if (user.tag != agents[user.guid].pub.tag && user.tagged) {
                $(user.guid + "tg").innerHTML = user.tag;
                $(user.guid + "tg").style.display = "inline-block";
            } else if (!user.tagged) $(user.guid + "tg").style.display = "none"
            let oldcolor = agents[user.guid].pub.color;
            agents[user.guid].pub = user;

            agents[user.guid].hats = user.hats || [];
            agents[user.guid].updateHats();

            if (user.color != oldcolor) agents[user.guid].change(user.color)
        })
        socket.on("talk", text => {
            if (settings.under) {
                if (text.text.includes("<")) return;
                censor.forEach(c => {
                    text.text = text.text.replaceAll(c, "****");
                    if (text.say != undefined) text.say = text.say.replaceAll(c, "")
                })
            }
            agents[text.guid].talk(text.text, text.say == undefined ? text.text : text.say);
        })
        socket.on("actqueue", queue => {
            agents[queue.guid].actqueue(queue.list, 0);
        });
        var banner = document.getElementById("banner");
        socket.on("update_self", info => {
            if (info.nuked) {
                $("chatbar_cont").style.display = "none";
                $("bg").innerHTML = "<img src='https://imgflip.com/s/meme/Nuclear-Explosion.jpg'>"
            }
            level = info.level;
            if (info.roomowner) $("room_owner").style.display = "block";
        })
        socket.on("kick", kicker => {
            error_id = "error_kick";
            $("error_kicker").innerHTML = kicker;
        })
        socket.on("announce", data => {
            announcements.push(new msWindow(data.title, data.html));
            if (announcements.length > 3) {
                announcements[0].kill();
            }
        })
        socket.on("explode", (data) => {
            let agent = agents[data.guid];
            if (agent) {
                agent.explode();
            }
        });
        socket.on("poll", data => {
            if (poll != undefined) {
                poll.kill();
            }
            poll = new msWindow("Poll from " + data.name, `
                <h1>${data.title}</h1>
                <div id="pollyes"><div id="innerbar_yes"></div><span class='polltx'>YES</span></div>
                <div id="pollno"><div id="innerbar_no"></div><span class='polltx'>NO</span></div>
                <span id="votecount">0</span> Votes!
                `, undefined, undefined, innerWidth / 2);
            $("pollyes").onclick = () => { socket.emit('command', { command: 'vote', param: 'yes' }) }
            $("pollno").onclick = () => { socket.emit('command', { command: 'vote', param: 'no' }) }
        })
        socket.on("vote", data => {
            if (poll == undefined) return;
            let tvotes = data.yes + data.no;
            $("innerbar_yes").style.width = data.yes / tvotes * 100 + "%";
            $("innerbar_no").style.width = data.no / tvotes * 100 + "%";
            $("votecount").innerHTML = tvotes;
        })
        socket.on("banwindow", data => {
            new msWindow("Banning " + data.name, `
          <table>
          <tr>
          <td class="side">
          <img src="./img/assets/ban.ico">
          </td>
          <td>
          <span class="win_text">
          <table style="margin-left: 10px;">
          <tr>Banning ${data.name}, IP ${data.ip}</tr>
          <tr><td>Reason:</td><td><input id="reason"></td></tr>
          </table>
          </span>
          </td>
          </tr>
          </table>
          `, undefined, undefined, undefined, undefined, [{ name: "CANCEL" }, {
                name: "BAN", callback: () => {
                    socket.emit("command", { command: "ban", param: data.ip + " " + $("reason").value })
                }
            }])
        })
        socket.on("window", data => {
            new msWindow(data.title, data.html);
        })
    }

    function start() {
        socket.emit("login", {
            name: $("nickname").value,
            room: $("room").value,
            color: settings.color
        })
        settings.name = $("nickname").value.replace(/ /g, "") == "" ? "Anonymous" : $("nickname").value;
        document.cookie = compileCookie(settings);
        
        saveUserPreferences(settings.name, settings.color || 'purple');
        
        $("login_card").style.display = "none";
        $("loading").style.display = "block";
    }

    function tile() {
        let x = 0;
        let sx = 0;
        let y = 0;
        Object.keys(agents).forEach(agent => {
            agent = agents[agent];
            agent.x = x;
            agent.y = y;
            agent.update();
            x += agent.w;
            if (x > innerWidth - agent.w) {
                x = sx;
                y += agent.h;
            }
            if (y > innerHeight - agent.w - 32) {
                sx += 20;
                x = sx;
                y = 0;
            }
        })
    }

    function desanitize(text) {
        return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&lbrack;/g, "square bracket");
    }

    window.onload = () => {
        if (window.cordova != undefined) {
            $("betaapp").style.display = "inline-block";
        }
        $("bonzicanvas").width = innerWidth;
        $("bonzicanvas").height = innerHeight;
        stage = new createjs.StageGL($("bonzicanvas"), { transparent: true });
        if (settings.bg == undefined) settings.bg = "";
        if (settings.theme == undefined) settings.theme = "./themes/purple.css";
        if (settings.disableCCs == undefined) settings.disableCCs = false;
        if (settings.autojoin == undefined) settings.autojoin = false;
        if (settings.color == undefined) settings.color = "";
        if (settings.bg.startsWith("http")) $("bg").innerHTML += "<img src='" + settings.bg.replace(/["'<>]/g, "") + "'></img>"
        $("content").addEventListener("mouseup", mouse => {
            if (mouse.touches != undefined) mouse = mouse.touches[0];
            if (window.cont != undefined && mouse.button != 2) window.cont = killmenus(window.cont);
        })
        movehandler();
        if (settings.name != undefined) $("nickname").value = settings.name;
        if (settings.welcome != welcomeversion) {
            settings.welcome = welcomeversion;
            document.cookie = compileCookie(settings);
            new msWindow("Welcome to BonziWORLD!",
                `<h1>Welcome to BonziWORLD!</h1>
                The worst place on the internet!<br>
                By pressing "Accept" you agree to our <a href='tac.html' target="_blank">Terms & Conditions</a><br>
                For more info, use the <a href='readme.html' target='_blank'>"README"</a><br>
                <font color=red>DISCLAIMER! CONTENT MAY BE OFFENSIVE. IF YOU ARE SENSITIVE, DO NOT USE BONziWORLD.<br>FOR MORE INFORMATION, READ THE TERMS AND CONDITIONS!</font><br><br>
                Use /settings to configure BonziWORLD to your liking! Custom backgrounds were moved to settings.<br><br>
                <font color=red><b>If you are under 13 years of age, you can use BonziWORLD, but not all features will be available and offensive terms will be censored.</b></font color=red>
                `,
                undefined, undefined, undefined, undefined, [{ name: "ACCEPT (over 13)" }, { name: "ACCEPT (under 13)", callback: () => { settings.under = true; compileCookie(settings) } }]);
        }
        $("loading").style.display = "none";
        $("login_card").style.display = "block";
        socket.on("login", setup);
        if (settings.autojoin) socket.emit("login", { name: settings.name, color: settings.color, room: "default" });
        socket.io.on("reconnect", () => {
            if ((error_id == "error_disconnect" || error_id == "error_restart") && room != "") {
                socket.off("leave");
                socket.off("join");
                socket.off("update");
                socket.off("kick");
                socket.off("announce");
                socket.off("talk");
                socket.off("actqueue");
                socket.off("update_self");
                socket.off("banwindow");
                socket.off("rawdata");
                socket.off("window");
                socket.emit("login", { name: settings.name, color: settings.color, room: room });
            }
        })

        $("card_login").onsubmit = start;
        $("login_button").onclick = start;
        $("tile").onclick = tile;
        $("logshow").onclick = showlog;
        $("log_close").onclick = closelog;
        if (settings.theme == "/themes/windowsvista.css" || settings.theme == "https://bonziworld.org/themes/windowsvista.css") {
            if (mobile) { $("logo_mobile").src = "/img/logovista_mobile.png"; }
            else { $("logo_login").src = "/img/logovista.png"; }
        }
        
        setTimeout(() => {
            initializeStartMenu();
        }, 1000);
    }

    socket.on("error", error => {
        $("login_error").innerHTML = error;
        $("login_error").style.display = "block";
        $("login_card").style.display = "block";
        $("loading").style.display = "none";
    })
    socket.on("ban", (data) => {
        error_id = "error_ban";
        $("banned_by").innerHTML = data.bannedby;
        $("own_ip").innerHTML = data.ip;
        $("ban_reason").innerHTML = data.reason;
    })
    socket.on("restart", () => {
        error_id = "error_restart";
    })
    socket.on("disconnect", () => {
        Object.keys(agents).forEach(agent => {
            agents[agent].kill(true);
        })
        $("error_page").style.display = "block";
        $(error_id).style.display = "block";
    })
    socket.on("rawdata", (d) => { alert(d) })

    function showlog() {
        $("log_cont").style.display = "inline-block";
        $("logshow").style.visibility = "hidden";
        if (!location.href.includes("mini.html")) {
            $("settingsUi").style.visibility = "hidden";
            $("appletsUi").style.visibility = "hidden";
        }
        minx = $("log_cont").clientWidth;
        $("log_body").scrollTop = $("log_body").scrollHeight;
        Object.keys(agents).forEach((agent) => {
            agent = agents[agent];
            if (agent.x < $("log_cont").clientWidth) {
                agent.x = $("log_cont").clientWidth;
                agent.update();
            }
        })
    }
    function closelog() {
        $("log_cont").style.display = "none";
        $("logshow").style.visibility = "visible";
        if (!location.href.includes("mini.html")) {
            $("settingsUi").style.visibility = "visible";
            $("appletsUi").style.visibility = "visible";
        }
        minx = 0;
    }

    function parseCookie(cookie) {
        let settings = {};
        cookie = cookie.split("; ");
        cookie.forEach(item => {
            let key = item.substring(0, item.indexOf("="));
            let param = item.substring(item.indexOf("=") + 1, item.length);
            if (key == "settings") {
                try {
                    settings = JSON.parse(atob(param.replace(/_/g, "/").replace(/-/g, "+")));
                }
                catch (exc) {
                    console.log("COOKIE ERROR. RESETTING.");
                    document.cookie = compileCookie({});
                }
            }
        })
        return settings;
    }
    function compileCookie(cookie) {
        let date = new Date();
        date.setDate(new Date().getDate() + 365);
        document.cookie = "settings=" + btoa(JSON.stringify(cookie)).replace(/\//g, "_").replace(/\+/g, "-") + "; expires=" + date;
    }

    function clearCookie() {
        document.cookie.split("; ").forEach(item => {
            document.cookie = item + "; expires=Thu, 18 Dec 2013 12:00:00 UTC;";
        })
    }

    function showUserEdit() {
        new msWindow("Editing " + useredit.name + "#" + useredit.id, `
            <table>
            <tr>
            <td class="side">
            <img src="./img/assets/lookup.webp">
            </td>
            <td>
            <span class="win_text">
            <table style="margin-left: 10px;">
            <tr><td>Name:</td><td><input id="newname"></td></tr>
            <tr><td>Color:</td><td><input id="newcolor"></td></tr>
            </table>
            <input type="submit" style="display:none;">
            </span>
            </td>
            </tr>
            </table>
            `,
            undefined, undefined, undefined, undefined, [{ name: "SUBMIT", callback: () => { submitUserEdit($("newname").value, $("newcolor").value) } }, { name: "CANCEL" }]);
    }

    function submitUserEdit(newname, newcolor) {
        useredit.newname = newname;
        useredit.newcolor = newcolor;
        socket.emit("command", { command: "useredit", param: JSON.stringify(useredit) })
    };

    function changeSettings(crosscolors, bg, autojoin, name, theme, color) {
        var colorse = ["red", "green", "blue", "purple", "black", "windowsxp"];
        if (colorse.includes(theme)) theme = "/themes/" + theme + ".css";

        settings.theme = theme;
        settings.disableCCs = crosscolors;
        settings.bg = bg;
        settings.autojoin = autojoin;
        
        if (name && name.trim() !== '') {
            settings.name = name.trim();
            saveUserPreferences(name.trim(), color || settings.color || 'purple');
        }
        
        if (color) {
            settings.color = color;
            saveUserPreferences(settings.name || 'Anonymous', color);
        }
        
        document.cookie = compileCookie(settings);
    }

    function range(bottom, to) {
        let x = [];
        for (i = bottom; i <= to; i++) {
            x.push(i);
        }
        return x;
    }

    if (settings.theme != undefined) {
        $("theme").href = settings.theme;
    }
})();
