const Discord = require("discord.js");

var CronJob = require('cron').CronJob;
let Parser = require('rss-parser');
let parser = new Parser();

const testing_id = '757019523252748351';

var url = 'https://fenix.tecnico.ulisboa.pt/disciplinas/PADI7/2020-2021/1-semestre/rss/announcement';
var guild;

function get_channel(id) {
    return guild.channels.cache.get(id);
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

function start(guildServer) {
    guild = guildServer;

    var job = new CronJob('* */5 * * * *', async () => {
 
        let feed = await parser.parseURL(url);

        let testingChannel = get_channel(testing_id);

        feed.items.forEach(item => {
            testingChannel.send(format_feed_entry(item));
        });

    }, null, true);

    job.start();
}

module.exports.start = start;