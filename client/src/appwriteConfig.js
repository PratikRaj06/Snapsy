import { Client, Storage } from "appwrite";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1") // Replace with your Appwrite endpoint
  .setProject(import.meta.env.VITE_APPWRITE_CLOUD); // Replace with your Appwrite project ID

const storage = new Storage(client);
export { storage };
