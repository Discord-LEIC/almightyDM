const Discord = require("discord.js");

var CronJob = require('cron').CronJob;
let Parser = require('rss-parser');
let parser = new Parser();

let db = require('./database.js');
var guild;

function get_channel(id) {
    return guild.channels.cache.get(id);
}

async function strip_html(message) {

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

async function formatDate(date) {
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

async function format_feed_entry(course, entry) {
    let acronym = course.custom_acronym;
    if (course.degree == 'LEIC-A' || course.degree == 'LEIC-T') { 
        acronym = course.fenix_acronym; 
    }

    const embed = new Discord.MessageEmbed()
        .setTitle(`[${acronym}] ${await strip_html(entry.title)}`)
        //.setColor(course.color)
        .setDescription(await formatDate(entry.pubDate) + await strip_html(entry.content.substring(0, 2000)))
        .setURL(entry.guid)
        .setAuthor(entry.author.replace(/(.*@.* \(|\))/gi, ''), `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`)
        .addField('Anúncio Original', `[Clica aqui](${entry.guid})`, false)

    //check_embed_len(embed, ' (...)')

    return embed
}

async function start(guildServer) {
    guild = guildServer;
    courses = await db.getCourses();

    let i = 0;
    var job = new CronJob('*/5 * * * * *', async () => {
        let now = new Date();
        console.log(`[${now}] Updating RSS feeds`);

        i += 1 % courses.length;
        let course = courses[i]; 
        console.log(`[+] Fetching ${course.degree}-${course.custom_acronym} at ${course.rss_link}`);

        let feed = await parser.parseURL(course.rss_link).catch(console.error);
        feed.items.sort((a, b) => {
            return (new Date(b.pubDate)).getTime() - (new Date(a.pubDate)).getTime();
        });
                
        let channel = get_channel(course.announcement_channel_id);
                
        let index = feed.items.length; 
        await channel.messages.fetch({ limit: 1 }).then(messages => {
            if (messages.first() !== undefined) {
                let lastMessageUrl = messages.first().embeds[0].url;
                index = feed.items.findIndex(item => { return item.guid.toString() === lastMessageUrl.toString(); });    
            }
        })
        .catch(console.error);
            
        for (let i = index - 1; i >= 0; i--) {
            channel.send(await format_feed_entry(course, feed.items[i]));
        }
        // INSERT ANNOUNCEMENT DB    
    }, null, true);

    job.start();
}

module.exports.start = start;