// app.js - Zim Random Chat Frontend - FULLY WORKING VERSION
class ZimRandomChat {
    constructor() {
        this.API_BASE = 'https://zimchat.infinityfree.me/api.php';
        this.sessionId = this.getOrCreateSession();
        this.username = 'Anonymous';
        this.currentConvoId = null;
        this.isSearching = false;
        this.messageCheckInterval = null;
        this.heartbeatInterval = null;
        this.lastMessageId = 0;
        this.displayedMessageIds = new Set();
        
        this.init();
    }

    init() {
        console.log('🇿🇼 Zim Random Chat Initialized - Session:', this.sessionId);
        
        this.loadUserData();
        this.setupEventListeners();
        this.startHeartbeat();
        this.updateOnlineCount();
        
        // Show appropriate screen
        if (this.username === 'Anonymous') {
            this.showUsernameScreen();
        } else {
            this.showWelcomeScreen();
        }
        
        this.updateRandomNameExamples();
    }

    getOrCreateSession() {
        let sessionId = localStorage.getItem('zimchat_session');
        if (!sessionId) {
            sessionId = 'zim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('zimchat_session', sessionId);
            console.log('🆕 New session created:', sessionId);
        }
        return sessionId;
    }

    loadUserData() {
        const savedUsername = localStorage.getItem('zimchat_username');
        if (savedUsername) {
            this.username = savedUsername;
            console.log('👤 Loaded username:', this.username);
        }
    }

    setupEventListeners() {
        document.getElementById('usernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setUsername();
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('👋 User inactive');
            } else {
                console.log('👋 User active');
                this.updateOnlineCount();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    generateRandomName() {
        const names = [      
            'Mwoyo weShumba', 'Sadza neNyama', 'Bapiro reHuku', 'Mazondo',
            'Mhepo yeZhizha', 'Mvura Inonaya', 'Tambawoga', 'Mumba Muno',
            'Huku iShiri?', 'Hove Huru', 'Kwatabva Kure', 'Patakazonyatsozvifungisisa',
            'Nyika Yedu', 'Zvandofarira', 'Mutauro Wedu', 'Zvese Zvese',
            'Mufaro weMoyo', 'Svondo neMuvhuro', 'Mwana waMambo', 'Umwe Wangu'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    updateRandomNameExamples() {
        document.getElementById('randomNameExample').textContent = this.generateRandomName();
        document.getElementById('randomNameBtn').textContent = this.generateRandomName();
    }

    // SIMPLE API CALL - NO CORS PROXY NEEDED
    async apiCall(action, params = {}) {
        // Build the URL
        const urlParams = new URLSearchParams({
            action: action,
            session: this.sessionId
        });
        
        // Add additional parameters
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                urlParams.append(key, value);
            }
        }
        
        const url = `${this.API_BASE}?${urlParams}`;
        console.log('🌐 API Call:', url);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ API Success:', data);
            return data;
            
        } catch (error) {
            console.error('❌ API Error:', error);
            return { error: error.message };
        }
    }

    async registerUser(username = 'Anonymous') {
        console.log('👤 Registering user:', username);
        const result = await this.apiCall('register_online', { username: username });
        
        if (result.error) {
            console.error('❌ Registration failed:', result.error);
        } else {
            console.log('✅ User registered:', result);
        }
        return result;
    }

    async startHeartbeat() {
        // Initial registration
        await this.registerUser(this.username);
        
        // Heartbeat every 30 seconds
        this.heartbeatInterval = setInterval(async () => {
            await this.apiCall('heartbeat');
        }, 30000);
    }

    async updateOnlineCount() {
        try {
            const data = await this.apiCall('get_online_count');
            if (data.count !== undefined) {
                document.querySelectorAll('#onlineCount, #welcomeOnlineCount, #searchOnlineCount').forEach(el => {
                    el.textContent = data.count;
                });
                console.log('👥 Online count updated:', data.count);
            }
        } catch (error) {
            console.log('Error updating online count:', error);
        }
    }

    // SCREEN MANAGEMENT
    hideAllScreens() {
        ['usernameScreen', 'welcomeScreen', 'waitingScreen', 'chatScreen'].forEach(screen => {
            document.getElementById(screen).style.display = 'none';
        });
    }

    showUsernameScreen() {
        this.hideAllScreens();
        document.getElementById('usernameScreen').style.display = 'block';
        document.getElementById('usernameInput').focus();
        this.updateRandomNameExamples();
        console.log('📱 Showing username screen');
    }

    showWelcomeScreen() {
        this.hideAllScreens();
        document.getElementById('welcomeScreen').style.display = 'block';
        document.getElementById('displayUsername').textContent = this.username;
        this.updateOnlineCount();
        console.log('📱 Showing welcome screen for:', this.username);
    }

    showWaitingScreen() {
        this.hideAllScreens();
        document.getElementById('waitingScreen').style.display = 'block';
        this.updateOnlineCount();
        console.log('📱 Showing waiting screen');
    }

    showChatScreen() {
        this.hideAllScreens();
        document.getElementById('chatScreen').style.display = 'flex';
        document.getElementById('chatMessages').innerHTML = '';
        document.getElementById('messageInput').focus();
        console.log('📱 Showing chat screen');
    }

    // USERNAME MANAGEMENT - SIMPLIFIED
    async setUsername() {
        const usernameInput = document.getElementById('usernameInput');
        let username = usernameInput.value.trim();
        
        if (!username) {
            username = this.generateRandomName();
        }
        
        username = username.substring(0, 20);
        console.log('🔄 Setting username to:', username);
        
        const result = await this.apiCall('set_username', { username: username });
        
        if (result.error) {
            console.error('❌ set_username failed:', result.error);
            alert('Error setting username. Using random name.');
            this.skipUsername();
        } else {
            console.log('✅ Username set successfully:', result);
            this.username = username;
            localStorage.setItem('zimchat_username', username);
            document.getElementById('displayUsername').textContent = username;
            
            // Update registration with new username
            await this.registerUser(username);
            this.showWelcomeScreen();
        }
    }

    async skipUsername() {
        const randomName = this.generateRandomName();
        console.log('🎲 Using random name:', randomName);
        
        const result = await this.apiCall('set_username', { username: randomName });
        
        if (result.error) {
            console.error('❌ skipUsername failed:', result.error);
            // Use local fallback
            this.username = randomName;
            localStorage.setItem('zimchat_username', randomName);
            document.getElementById('displayUsername').textContent = randomName;
            this.showWelcomeScreen();
        } else {
            console.log('✅ Random name set successfully:', result);
            this.username = randomName;
            localStorage.setItem('zimchat_username', randomName);
            document.getElementById('displayUsername').textContent = randomName;
            await this.registerUser(randomName);
            this.showWelcomeScreen();
        }
    }

    // CHAT MATCHING
    async startChat() {
        console.log('🚀 Starting chat search...');
        this.showWaitingScreen();
        this.isSearching = true;
        this.displayedMessageIds.clear();
        this.lastMessageId = 0;
        
        this.searchForPartner();
    }

    async searchForPartner() {
        if (!this.isSearching) {
            console.log('❌ Search cancelled');
            return;
        }
        
        console.log('🔍 Searching for partner...');
        
        const result = await this.apiCall('join_pool');
        console.log('🤝 Search result:', result);
        
        if (result.status === 'matched' && result.convo_id) {
            console.log('🎉 Partner found! Convo ID:', result.convo_id);
            this.currentConvoId = result.convo_id;
            this.startChatSession();
        } else if (result.status === 'waiting') {
            console.log('⏳ Still waiting...');
            setTimeout(() => this.searchForPartner(), 2000);
        } else {
            console.log('🔄 Retrying search...');
            setTimeout(() => this.searchForPartner(), 3000);
        }
    }

    async cancelSearch() {
        console.log('❌ Cancelling search');
        this.isSearching = false;
        await this.apiCall('cancel_search');
        this.showWelcomeScreen();
    }

    // CHAT SESSION
    startChatSession() {
        console.log('💬 Starting chat session:', this.currentConvoId);
        this.showChatScreen();
        this.sendSystemMessage('You are now connected! Say hi! 👋');
        
        this.messageCheckInterval = setInterval(() => this.checkForMessages(), 1000);
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message || !this.currentConvoId) {
            console.log('❌ Cannot send message - no message or convo ID');
            return;
        }
        
        console.log('📤 Sending message:', message);
        
        // Show message immediately
        const tempMessageId = 'temp_' + Date.now();
        this.addMessageToChat(message, 'self', this.username, tempMessageId);
        input.value = '';
        
        // Send to server
        const result = await this.apiCall('send_message', {
            convo_id: this.currentConvoId,
            message: message
        });
        
        if (result.status === 'sent' && result.message_id) {
            console.log('✅ Message sent successfully, ID:', result.message_id);
            this.lastMessageId = Math.max(this.lastMessageId, result.message_id);
            
            // Replace temporary message
            const tempMsg = document.querySelector(`[data-message-id="${tempMessageId}"]`);
            if (tempMsg) tempMsg.remove();
            this.addMessageToChat(message, 'self', this.username, result.message_id);
        } else {
            console.error('❌ Failed to send message:', result);
            const tempMsg = document.querySelector(`[data-message-id="${tempMessageId}"]`);
            if (tempMsg) {
                tempMsg.style.opacity = '0.6';
                tempMsg.querySelector('.message-bubble').style.background = '#ffcccc';
            }
        }
    }

    async checkForMessages() {
        if (!this.currentConvoId) return;
        
        const result = await this.apiCall('get_messages', {
            convo_id: this.currentConvoId,
            after: this.lastMessageId
        });
        
        if (result.convo_ended) {
            console.log('🔚 Conversation ended by partner');
            this.endChat();
            return;
        }
        
        if (result.messages && result.messages.length > 0) {
            console.log('📨 New messages:', result.messages.length);
            result.messages.forEach(msg => {
                if (!this.displayedMessageIds.has(msg.message_id) && msg.sender_session !== this.sessionId) {
                    console.log('💬 Displaying message from partner:', msg);
                    this.addMessageToChat(msg.message_text, 'other', msg.username, msg.message_id);
                    this.displayedMessageIds.add(msg.message_id);
                    this.lastMessageId = Math.max(this.lastMessageId, msg.message_id);
                }
            });
        }
    }

    addMessageToChat(message, type, username, messageId) {
        const messagesDiv = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.setAttribute('data-message-id', messageId);
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        if (type === 'other') {
            const usernameDiv = document.createElement('div');
            usernameDiv.className = 'message-username';
            usernameDiv.textContent = username;
            usernameDiv.style.fontWeight = 'bold';
            usernameDiv.style.marginBottom = '5px';
            usernameDiv.style.fontSize = '0.8rem';
            usernameDiv.style.color = 'var(--secondary)';
            bubbleDiv.appendChild(usernameDiv);
        }
        
        const textDiv = document.createElement('div');
        textDiv.textContent = message;
        bubbleDiv.appendChild(textDiv);
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        bubbleDiv.appendChild(timeDiv);
        
        messageDiv.appendChild(bubbleDiv);
        messagesDiv.appendChild(messageDiv);
        
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    sendSystemMessage(message) {
        const messagesDiv = document.getElementById('chatMessages');
        const systemDiv = document.createElement('div');
        systemDiv.className = 'message system';
        systemDiv.style.textAlign = 'center';
        systemDiv.style.margin = '10px 0';
        
        const systemMsg = document.createElement('div');
        systemMsg.style.background = 'var(--gray)';
        systemMsg.style.color = 'var(--text-dark)';
        systemMsg.style.padding = '8px 15px';
        systemMsg.style.borderRadius = '15px';
        systemMsg.style.display = 'inline-block';
        systemMsg.style.fontSize = '0.9rem';
        systemMsg.textContent = message;
        
        systemDiv.appendChild(systemMsg);
        messagesDiv.appendChild(systemDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async endChat() {
        console.log('🔚 Ending chat');
        
        this.isSearching = false;
        
        if (this.messageCheckInterval) {
            clearInterval(this.messageCheckInterval);
            this.messageCheckInterval = null;
        }
        
        if (this.currentConvoId) {
            await this.apiCall('end_chat', { convo_id: this.currentConvoId });
        }
        
        this.currentConvoId = null;
        this.lastMessageId = 0;
        this.displayedMessageIds.clear();
        
        this.showWelcomeScreen();
    }

    cleanup() {
        console.log('🧹 Cleaning up...');
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.messageCheckInterval) {
            clearInterval(this.messageCheckInterval);
        }
        if (this.currentConvoId) {
            // Try to notify server
            fetch(`${this.API_BASE}?action=end_chat&session=${this.sessionId}&convo_id=${this.currentConvoId}`, {
                method: 'GET',
                mode: 'no-cors'
            }).catch(() => {});
        }
    }
}

// Initialize the chat when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing chat...');
    window.chatApp = new ZimRandomChat();
});

// Global functions for HTML buttons
function setUsername() {
    if (window.chatApp) {
        window.chatApp.setUsername();
    }
}

function skipUsername() {
    if (window.chatApp) {
        window.chatApp.skipUsername();
    }
}

function startChat() {
    if (window.chatApp) {
        window.chatApp.startChat();
    }
}

function cancelSearch() {
    if (window.chatApp) {
        window.chatApp.cancelSearch();
    }
}

function sendMessage() {
    if (window.chatApp) {
        window.chatApp.sendMessage();
    }
}

function endChat() {
    if (window.chatApp) {
        window.chatApp.endChat();
    }
}