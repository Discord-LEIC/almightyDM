let guild;
let channelsIDs;

async function fetchChannelIDs(guildServer, db) {
    guild = guildServer;

    channelsIDs = await db.getChannels();

    return channelsIDs;
}

async function fetchMessages() {
    for (let i = 0; i < channelsIDs.length; i++) {
        const channel = get_channel(channelsIDs[i].discord_id);
        channel.messages.fetch()
        .catch(console.error);
    }
}

function get_channel(id) {
    return guild.channels.cache.get(id);
}

module.exports = {
    fetchChannelIDs,
    fetchMessages
};