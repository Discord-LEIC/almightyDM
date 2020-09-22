const Discord = require("discord.js");
const client = new Discord.Client;

// RSS

var CronJob = require('cron').CronJob;
let Parser = require('rss-parser');
let parser = new Parser();

// 

const config = require('./config.json');
const token = config.token; // Bot Token
const guildID = config.guildID;

const subscriptionChannelID = config.channels.subscribe; // #welcome channel ID (this is monitored for reactions)
const roleSelectionEmoji = config.roleSelectionEmoji; // Emoji identifier used for role assignment
const msg_roles = config.msg_roles; // Message ID vs Role ID mapping

var guild;
var url = 'https://fenix.tecnico.ulisboa.pt/disciplinas/PADI7/2020-2021/1-semestre/rss/announcement';

const testing_id = '757019523252748351';
const bodCommands_id = '756527548862693396';

function get_channel(id) {
    return guild.channels.cache.get(id);
}

async function getAnnouncement(url) {
 
    let feed = await parser.parseURL(url);
    console.log(feed.title);
   
    feed.items.forEach(item => {
      console.log(item);
    });
}


// should only run once!
async function setup() {
    var courses = ["FP", "IAC", "IEI", "AL", "CDI-I", "IAED", "LP", "MD", "CDI-II", "SO", "PO", "ACED", "MO", "Ges", "ASA", "IPM", "TC", "EO", "PE", "BD", "CG", "IA", "OC", "RC", "AMS", "Compiladores", "CS", "ES", "SD"];

    var instructions = "Reage com :raised_hand: na mensagem da respetiva cadeira para teres acesso ao seu canal de discussão e receberes notificações dos anúncios dessa cadeira. Para reverter a ação, basta retirar a reação na mensagem correspondente.";
    //    -> Create channels
    //    -> Create roles

    //    -> Create sign-up messages
    
    /*let subscriptionChannel = get_channel(subscriptionChannelID);
    for(let course of courses) {
        // console.log(`[${course}]`);
        let message = await subscriptionChannel.send(`[${course}]`);
        message.react(roleSelectionEmoji);
        console.log(`${course}: ${message.id}`);
    }

    // console.log(instructions);
    subscriptionChannel.send(instructions);*/
    
}

client.on("ready", async() => {
    guild = await client.guilds.cache.get(guildID);

    // Fetch subscription messages
    const subscriptionChannel = get_channel(subscriptionChannelID);
    subscriptionChannel.messages.fetch()
        .catch(console.error);

    console.log(`Logged in as ${client.user.tag}`);

    var job = new CronJob('*/5 * * * * *', async () => {
 
        console.log(url);
        let feed = await parser.parseURL(url);
        console.log(feed.title);
       
        feed.items.forEach(item => {
          console.log(item);
        });

        let testingChannel = get_channel(testing_id);
        testingChannel.send('<@177142027752964096> enche 10');

    }, null, true);

    job.start();
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

        // Ensures role exists
        if (role_id === undefined) return;

        console.log(`${member.user.username} subscribed to ${guild.roles.cache.get(role_id).name}`);
        member.roles.add(role_id);
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

client.on('message', msg => {
    return;

    if(msg.author.bot) return; // ignore bot messages

    console.log(`Got message: ${msg.content}`);
});

client.login(token);

