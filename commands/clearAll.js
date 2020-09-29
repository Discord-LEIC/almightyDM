const courses = require('../courses.json');
var currentSemester = "1";

var guild;

function get_channel(id) {
    return guild.channels.cache.get(id);
}

module.exports = {
	name: 'clearall',
    description: 'Clear all announcements channels messages',
    usage: '$$$clearAll',
	async execute(client, guildServer, args) {
        guild = guildServer;

		for (let i = 1; i <= 3; i++) {
            for (key in courses[i.toString()][currentSemester]) {
                let channel = get_channel(courses[i][currentSemester][key].discord_id);
                let messages = await channel.messages.fetch( {limit: 100} );
                channel.bulkDelete(messages);
            }
        }
        console.log("Cleaning all announcements channels");
	},
};