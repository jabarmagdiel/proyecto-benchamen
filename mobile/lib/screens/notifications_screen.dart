import 'package:flutter/material.dart';
import '../services/notifications_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationsService _notifService = NotificationsService();
  List<dynamic> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    final notifs = await _notifService.getNotifications();
    if (mounted) {
      setState(() {
        _notifications = notifs;
        _isLoading = false;
      });
    }
  }

  Future<void> _markAsRead(int id, int index) async {
    await _notifService.markAsRead(id);
    setState(() {
      _notifications[index]['is_read'] = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A101D),
      appBar: AppBar(
        title: const Text('Avisos', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF15233D),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadNotifications,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
          : _notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.notifications_active_outlined, size: 80, color: Color(0xFF20CDFE)),
                      SizedBox(height: 16),
                      Text(
                        'No tienes avisos nuevos',
                        style: TextStyle(color: Colors.white54, fontSize: 16),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _notifications.length,
                  itemBuilder: (context, index) {
                    final notif = _notifications[index];
                    final bool isRead = notif['is_read'] ?? false;
                    return Card(
                      color: isRead ? const Color(0xFF10192A) : const Color(0xFF15233D),
                      margin: const EdgeInsets.only(bottom: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: isRead ? BorderSide.none : const BorderSide(color: Color(0xFF20CDFE), width: 1),
                      ),
                      child: ListTile(
                        leading: Icon(
                          Icons.notifications,
                          color: isRead ? Colors.white24 : const Color(0xFF20CDFE),
                        ),
                        title: Text(
                          notif['title'] ?? 'Notificación',
                          style: TextStyle(
                            color: isRead ? Colors.white70 : Colors.white,
                            fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                          ),
                        ),
                        subtitle: Text(
                          notif['content'] ?? '',
                          style: const TextStyle(color: Colors.white54),
                        ),
                        onTap: () {
                          if (!isRead) {
                            _markAsRead(notif['id'], index);
                          }
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
