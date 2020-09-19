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

// TODO
//    -> Update config.json based on !command
//

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


function myLogger(message, channel = testing_id) {
    const channel_testing = guild.channels.cache.get(channel);
    channel_testing.send('╔═════════════[LOGGER]═════════════╗\n' + stringify(message, 5, null, 2) + '\n ╚════════════════════════════════╝');
}

function stringify(val, depth, replacer, space) {
    depth = isNaN(+depth) ? 1 : depth;

    function _build(key, val, depth, o, a) { // (JSON.stringify() has it's own rules, which we respect here by using it for property iteration)
        return !val || typeof val != 'object' ? val : (a = Array.isArray(val), JSON.stringify(val, function(k, v) {
            if (a || depth > 0) {
                if (replacer) v = replacer(k, v);
                if (!k) return (a = Array.isArray(v), val = v);
                !o && (o = a ? [] : {});
                o[k] = _build(k, v, a ? depth : depth - 1);
            }
        }), o || (a ? [] : {}));
    }
    return JSON.stringify(_build('', val, depth), null, space);
}