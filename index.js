require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// 1. Initialize Client with necessary Intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// 2. Prepare Command Collection
client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
}

// 3. Prepare Event Handler
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// 4. Register Slash Commands (Deployment)
const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log(`🛡️ Vanguard: Started refreshing ${commands.length} slash commands.`);

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log('🛡️ Vanguard: Successfully reloaded slash commands.');
    } catch (error) {
        console.error('❌ Vanguard Deployment Error:', error);
    }
})();

// 5. Global Error Catching (Prevents bot from crashing)
process.on('unhandledRejection', error => {
    console.error('🚨 Vanguard Unhandled promise rejection:', error);
});

// 6. Login
client.login(process.env.BOT_TOKEN);