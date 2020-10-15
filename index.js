const fs = require('fs');
const Discord = require("discord.js");
const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const rss = require('./rss');
const setup = require('./setup');

const config = require('./config.json');
const prefix = config.prefix;

let db = require('./database.js');

const token = 'NzU3MDE0MzQxNTkyODA5NDky.X2aOiw.LKjemUNdmboKZTwp9ymjWq5qS98'; 

const roleSelectionEmoji = config.roleSelectionEmoji; // Emoji identifier used for role assignment
const subscriptionChannelID = config.channels.subscribe; // #welcome channel ID (this is monitored for reactions)
const welcomeChannelID = config.channels.welcomeChannelID;
const welcomeMessageID = config.welcomeMessageID;

var guild;
const guildID = config.guildID;

function get_channel(id) {
    return guild.channels.cache.get(id);
}

client.on("ready", async() => {
    await db.createPool();
    client.user.setActivity("0.75 Roulette");
    
    guild = await client.guilds.cache.get(guildID);
    console.log(guild.name);

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
    }
    
    console.log(`Logged in as ${client.user.tag} at ${guild.name}`);
    
    // rss.start(guild);
    
    //TODO: Get this working
   
    // Fetch subscription messages
    const subscriptionChannel = get_channel(subscriptionChannelID);
    subscriptionChannel.messages.fetch()
    .catch(console.error);

    const welcomeChannel = get_channel(welcomeChannelID);
    welcomeChannel.messages.fetch()
    .catch(console.error);

}); 

client.on('messageReactionAdd', async(reaction, user) => {
    
    // Ignore reactions from bots
    if (user.bot) return;
    
    // Only process reactions from subscription channel
    if (reaction.message.channel.id === subscriptionChannelID) {
        // Assign role when the chosen reaction is selected
        if (reaction.emoji.identifier === roleSelectionEmoji) {
            const member = await guild.member(user);
            const role_id = await db.getRole(reaction.message.id);
    
            // Ensures role exists
            if (role_id === undefined) return;
    
            console.log(`${member.user.username} subscribed to ${guild.roles.cache.get(role_id).name}`);
            member.roles.add(role_id);
        }

    } else if(reaction.message.id === welcomeMessageID
        && reaction.emoji.identifier === roleSelectionEmoji) {
            if(await db.is_registered(user.id)) {
                // grant student role
                const member = await guild.member(user);
                // const role_id = await db.getRole(reaction.message.id);
                // if (role_id !== undefined) throw new Error("Undefined role");
                member.roles.add("689962857655566380");
            } else {
                reaction.users.remove(user);
            }
       	    console.log("Got new sign-up in #welcome");
    } else if (reaction.emoji.toString() === config.reactionEmoji && reaction.count >= config.reactionsCount && !reaction.message.pinned) {
        await reaction.message.pin();
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
        const role_id = await db.getRole(reaction.message.id);

        // Ensures role exists
        if (role_id === undefined) return;

        console.log(`${member.user.username} unsubscribed to ${guild.roles.cache.get(role_id).name}`);
        member.roles.remove(role_id);
    }
});

client.on('message', message => {

    if (!message.content.startsWith(prefix) || message.channel.id != config.channels.puppetMaster || !message.member.roles._roles.has(config.roleStaff) || message.author.bot) return;

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
