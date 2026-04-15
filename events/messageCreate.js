const { Events, EmbedBuilder } = require('discord.js');
const messageLog = new Map();

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;
        
        const now = Date.now();
        const timestamps = messageLog.get(message.author.id) || [];
        const recent = timestamps.filter(t => now - t < 10000);
        recent.push(now);
        messageLog.set(message.author.id, recent);

        if (recent.length > 3) {
            messageLog.delete(message.author.id);
            const muteRole = process.env.DEFAULT_MUTE_ROLE_ID;
            const logChannel = message.guild.channels.cache.get(process.env.PUNISHMENT_LOG_ID);

            await message.member.roles.add(muteRole);

            const autoEmbed = new EmbedBuilder()
                .setAuthor({ name: 'Vanguard Auto-Mod', iconURL: client.user.displayAvatarURL() })
                .setTitle('🤖 Automatic Restriction')
                .setColor(0xFF0000)
                .setDescription('You have been muted for spamming.')
                .addFields(
                    { name: '⏳ Duration', value: '`30m`', inline: true },
                    { name: '📝 Reason', value: '```Triggering 4-msg/10s spam filter.```' }
                ).setTimestamp();

            try { await message.author.send({ embeds: [autoEmbed] }); } catch (e) {}
            if (logChannel) await logChannel.send({ embeds: [autoEmbed] });
        }
    }
};