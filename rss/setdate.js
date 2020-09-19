const datetime = require("datetime.js");
const timegm = require("calendar.js");

const Discord = require("discord.js");
const Client = Discord.Client;
const Message = Discord.Message;

const feed_state = require('feed_state');
const AccessControl = require('policy');

SHORT_HELP_TEXT = '$$$rss setdate [nome|url] [timestamp|now|None] - \
Redefine data de última atualização para um feed'

/**
     * Show help
     */
function help(...kwargs) {
    return SHORT_HELP_TEXT;
}

/**
     * Get current timestamp (UTC)
     */
function get_current_timestamp() {
    return timegm(datetime.utcnow().utctimetuple())
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

    try:
        new_last_update = kwargs['args'][1]
    except IndexError:
        raise ValueError('Missing argument: new time')

    if new_last_update == 'None':
        new_last_update = None
    elif new_last_update == 'now':
        new_last_update = get_current_timestamp()
    else:
        new_last_update = int(new_last_update)

    feed_state.update(name, new_last_update)
    await message.channel.send(content='Feito')
}
    
