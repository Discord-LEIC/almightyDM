var guild;

function get_channel(id) {
    return guild.channels.cache.get(id);
}

module.exports = {
	name: 'say',
    description: 'Say something to the selected channel',
    usage: '$$$say <channel_id> <message>',
	async execute(client, guildServer, args) {
        guild = guildServer;

        let channel = get_channel(args[0].slice(2,).slice(0,-1));

        let message = "";
        for (i = 1; i < args.length; i++) {
            message += ` ${args[i]}`;
        }

        channel.send(message);

        let channel2 = get_channel("760244020915732501");
        channel2.send(`Message sent to channel ${channel.name}`);
        console.log(`Sending a message to channel ${channel.name}`);
	},
};