import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FileType from 'file-type';
import PhoneNumber from 'awesome-phonenumber';

const {
    default: _makeWaSocket,
    makeWALegacySocket,
    downloadContentFromMessage,
    jidDecode,
    areJidsSameUser,
    generateWAMessage,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    WAMessageStubType,
    extractMessageContent,
    makeInMemoryStore,
    getAggregateVotesInPollMessage,
    prepareWAMessageMedia,
    WA_DEFAULT_EPHEMERAL,
    PHONENUMBER_MCC,
    WAProto // تعديل للمكتبة الجديدة
} = (await import("@whiskeysockets/baileys")).default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function makeWASocket(connectionOptions, options = {}) {
    let conn = _makeWaSocket(connectionOptions);

    Object.defineProperties(conn, {
        // ... (دالات الإعدادات الأساسية للبوت)
    });

    conn.sendNCarousel = async (jid, footer, slides, options = {}) => {
        const cards = [];
        for (const slide of slides) {
            let media = {};
            if (slide.image) {
                const upload = await conn.waUploadToServer(slide.image, { typeof: 'image' });
                media = { imageMessage: { url: upload.url } };
            } else if (slide.video) {
                const upload = await conn.waUploadToServer(slide.video, { typeof: 'video' });
                media = { videoMessage: { url: upload.url } };
            }
            cards.push({
                body: { text: slide.body || '' },
                footer: { text: slide.footer || '' },
                header: {
                    title: slide.title || '',
                    hasMediaAttachment: !!(slide.image || slide.video),
                    ...media
                },
                nativeFlowMessage: {
                    buttons: slide.buttons || []
                }
            });
        }
        const messageContent = WAProto.Message.fromObject({
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: options.body || '' },
                        footer: { text: footer || '' },
                        header: { hasMediaAttachment: false },
                        carouselMessage: { cards }
                    }
                }
            }
        });
        return await conn.relayMessage(jid, messageContent, {});
    };

    conn.sendCarousel = async (jid, text = '', footer = '', cards = [], options = {}) => {
        async function getMediaMessage(media) {
            if (!media) return null;
            const type = Object.keys(media)[0];
            const content = await prepareWAMessageMedia(media, { upload: conn.waUploadToServer });
            return { hasMediaAttachment: true, [`${type}Message`]: content[`${type}Message`] };
        }
        const formattedCards = await Promise.all(cards.map(async (card) => {
            const header = card.media ? await getMediaMessage(card.media) : { hasMediaAttachment: false };
            return {
                body: WAProto.Message.InteractiveMessage.Body.fromObject({ text: card.body || '' }),
                footer: WAProto.Message.InteractiveMessage.Footer.fromObject({ text: card.footer || '' }),
                header: WAProto.Message.InteractiveMessage.Header.fromObject({
                    title: card.title || '',
                    subtitle: card.subtitle || '',
                    ...header
                }),
                nativeFlowMessage: WAProto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: card.buttons || []
                })
            };
        }));
        const messageContent = WAProto.Message.fromObject({
            viewOnceMessage: {
                message: {
                    interactiveMessage: WAProto.Message.InteractiveMessage.create({
                        body: WAProto.Message.InteractiveMessage.Body.fromObject({ text }),
                        footer: WAProto.Message.InteractiveMessage.Footer.fromObject({ text: footer }),
                        header: WAProto.Message.InteractiveMessage.Header.fromObject({ hasMediaAttachment: false }),
                        carouselMessage: WAProto.Message.InteractiveMessage.CarouselMessage.fromObject({
                            cards: formattedCards
                        })
                    })
                }
            }
        });
        return await conn.relayMessage(jid, messageContent, { messageId: options.quoted?.key?.id });
    };

    conn.sendGroupV4Invite = async (jid, participant, inviteCode, inviteExpiration, groupName, caption = 'Group Invite', options = {}) => {
        const msg = WAProto.Message.fromObject({
            groupInviteMessage: {
                inviteCode,
                inviteExpiration: parseInt(inviteExpiration) || Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60),
                groupJid: jid,
                groupName: groupName || conn.getName(jid),
                caption
            }
        });
        return await conn.relayMessage(participant, msg, options);
    };

    conn.cMod = (jid, message, text = '', sender = conn.user.id, options = {}) => {
        let copy = WAProto.WebMessageInfo.fromObject(WAProto.WebMessageInfo.toObject(message));
        let type = Object.keys(copy.message)[0];
        let isEphemeral = type === 'ephemeralMessage';
        if (isEphemeral) {
            type = Object.keys(copy.message.ephemeralMessage.message)[0];
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
        let content = msg[type];
        if (typeof content === 'string') msg[type] = text;
        else if (content.caption) content.caption = text;
        else if (content.text) content.text = text;
        if (typeof content !== 'string') msg[type] = { ...content, ...options };
        if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
        else if (copy.key.fromMe) sender = copy.key.participant = conn.user.id;
        if (copy.key.fromMe) delete copy.key.participant;
        return WAProto.WebMessageInfo.fromObject(copy);
    };

    return conn;
}
        serializeM: {
            /**
             * Serialize Message, so it easier to manipulate
             * @param {import("@whiskeysockets/baileys").proto.WebMessageInfo} m
             */
            value(m) {
                return smsg(conn, m);
            },
        },
        ...(typeof conn.chatRead !== "function" ?
            {
                chatRead: {
                    value(jid, participant = conn.user.jid, messageID) {
                        return conn.sendReadReceipt(jid, participant, [messageID]);
                    },
                    enumerable: true,
                },
            } :
            {}),
        ...(typeof conn.setStatus !== "function" ?
            {
                setStatus: {
                    value(status) {
                        return conn.query({
                            tag: "iq",
                            attrs: {
                                to: "s.whatsapp.net",
                                type: "set",
                                xmlns: "status",
                            },
                            content: [{
                                tag: "status",
                                attrs: {},
                                content: Buffer.from(status, "utf-8"),
                            }, ],
                        });
                    },
                    enumerable: true,
                },
            } :
            {}),
    });
    if (sock.user?.id) sock.user.jid = sock.decodeJid(sock.user.id);
    store.bind(sock);
    return sock;
}

/**
 * Serialize Message
 * @param {ReturnType<typeof makeWASocket>} conn
 * @param {import("@whiskeysockets/baileys").proto.WebMessageInfo} m
 * @param {Boolean} hasParent
 */
export function smsg(conn, m, hasParent) {
    if (!m) return m;
    const M = WAProto.WebMessageInfo;
    try {
        m = M.fromObject(m);
        m.conn = conn;
        let protocolMessageKey;
        if (m.message) {
            if (m.mtype == "protocolMessage" && m.msg?.key) {
                protocolMessageKey = m.msg.key;
                if (protocolMessageKey.remoteJid === "status@broadcast") {
                    protocolMessageKey.remoteJid = m.chat || "";
                }
                if (
                    !protocolMessageKey.participant ||
                    protocolMessageKey.participant === "status_me"
                ) {
                    protocolMessageKey.participant =
                        typeof m.sender === "string" ? m.sender : "";
                }
                const decodedParticipant =
                    conn?.decodeJid?.(protocolMessageKey.participant) || "";
                protocolMessageKey.fromMe =
                    decodedParticipant === (conn?.user?.id || "");
                if (
                    !protocolMessageKey.fromMe &&
                    protocolMessageKey.remoteJid === (conn?.user?.id || "")
                ) {
                    protocolMessageKey.remoteJid =
                        typeof m.sender === "string" ? m.sender : "";
                }
            }
            if (m.quoted && !m.quoted.mediaMessage) {
                delete m.quoted.download;
            }
        }
        if (!m.mediaMessage) {
            delete m.download;
        }
        if (protocolMessageKey && m.mtype == "protocolMessage") {
            try {
                conn.ev.emit("message.delete", protocolMessageKey);
            } catch (e) {
                console.error("Error al emitir message.delete:", e);
            }
        }
        return m;
    } catch (e) {
        console.error("Error en smsg:", e);
        return m;
    }
}

// تعديل الدالة لتعمل مع الـ Prototype الخاص بـ WAProto الجديد
export function serialize() {
    const MediaType = ["imageMessage", "videoMessage", "audioMessage", "stickerMessage", "documentMessage"];
    const safeEndsWith = (str, suffix) =>
        typeof str === "string" && str.endsWith(suffix);
    const safeDecodeJid = (jid, conn) => {
        try {
            if (!jid || typeof jid !== "string") return "";
            return conn?.decodeJid?.(jid) || jid;
        } catch (e) {
            console.error("Error en safeDecodeJid:", e);
            return "";
        }
    };

    return Object.defineProperties(WAProto.WebMessageInfo.prototype, {
        conn: {
            value: undefined,
            enumerable: false,
            writable: true,
        },
        id: {
            get() {
                try {
                    return this.key?.id || "";
                } catch (e) {
                    return "";
                }
            },
            enumerable: true,
        },
        isBaileys: {
            get() {
                try {
                    const userId = this.conn?.user?.id || "";
                    const sender = this.sender || "";
                    const messageId = this.id || "";
                    const baileysStarts = ['NJX-', 'Lyru-', 'META-', 'EvoGlobalBot-', 'FizzxyTheGreat-', 'BAE5', '3EB0', 'B24E', '8SCO', 'SUKI', 'MYSTIC-'];
                    const hasKnownPrefix = baileysStarts.some(prefix => messageId.startsWith(prefix));
                    const isSukiPattern = /^SUKI[A-F0-9]+$/.test(messageId);
                    const isMysticPattern = /^MYSTIC[A-F0-9]+$/.test(messageId);
                    return isMysticPattern || isSukiPattern || hasKnownPrefix || false;
                } catch (e) {
                    return false;
                }
            },
            enumerable: true,
        },
        chat: {
            get() {
                try {
                    const senderKeyDistributionMessage =
                        this.message?.senderKeyDistributionMessage?.groupId;
                    const rawJid =
                        this.key?.remoteJid ||
                        (senderKeyDistributionMessage &&
                            senderKeyDistributionMessage !== "status@broadcast") ||
                        "";
                    return safeDecodeJid(rawJid, this.conn);
                } catch (e) {
                    return "";
                }
            },
            enumerable: true,
        },
        isGroup: {
            get() {
                try {
                    return safeEndsWith(this.chat, "@g.us");
                } catch (e) {
                    return false;
                }
            },
            enumerable: true,
        },
        sender: {
            get() {
                return this.conn?.decodeJid(this.key?.fromMe && this.conn?.user.id || this.participant || this.key.participant || this.chat || '');
            },
            enumerable: true,
        },
        fromMe: {
            get() {
                try {
                    const userId = this.conn?.user?.jid || "";
                    const sender = this.sender || "";
                    return this.key?.fromMe || areJidsSameUser(userId, sender) || false;
                } catch (e) {
                    return false;
                }
            },
            enumerable: true,
        },
        mtype: {
            get() {
                try {
                    if (!this.message) return "";
                    const type = Object.keys(this.message);
                    if (!["senderKeyDistributionMessage", "messageContextInfo"].includes(type[0])) return type[0];
                    if (type.length >= 3 && type[1] !== "messageContextInfo") return type[1];
                    return type[type.length - 1];
                } catch (e) {
                    return "";
                }
            },
            enumerable: true,
        },
        msg: {
            get() {
                try {
                    if (!this.message) return null;
                    return this.message[this.mtype] || null;
                } catch (e) {
                    return null;
                }
            },
            enumerable: true,
        },
        mediaMessage: {
            get() {
                try {
                    if (!this.message) return null;
                    const Message = (this.msg?.url || this.msg?.directPath ? { ...this.message } : extractMessageContent(this.message)) || null;
                    if (!Message) return null;
                    const mtype = Object.keys(Message)[0];
                    return MediaType.includes(mtype) ? Message : null;
                } catch (e) {
                    return null;
                }
            },
            enumerable: true,
        },
        mediaType: {
            get() {
                try {
                    const message = this.mediaMessage;
                    if (!message) return null;
                    return Object.keys(message)[0];
                } catch (e) {
                    return null;
                }
            },
            enumerable: true,
        },
        _text: {
            value: null,
            writable: true,
            enumerable: true,
        },
        text: {
            get() {
                try {
                    const msg = this.msg;
                    const text = (typeof msg === "string" ? msg : msg?.text) || msg?.caption || msg?.contentText || "";
                    return typeof this._text === "string" ? this._text : "" || (typeof text === "string" ? text : text?.selectedDisplayText || text?.hydratedTemplate?.hydratedContentText || text) || "";
                } catch (e) {
                    return "";
                }
            },
            set(str) {
                this._text = str;
            },
            enumerable: true,
        },
        mentionedJid: {
            get() {
                try {
                    const mentioned = this.conn.parseMention(this.text).length > 0 ? this.conn.parseMention(this.text) : this.msg?.contextInfo?.mentionedJid || [];
                    const groupChatId = this.chat?.endsWith("@g.us") ? this.chat : null;
                    const processJid = (user) => {
                        try {
                            if (user && typeof user === "object") user = user.lid || user.jid || user.id || "";
                            if (typeof user === "string" && user.includes("@lid") && groupChatId) {
                                const resolved = String.prototype.resolveLidToRealJid.call(user, groupChatId, this.conn);
                                return resolved.then(res => typeof res === "string" ? res : user);
                            }
                            return Promise.resolve(user);
                        } catch (e) {
                            return Promise.resolve(user);
                        }
                    };
                    return Promise.all(mentioned.map(processJid)).then(jids => jids.filter(jid => jid && typeof jid === "string"));
                } catch (e) {
                    return Promise.resolve([]);
                }
            },
            enumerable: true,
        },
        name: {
            get() {
                try {
                    if (this.pushName) return this.pushName;
                    const sender = this.sender;
                    return sender ? this.conn?.getName?.(sender) : "";
                } catch (e) {
                    return "";
                }
            },
            enumerable: true,
        },
        download: {
            value(saveToFile = false) {
                try {
                    const mtype = this.mediaType;
                    return this.conn?.downloadM?.(this.mediaMessage?.[mtype], mtype?.replace(/message/i, ""), saveToFile);
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            enumerable: true,
            configurable: true,
        },
        reply: {
            value(text, chatId, options) {
                try {
                    return this.conn?.reply?.(chatId ? chatId : this.chat, text, this, options);
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            enumerable: true,
        },
        copy: {
            value() {
                try {
                    const M = WAProto.WebMessageInfo;
                    return smsg(this.conn, M.fromObject(M.toObject(this)));
                } catch (e) {
                    return null;
                }
            },
            enumerable: true,
        },
        forward: {
            value(jid, force = false, options = {}) {
                try {
                    return this.conn?.sendMessage?.(jid, { forward: this, force, ...options }, { ...options });
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            enumerable: true,
        },
        copyNForward: {
            value(jid, forceForward = false, options = {}) {
                try {
                    return this.conn?.copyNForward?.(jid, this, forceForward, options);
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            enumerable: true,
        },
        cMod: {
            value(jid, text = "", sender = this.sender, options = {}) {
                try {
                    return this.conn?.cMod?.(jid, this, text, sender, options);
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            enumerable: true,
        },
        getQuotedObj: {
            value() {
                try {
                    if (!this.quoted?.id) return null;
                    const q = WAProto.WebMessageInfo.fromObject(this.conn?.loadMessage?.(this.quoted.id) || this.quoted.vM || {});
                    return smsg(this.conn, q);
                } catch (e) {
                    return null;
                }
            },
            enumerable: true,
        },
        getQuotedMessage: {
            get() {
                return this.getQuotedObj;
            },
            enumerable: true,
        },
        delete: {
            value() {
                try {
                    return this.conn?.sendMessage?.(this.chat, { delete: this.key });
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            enumerable: true,
        },
        quoted: {
            get() {
                try {
                    const self = this;
                    const msg = self.msg;
                    const contextInfo = msg?.contextInfo;
                    const quoted = contextInfo?.quotedMessage;
                    if (!msg || !contextInfo || !quoted) return null;

                    const type = Object.keys(quoted)[0];
                    const q = quoted[type];
                    const text = typeof q === "string" ? q : q?.text || "";

                    return Object.defineProperties(
                        JSON.parse(JSON.stringify(typeof q === "string" ? { text: q } : q || {})), {
                            mtype: { get() { return type; }, enumerable: true },
                            mediaMessage: {
                                get() {
                                    const Message = (q?.url || q?.directPath ? { ...quoted } : extractMessageContent(quoted)) || null;
                                    if (!Message) return null;
                                    const mtype = Object.keys(Message)[0];
                                    return MediaType.includes(mtype) ? Message : null;
                                },
                                enumerable: true,
                            },
                            mediaType: {
                                get() {
                                    const message = this.mediaMessage;
                                    if (!message) return null;
                                    return Object.keys(message)[0];
                                },
                                enumerable: true,
                            },
                            id: { get() { return contextInfo.stanzaId || ""; }, enumerable: true },
                            chat: { get() { return contextInfo.remoteJid || self.chat || ""; }, enumerable: true },
                            isBaileys: {
                                get() {
                                    const userId = self.conn?.user?.id || "";
                                    const sender = this.sender || "";
                                    const messageId = this.id || "";
                                    const baileysStarts = ['NJX-', 'Lyru-', 'META-', 'EvoGlobalBot-', 'FizzxyTheGreat-', 'BAE5', '3EB0', 'B24E', '8SCO', 'SUKI', 'MYSTIC-'];
                                    return baileysStarts.some(prefix => messageId.startsWith(prefix)) || /^SUKI[A-F0-9]+$/.test(messageId) || /^MYSTIC[A-F0-9]+$/.test(messageId) || false;
                                },
                                enumerable: true,
                            },
                            sender: {
                                get() {
                                    try {
                                        const rawParticipant = contextInfo.participant;
                                        if (!rawParticipant) {
                                            const isFromMe = this.key?.fromMe || areJidsSameUser(this.chat, self.conn?.user?.id || "");
                                            return isFromMe ? safeDecodeJid(self.conn?.user?.id, self.conn) : this.chat;
                                        }
                                        const parsedJid = safeDecodeJid(rawParticipant, self.conn);
                                        if (parsedJid && parsedJid.includes("@lid")) {
                                            const groupChatId = this.chat?.endsWith("@g.us") ? this.chat : null;
                                            if (groupChatId) return String.prototype.resolveLidToRealJid.call(parsedJid, groupChatId, self.conn);
                                        }
                                        return parsedJid;
                                    } catch (e) {
                                        return "";
                                    }
                                },
                                enumerable: true,
                            },
                            fromMe: { get() { return areJidsSameUser(this.sender || "", self.conn?.user?.jid || ""); }, enumerable: true },
                            text: { get() { return text || this.caption || this.contentText || this.selectedDisplayText || ""; }, enumerable: true },
                            mentionedJid: {
                                get() {
                                    const mentioned = q?.contextInfo?.mentionedJid || self.getQuotedObj()?.mentionedJid || [];
                                    const groupChatId = this.chat?.endsWith("@g.us") ? this.chat : null;
                                    const processJid = (user) => {
                                        if (user && typeof user === "object") user = user.lid || user.jid || user.id || "";
                                        if (typeof user === "string" && user.includes("@lid") && groupChatId) {
                                            return String.prototype.resolveLidToRealJid.call(user, groupChatId, self.conn).then(res => typeof res === "string" ? res : user);
                                        }
                                        return Promise.resolve(user);
                                    };
                                    return Promise.all(mentioned.map(processJid)).then(jids => jids.filter(jid => jid && typeof jid === "string")).catch(() => mentioned);
                                },
                                enumerable: true,
                            },
                            vM: {
                                get() {
                                    return WAProto.WebMessageInfo.fromObject({
                                        key: { fromMe: this.fromMe, remoteJid: this.chat, id: this.id },
                                        message: quoted,
                                        ...(self.isGroup ? { participant: this.sender } : {}),
                                    });
                                },
                                enumerable: true,
                            },
                            fakeObj: { get() { return this.vM; }, enumerable: true },
                            download: {
                                value(saveToFile = false) {
                                    const mtype = this.mediaType;
                                    return self.conn?.downloadM?.(this.mediaMessage?.[mtype], mtype?.replace(/message/i, ""), saveToFile);
                                },
                                enumerable: true,
                                configurable: true,
                            },
                            reply: { value(text, chatId, options) { return self.conn?.reply?.(chatId ? chatId : this.chat, text, this.vM, options); }, enumerable: true },
                            copy: { value() { const M = WAProto.WebMessageInfo; return smsg(self.conn, M.fromObject(M.toObject(this.vM))); }, enumerable: true },
                            forward: { value(jid, force = false, options) { return self.conn?.sendMessage?.jid, { forward: this.vM, force, ...options }, { ...options }; }, enumerable: true },
                            copyNForward: { value(jid, forceForward = false, options) { return self.conn?.copyNForward?.(jid, this.vM, forceForward, options); }, enumerable: true },
                            cMod: { value(jid, text = "", sender = this.sender, options = {}) { return self.conn?.cMod?.(jid, this.vM, text, sender, options); }, enumerable: true },
                            delete: { value() { return self.conn?.sendMessage?.(this.chat, { delete: this.vM.key }); }, enumerable: true },
                        },
                    );
                } catch (e) {
                    return null;
                }
            },
            enumerable: true,
        },
    });
}

export function logic(check, inp, out) {
    if (inp.length !== out.length) throw new Error("Input and Output must have same length");
    for (const i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i];
    return null;
}

export function protoType() {
    Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
        const ab = new ArrayBuffer(this.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < this.length; ++i) view[i] = this[i];
        return ab;
    };
    Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
        return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength);
    };
    ArrayBuffer.prototype.toBuffer = function toBuffer() {
        return Buffer.from(new Uint8Array(this));
    };
    Uint8Array.prototype.getFileType = ArrayBuffer.prototype.getFileType = Buffer.prototype.getFileType = async function getFileType() {
        return await fileTypeFromBuffer(this);
    };
    String.prototype.isNumber = Number.prototype.isNumber = function isNumber() {
        const int = parseInt(this);
        return typeof int === "number" && !isNaN(int);
    };
    String.prototype.capitalize = function capitalize() {
        return this.charAt(0).toUpperCase() + this.slice(1, this.length);
    };
    String.prototype.capitalizeV2 = function capitalizeV2() {
        return this.split(" ").map((v) => v.capitalize()).join(" ");
    };

    String.prototype.resolveLidToRealJid = (function() {
        const lidCache = new Map();
        return async function(groupChatId, conn, maxRetries = 3, retryDelay = 60000) {
            const inputJid = this.toString();
            if (!inputJid.endsWith("@lid") || !groupChatId?.endsWith("@g.us")) {
                return inputJid.includes("@") ? inputJid : `${inputJid}@s.whatsapp.net`;
            }
            if (lidCache.has(inputJid)) return lidCache.get(inputJid);
            const lidToFind = inputJid.split("@")[0];
            let attempts = 0;
            while (attempts < maxRetries) {
                try {
                    const metadata = await conn?.groupMetadata(groupChatId);
                    if (!metadata?.participants) throw new Error("No participants");
                    for (const participant of metadata.participants) {
                        try {
                            if (!participant?.jid) continue;
                            const contactDetails = await conn?.onWhatsApp(participant.jid);
                            if (!contactDetails?.[0]?.lid) continue;
                            if (contactDetails[0].lid.split("@")[0] === lidToFind) {
                                lidCache.set(inputJid, participant.jid);
                                return participant.jid;
                            }
                        } catch { continue; }
                    }
                    lidCache.set(inputJid, inputJid);
                    return inputJid;
                } catch (e) {
                    if (++attempts >= maxRetries) {
                        lidCache.set(inputJid, inputJid);
                        return inputJid;
                    }
                    await new Promise((resolve) => setTimeout(resolve, retryDelay));
                }
            }
            return inputJid;
        };
    })();

    String.prototype.decodeJid = function decodeJid() {
        if (/:\d+@/gi.test(this)) {
            const decode = jidDecode(this) || {};
            return ((decode.user && decode.server && decode.user + "@" + decode.server) || this).trim();
        } else return this.trim();
    };
    Number.prototype.toTimeString = function toTimeString() {
        const seconds = Math.floor((this / 1000) % 60);
        const minutes = Math.floor((this / (60 * 1000)) % 60);
        const hours = Math.floor((this / (60 * 60 * 1000)) % 24);
        const days = Math.floor(this / (24 * 60 * 60 * 1000));
        return ((days ? `${days} day(s) ` : "") + (hours ? `${hours} hour(s) ` : "") + (minutes ? `${minutes} minute(s) ` : "") + (seconds ? `${seconds} second(s)` : "")).trim();
    };
    Number.prototype.getRandom = String.prototype.getRandom = Array.prototype.getRandom = function getRandom() {
        if (Array.isArray(this) || this instanceof String) return this[Math.floor(Math.random() * this.length)];
        return Math.floor(Math.random() * this);
    };
}
