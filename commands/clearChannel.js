const puppetMaster = require('../config.json').channels.puppetMaster;
var guild;

function get_channel(id) {
    return guild.channels.cache.get(id);
}

module.exports = {
	name: 'clear',
    description: 'Clear all announcements for specific channel',
    usage: '$$$clear <channel_id>',
	async execute(client, guildServer, args) {
        guild = guildServer;

        let channel = get_channel(args[0].slice(2,).slice(0,-1));
        let messages = await channel.messages.fetch( {limit: 100} );
        channel.bulkDelete(messages);

        let channel2 = get_channel(puppetMaster);
        channel2.send(`Cleared all announcements for channel ${channel.name}`);
        console.log(`Cleaning all announcements for channel ${channel.name}`);
	},
};