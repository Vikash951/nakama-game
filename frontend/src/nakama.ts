import { Client } from "@heroiclabs/nakama-js";

const HOST = "localhost";
const PORT = 7350;
const USE_SSL = false;

export const client = new Client("defaultkey", HOST, PORT, USE_SSL);

let session: any = null;
let socket: any = null;

// Authenticate with device ID (stored in localStorage)
export async function authenticateDevice(): Promise<any> {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }

  session = await client.authenticateDevice(deviceId, true);
  console.log("Authenticated! User ID:", session.user_id);
  return session;
}

// Open a real-time socket connection
export async function connectSocket(currentSession: any): Promise<any> {
  socket = client.createSocket(USE_SSL, false);
  await socket.connect(currentSession, true);
  console.log("Socket connected!");
  return socket;
}

// Update display name (nickname) with unique #tag based on userId
export async function setDisplayName(
  currentSession: any,
  name: string
): Promise<string> {
  // Take first 4 chars of userId as a unique tag
  const tag = currentSession.user_id.substring(0, 4);
  const taggedName = `${name}#${tag}`;
  await client.updateAccount(currentSession, {
    username: taggedName,
    display_name: taggedName,
  });
  console.log("Display name set to:", taggedName);
  return taggedName;
}

export function getSocket(): any {
  return socket;
}

export function getSession(): any {
  return session;
}