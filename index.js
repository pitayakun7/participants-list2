'use strict';

require('dotenv').config();

const { Client, GatewayIntentBits, Events } = require('discord.js');
const express = require('express');

const {
    isServerDeleteMessage, handleServerDeleteMessage,
    isServerDeleteButton, handleServerDeleteButton,
} = require('./commands/serverDelete');

// ─── ヘルスチェック用の簡易Webサーバー（Render等で必要な場合） ──
const app = express();
app.get('/', (req, res) => res.send('Bot is online!'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(process.env.PORT || 3000);

// ─── Discord Client ────────────────────────────────────────────
// !server-delete に必要な最小限のIntent
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,          // サーバー・チャンネル情報
        GatewayIntentBits.GuildMessages,   // メッセージ受信
        GatewayIntentBits.MessageContent,  // メッセージ本文の読み取り（!server-delete）
    ],
});

client.once(Events.ClientReady, c => {
    console.log(`[READY] ${c.user.tag}`);
});

// ─── !server-delete（非公開プレフィックスコマンド）────────────
client.on(Events.MessageCreate, message => {
    if (isServerDeleteMessage(message)) {
        handleServerDeleteMessage(message).catch(e => console.error('[server-delete]', e));
    }
});

// ─── 確認ボタン ────────────────────────────────────────────────
client.on(Events.InteractionCreate, interaction => {
    if (interaction.isButton() && isServerDeleteButton(interaction.customId)) {
        handleServerDeleteButton(interaction).catch(e => console.error('[server-delete button]', e));
    }
});

client.on('warn', console.warn);
client.on('error', err => console.error('[client error]', err));

process.on('unhandledRejection', reason => console.error('[unhandledRejection]', reason));
process.on('uncaughtException', err => console.error('[uncaughtException]', err));

// ─── Bot ログイン ──────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('[LOGIN OK]'))
    .catch(err => console.error('[LOGIN REJECTED]', err));
