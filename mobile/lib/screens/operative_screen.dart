import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/activity_service.dart';
import '../models/activity.dart';
import 'activity_detail_screen.dart';

class OperativeScreen extends StatefulWidget {
  const OperativeScreen({super.key});

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
        title: const Text('Mis Tareas', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF15233D),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadActivities,
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () => authService.logout(),
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
                    return Card(
                      color: const Color(0xFF15233D),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ActivityDetailScreen(activity: activity),
                            ),
                          );
                        },
                        contentPadding: const EdgeInsets.all(16),
                        title: Text(
                          activity.title,
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16),
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${activity.projectName ?? "Sin proyecto"} • ${activity.companyName ?? "Sin empresa"}',
                                style: const TextStyle(color: Colors.white70),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF20CDFE).withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      activity.status.toUpperCase(),
                                      style: const TextStyle(
                                          color: Color(0xFF20CDFE), fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.purple.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      activity.priority.toUpperCase(),
                                      style: const TextStyle(
                                          color: Colors.purpleAccent, fontSize: 10, fontWeight: FontWeight.bold),
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
