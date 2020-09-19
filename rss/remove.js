const Discord = require("discord.js");
const Client = Discord.Client;
const Message = Discord.Message;

const feed_state = require('feed_state');
const AccessControl = require('policy');

SHORT_HELP_TEXT = '$$$rss remove <name> - Remove feed do sistema'

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
    try:
    name = kwargs['args'][0]
    except IndexError:
        raise ValueError('Missing argument: name')

    feed_state.delete(name)
    await message.channel.send(content='Feito')
}
    
