const Discord = require("discord.js");
const client = new Discord.Client;

const config = require('./config.json');
const token = config.token; // Bot Token
const guildID = config.guildID;
const welcomeID = config.channels.welcome; // #welcome channel ID (this is monitored for reactions)
const roleSelectionEmoji = config.roleSelectionEmoji; // Emoji identifier used for role assignment
const msg_roles = config.msg_roles; // Message ID vs Role ID mapping

var guild;

const testing_id = '756662963188006914';
const bodCommands_id = '756527548862693396  ';

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);

    // If needed setup server
    //    -> Create channels
    //    -> Create roles
    //    -> Create sign-up messages
    //    -> React to sign-up messages

    guild = client.guilds.cache.get(guildID);

    // Fetch sign-up messages
    const channel_welcome = guild.channels.cache.get(welcomeID);
    channel_welcome.messages.fetch()
        .catch(console.error);

});

client.on('messageReactionAdd', async(reaction, user) => {

    // Only process reactions from #welcome
    if (reaction.message.channel.id !== welcomeID) return;

    // Ignore reactions from bots
    if (user.bot) return;

    // Assign role when the chosen reaction is selected
    if (reaction.emoji.identifier === roleSelectionEmoji) {
        const member = await guild.member(user);
        const role_id = msg_roles[reaction.message.id];

        // Ensures role exists
        if (role_id === undefined) return;

        console.log(`${member.user.username} subscribed to ${guild.roles.cache.get(role_id).name}`);
        member.roles.add(role_id);
    }
});

client.on('messageReactionRemove', async(reaction, user) => {

    // Only process reactions from #welcome
    if (reaction.message.channel.id !== welcomeID) return;

    // Ignore reactions from bots
    if (user.bot) return;

    // Assign role when the chosen reaction is selected
    if (reaction.emoji.identifier === roleSelectionEmoji) {
        const member = await guild.member(user);
        const role_id = msg_roles[reaction.message.id];

        // Ensures role exists
        if (role_id === undefined) return;

        console.log(`${member.user.username} unsubscribed to ${guild.roles.cache.get(role_id).name}`);
        member.roles.remove(role_id);
    }
});

client.on('message', msg => {
    // Only process messages from #bot-commands
    if (msg.channel.id !== bodCommands_id) return;

    // Ignore messages from bots
    if (msg.author.bot) return;

    if (message.content === "!clear") {
        console.log("CLEARED CHANNEL");
        async function clear() {
            message.delete();
            const fetched = await msg.channel.fetchMessages({ limit: 99 });
            message.channel.bulkDelete(fetched);
        }
        clear();
    }

    //myLogger('Hello!', welcomeID);
    console.log(`Got message: ${message.content}`);
});

client.login(token);

