const Discord = require("discord.js");
const Client = Discord.Client;
const Message = Discord.Message;

const feed_state = require('feed_state');

SHORT_HELP_TEXT = '$$$rss dump - Devolve backup da informação dos feeds (JSON)'

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
    msg = feed_state.dumps()

    # Split in 2000 chars' messages
    while len(msg) > 0:
        await message.channel.send(content='```\n' + msg[:1992] + '\n```')
        msg = msg[1992:]
}

