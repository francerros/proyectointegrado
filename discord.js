const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '167.235.14.90',
  user: 'rustuser',
  password: '********',
  database: 'rust'
});

connection.connect((err) => {
  if (err) {
    console.error('Error de conexión: ' + err.stack);
    return;
  }
  console.log('Conectado a la base de datos como id ' + connection.threadId);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let statsMessage = null;

client.once('ready', () => {
  console.log(`? Bot listo como ${client.user.tag}`);

  setInterval(updateTopPlayers, 1 * 60 * 1000); // 5 minutos
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!mapa') {
    const askImageMessage = await message.channel.send('📸 Por favor, envía la URL de la imagen que quieres usar para el mapa.');

    try {
      const filter = (response) => response.author.id === message.author.id;
      const collected = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000,
        errors: ['time'],
      });

      const imageUrl = collected.first().content;

      const embed = new EmbedBuilder()
        .setTitle('🌍 !Prepárate para el próximo mapa! 🌍')
        .setDescription('📍 Después del wipe, este será el nuevo mapa donde comenzará tu aventura en **Rust**. !Explora, construye y domina el terreno! 🏗️')
        .setColor(0xFFA500)
        .setImage(imageUrl)
        .addFields(
          { name: '🗓  Fecha del Wipe:', value: '22 de Mayo de 2025' },
          { name: '🗺  Características del mapa:', value: '- Tamaño: 4000' },
          { name: '🔑 Server IP', value: '167.235.14.90' },
          { name: '🚀 Como entrar', value: 'Presiona F1 y escribe "connect 167.235.14.90"' },
          { name: '🔜 Siguiente Wipe', value: '#proximo-wipe' }
        )
        .setFooter({ text: '!Nos vemos en el wipe!', iconURL: 'https://tu-imagen-url.com/icono.png' })
        .setTimestamp(new Date());

      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      message.channel.send('🚨 El tiempo para responder ha terminado o no se proporcionó una URL válida. Intenta de nuevo.');
    }
  }

  if (message.content === '!top') {
    const channelId = '1369297764034281575';

    connection.query(
      `
        SELECT
          name,
          JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Kills')) AS kills,
          JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Deaths')) AS deaths
        FROM PlayerDatabase
        WHERE
          JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Kills')) IS NOT NULL AND
          JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Deaths')) IS NOT NULL AND
          JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Kills')) > 0 AND
          JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Deaths')) > 0
        ORDER BY
          CAST(JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Kills')) AS UNSIGNED) /
          NULLIF(CAST(JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Deaths')) AS UNSIGNED), 0) DESC
        LIMIT 5;
      `,
      (err, results) => {
        if (err) {
          console.error(err);
          message.channel.send('Hubo un error al obtener los datos.');
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle('🏆 Top 5 Jugadores - K/D')
          .setColor(0x00FF00)
          .setDescription('Top 5')
          .setTimestamp(new Date());

        results.forEach((row, index) => {
          const nombre = row.name || 'Jugador desconocido';
          const kills = parseInt(row.kills) || 0;
          const deaths = parseInt(row.deaths) || 1; // evitar división por 0
          const kd = (kills / deaths).toFixed(2);

          embed.addFields({
            name: `#${index + 1} - ${nombre}`,
            value: `K/D: ${kd}`,
          });
        });

        const channel = client.channels.cache.get(channelId);
        if (channel) {
          if (!statsMessage) {
            statsMessage = channel.send({ embeds: [embed] });
          } else {
            statsMessage.then(message => message.edit({ embeds: [embed] }));
          }
        } else {
          message.channel.send('No se pudo encontrar el canal especificado.');
        }
      }
    );
  }
});

function updateTopPlayers() {
  const channelId = '1369297764034281575';

  connection.query(
    `
      SELECT
        name,
        JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Kills')) AS kills,
        JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Deaths')) AS deaths
      FROM PlayerDatabase
      WHERE 
        JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Kills')) IS NOT NULL AND
        JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Deaths')) IS NOT NULL AND
        JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Kills')) > 0 AND
        JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Deaths')) > 0
      ORDER BY 
        CAST(JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Kills')) AS UNSIGNED) /
        NULLIF(CAST(JSON_UNQUOTE(JSON_EXTRACT(StatisticsDB, '$.Deaths')) AS UNSIGNED), 0) DESC
      LIMIT 5;
    `,
    (err, results) => {
      if (err) {
        console.error(err);
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Top 5 Jugadores - K/D')
        .setColor(0x00FF00)
        .setDescription('Top 5')
        .setTimestamp(new Date());

      results.forEach((row, index) => {
        const nombre = row.name || 'Jugador desconocido';
        const kills = parseInt(row.kills) || 0;
        const deaths = parseInt(row.deaths) || 1;
        const kd = (kills / deaths).toFixed(2);

        embed.addFields({
          name: `#${index + 1} - ${nombre}`,
          value: `K/D: ${kd}`,
        });
      });

      const channel = client.channels.cache.get(channelId); 
      if (channel) {
        if (!statsMessage) {
          statsMessage = channel.send({ embeds: [embed] });
        } else {
          statsMessage.then(message => message.edit({ embeds: [embed] }));
        }
      }
    }
  );
}

client.login('OTIyNTg5Nzg3MDkxNzc5NTg1.GUKSTn.******************');
