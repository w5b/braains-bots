// const commandIndex = {
//   _taroRequest: 0,
//   _taroResponse: 1,
//   _taroNetTimeSync: 2,
//   _snapshot: 3,
//   joinGame: 4,
//   gameOver: 5,
//   makePlayerSelectUnit: 6,
//   playerUnitMoved: 7,
//   playerKeyDown: 8,
//   playerKeyUp: 9,
//   playerMouseMoved: 10,
//   playerCustomInput: 11,
//   playerAbsoluteAngle: 12,
//   playerDialogueSubmit: 13,
//   buyItem: 14,
//   buyUnit: 15,
//   buySkin: 16,
//   equipSkin: 17,
//   unEquipSkin: 18,
//   swapInventory: 19,
//   playAdCallback: 20,
//   makePlayerCameraTrackUnit: 21,
//   changePlayerCameraPanSpeed: 22,
//   hideUnitFromPlayer: 23,
//   showUnitFromPlayer: 24,
//   hideUnitNameLabelFromPlayer: 25,
//   showUnitNameLabelFromPlayer: 26,
//   createPlayer: 27,
//   updateUiText: 28,
//   updateUiTextForTime: 29,
//   alertHighscore: 30,
//   addShopItem: 31,
//   removeShopItem: 32,
//   gameState: 33,
//   updateEntityAttribute: 34,
//   updateAllEntities: 35,
//   itemHold: 36,
//   item: 37,
//   clientConnect: 38,
//   clientDisconnect: 39,
//   killStreakMessage: 40,
//   insertItem: 41,
//   playAd: 42,
//   ui: 43,
//   updateShopInventory: 44,
//   errorLogs: 45,
//   devLogs: 46,
//   sound: 47,
//   particle: 48,
//   camera: 49,
//   videoChat: 50,
//   gameSuggestion: 51,
//   minimap: 52,
//   createFloatingText: 53,
//   openShop: 54,
//   openDialogue: 55,
//   closeDialogue: 56,
//   userJoinedGame: 57,
//   kick: 58,
//   "ban-user": 59,
//   "ban-ip": 60,
//   "ban-chat": 61,
//   trade: 62,
//   editTile: 63,
//   editRegion: 64,
//   editEntity: 65,
//   updateUnit: 66,
//   updateItem: 67,
//   updateProjectile: 68,
//   recordSocketMsgs: 69,
//   getSocketMsgs: 70,
//   stopRecordSocketMsgs: 71,
//   renderSocketLogs: 72,
//   _taroStreamCreate: 73,
//   _taroStreamCreateSnapshot: 74,
//   _taroStreamDestroy: 75,
//   _taroStreamData: 76,
//   _taroStreamTime: 77,
//   taroChatMsg: 78,
//   taroChatJoinRoom: 79,
//   taroChatLeaveRoom: 80,
//   taroChatRoomList: 81,
//   taroChatRoomUserList: 82,
//   taroChatRoomCreated: 83,
//   taroChatRoomRemoved: 84,
// };

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 4000 }, () => {
  console.log("----------------------");
  console.log("Initialized Server");
});

let serverData = {
  url: null,
  id: null,
  allowChat: null,
};

let browser;

wss.broadcast = function (data) {
  wss.clients.forEach((client) => client.send(data));
};

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case "Client":
        switch (data.id) {
          case "Client":
            console.log("Client Connected");
            break;
          case "Puppeteer":
            console.log("Puppeteer Connected");
            break;
        }
        break;
      case "getData":
        serverData.url = data.data.url;
        serverData.id = data.data.id;
        serverData.allowChat = data.data.allowChat;
        break;
      case "initBots":
        if (data.data.init && typeof data.data.amount == "number" && data.data.amount <= 50) {
          sendBots(data.data.amount);
        } else {
          console.log("Ending Bots...");
          if (browser) browser.close();
        }
        break;
      case "sendBotMessage":
        if (typeof data.data == "string") wss.broadcast(JSON.stringify({ type: "BotMessage", data: { message: data.data } }));
        break;
      case "BotConnected":
        console.log("Bot Connected, id: " + data.data.id);
        break;
      case "BotDisconnected":
        console.log("Bot Disconnected, id: " + data.data.id);
        break;
      case "BotDrop":
        wss.broadcast(JSON.stringify({ type: "BotDrop" }));
        break;
      case "Error":
        console.log("Error: " + data.errorMessage);
      default:
        console.log(`Unhandled message type: ${data.type}`);
    }
  });

  ws.on("close", () => {
    console.log("Client Disconnected");
    if (browser) browser.close();
  });
});

puppeteer.use(StealthPlugin());

async function sendBots(amount) {
  console.log(`Initializing ${amount} bots...`);
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--single-process"],
  });

  const page = await browser.newPage();
  const page2 = await browser.newPage();
  await page.evaluate(
    (serverData, amount) => {
      let WebSocketArray = [];
      let tokenArray = [];
      let currentMessage = "";
      let botDrop = false;
      const ws = new WebSocket("ws://localhost:4000");

      ws.onopen = function () {
        ws.send(JSON.stringify({ type: "Client", id: "Puppeteer" }));
        initBots();
      };

      ws.onmessage = function (message) {
        const data = JSON.parse(message.data);
        switch (data.type) {
          case "BotMessage":
            currentMessage = data.data.message;
            break;
          case "BotDrop":
            botDrop = !botDrop;
            break;
        }
      };

      function httpGet(theUrl) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", theUrl, false); // false for synchronous request
        xmlHttp.send(null);
        return xmlHttp.responseText;
      }

      function getVariableValue(str, variableName) {
        const regex = new RegExp(`(${variableName}\\s*[:=]\\s*([^;\\n]+)|\\b${variableName}\\b\\s*[=:])`);
        const match = str.match(regex);
        if (match) {
          const variableValue = match[2] ? match[2].trim() : match[1].replace(new RegExp(`\\b${variableName}\\b\\s*[=:]\\s*`), "").trim();
          return eval(variableValue);
        }
        return undefined;
      }

      function getVal(index, data) {
        let encoded = String.fromCharCode(index);
        return [encoded, data];
      }

      function encode(data) {
        return JSON.stringify(data);
      }

      function send(ws, data) {
        let str = encode(data);
        ws.send(str);
      }

      function initBots() {
        for (let i = 0; i < amount; i++) {
          let HTML = httpGet("https://www.modd.io/play/cCdse8Xa/");
          let token = getVariableValue(HTML, "gsAuthToken");
          if (token == undefined) {
            ws.send(JSON.stringify({ type: "Error", errorMessage: "Failed to fetch token." }));
          } else {
            tokenArray.push(token);
          }
        }
        for (let i = 0; i < amount; i++) {
          if (!tokenArray[i]) continue;
          let socket = new WebSocket(`${serverData.url}?token=${tokenArray[i]}&sid=${serverData.id}&distinctId=${""}`, "netio1");
          WebSocketArray.push(socket);
          socket.onopen = function () {
            ws.send(
              JSON.stringify({
                type: "BotConnected",
                data: {
                  id: i + 1,
                },
              })
            );
          };

          socket.onerror = () => {
            ws.send(JSON.stringify({ type: "Error", errorMessage: `Bot: ${i} Failed to connect to socket.` }));
          };

          socket.onclose = () => {
            ws.send(JSON.stringify({ type: "BotDisconnected", data: { id: i } }));
          };
        }
        let loop = setInterval(() => {
          for (let i = 0; i < WebSocketArray.length; i++) {
            if (WebSocketArray[i].readyState === 3) {
              let HTML = httpGet("https://www.modd.io/play/two-houses/");
              let token = getVariableValue(HTML, "gsAuthToken");
              WebSocketArray.splice(i, 1);
              tokenArray.splice(i, 1);
              let socket = new WebSocket(`${serverData.url}?token=${token}&sid=${serverData.id}&distinctId=${""}`, "netio1");
              WebSocketArray.push(socket);
              tokenArray.push(token);
              socket.onopen = function () {
                ws.send(
                  JSON.stringify({
                    type: "BotConnected",
                    data: {
                      id: i + 1,
                    },
                  })
                );
              };

              socket.onerror = () => {
                ws.send(JSON.stringify({ type: "Error", errorMessage: `Bot: ${i} Failed to connect to socket.` }));
              };

              socket.onclose = () => {
                ws.send(JSON.stringify({ type: "BotDisconnected", data: { id: i } }));
              };
            } else if (WebSocketArray[i].readyState === 1 && serverData.allowChat) {
              if (currentMessage != "") {
                send(WebSocketArray[i], getVal(79, "1"));
                send(WebSocketArray[i], getVal(78, { text: currentMessage, roomId: "1" }));
              }
              if (botDrop) {
                send(WebSocketArray[i], getVal(14, { id: "baseballBat", token: null }));
              }
            }
          }
        }, 1000);
      }
    },
    serverData,
    amount
  );
}
