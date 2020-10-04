const Discord = require("discord.js");

var guild;

function get_channel(id) {
    return guild.channels.cache.get(id);
}

module.exports = {
    name: "help",
    description: "Returns all commands, or one specific command info",
    async execute(client, guildServer, args) {
        guild = guildServer;
        let channel = get_channel("761726189055508480");

        if (args[0]) {
            return getCMD(client, channel, args[0]);

        } else {
            return getAll(client, channel);
        }
    },
}

function getAll(client, channel) {
    const embed = new Discord.MessageEmbed();

    const commands = client.commands
            .map(cmd => `- \`${cmd.name}\``)
            .join("\n");

    embed.setTitle("Available commands")
         .setFooter("$$$help <command> for more info")
         .setDescription(commands);

    return channel.send(embed);
}

function getCMD(client, channel, input) {
    const embed = new Discord.MessageEmbed();

    const cmd = client.commands.get(input.toLowerCase());
    
    let info = `No information found for command **${input.toLowerCase()}**`;

    if (!cmd) {
        return channel.send(embed.setColor("RED").setDescription(info));
    }

    // Add all cmd info to the embed
    if (cmd.name) info = `**Command name**: ${cmd.name}`;
    if (cmd.description) info += `\n**Description**: ${cmd.description}`;
    if (cmd.usage) {
        info += `\n**Usage**: ${cmd.usage}`;
        embed.setFooter(`Syntax: <> = required, [] = optional`);
    }

    return channel.send(embed.setColor("GREEN").setDescription(info));
}