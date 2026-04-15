const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vanguard-mute')
        .setDescription('Vanguard Mute Management')
        .addSubcommand(sub =>
            sub.setName('permanent')
                .setDescription('Mute indefinitely')
                .addUserOption(opt => opt.setName('user').setDescription('Target').setRequired(true))
                .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('temporary')
                .setDescription('Mute for a duration')
                .addUserOption(opt => opt.setName('user').setDescription('Target').setRequired(true))
                .addStringOption(opt => opt.setName('duration').setDescription('Time (e.g. 30m, 1h)').setRequired(true))
                .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('undo')
                .setDescription('Unmute a user')
                .addUserOption(opt => opt.setName('user').setDescription('Target').setRequired(true))
        ),

    async execute(interaction) {
        const staffRoles = process.env.STAFF_ROLE_IDS.split(',');
        if (!interaction.member.roles.cache.some(r => staffRoles.includes(r.id))) {
            return interaction.reply({ content: '❌ Access Denied.', flags: [64] });
        }

        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user'); // Get User first
        const targetMember = interaction.options.getMember('user'); // Get Member for roles
        const muteRoleId = process.env.DEFAULT_MUTE_ROLE_ID;
        const logChannel = interaction.guild.channels.cache.get(process.env.PUNISHMENT_LOG_ID);

        if (!targetUser) return interaction.reply({ content: '❌ Could not find that user.', flags: [64] });

        // --- HANDLER FOR UNMUTE (UNDO) ---
        if (subcommand === 'undo') {
            if (!targetMember) return interaction.reply({ content: '❌ User is not in the server.', flags: [64] });
            await targetMember.roles.remove(muteRoleId);
            return interaction.reply({ content: `✅ Unmuted **${targetUser.tag}**.`, flags: [64] });
        }

        // --- HANDLER FOR MUTES ---
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const durationInput = interaction.options.getString('duration');
        const durationMs = durationInput ? ms(durationInput) : null;

        if (!targetMember) return interaction.reply({ content: '❌ Target is not in the server.', flags: [64] });

        const dmEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Vanguard', iconURL: interaction.client.user.displayAvatarURL() })
            .setTitle('🛑 Punishment Notification')
            .setColor(0xFF0000)
            .setDescription(`You have been restricted in **${interaction.guild.name}**.`)
            .addFields(
                { name: '👤 User', value: `${targetUser}`, inline: true },
                { name: '⚖️ Action', value: '`Muted`', inline: true },
                { name: '⏳ Duration', value: `\`${durationInput || 'Permanent'}\``, inline: true },
                { name: '📝 Reason', value: `\`\`\`${reason}\`\`\`` }
            )
            .setTimestamp();

        const logEmbed = new EmbedBuilder()
            .setTitle('🔇 Punishment Issued: MUTE')
            .setColor(0xFF0000)
            .addFields(
                { name: '👤 Target', value: `${targetUser.tag}`, inline: false },
                { name: '🛡️ Moderator', value: `${interaction.user}`, inline: true },
                { name: '⏱️ Duration', value: `\`${durationInput || 'Permanent'}\``, inline: true },
                { name: '📝 Reason', value: `\`\`\`${reason}\`\`\`` }
            )
            .setTimestamp();

        try {
            await targetMember.roles.add(muteRoleId);
            await targetUser.send({ embeds: [dmEmbed] }).catch(() => console.log("DMs closed."));
            if (logChannel) await logChannel.send({ embeds: [logEmbed] });

            if (subcommand === 'temporary' && durationMs) {
                setTimeout(async () => {
                    const freshMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
                    if (freshMember && freshMember.roles.cache.has(muteRoleId)) {
                        await freshMember.roles.remove(muteRoleId);
                        const lifted = new EmbedBuilder()
                            .setTitle('✅ Access Restored')
                            .setColor(0x00FF00)
                            .setDescription(`Your mute in **${interaction.guild.name}** has expired.`);
                        await freshMember.send({ embeds: [lifted] }).catch(() => {});
                    }
                }, durationMs);
            }

            return interaction.reply({ content: `✅ Successfully muted **${targetUser.tag}**.`, flags: [64] });
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: '❌ Failed to apply mute. Check bot permissions.', flags: [64] });
        }
    }
};