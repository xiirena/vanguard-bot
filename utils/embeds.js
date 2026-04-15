const { EmbedBuilder } = require('discord.js');

module.exports = {
    // A standard Red Embed template for Vanguard
    createRedEmbed: (title, description, fields = []) => {
        return new EmbedBuilder()
            .setTitle(`🛡️ Vanguard | ${title}`)
            .setColor(0xFF0000) // Your signature Red
            .setDescription(description)
            .addFields(fields)
            .setFooter({ text: '2Bad MC' })
            .setTimestamp();
    }
};