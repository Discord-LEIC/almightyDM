const Discord = require("discord.js");
const Client = Discord.Client;
const Message = Discord.Message;

const AccessControl = require('policy');
const feed_state = require('feed_state');

SHORT_HELP_TEXT = '$$$rss import <dados em JSON> - Importa lista de feeds substituindo os existentes'

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
@AccessControl(roles=['Staff'], relax_in=[], relax_pm=True)
async function run(client, message, ...kwargs) {
    await feed_state.loads(str.join(' ', kwargs['args']))

    await message.channel.send(content='Feeds importados com sucesso.')
}
    
