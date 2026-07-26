import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/activity_service.dart';
import '../models/activity.dart';
import 'activity_detail_screen.dart';
import 'notifications_screen.dart';

class OperativeScreen extends StatefulWidget {
  final VoidCallback? onMenuPressed;
  const OperativeScreen({super.key, this.onMenuPressed});

  @override
  State<OperativeScreen> createState() => _OperativeScreenState();
}

class _OperativeScreenState extends State<OperativeScreen> {
  final ActivityService _activityService = ActivityService();
  List<Activity> _activities = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadActivities();
  }

  Future<void> _loadActivities() async {
    setState(() => _isLoading = true);
    final acts = await _activityService.getMyActivities();
    setState(() {
      _activities = acts;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context, listen: false);

    return Scaffold(
      backgroundColor: const Color(0xFF0A101D),
      appBar: AppBar(
        leading: widget.onMenuPressed != null 
          ? IconButton(
              icon: const Icon(Icons.menu, color: Colors.white),
              onPressed: widget.onMenuPressed,
            )
          : null,
        title: const Text('Mis Actividades', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF15233D),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.white),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadActivities,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
          : _activities.isEmpty
              ? const Center(
                  child: Text('No tienes tareas asignadas',
                      style: TextStyle(color: Colors.white54, fontSize: 16)),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _activities.length,
                  itemBuilder: (context, index) {
                    final activity = _activities[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF15233D).withOpacity(0.8),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF20CDFE).withOpacity(0.15), width: 1),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ActivityDetailScreen(activity: activity),
                            ),
                          );
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      activity.title,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18,
                                      ),
                                    ),
                                  ),
                                  const Icon(Icons.arrow_forward_ios, color: Colors.white30, size: 16),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  const Icon(Icons.business, color: Colors.white54, size: 16),
                                  const SizedBox(width: 6),
                                  Text(
                                    activity.companyName ?? "Sin empresa",
                                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                                  ),
                                  const SizedBox(width: 12),
                                  const Icon(Icons.folder, color: Colors.white54, size: 16),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      activity.projectName ?? "Sin proyecto",
                                      style: const TextStyle(color: Colors.white70, fontSize: 14),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF20CDFE).withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFF20CDFE).withOpacity(0.3)),
                                    ),
                                    child: Text(
                                      activity.status.toUpperCase(),
                                      style: const TextStyle(
                                          color: Color(0xFF20CDFE), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Colors.purpleAccent.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: Colors.purpleAccent.withOpacity(0.3)),
                                    ),
                                    child: Text(
                                      activity.priority.toUpperCase(),
                                      style: const TextStyle(
                                          color: Colors.purpleAccent, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                                    ),
                                  ),
                                ],
                              )
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
