const Discord = require("discord.js");
const Client = Discord.Client;
const Message = Discord.Message;

const feed_state = require('feed_state');
const format_feed = require('.get');

SHORT_HELP_TEXT = '$$$rss list - Lista feeds em monitorização'

/**
     * Show help
     */
function help(...kwargs) {
    return SHORT_HELP_TEXT;
}

/**
     * Run command
     * @param {Client} client
     * @param {Message} message
     */  
async function run(client, message, ...kwargs) {
    if len(feed_state.get_names()) == 0:
        await message.channel.send(content='Não há feeds')

    // Split in around 2000 chars' messages
    message_text = ''
    for name in feed_state.get_names():
        tmp = format_feed(name) + '\n'
        if len(message_text) + len(tmp) > 2000:
            await message.channel.send(message_text)
            message_text = tmp
        else:
            message_text += tmp

    if len(message_text) > 0:
        await message.channel.send(message_text)
}

    
