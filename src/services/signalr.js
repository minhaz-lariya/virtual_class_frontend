import * as signalR from "@microsoft/signalr";

export const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://10.73.208.147:7860")
  .withAutomaticReconnect()
  .build();