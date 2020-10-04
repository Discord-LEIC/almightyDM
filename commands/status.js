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

        client.user.setActivity(args[0]);
        
        let channel2 = get_channel("761726189055508480");
        channel2.send(`Changed my status to ${args[0]}`);
        console.log(`Changed status to ${args[0]}`);
	},
};