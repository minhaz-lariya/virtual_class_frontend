import * as signalR from "@microsoft/signalr";

export const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://13.60.249.222:5000/meetingHub")
  .withAutomaticReconnect()
  .build();