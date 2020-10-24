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
let fetch = require('./fetch.js');

const token = 'NzYwNTk1NTg0MDAzOTk3ODI4.X3OV1g.JlDhszyUEq5iFbjKg5Nv67xQh38'; 

const roleSelectionEmoji = config.roleSelectionEmoji; // Emoji identifier used for role assignment

let channelIDs;

var guild;
const guildID = config.guildID;

function get_channel(id) {
    return guild.channels.cache.get(id);
}

function includesChannel(channelID) {
    for (let i = 0; i < channelIDs.length; i++) {
        if (channelIDs[i].discord_id === channelID) { return true; }
    }
    return false;
}

function clear_server() {
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
        if(role.name != '@everyone' & role.name !='bot' & role.name != 'staff' & role.name != 'admin'){
            console.log(`Deleting role ${role.name}`);    
            role.delete().catch(console.error);
        }
    });
}

client.on("ready", async() => {
    await db.createPool();

    // client.user.setActivity("0.75 Roulette");
    
    guild = await client.guilds.fetch(guildID);

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.name, command);
    }
    
    console.log(`Logged in as ${client.user.tag} at ${guild.name}`);

    channelIDs = await fetch.fetchChannelIDs(guild, db);
    await fetch.fetchMessages();
    rss.start(guild);
    
    //TODO: Get this working
}); 

client.on('messageReactionAdd', async(reaction, user) => {
    
    // Ignore reactions from bots
    if (user.bot) return;
    
    let welcomeID = await db.getWelcomeChannel();

    console.log("role: " + reaction.message.id);

    // Only process reactions from subscription channel
    if (welcomeID !== reaction.message.channel.id && includesChannel(reaction.message.channel.id)) {
        // Assign role when the chosen reaction is selected
        if (reaction.emoji.identifier === roleSelectionEmoji) {
            const member = await guild.member(user);
            let role_id = await db.getRole(reaction.message.id);
            
            if (role_id == "") { 
                role_id = await db.getRoleMessages(reaction.message.id);
            }

            // Ensures role exists
            if (role_id == "") return;

            console.log(`${user.username} subscribed to ${guild.roles.cache.get(role_id).name}`);
            
            member.roles.add(role_id);
        }

    } else if (reaction.message.channel.id === welcomeID && reaction.emoji.identifier === roleSelectionEmoji) {
            if (await db.is_registered(user.id)) {
                // grant student role
                const member = await guild.member(user);
                role_id = await db.getRoleMessages(reaction.message.id);
                member.roles.add(role_id);
		console.log(`[${user.id}:${user.username}] Granting @student role`);
            } else {
                reaction.users.remove(user);
		console.log(`[${user.id}:${user.username}] Failed to register @student role`);
            }

    } else if (reaction.emoji.toString() === config.reactionEmoji && reaction.count >= config.reactionsCount && !reaction.message.pinned) {
        await reaction.message.pin();
    }
});

client.on('messageReactionRemove', async(reaction, user) => {
    let welcomeID = await db.getWelcomeChannel();

    // Only process reactions from subscription channel
    if (welcomeID !== reaction.message.channel.id && !includesChannel(reaction.message.channel.id)) return;
    
    // Ignore reactions from bots
    if (user.bot) return;

    // Assign role when the chosen reaction is selected
    if (reaction.emoji.identifier === roleSelectionEmoji) {
        const member = await guild.member(user);
        let role_id = await db.getRole(reaction.message.id);

        if (role_id == "")
            role_id = await db.getRoleMessages(reaction.message.id);

        // Ensures role exists
        if (role_id == "") return;

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
