import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { Loader, ErrorBanner } from '../components/Loader';

const Chat = () => {
  const { user } = useAuth();
  const { socket, onlineUserIds } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const loadContacts = async () => {
    try {
      const { data } = await api.get('/messages/contacts');
      setContacts(data.contacts);
      if (data.contacts.length > 0 && !activeContact) {
        setActiveContact(data.contacts[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (contactId) => {
    try {
      const { data } = await api.get(`/messages/${contactId}`);
      setMessages(data.messages);
      if (socket) socket.emit('chat:read', { senderId: contactId });
    } catch (err) {
      setError('Failed to load conversation');
    }
  };

  useEffect(() => { loadContacts(); }, []);
  useEffect(() => {
    if (activeContact) loadConversation(activeContact._id);
  }, [activeContact]);

  useEffect(() => {
    if (!socket) return;
    const handler = (message) => {
      if (
        activeContact &&
        (message.sender._id === activeContact._id || message.sender._id === user._id)
      ) {
        setMessages((prev) => [...prev, message]);
      }
      loadContacts();
    };
    socket.on('chat:message', handler);
    return () => socket.off('chat:message', handler);
  }, [socket, activeContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeContact || !socket) return;
    socket.emit('chat:send', { receiverId: activeContact._id, content: input.trim() });
    setInput('');
  };

  const initials = (name) => (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  if (loading) return <DashboardLayout title="Chat"><Loader /></DashboardLayout>;

  return (
    <DashboardLayout title="Chat">
      <ErrorBanner message={error} />
      <div className="chat-layout">
        <div className="chat-contacts">
          {contacts.length === 0 && <div className="empty-state" style={{ padding: 20 }}>No contacts available</div>}
          {contacts.map((c) => (
            <div
              key={c._id}
              className={`chat-contact ${activeContact?._id === c._id ? 'active' : ''}`}
              onClick={() => setActiveContact(c)}
            >
              <div className="avatar avatar-sm">{initials(c.name)}</div>
              {onlineUserIds.has(c._id) && <span className="chat-contact-online-dot"></span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.jobTitle || c.email}</div>
              </div>
              {c.unreadCount > 0 && <span className="badge badge-danger">{c.unreadCount}</span>}
            </div>
          ))}
        </div>

        <div className="chat-window">
          {!activeContact ? (
            <div className="chat-empty">Select a contact to start chatting</div>
          ) : (
            <>
              <div className="chat-header">
                <div className="avatar avatar-sm">{initials(activeContact.name)}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{activeContact.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {onlineUserIds.has(activeContact._id) ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
              <div className="chat-messages">
                {messages.map((m) => (
                  <div key={m._id} className={`chat-bubble ${m.sender._id === user._id ? 'sent' : 'received'}`}>
                    {m.content}
                    <span className="chat-bubble-time">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form className="chat-input-bar" onSubmit={handleSend}>
                <input
                  className="form-control"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                />
                <button className="btn btn-primary" type="submit">Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
