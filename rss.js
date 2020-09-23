const Discord = require("discord.js");
const courses = require('./courses.json');

var CronJob = require('cron').CronJob;
let Parser = require('rss-parser');
let parser = new Parser();

const testing_id = '757019523252748351';

var guild;
var currentSemester = "1";
var tmpYear = 0;

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

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
        hour = d.getHours();
        min = d.getMinutes();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
    if (hour.toString().length < 2) 
        hour = '0' + hour;
    if (min.toString().length < 2) 
        min = '0' + min;
    
    return `_${day}-${month}-${year} ${hour}:${min}_\n\n`;
}

function format_feed_entry(course, entry) {

    const embed = new Discord.MessageEmbed()
        .setTitle(`[${course.acronym}] ${strip_html(entry.title)}`)
        //.setColor(course.color)
        .setDescription(formatDate(entry.pubDate) + strip_html(entry.content.substring(0, 2000)))
        .setURL(entry.guid)
        .setAuthor(entry.author.replace(/(.*@.* \(|\))/gi, ''), `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`)
        .addField('Anúncio Original', `[Clica aqui](${entry.guid})`, false)

    //check_embed_len(embed, ' (...)')

    return embed
}

async function clearChannels() {
    // Clear channels messages just for testing purposes
    for (let i = 1; i <= 3; i++) {
        for (key in courses[i.toString()][currentSemester]) {
            let channel = get_channel(courses[i][currentSemester][key].discord_id);
            let messages = await channel.messages.fetch( {limit: 100} );
            channel.bulkDelete(messages);
        }
    }
}

async function start(guildServer) {
    guild = guildServer;

    await clearChannels();

    var job = new CronJob('* */3 * * * *', async () => {

        for (key in courses[(tmpYear+1).toString()][currentSemester]) {
            course = courses[(tmpYear+1).toString()][currentSemester][key];
            let feed = await parser.parseURL(course.announcements);
            feed.items.sort((a, b) => {
                return (new Date(b.pubDate)).getTime() - (new Date(a.pubDate)).getTime();
            });
                
            let channel = get_channel(course.discord_id);
                
            let index = feed.items.length; 
            await channel.messages.fetch({ limit: 1 }).then(messages => {
                if (messages.first() !== undefined) {
                    let lastMessageUrl = messages.first().embeds[0].url;
                    index = feed.items.findIndex(item => { return item.guid.toString() === lastMessageUrl.toString(); });    
                }
            })
            .catch(console.error);
                
            for (let i = index - 1; i >= 0; i--) {
                channel.send(format_feed_entry(course, feed.items[i]));
            }
        }
        tmpYear = (tmpYear + 1) % 3;

    }, null, true);

    job.start();
}

module.exports.start = start;