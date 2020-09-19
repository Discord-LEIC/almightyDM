const datetime = require('Date');

const Discord = require("discord.js");
const Client = Discord.Client;
const Message = Discord.Message;

const feed_state = require('feed_state');

SHORT_HELP_TEXT = '$$$rss get <name> - Mostra informação sobre um feeds em monitorização'

/**
     * Show help
     */
function help(...kwargs) {
    return SHORT_HELP_TEXT;
}

/**
     * Convert timestamp to date
     * @param {float} timestamp
     */  
function format_timestamp(timestamp) {
    dt = datetime.utcfromtimestamp(timestamp)
    return dt.strftime('%Y/%m/%d %H:%M:%S UTC%z')
}

/**
     * Beautify feed info
     * @param {String} name
     */  
function format_feed(name) {
    url = feed_state.get_url(name)
    last_update = feed_state.get_last_update(name)

    return '**{}**: {}\nÚltima atualização: {}'.format(
            name,
            url,
            format_timestamp(last_update)
        )
}
    
/**
     * Run command
     * @param {Client} client
     * @param {Message} message
     */   
async function run(client, message, ...kwargs) {
  try:
        url = kwargs['args'][0]
    except IndexError:
        raise ValueError('Missing argument: name')

    await message.channel.send(content=format_feed(name))
}
  
