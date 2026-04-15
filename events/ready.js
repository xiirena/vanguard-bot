const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`🛡️ Vanguard is online. Logged in as ${client.user.tag}`);
        console.log(`📍 Protecting: ${client.guilds.cache.size} servers.`);
    },
};