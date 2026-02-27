import * as signalR from "@microsoft/signalr";

export const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://13.60.207.233:5000/meetingHub")
  .withAutomaticReconnect()
  .build();