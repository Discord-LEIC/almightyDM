const fs = require('fs');

var guild;

function get_channel(id) {
    return guild.channels.cache.get(id);
}

module.exports = {
	name: 'help',
	description: 'Shows help for all admin bot commands',
	async execute(message, guildServer, args) {
        guild = guildServer;

        let commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(`./${file}`);
            let channel = get_channel("760244020915732501");
            let message = await channel.send(`${command.name}: ${command.description} : ${command.usage}`);
        }
	},
};