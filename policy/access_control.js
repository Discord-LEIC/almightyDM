const Discord = require("discord.js");
const Client = Discord.Client;
const DMChannel = Discord.DMChannel;

const Member = Discord.Member;
const TextChannel = Discord.TextChannel;
const GuildChannel = Discord.abc;

/**
     * Check if user has permission to execute command
     * @param {Client} client
     * @param {TextChannel} channel
     * @param {Member} user
     */  
function check_permissions(client, channel, user, ...kwargs) {
    role_whitelist = kwargs['roles']
    if isinstance(channel, DMChannel):
        relaxed_channels = []
    else:
        relaxed_channels = kwargs.get('relax_in', [channel.name])

    relax_pm = kwargs.get('relax_pm', False)

    member = client.guilds[0].get_member(user.id)

    return (isinstance(channel, GuildChannel) and (channel.name in relaxed_channels or user.top_role.name in role_whitelist)) or \
       (isinstance(channel, DMChannel) and relax_pm and member is not None and member.top_role.name in role_whitelist)
}
    
/**
     * Decorator to change command permissions

    role_whitelist - Roles who can use it freely
    relax_in - Channels where users can use it freely - Optional (default: all channels)
    relax_pm - Whether can use it in DMs or not - Optional (default: False)
     */  
function AccessControl(...rules) {
    def _decorate(fn):
        def _wrapper(*args, **kwargs):
            client = args[0]
            message = args[1]

            user = message.author
            if 'su_orig_user' in kwargs:
                user = kwargs['su_orig_user']

            if check_permissions(client, message.channel, user, **rules):
                return fn(*args, **kwargs)
            else:
                raise PermissionError('Permission denied in {} to {}'.format(__name__, message.author))

        return _wrapper

    return _decorate
}
