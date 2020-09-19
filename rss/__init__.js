const Discord = require("discord.js");
const Client = Discord.Client;
const Message = Discord.Message;

__all__ = ['add', 'dump', 'get', 'import', 'join', 'list', 'refresh', 'remove', 'removeall', 'setdate']

SHORT_HELP_TEXT = '$$$rss [...] - Gere feeds RSS (inclui subcomandos)'

/**
     * Select subcommand
     * @param {String} name
     */
function get_subcommand(name) {    
    return import_module('.' + name, 'hooks.commands.rss');
}

/**
     * Select subcommand help
     * @param {String} name
     */
function get_subcommand_short_help(name) {
    return get_subcommand(name).SHORT_HELP_TEXT;
}

/**
     * Show subcommand long help
     * @param {String} name
     */
function get_subcommand_long_help(name, ...kwargs) {
    return get_subcommand(name).help(...kwargs)
}

/**
     * Show help
     */
function help(...kwargs) {
    if not kwargs['args']:
        return str.join('\n', map(get_subcommand_short_help, __all__))
    else:
        name = kwargs['args'][0]
        kwargs['args'] = kwargs['args'][1:]
        return get_subcommand_long_help(name, **kwargs)
}

/**
     * Run command
     * @param {Client} client
     * @param {Message} message
     */        
async function run(client, message = None, ...kwargs) {
    args = kwargs.get('args', [])
    if not args or args[0] == '':
        command = 'refresh'
    else:
        command = args[0]
        kwargs['args'] = args[1:]

    if command in __all__:
        command_module = get_subcommand(command)
        return await command_module.run(client, message, **kwargs)
    else:
        raise NotImplementedError('$$$rss {}'.format(command))
}
    
