import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  WebSocket? _socket;
  bool _isConnecting = false;
  Timer? _reconnectTimer;
  Timer? _pingTimer;

  final StreamController<Map<String, dynamic>> _eventController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get eventStream => _eventController.stream;

  Future<void> connect() async {
    if (_socket != null || _isConnecting) return;
    _isConnecting = true;

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null || token.isEmpty) {
        _isConnecting = false;
        return;
      }

      final baseUrl = ApiService.baseUrl;
      final wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
      final wsHost = baseUrl.replaceFirst(RegExp(r'https?://'), '');
      final wsUrl = '$wsProtocol://$wsHost/ws?token=$token';

      debugPrint('Connecting to WebSocket: $wsUrl');
      _socket = await WebSocket.connect(wsUrl).timeout(const Duration(seconds: 10));
      _isConnecting = false;
      debugPrint('WebSocket connected successfully');

      // Temporizador de Ping para mantener la conexión activa en Render/Servidores
      _pingTimer?.cancel();
      _pingTimer = Timer.periodic(const Duration(seconds: 25), (timer) {
        if (_socket != null && _socket!.readyState == WebSocket.open) {
          _socket!.add('ping');
        }
      });

      _socket!.listen(
        (message) {
          try {
            if (message is String) {
              final data = jsonDecode(message);
              if (data is Map<String, dynamic> && data['type'] == 'REALTIME_UPDATE') {
                _eventController.add(data);
              }
            }
          } catch (e) {
            // Ignorar mensajes sin formato JSON
          }
        },
        onDone: () {
          debugPrint('WebSocket cerrado');
          _cleanup();
          _scheduleReconnect();
        },
        onError: (error) {
          debugPrint('WebSocket error: $error');
          _cleanup();
          _scheduleReconnect();
        },
      );
    } catch (e) {
      debugPrint('Error conectando a WebSocket: $e');
      _isConnecting = false;
      _cleanup();
      _scheduleReconnect();
    }
  }

  void _cleanup() {
    _pingTimer?.cancel();
    _pingTimer = null;
    try {
      _socket?.close();
    } catch (_) {}
    _socket = null;
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 4), () {
      connect();
    });
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _cleanup();
  }
}
