const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vanguard-ban')
        .setDescription('Vanguard Ban Management')
        .addSubcommand(sub =>
            sub.setName('permanent')
                .setDescription('Permanently ban a user')
                .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
                .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('temporary')
                .setDescription('Temporarily ban a user')
                .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
                .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g., 1d, 1w)').setRequired(true))
                .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('undo')
                .setDescription('Unban a user')
                .addStringOption(opt => opt.setName('userid').setDescription('The Discord ID of the user').setRequired(true))
        ),

    async execute(interaction) {
        const staffRoles = process.env.STAFF_ROLE_IDS.split(',');
        if (!interaction.member.roles.cache.some(r => staffRoles.includes(r.id))) {
            return interaction.reply({ content: '❌ Access Denied.', flags: [64] });
        }

        const subcommand = interaction.options.getSubcommand();
        const logChannel = interaction.guild.channels.cache.get(process.env.PUNISHMENT_LOG_ID);

        // --- HANDLER FOR UNBAN (UNDO) ---
        if (subcommand === 'undo') {
            const userId = interaction.options.getString('userid');
            try {
                await interaction.guild.members.unban(userId);
                return interaction.reply({ content: `✅ Successfully unbanned ID: ${userId}`, flags: [64] });
            } catch (err) {
                return interaction.reply({ content: `❌ Could not find a ban for ID: ${userId}`, flags: [64] });
            }
        }

        // --- HANDLER FOR BANS (PERM & TEMP) ---
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const duration = subcommand === 'temporary' ? interaction.options.getString('duration') : 'Permanent';

        if (!target) return interaction.reply({ content: '❌ User not found.', flags: [64] });

        const dmEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Vanguard', iconURL: interaction.client.user.displayAvatarURL() })
            .setTitle('🚫 Entry Denied')
            .setColor(0xFF0000)
            .setDescription(`You have been banned from **${interaction.guild.name}**.`)
            .addFields(
                { name: '⚖️ Action', value: '`Ban`', inline: true },
                { name: '⏳ Duration', value: `\`${duration}\``, inline: true },
                { name: '📝 Reason', value: `\`\`\`${reason}\`\`\`` }
            )
            .setFooter({ text: 'This action is final unless appealed.' })
            .setTimestamp();

        const logEmbed = new EmbedBuilder()
            .setTitle('🔨 Punishment Issued: BAN')
            .setColor(0xFF0000)
            .addFields(
                { name: '👤 Target', value: `${target.tag} (${target.id})`, inline: false },
                { name: '🛡️ Moderator', value: `${interaction.user}`, inline: true },
                { name: '⏱️ Duration', value: `\`${duration}\``, inline: true },
                { name: '📝 Reason', value: `\`\`\`${reason}\`\`\`` }
            )
            .setTimestamp();

        try { 
            await target.send({ embeds: [dmEmbed] }); 
        } catch (e) { 
            console.log("User DMs closed."); 
        }
        
        await interaction.guild.members.ban(target.id, { reason: `Vanguard [${interaction.user.tag}]: ${reason}` });
        
        if (logChannel) await logChannel.send({ embeds: [logEmbed] });
        return interaction.reply({ content: `✅ Successfully banned ${target.tag}.`, flags: [64] });
    },
};