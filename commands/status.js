const puppetMaster = require('../config.json').channels.puppetMaster;
var guild;

function get_channel(id) {
    return guild.channels.cache.get(id);
}

module.exports = {
	name: 'status',
    description: 'Edit current status',
    usage: '$$$status <status>',
	async execute(client, guildServer, args) {
        guild = guildServer;

        let message = "";
        for (i = 0; i < args.length; i++) {
            message += ` ${args[i]}`;
        }

        client.user.setActivity(message);
        
        let channel2 = get_channel(puppetMaster);
        channel2.send(`Changed my status to ${message}`);
        console.log(`Changed status to ${message}`);
	},
};