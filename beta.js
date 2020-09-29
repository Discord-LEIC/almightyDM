const fs = require('fs');
const Discord = require("discord.js");
const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const rss = require('./rss');
const config = require('./config.json');
const { prefix } = require('./config.json');

const token = process.env.DISCORD_TOKEN;

const subscriptionChannelID = config.channels.subscribe; // #welcome channel ID (this is monitored for reactions)
const roleSelectionEmoji = config.roleSelectionEmoji; // Emoji identifier used for role assignment

// for now just has LEIC-A / LEIC-T
const leicaID = '760588153257066556';
const leictID = '760589363456770068';
const msg_roles = {
    "760606091746213898": leicaID,
    "760606093247381545": leictID
}

var guild;
const guildID = '760586549640953887';


function get_channel(id) {
    return guild.channels.cache.get(id);
}

client.on("ready", async() => {
    guild = await client.guilds.cache.get(guildID);

    // Fetch subscription messages (needed to listen to reacts)
    const subscriptionChannel = get_channel(subscriptionChannelID);
    subscriptionChannel.messages.fetch()
        .catch(console.error);
    
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
    }

    rss.start(guild);

    console.log(`Logged in as ${client.user.tag}`);
}); 

client.on('messageReactionAdd', async(reaction, user) => {

    // Only process reactions from subscription channel
    if (reaction.message.channel.id !== subscriptionChannelID) return;

    // Ignore reactions from bots
    if (user.bot) return;


    // Assign role when the chosen reaction is selected
    if (reaction.emoji.identifier === roleSelectionEmoji) {
        const member = await guild.member(user);
        const role_id = msg_roles[reaction.message.id];

        // Ensures role exists. People may react to the instructions message
        if (role_id === undefined) return;

        // user already has another role
        for(const [key, role] of member.roles.cache) {
            if(role.id === leicaID && role_id === leictID
            || role.id === leictID && role_id === leicaID ) {
                reaction.users.remove(user)
                return;
            }
        }

        console.log(`${member.user.username} subscribed to ${guild.roles.cache.get(role_id).name}`);
        await member.roles.add(role_id);

    }
});

client.on('messageReactionRemove', async(reaction, user) => {

    // Only process reactions from subscription channel
    if (reaction.message.channel.id !== subscriptionChannelID) return;

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

client.on('message', message => {

    if (!message.content.startsWith(prefix) || message.channel.id != 760601249023655987 || !message.member.roles._roles.has("760588109389234200") || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
	if (!client.commands.has(command)) return;

    try {
	    client.commands.get(command).execute(client, guild, args);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});

client.login(token);
