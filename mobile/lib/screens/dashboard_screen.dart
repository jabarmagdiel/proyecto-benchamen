import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/activity_service.dart';
import '../services/projects_service.dart';
import 'notifications_screen.dart';

class DashboardScreen extends StatefulWidget {
  final VoidCallback? onMenuPressed;
  const DashboardScreen({super.key, this.onMenuPressed});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ActivityService _activityService = ActivityService();
  final ProjectsService _projectsService = ProjectsService();
  
  bool _isLoading = true;
  int _totalProjects = 0;
  int _pendingActivities = 0;
  int _completedActivities = 0;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    try {
      final projects = await _projectsService.getProjects();
      final activities = await _activityService.getAllActivities();
      
      setState(() {
        _totalProjects = projects.length;
        _pendingActivities = activities.where((a) => a.status != 'aprobada').length;
        _completedActivities = activities.where((a) => a.status == 'aprobada').length;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final role = authService.role?.toLowerCase() ?? '';
    final isAdmin = role == 'admin' || role == 'administrador';

    return Scaffold(
      backgroundColor: const Color(0xFF0A101D),
      appBar: AppBar(
        leading: widget.onMenuPressed != null 
          ? IconButton(icon: const Icon(Icons.menu, color: Colors.white), onPressed: widget.onMenuPressed)
          : null,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Alfa Prestige', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
            Text(isAdmin ? 'Panel Administrador' : 'Portal de Cliente', style: const TextStyle(color: Color(0xFF20CDFE), fontSize: 12)),
          ],
        ),
        backgroundColor: const Color(0xFF0A101D),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.white),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
          : isAdmin 
              ? _buildAdminDashboard() 
              : _buildClientDashboard(),
    );
  }

  Widget _buildAdminDashboard() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Resumen General', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _buildMetricCard('Proyectos', _totalProjects.toString(), Icons.folder, Colors.blue)),
              const SizedBox(width: 16),
              Expanded(child: _buildMetricCard('Actividades Pendientes', _pendingActivities.toString(), Icons.pending_actions, Colors.orange)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildMetricCard('Actividades Completadas', _completedActivities.toString(), Icons.check_circle, Colors.green)),
              const SizedBox(width: 16),
              Expanded(child: Container()), // Spacer
            ],
          )
        ],
      ),
    );
  }

  Widget _buildClientDashboard() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Bienvenido al Portal de Cliente', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Resumen del progreso de tus proyectos y entregas', style: TextStyle(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _buildMetricCard('Mis Proyectos', _totalProjects.toString(), Icons.folder, Colors.blue)),
              const SizedBox(width: 16),
              Expanded(child: _buildMetricCard('En Revisión / Pendientes', _pendingActivities.toString(), Icons.pending_actions, Colors.orange)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildMetricCard('Entregas Aprobadas', _completedActivities.toString(), Icons.check_circle, Colors.green)),
              const SizedBox(width: 16),
              Expanded(child: Container()),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF15233D).withOpacity(0.8),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.15),
            blurRadius: 15,
            spreadRadius: 2,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 16),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.w900,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
