const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staffcommands')
        .setDescription('Sends the Vanguard command manual to the guide channel'),

    async execute(interaction) {
        const staffRoles = process.env.STAFF_ROLE_IDS.split(',');
        if (!interaction.member.roles.cache.some(r => staffRoles.includes(r.id))) {
            return interaction.reply({ content: '❌ Access Denied.', ephemeral: true });
        }

        const guideChannelId = process.env.STAFF_GUIDE_CHANNEL_ID;
        const guideChannel = interaction.guild.channels.cache.get(guideChannelId);

        if (!guideChannel) {
            return interaction.reply({ content: '❌ Guide channel not found. Check your .env file.', ephemeral: true });
        }

        const helpEmbed = new EmbedBuilder()
            .setTitle('🛡️ Vanguard | Staff Command Manual')
            .setColor(0xFF0000) // Your signature Red
            .setDescription('Below is the list of available commands for the Vanguard Security System.')
            .addFields(
                { 
                    name: '🔨 Banning', 
                    value: '`/vanguard-ban permanent {user} {reason}`\n`/vanguard-ban temporary {user} {duration} {reason}`\n`/vanguard-ban undo {userid}`' 
                },
                { 
                    name: '🔇 Muting', 
                    value: '`/vanguard-mute permanent {user} {reason}`\n`/vanguard-mute temporary {user} {duration} {reason}`\n`/vanguard-mute undo {user}`' 
                },
                { 
                    name: '⚠️ Warnings', 
                    value: '`/vanguard-warn add {user} {reason}`\n`/vanguard-warn check {user}`\n`/vanguard-warn remove {user}`' 
                },
                { 
                    name: '⏱️ Time Formats', 
                    value: 'Use `s` (seconds), `m` (minutes), `h` (hours), `d` (days), `w` (weeks).\nExample: `30m`, `12h`, `1d`.' 
                },
                { 
                    name: '🤖 Auto-Mod Logic', 
                    value: '• **Spam:** 4 messages in 10s = Warn.\n• **Escalation:** 3 Warns = Auto-Mute (30m).' 
                }
            )
            .setFooter({ text: 'Vanguard Security • 2Bad MC Staff Only' })
            .setTimestamp();

        await guideChannel.send({ embeds: [helpEmbed] });

        return interaction.reply({ 
            content: `✅ The command manual has been sent to <#${guideChannelId}>.`, 
            ephemeral: true 
        });
    }
};