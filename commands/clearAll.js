const puppetMaster = require('../config.json').channels.puppetMaster;
let db = require('../database.js');
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
        const courses = await db.getCourses();

        for (let i = 0; i < courses.length; i++) {
            let channel = get_channel(courses[i].announcement_channel_id);
            let messages = await channel.messages.fetch( {limit: 100} );
            channel.bulkDelete(messages);
        } 

        await db.deleteAllAnnouncements();

        channel = get_channel(puppetMaster);
        channel.send("Cleared all announcements channels");
        console.log("Cleaning all announcements channels");
	},
};