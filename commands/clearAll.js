const courses = require('../beta_courses.json');

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
        
        for (campus in courses) {
            for (key in courses[campus]) {
                let channel = get_channel(courses[campus][key].announcements.slice(2,).slice(0,-1));
                let messages = await channel.messages.fetch( {limit: 100} );
                channel.bulkDelete(messages);
            }
        }

        channel = get_channel("760601249023655987");
        channel.send("Cleared all announcements channels");
        console.log("Cleaning all announcements channels");
	},
};