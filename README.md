Summary
=======
A simple code to demonstrate the idea to integrate the power of Elasticsearch into slack

The idea comes from the fact that eko app is quite similar to Slack platform. So, 
I think it would be better to extend the feature by giving customer to do whatever
they want via BOT api like Slack does.


Prerequisite
============
1. You have to add a new BOT in your slack organization via http://yourorganization.slack.com/services/new/bot
2. Pick the name for your bot
3. Next you will get API token from Slack
4. Add the bot into a public channel


Configuration
=============
1. Change API token and bot's name accordingly in /lib/slack/config.js
2. You don't need to configure ES because I've hosted in found.io and it will be available up to 28 Oct 2015

Installation
============
You can also install via npm:
```sh
npm install
```

You can run via 
```sh
node index.js
```

After you see the message on the console, please go to the channel you have just created earlier and try command

1. siri near 1000km
2. siri search rock


