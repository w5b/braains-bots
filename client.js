// ==UserScript==
// @name         Braains.io bots
// @namespace    http://tampermonkey.net/
// @version      1
// @description  try to take over the world!
// @author       Jerry
// @match        https://www.modd.io/play/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=modd.io
// @grant        none
// ==/UserScript==

let button;
let button2;
let input;
let input2;
let forceDC = true;
let on = false;

function connectToServer() {
  const ws = new WebSocket("ws://localhost:4000");

  ws.onopen = () => {
    const initInterval = setInterval(() => {
      if (typeof taro != "undefined") {
        const gameData = taro.game && taro.game.data && taro.game.data.defaultData;
        ws.send(
          JSON.stringify({
            type: "getData",
            data: {
              url: taro.client.server.url,
              id: taro.client.server.id,
              allowChat: !gameData.allowVerifiedUserToChat,
            },
          })
        );

        clearInterval(initInterval);
      }
    }, 100);
    forceDC = true;
    console.log("Connected to server");

    button = document.createElement("Button");
    input = document.createElement("input");
    button.id = "bot_init";
    button.innerHTML = "Start Bots";
    button.style = "top:50px;left:10px;position:absolute;z-index:99999;padding:20px;";

    button2 = document.createElement("Button");
    input2 = document.createElement("input");
    button2.id = "send_message";
    button2.innerHTML = "Send Message";
    button2.style = "top:210px;left:10px;position:absolute;z-index:99999;padding:20px;width:100px;";

    input.id = "bot_amount";
    input.placeholder = "amount";
    input.style = "top:130px;left:10px;position:absolute;z-index:99999;padding:20px;width:100px;height:50px;";

    input2.id = "bot_message";
    input2.placeholder = "Bot Msg";
    input2.style = "top:320px;left:10px;position:absolute;z-index:99999;padding:20px;width:100px;height:50px;";

    document.body.appendChild(button);
    document.body.appendChild(button2);
    document.body.appendChild(input);
    document.body.appendChild(input2);

    button2.addEventListener("click", () => {
      if (typeof input2.value == "string") {
        console.log(input2.value);
        ws.send(JSON.stringify({ type: "sendBotMessage", data: input2.value }));
        input2.value = "";
      }
    });

    button.addEventListener("click", () => {
      if (input.value == "" || !parseInt(input.value) || (parseInt(input.value) > 50 && !on)) {
        alert("please make sure amount of bots is valid (must be under 50)");
        return;
      }
      if (!on) {
        button.innerHTML = "End Bots";
        on = true;
        ws.send(
          JSON.stringify({
            type: "initBots",
            data: { init: true, amount: parseInt(input.value) },
          })
        );
        input.value = "";
      } else {
        on = false;
        button.innerHTML = "Start Bots";
        ws.send(
          JSON.stringify({
            type: "initBots",
            data: { init: false, amount: null },
          })
        );
      }
    });
  };

  ws.addEventListener("close", () => {
    on = false;
    if (forceDC) {
      try {
        document.body.removeChild(button);
        document.body.removeChild(button2);
        document.body.removeChild(input);
        document.body.removeChild(input2);
      } catch (error) {}
      setTimeout(function () {
        connectToServer();
      }, 2000);
    }
  });
}

connectToServer();
