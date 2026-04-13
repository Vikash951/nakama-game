const { Client } = require('@heroiclabs/nakama-js');
global.WebSocket = require('ws'); // Need ws for node

async function test() {
  const client = new Client("defaultkey", "127.0.0.1", "7350");
  
  // Create users
  const uid1 = "test_user_1_" + Date.now();
  const uid2 = "test_user_2_" + Date.now();

  const session1 = await client.authenticateCustom(uid1, true);
  const session2 = await client.authenticateCustom(uid2, true);

  console.log("Users created");

  const socket1 = client.createSocket(false, false);
  const socket2 = client.createSocket(false, false);

  await socket1.connect(session1, true);
  await socket2.connect(session2, true);

  console.log("Sockets connected");

  socket1.onmatchmakermatched = async (matched) => {
    console.log("Socket 1 Matchmaker matched:", matched);
    try {
      const match = await socket1.joinMatch(undefined, matched.token);
      console.log("Socket 1 joined match:", match.match_id);
    } catch (e) {
      console.log("Socket 1 error:", e);
    }
  };

  socket2.onmatchmakermatched = async (matched) => {
    console.log("Socket 2 Matchmaker matched:", matched);
    try {
      const match = await socket2.joinMatch(undefined, matched.token);
      console.log("Socket 2 joined match:", match.match_id);
    } catch (e) {
      console.log("Socket 2 error:", e);
    }
  };

  socket1.onmatchdata = (matchState) => {
    console.log("Socket 1 received match data:", matchState.op_code);
  };
  socket2.onmatchdata = (matchState) => {
    console.log("Socket 2 received match data:", matchState.op_code);
  };

  await socket1.addMatchmaker("*", 2, 2);
  await socket2.addMatchmaker("*", 2, 2);

  console.log("Matchmaker added. Waiting 5 seconds...");
  await new Promise(resolve => setTimeout(resolve, 5000));
}

test().catch(console.error);
