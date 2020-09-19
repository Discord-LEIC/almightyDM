const Discord = require("discord.js");
const Client = Discord.Client;
const Message = Discord.Message;

const logging = require("logging.js");
const delete_role_channel = require("management.js");

const feed_state = require('feed_state');
const AccessControl = require('policy');

SHORT_HELP_TEXT = '$$$rss removeall <name(s)> - Remove tudo o que está associado ao feed'

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
        for name in kwargs['args']:
            try:
                feed_state.delete(name)
                await delete_role_channel(name)
            except:
                logging.error('No feed/role/channel named %s', name)
                pass
    except KeyError:
        raise ValueError('Missing argument: name')

    await message.channel.send(content='Feito')
}
