import { ApiClient } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';
import { EventSubHttpListener, ReverseProxyAdapter, } from '@twurple/eventsub-http';

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const secret = process.env.SECRET;
const hostName = process.env.HOST_NAME;
const port = process.env.PORT;

if (!clientId || !clientSecret || !secret || !hostName || !port) throw new Error();

const authProvider = new AppTokenAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient({ authProvider });

const adapter = new ReverseProxyAdapter({
  hostName,
  port: Number(port)
});

const listener = new EventSubHttpListener({ apiClient, adapter, secret });

listener.start();
apiClient.users.getUsersByNames(["kobert", "jedster1111"])
  .then(users => {
    users.forEach(user => {
      if (!user) throw new Error();

      console.log(`Found user id for ${user.displayName}: ${user.id}`)

      listener.onStreamOnline(user, event => {
        console.log(`${event.broadcasterDisplayName} is online! ${event.startDate}`)
      })

      listener.onStreamOffline(user, event => {
        console.log(`${event.broadcasterDisplayName} is offline!`)
      })
    })
  });
