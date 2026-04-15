const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = new Map(); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vanguard-warn')
        .setDescription('Vanguard Warning Management')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Warn a user')
                .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
                .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('check')
                .setDescription('Check a user\'s warning count')
                .addUserOption(opt => opt.setName('user').setDescription('The user to check').setRequired(true))
        ),

    async execute(interaction) {
        const staffRoles = process.env.STAFF_ROLE_IDS.split(',');
        if (!interaction.member.roles.cache.some(r => staffRoles.includes(r.id))) {
            return interaction.reply({ content: '❌ Access Denied.', flags: [64] });
        }

        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getUser('user');
        const logChannel = interaction.guild.channels.cache.get(process.env.PUNISHMENT_LOG_ID);

        if (!target) return interaction.reply({ content: '❌ User not found.', flags: [64] });

        // --- HANDLER FOR CHECK ---
        if (subcommand === 'check') {
            const warns = db.get(target.id) || 0;
            return interaction.reply({ content: `👤 **${target.tag}** currently has **${warns}** warnings.`, flags: [64] });
        }

        // --- HANDLER FOR ADD ---
        const reason = interaction.options.getString('reason');
        const currentWarns = (db.get(target.id) || 0) + 1;
        db.set(target.id, currentWarns);

        const dmEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Vanguard', iconURL: interaction.client.user.displayAvatarURL() })
            .setTitle('⚠️ Formal Warning')
            .setColor(0xFF0000)
            .addFields(
                { name: '📊 Warns', value: `\`${currentWarns}/3\``, inline: true },
                { name: '📝 Reason', value: `\`\`\`${reason}\`\`\`` }
            )
            .setTimestamp();

        const logEmbed = new EmbedBuilder()
            .setTitle('⚠️ Punishment Issued: WARN')
            .setColor(0xFF0000)
            .addFields(
                { name: '👤 Target', value: `${target.tag}`, inline: true },
                { name: '📊 Count', value: `\`${currentWarns}\``, inline: true },
                { name: '🛡️ Moderator', value: `${interaction.user}`, inline: true },
                { name: '📝 Reason', value: `\`\`\`${reason}\`\`\`` }
            )
            .setTimestamp();

        try { 
            await target.send({ embeds: [dmEmbed] }); 
        } catch (e) { 
            console.log("User DMs closed."); 
        }
        if (logChannel) await logChannel.send({ embeds: [logEmbed] });

        return interaction.reply({ content: `✅ Warned ${target.tag}.`, flags: [64] });
    }
};