"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { whatsappApi, companiesApi } from "@/lib/api";
import { WhatsAppChatSummary, WhatsAppMessage, WhatsAppTemplate, Company, WhatsAppConfig } from "@/types";
import {
  MessageSquare,
  Send,
  ExternalLink,
  Phone,
  Search,
  CheckCheck,
  ShieldAlert,
  Sparkles,
  Plus,
  Bot,
  RefreshCw,
  Building2,
  User,
  Paperclip,
  CheckCircle2,
  X,
  FileText,
  MessageCircle,
  Settings,
  Copy,
  Check,
  Radio
} from "lucide-react";
import Link from "next/link";

export default function WhatsAppChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<WhatsAppChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChatSummary | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Modales
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Formulario configuración Meta
  const [cfgPhone, setCfgPhone] = useState("");
  const [cfgPhoneId, setCfgPhoneId] = useState("");
  const [cfgWabaId, setCfgWabaId] = useState("");
  const [cfgToken, setCfgToken] = useState("");
  const [cfgVerifyToken, setCfgVerifyToken] = useState("addons_secret_token");
  const [savingCfg, setSavingCfg] = useState(false);

  // Formulario nuevo chat
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [newCompanyId, setNewCompanyId] = useState<number | undefined>(undefined);
  const [initialMsg, setInitialMsg] = useState("");

  // Formulario simular entrante
  const [simText, setSimText] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Verificar rol de Administrador
  const isAdmin = user?.role === "administrador";

  useEffect(() => {
    if (isAdmin) {
      fetchConfig();
      fetchChats();
      fetchTemplates();
      fetchCompanies();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.phone_number);
    }
  }, [selectedChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConfig = async () => {
    try {
      const res = await whatsappApi.getConfig();
      if (res.data) {
        setConfig(res.data);
        setCfgPhone(res.data.company_phone || "");
        setCfgPhoneId(res.data.phone_number_id || "");
        setCfgWabaId(res.data.waba_id || "");
        setCfgToken(res.data.access_token || "");
        setCfgVerifyToken(res.data.verify_token || "addons_secret_token");
      }
    } catch (err) {
      console.error("Error al cargar configuración de WhatsApp:", err);
    }
  };

  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const res = await whatsappApi.getChats();
      setChats(res.data);
      if (res.data.length > 0 && !selectedChat) {
        setSelectedChat(res.data[0]);
      }
    } catch (err) {
      console.error("Error al cargar chats:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchMessages = async (phone: string) => {
    setLoadingMessages(true);
    try {
      const res = await whatsappApi.getMessages(phone);
      setMessages(res.data);
    } catch (err) {
      console.error("Error al cargar mensajes:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await whatsappApi.getTemplates();
      setTemplates(res.data);
    } catch (err) {
      console.error("Error al cargar plantillas:", err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await companiesApi.list();
      setCompanies(res.data);
    } catch (err) {
      console.error("Error al cargar empresas:", err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfgPhone.trim()) {
      alert("Por favor ingresa el número telefónico oficial de la empresa.");
      return;
    }

    setSavingCfg(true);
    try {
      const res = await whatsappApi.saveConfig({
        company_phone: cfgPhone,
        phone_number_id: cfgPhoneId,
        waba_id: cfgWabaId,
        access_token: cfgToken,
        verify_token: cfgVerifyToken,
        is_active: true,
      });

      setConfig(res.data);
      setShowConfigModal(false);
      alert("✅ Configuración de WhatsApp de la empresa guardada correctamente.");
    } catch (err) {
      console.error("Error al guardar configuración:", err);
      alert("❌ Error al guardar la configuración.");
    } finally {
      setSavingCfg(false);
    }
  };

  const handleSendMessage = async (openExternal = false) => {
    if (!messageInput.trim() || !selectedChat) return;

    setSending(true);
    const textToSend = messageInput.trim();
    try {
      const res = await whatsappApi.sendMessage({
        phone_number: selectedChat.phone_number,
        client_name: selectedChat.client_name,
        company_id: selectedChat.company_id,
        message_text: textToSend,
      });

      setMessages((prev) => [...prev, res.data]);
      setMessageInput("");
      fetchChats();

      if (openExternal && res.data.whatsapp_url) {
        window.open(res.data.whatsapp_url, "_blank");
      }
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      alert("❌ Error al enviar mensaje por WhatsApp.");
    } finally {
      setSending(false);
    }
  };

  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim() || !newName.trim() || !initialMsg.trim()) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    try {
      const res = await whatsappApi.sendMessage({
        phone_number: newPhone,
        client_name: newName,
        company_id: newCompanyId,
        message_text: initialMsg,
      });

      setShowNewChatModal(false);
      setNewPhone("");
      setNewName("");
      setInitialMsg("");
      
      await fetchChats();
      
      const updatedChat: WhatsAppChatSummary = {
        phone_number: newPhone,
        client_name: newName,
        company_id: newCompanyId,
        company_name: companies.find(c => c.id === newCompanyId)?.name,
        last_message: initialMsg,
        last_message_time: new Date().toISOString(),
        unread_count: 0,
        unread: false
      };
      
      setSelectedChat(updatedChat);
      if (res.data.whatsapp_url) {
        window.open(res.data.whatsapp_url, "_blank");
      }
    } catch (err) {
      console.error("Error al iniciar nuevo chat:", err);
    }
  };

  const handleSimulateInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim() || !selectedChat) return;

    try {
      const res = await whatsappApi.simulateInbound({
        phone_number: selectedChat.phone_number,
        client_name: selectedChat.client_name,
        company_id: selectedChat.company_id,
        message_text: simText,
      });

      setMessages((prev) => [...prev, res.data]);
      setSimText("");
      setShowSimulateModal(false);
      fetchChats();
    } catch (err) {
      console.error("Error al simular respuesta:", err);
    }
  };

  const applyTemplate = (content: string) => {
    setMessageInput(content);
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin.replace("3000", "8000")}/api/whatsapp/webhook`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const filteredChats = chats.filter(
    (c) =>
      c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone_number.includes(searchQuery) ||
      (c.company_name && c.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Acceso Denegado para Roles no Administradores
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-[#15233D] border border-rose-500/30 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <ShieldAlert size={36} />
          </div>
          <h2 className="text-2xl font-black text-white">Acceso Restringido</h2>
          <p className="text-slate-300 text-xs leading-relaxed">
            El módulo de **WhatsApp Chat Corporativo** está reservado exclusivamente para los **Administradores** de ADDONS.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-[#20CDFE] text-[#07060B] font-bold px-6 py-3 rounded-xl text-xs hover:opacity-90 transition-opacity"
            >
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8">
      
      {/* ── Header Principal ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A101D] p-6 rounded-3xl border border-slate-800/80 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">WhatsApp Corporativo de la Empresa</h1>
              {config?.access_token ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Conectado Meta Cloud API
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Radio size={12} />
                  Número: {config?.company_phone || "No configurado"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Bandeja centralizada multimanager. Todos los mensajes enviados por prospectos/clientes de Meta Ads al número oficial de la agencia se gestionan aquí.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors text-xs font-bold"
            title="Configurar número oficial y token de Meta"
          >
            <Settings size={15} className="text-[#20CDFE]" />
            <span>Configuración Número</span>
          </button>

          <button
            onClick={() => fetchChats()}
            className="p-3 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors"
            title="Recargar conversaciones"
          >
            <RefreshCw size={16} />
          </button>
          
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity"
          >
            <Plus size={16} />
            <span>Nuevo Chat</span>
          </button>
        </div>
      </div>

      {/* ── Interfaz Principal de Chat ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[760px]">
        
        {/* ── Panel Izquierdo: Lista de Chats ── */}
        <div className="lg:col-span-4 bg-[#0A101D] border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
          
          {/* Búsqueda */}
          <div className="p-4 border-b border-slate-800/80">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente, empresa o teléfono..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#15233D]/60 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#20CDFE]"
              />
            </div>
          </div>

          {/* Lista de Conversaciones */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {loadingChats ? (
              <div className="p-8 text-center text-xs text-slate-500">Cargando conversaciones del WhatsApp oficial...</div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs text-slate-400 font-bold">No hay conversaciones</p>
                <p className="text-[11px] text-slate-500">Inicia una nueva conversación con &quot;Nuevo Chat&quot; o conecta Meta WhatsApp API.</p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = selectedChat?.phone_number === chat.phone_number;
                return (
                  <button
                    key={chat.phone_number}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-4 text-left flex items-start justify-between gap-3 transition-colors ${
                      isSelected
                        ? "bg-[#15233D] border-l-4 border-l-emerald-400"
                        : "hover:bg-[#15233D]/50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0 mt-0.5">
                      {chat.client_name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white truncate">{chat.client_name}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(chat.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {chat.company_name && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-[#20CDFE] mb-1">
                          <Building2 size={10} />
                          <span className="truncate">{chat.company_name}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 truncate">{chat.last_message}</p>
                    </div>

                    {chat.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-[#07060B] font-black text-[10px] flex items-center justify-center shrink-0">
                        {chat.unread_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* ── Panel Derecho: Ventana de Chat Activo ── */}
        <div className="lg:col-span-8 bg-[#0A101D] border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
          
          {selectedChat ? (
            <>
              {/* Header de Chat */}
              <div className="p-4 px-6 border-b border-slate-800/80 bg-[#15233D]/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    {selectedChat.client_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      {selectedChat.client_name}
                      {selectedChat.company_name && (
                        <span className="text-[10px] text-[#20CDFE] font-bold bg-[#20CDFE]/10 px-2 py-0.5 rounded-full border border-[#20CDFE]/20">
                          {selectedChat.company_name}
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">{selectedChat.phone_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSimulateModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition-colors"
                    title="Simular mensaje de prospecto entrante"
                  >
                    <Bot size={14} />
                    <span className="hidden sm:inline">Simular Entrada</span>
                  </button>

                  <a
                    href={`https://wa.me/${selectedChat.phone_number.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-[#07060B] text-xs font-black hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
                  >
                    <ExternalLink size={14} />
                    <span>Abrir en WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Contenedor de Mensajes */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-[#0A101D] to-[#07060B]">
                {loadingMessages ? (
                  <div className="text-center text-xs text-slate-500 py-8">Cargando conversación...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-8">
                    No hay mensajes registrados. Escribe el primer mensaje a continuación.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOutbound = msg.direction === "outbound";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-2xl text-xs leading-relaxed space-y-1 shadow-lg ${
                            isOutbound
                              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none"
                              : "bg-[#15233D] border border-slate-800 text-slate-200 rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message_text}</p>

                          <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-300/80 pt-1">
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {isOutbound && <CheckCheck size={13} className="text-emerald-200" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Barra de Plantillas Rápidas */}
              <div className="px-6 py-2 bg-[#0F172A] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-400" /> Plantillas:
                </span>
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl.content)}
                    className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold whitespace-nowrap hover:border-emerald-500/50 transition-colors shrink-0"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>

              {/* Formulario de Envío de Mensaje */}
              <div className="p-4 px-6 border-t border-slate-800/80 bg-[#15233D]/60 flex items-center gap-3">
                <textarea
                  rows={2}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Escribe la respuesta del Administrador para el cliente..."
                  className="flex-1 p-3 rounded-2xl bg-[#0A101D] border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSendMessage(false)}
                    disabled={sending || !messageInput.trim()}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                    title="Enviar respuesta al WhatsApp del cliente"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MessageCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white">Selecciona una conversación</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Elige un chat de la izquierda para responder al cliente o configura el número de teléfono oficial de la empresa.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* ── MODAL: Configuración de WhatsApp Corporativo ── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-3xl p-6 w-full max-w-xl space-y-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Settings className="text-[#20CDFE]" size={18} /> Configurar Número Oficial de la Empresa
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingresa los datos del número de WhatsApp Business de tu empresa y la API oficial de Meta para sincronizar los mensajes entrantes de los clientes en tiempo real.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono Oficial de la Empresa *</label>
                <input
                  type="text"
                  value={cfgPhone}
                  onChange={(e) => setCfgPhone(e.target.value)}
                  placeholder="Ej: +18095550199"
                  className="w-full p-3 rounded-xl bg-[#15233D] border border-slate-800 text-xs text-white outline-none focus:border-[#20CDFE]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Meta Phone Number ID</label>
                  <input
                    type="text"
                    value={cfgPhoneId}
                    onChange={(e) => setCfgPhoneId(e.target.value)}
                    placeholder="Ej: 1083928192830"
                    className="w-full p-3 rounded-xl bg-[#15233D] border border-slate-800 text-xs text-white outline-none focus:border-[#20CDFE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Business Account ID</label>
                  <input
                    type="text"
                    value={cfgWabaId}
                    onChange={(e) => setCfgWabaId(e.target.value)}
                    placeholder="Ej: 9283719283"
                    className="w-full p-3 rounded-xl bg-[#15233D] border border-slate-800 text-xs text-white outline-none focus:border-[#20CDFE]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Meta System Access Token (Permanente)</label>
                <textarea
                  rows={3}
                  value={cfgToken}
                  onChange={(e) => setCfgToken(e.target.value)}
                  placeholder="EAAG..."
                  className="w-full p-3 rounded-xl bg-[#15233D] border border-slate-800 text-xs text-white outline-none focus:border-[#20CDFE] resize-none font-mono"
                />
              </div>

              {/* URL Webhook de Meta para Copiar */}
              <div className="p-4 rounded-2xl bg-[#15233D]/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ExternalLink size={14} className="text-emerald-400" /> URL del Webhook para Meta Developers:
                  </span>
                  <button
                    type="button"
                    onClick={copyWebhookUrl}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#20CDFE] hover:underline"
                  >
                    {copiedWebhook ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedWebhook ? "¡Copiado!" : "Copiar URL"}</span>
                  </button>
                </div>
                <p className="text-[11px] font-mono text-slate-400 bg-[#0A101D] p-2.5 rounded-xl border border-slate-800 break-all select-all">
                  {typeof window !== "undefined" ? `${window.location.origin.replace("3000", "8000")}/api/whatsapp/webhook` : "/api/whatsapp/webhook"}
                </p>
                <p className="text-[10px] text-slate-500">
                  Token de verificación Webhook: <code className="text-amber-400 font-mono">{cfgVerifyToken}</code>
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCfg}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] font-bold text-xs shadow-lg shadow-[#20CDFE]/20"
                >
                  {savingCfg ? "Guardando..." : "Guardar Configuración"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Nuevo Chat ── */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <MessageSquare className="text-emerald-400" size={18} /> Iniciar Nuevo Chat de WhatsApp
              </h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewChat} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full p-3 rounded-xl bg-[#15233D] border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono con Código de País *</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ej: +18095550199"
                  className="w-full p-3 rounded-xl bg-[#15233D] border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Empresa (Opcional)</label>
                <select
                  value={newCompanyId || ""}
                  onChange={(e) => setNewCompanyId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full p-3 rounded-xl bg-[#15233D] border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="">Seleccionar empresa...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Primer Mensaje *</label>
                <textarea
                  rows={3}
                  value={initialMsg}
                  onChange={(e) => setInitialMsg(e.target.value)}
                  placeholder="Hola, te contactamos desde ADDONS..."
                  className="w-full p-3 rounded-xl bg-[#15233D] border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20"
                >
                  Iniciar Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Simular Respuesta Entrante ── */}
      {showSimulateModal && selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Bot className="text-purple-400" size={18} /> Simular Respuesta de {selectedChat.client_name}
              </h3>
              <button onClick={() => setShowSimulateModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSimulateInbound} className="space-y-4">
              <p className="text-xs text-slate-400">
                Usa este simulador para probar cómo entran los mensajes de clientes recibidos por el Webhook de Meta.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mensaje Recibido</label>
                <textarea
                  rows={3}
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  placeholder="Ej: ¡Hola! Vi su anuncio de Meta Ads y quisiera una cotización de pauta."
                  className="w-full p-3 rounded-xl bg-[#15233D] border border-slate-800 text-xs text-white outline-none focus:border-purple-500 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20"
                >
                  Simular Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
