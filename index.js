const fs = require('fs');
const Discord = require("discord.js");
const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const rss = require('./rss_alpha');
const setup = require('./setup');

const config = require('./config.json');
const { prefix } = require('./config.json');


const token = 'NzYwODcyOTUxNTkwNTUxNTYy.X3SYJw.5Ig4YHVBg1rhYKa6WxyXwx0gT5E';

const subscriptionChannelID = config.channels.subscribe; // #welcome channel ID (this is monitored for reactions)
const roleSelectionEmoji = config.roleSelectionEmoji; // Emoji identifier used for role assignment
const msg_roles = config.msg_roles; // Message ID vs Role ID mapping

var guild;
const guildID = '761290372315086869';

const testing_id = '757019523252748351';
const bodCommands_id = '756527548862693396';

function get_channel(id) {
    return guild.channels.cache.get(id);
}


client.on("ready", async() => {
    console.log(`Logged in as ${client.user.tag}`);
    guild = await client.guilds.cache.get(guildID);

    // TODO: REMOVE THIS
    guild.channels.cache.forEach(channel => {
        if(channel.type != 'category'){
            console.log(`Deleting ${channel.name}`);
            channel.delete();
        }
    });

    //TODO: Hardcoded mess, please kill.
    guild.channels.cache.forEach(channel => {
        if(channel.type == 'category'){
            console.log(`Deleting ${channel.name}`);
            channel.delete();
        }
    });

    guild.roles.cache.forEach(role => {
        if(role.name != '@everyone' & role.name !='bot' & role.name != 'admin'){
            console.log(`Deleting role ${role.name}`);    
            role.delete().catch(console.error);
        }
    });
 
    await setup.setup_server(guild);

    // TODO: END REMOVE

    //TODO: Get this working
    /*
    // Fetch subscription messages
    const subscriptionChannel = get_channel(subscriptionChannelID);
    subscriptionChannel.messages.fetch()
        .catch(console.error);

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
    }

    //rss.start(guild);
    */
}); 

client.on('messageReactionAdd', async(reaction, user) => {

    return;

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

        console.log(`${member.user.username} subscribed to ${guild.roles.cache.get(role_id).name}`);
        member.roles.add(role_id);
    }
});

client.on('messageReactionRemove', async(reaction, user) => {

    return;

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

    return;

    if (!message.content.startsWith(prefix) || message.channel.id != 760244020915732501 || !message.member.roles._roles.has("689586433232863308") || message.author.bot) return;

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

client.on('message', msg => {
    return;

    if(msg.author.bot) return; // ignore bot messages

    console.log(`Got message: ${msg.content}`);
});

client.login(token);
