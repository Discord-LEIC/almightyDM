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

function strip_html(message) {

    // Transform &amp; into &
    message = message.replace(/&amp;/gi, '&')
    // Transform &lt; into <
    message = message.replace(/&lt;/gi, '<')
    // Transform &#34; into "
    message = message.replace(/&#34;/gi, '"')
    // Transform &#39; into '
    message = message.replace(/&#39;/gi, '\'')
    // Transform &#61 into @
    message = message.replace(/&#61;/gi, '=')
    // Transform &#64 into @
    message = message.replace(/&#64;/gi, '@')
    // Transform <br> into newline
    message = message.replace(/<br[^><\w]*\/?>/gi, '\n')
    // Transform <i> into italic
    message = message.replace(/<\/?i[^<>\w]*>/gi, '*')
    // Transform <b> into bold
    message = message.replace(/<\/?b[^<>\w]*>/gi, '**')
    // Transform headings in newlines and spaces
    message = message.replace(/<h\d?[^<>\w]*>/gi, ' ')
    message = message.replace(/<\/h\d?[^<>\w]*>/gi, '\n')
    // Transform some divs into spaces
    message = message.replace(/<\/div[^<>\w]*>[^\w\n]*<div[^<>\w]*>/gi, '\n')
    // Avoid multiple whitespace
    message = message.replace(/\n{3,}/gi, '\n')
    message = message.replace(/\s{3,}/gi, ' ')
    message = message.replace(/\n\s*\n/gi, '\n\n')

    // Remove unknown/not needed html entities
    message = message.replace(/&#\d+;/gi, ' ')

    return message.replace(/<[^<]+?>|\\xa0/gi, '')
}

function format_feed_entry(entry) {

    const embed = new Discord.MessageEmbed()
        .setTitle(strip_html(entry.title))
        .setColor(0xff0000)
        .setDescription(strip_html(entry.content.substring(0, 2000)))
        .setAuthor(entry.author.replace(/(.*@.* \(|\))/gi, ''))
        .addField('Anúncio Original', `[Clica aqui](${entry.link})`, false)

    //check_embed_len(embed, ' (...)')

    return embed
}

client.on("ready", async() => {
    guild = await client.guilds.cache.get(guildID);

    // Fetch subscription messages
    const subscriptionChannel = get_channel(subscriptionChannelID);
    subscriptionChannel.messages.fetch()
        .catch(console.error);

    console.log(`Logged in as ${client.user.tag}`);

    var job = new CronJob('*/5 * * * * *', async () => {
 
        let feed = await parser.parseURL(url);

        let testingChannel = get_channel(testing_id);

        feed.items.forEach(item => {

        testingChannel.send(format_feed_entry(item));
        });


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

