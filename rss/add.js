const feedparser = require('feedparser');
const feed_state = require('feed_state');
const AccessControl = require('policy');

const Discord = require("discord.js");
const Client = Discord.Client;
const Message = Discord.Message;

SHORT_HELP_TEXT = '$$$rss add <name> <url> [last_update] - Adiciona feed RSS para monitorização'

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
@AccessControl(roles=['Staff'], relax_pm=True)
async function run(client, message, ...kwargs) {
    args = kwargs['args']
    if len(args) < 1:
        raise ValueError('Missing arguments: name, url')
    elif len(args) < 2:
        raise ValueError('Missing argument: url')
    elif len(kwargs['args']) > 3:
        raise ValueError('Too many arguments')

    # Test the feed
    url = args[1]
    try:
        feedparser.parse(url)
    except Exception:
        raise ValueError('Invalid feed URL: {}'.format(url))

    await feed_state.add(*kwargs['args'])

    await message.channel.send(content='Feito')
}
    
